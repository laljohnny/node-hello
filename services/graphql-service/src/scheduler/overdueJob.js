const cron = require('node-cron');
const { executeQuery } = require('../utils/db');

/**
 * Overdue maintenance checker cron job
 * Runs daily at 9:00 AM UTC
 * Marks pending maintenance activities as overdue if past their scheduled date
 */
function startOverdueJob() {
    // Run every day at 9:00 AM UTC
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running overdue maintenance checker...');

        try {
            // Get all active tenant schemas
            const schemasQuery = `
                SELECT schema_name 
                FROM companies 
                WHERE schema_status = 'active' AND deleted_at IS NULL
            `;

            const schemasResult = await executeQuery('public', schemasQuery, []);
            const schemas = schemasResult.rows;

            console.log(`Found ${schemas.length} active tenant schemas`);

            let totalOverdue = 0;

            // Process each tenant schema
            for (const { schema_name } of schemas) {
                try {
                    // Update pending activities that are past their scheduled date
                    const updateQuery = `
                        UPDATE ${schema_name}.asset_maintenance_activity
                        SET status = 'overdue', updated_at = NOW()
                        WHERE status = 'pending'
                            AND scheduled_at < CURRENT_DATE
                            AND deleted_at IS NULL
                        RETURNING id, asset_id, scheduled_at
                    `;

                    const result = await executeQuery(schema_name, updateQuery, []);
                    const overdueCount = result.rows.length;

                    if (overdueCount > 0) {
                        totalOverdue += overdueCount;
                        console.log(`  ⚠️  ${schema_name}: Marked ${overdueCount} activities as overdue`);

                        // Log each overdue activity
                        result.rows.forEach(row => {
                            console.log(`    - Activity ${row.id} for asset ${row.asset_id} (due: ${row.scheduled_at})`);
                        });
                    }
                } catch (schemaError) {
                    console.error(`  ❌ Error processing schema ${schema_name}:`, schemaError.message);
                    // Continue with next schema
                }
            }

            if (totalOverdue > 0) {
                console.log(`⏰ Overdue checker completed: ${totalOverdue} activities marked as overdue`);
            } else {
                console.log('⏰ Overdue checker completed: No overdue activities found');
            }
        } catch (error) {
            console.error('❌ Fatal error in overdue checker job:', error);
        }
    });

    console.log('✅ Overdue checker scheduled (daily at 9:00 AM UTC)');
}

module.exports = { startOverdueJob };
