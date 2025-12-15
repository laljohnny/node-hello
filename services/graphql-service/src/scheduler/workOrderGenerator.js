const cron = require('node-cron');
const { executeTransaction, executeQuery } = require('../utils/db');
const moment = require('moment-timezone');

/**
 * Work Order Generator Job
 * Runs daily at 1:00 AM UTC
 * Generates work orders from maintenance schedules
 */
function startWorkOrderGenerationJob() {
    // Run every day at 1:00 AM UTC
    cron.schedule('0 1 * * *', async () => {
        console.log('🛠️ Running work order generation job...');

        try {
            // Get all active tenant schemas
            const schemasQuery = `
                SELECT schema_name 
                FROM companies 
                WHERE schema_status = 'active' AND deleted_at IS NULL
            `;

            const schemasResult = await executeQuery('public', schemasQuery, []);
            const schemas = schemasResult.rows;

            console.log(`Found ${schemas.length} active tenant schemas for work order generation`);

            let totalWorkOrders = 0;
            let totalErrors = 0;

            for (const { schema_name } of schemas) {
                try {
                    // 1. Get default work order stage
                    const stageQuery = `
                        SELECT id FROM ${schema_name}.work_order_stages 
                        WHERE is_default = true AND deleted_at IS NULL 
                        LIMIT 1
                    `;
                    const stageResult = await executeQuery(schema_name, stageQuery, []);
                    const defaultStageId = stageResult.rows.length > 0 ? stageResult.rows[0].id : null;

                    if (!defaultStageId) {
                        console.log(`  ⚠️ No default work order stage found for ${schema_name} - skipping`);
                        continue;
                    }

                    // 2. Find due schedules
                    const dueSchedulesQuery = `
                        SELECT * FROM ${schema_name}.asset_maintenance_schedules
                        WHERE next_due_date <= CURRENT_DATE 
                        AND deleted_at IS NULL
                    `;
                    const schedulesResult = await executeQuery(schema_name, dueSchedulesQuery, []);
                    const dueSchedules = schedulesResult.rows;

                    if (dueSchedules.length > 0) {
                        console.log(`  📋 ${schema_name}: Found ${dueSchedules.length} due schedules`);
                    }

                    for (const schedule of dueSchedules) {
                        try {
                            const queries = [];

                            // Fetch the asset details for this schedule
                            const assetQuery = `
                                SELECT id, product_id, file_ids, location_ids 
                                FROM ${schema_name}.assets 
                                WHERE id = $1 AND deleted_at IS NULL
                            `;
                            const assetResult = await executeQuery(schema_name, assetQuery, [schedule.asset_id]);
                            const asset = assetResult.rows.length > 0 ? assetResult.rows[0] : null;

                            // Create Work Order
                            const woQuery = `
                                INSERT INTO ${schema_name}.work_orders (
                                    title, description, severity, work_order_type, 
                                    work_order_service_category, work_order_stage_id, 
                                    start_date, time_zone, created_at, updated_at
                                )
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                                RETURNING id
                            `;

                            // Use schedule title or default
                            const woTitle = schedule.title || 'Preventive Maintenance';
                            const woDescription = schedule.description || 'Auto-generated preventive maintenance';

                            const woResult = await executeQuery(schema_name, woQuery, [
                                woTitle,
                                woDescription,
                                'medium', // Default severity
                                'preventive_maintenance', // Default type
                                'hvac', // Default category
                                defaultStageId,
                                moment().toISOString(), // Start date is now
                                schedule.time_zone || 'PST'
                            ]);

                            const workOrderId = woResult.rows[0].id;

                            // Create work_order_assets record if asset exists
                            if (asset) {
                                // Get asset_service_type_id from product's type_id
                                let assetServiceTypeId = null;
                                if (asset.product_id) {
                                    const productQuery = `
                                        SELECT type_id FROM public.products 
                                        WHERE id = $1 AND deleted_at IS NULL
                                    `;
                                    const productResult = await executeQuery('public', productQuery, [asset.product_id]);
                                    if (productResult.rows.length > 0) {
                                        assetServiceTypeId = productResult.rows[0].type_id;
                                    }
                                }

                                // Get asset_sop_incident_plan_ids by querying all asset_sops_incident_plans for this asset
                                const sopIncidentPlanQuery = `
                                    SELECT id FROM ${schema_name}.asset_sops_incident_plans 
                                    WHERE asset_id = $1 AND deleted_at IS NULL
                                `;
                                const sopIncidentPlanResult = await executeQuery(schema_name, sopIncidentPlanQuery, [asset.id]);
                                const assetSopIncidentPlanIds = sopIncidentPlanResult.rows.map(row => row.id);

                                // Insert work_order_assets record
                                const woAssetQuery = `
                                    INSERT INTO ${schema_name}.work_order_assets (
                                        work_order_id, asset_id, asset_service_type_id,
                                        asset_sop_incident_plan_ids, asset_file_ids, location_file_ids, created_at
                                    )
                                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                                `;
                                await executeQuery(schema_name, woAssetQuery, [
                                    workOrderId,
                                    asset.id,
                                    assetServiceTypeId,
                                    assetSopIncidentPlanIds.length > 0 ? assetSopIncidentPlanIds : [],
                                    asset.file_ids || [], // asset_file_ids
                                    asset.location_ids || []
                                ]);
                            }

                            // Create Assignment if users are assigned
                            if (schedule.assigned_to_user_ids && schedule.assigned_to_user_ids.length > 0) {
                                const assignmentQuery = `
                                    INSERT INTO ${schema_name}.work_order_assignments (
                                        work_order_id, user_ids, created_at, updated_at
                                    )
                                    VALUES ($1, $2, NOW(), NOW())
                                `;
                                await executeQuery(schema_name, assignmentQuery, [
                                    workOrderId,
                                    schedule.assigned_to_user_ids
                                ]);
                            }

                            // Calculate next due date
                            let nextDate = moment(schedule.next_due_date || undefined); // Use existing next date base
                            const freqValue = schedule.frequency_value || 1;

                            switch (schedule.frequency?.toLowerCase()) {
                                case 'daily': nextDate.add(freqValue, 'days'); break;
                                case 'weekly': nextDate.add(freqValue, 'weeks'); break;
                                case 'monthly': nextDate.add(freqValue, 'months'); break;
                                case 'quarterly': nextDate.add(freqValue * 3, 'months'); break;
                                case 'annually': nextDate.add(freqValue, 'years'); break;
                                default: nextDate.add(freqValue, 'months'); // Default fallback
                            }

                            // Update Schedule
                            const updateScheduleQuery = `
                                UPDATE ${schema_name}.asset_maintenance_schedules
                                SET next_due_date = $1, updated_at = NOW()
                                WHERE id = $2
                            `;
                            await executeQuery(schema_name, updateScheduleQuery, [
                                nextDate.format('YYYY-MM-DD'),
                                schedule.id
                            ]);

                            totalWorkOrders++;
                        } catch (woError) {
                            console.error(`    ❌ Error creating WO for schedule ${schedule.id}:`, woError.message);
                            totalErrors++;
                        }
                    }

                } catch (schemaError) {
                    console.error(`  ❌ Error processing schema ${schema_name}:`, schemaError.message);
                    totalErrors++;
                }
            }

            console.log(`🛠️ Work order generation completed: ${totalWorkOrders} created, ${totalErrors} errors`);

        } catch (error) {
            console.error('❌ Fatal error in work order generator:', error);
        }
    });

    console.log('✅ Work order generation job scheduled (daily at 1:00 AM UTC)');
}

module.exports = { startWorkOrderGenerationJob };
