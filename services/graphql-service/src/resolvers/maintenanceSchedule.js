const {
    executeTransaction,
    executeQuery
} = require('../utils/db');
const { calculateReminderDate } = require('../utils/dateUtils');

const maintenanceScheduleResolvers = {
    Query: {
        // ==================== Get All Maintenance Schedules ====================
        maintenanceSchedules: async (parent, { filter, limit = 50, offset = 0 }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const conditions = ['deleted_at IS NULL'];
            const params = [];
            let paramIndex = 1;

            // Apply filters
            if (filter) {
                if (filter.assetId) {
                    conditions.push(`asset_id = $${paramIndex}`);
                    params.push(filter.assetId);
                    paramIndex++;
                }

                if (filter.assignedToUserId) {
                    conditions.push(`$${paramIndex} = ANY(assigned_to_user_ids)`);
                    params.push(filter.assignedToUserId);
                    paramIndex++;
                }

                if (filter.frequency) {
                    conditions.push(`frequency = $${paramIndex}`);
                    params.push(filter.frequency);
                    paramIndex++;
                }

                if (filter.searchTerm) {
                    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
                    params.push(`%${filter.searchTerm}%`);
                    paramIndex++;
                }
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const query = `
                SELECT * FROM ${schema}.asset_maintenance_schedules
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            params.push(limit, offset);

            const result = await executeQuery(schema, query, params);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                assetPartIds: row.asset_part_ids || [],
                title: row.title,
                description: row.description,
                frequency: row.frequency,
                frequencyValue: row.frequency_value,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                timeZone: row.time_zone || 'UTC',
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            }));
        },

        // ==================== Get Maintenance Schedules by Asset ID ====================
        maintenanceSchedule: async (parent, { assetId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_maintenance_schedules
                WHERE asset_id = $1 AND deleted_at IS NULL
                ORDER BY created_at DESC
            `;

            const result = await executeQuery(schema, query, [assetId]);

            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                assetPartIds: row.asset_part_ids || [],
                title: row.title,
                description: row.description,
                frequency: row.frequency,
                frequencyValue: row.frequency_value,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                timeZone: row.time_zone || 'UTC',
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            }));
        },

    },

    Mutation: {
        // ==================== Create Maintenance Schedules ====================
        createMaintenanceSchedules: async (parent, { assetId, input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Extract maintenanceSchedules from input object
            const schedules = input.maintenanceSchedules;

            // Build queries for all schedules, activities, and reminders
            const allQueries = [];

            schedules.forEach(schedule => {
                // 1. Insert maintenance schedule
                const scheduleQuery = {
                    query: `
                        INSERT INTO ${schema}.asset_maintenance_schedules (
                            asset_id, asset_part_ids, title, description,
                            frequency, frequency_value, start_date, next_due_date, 
                            time_zone, assigned_to_user_ids
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING *
                    `,
                    params: [
                        assetId,
                        schedule.assetPartIds || [],
                        schedule.title,
                        schedule.description || null,
                        schedule.frequency,
                        schedule.frequencyValue || 1,
                        schedule.startDate,
                        schedule.nextDueDate || null,
                        schedule.timezone || 'UTC',
                        schedule.assignedToUserIds || []
                    ]
                };
                allQueries.push(scheduleQuery);

                // 2. Insert initial maintenance activity (only if nextDueDate is provided)
                if (schedule.nextDueDate) {
                    const activityQuery = {
                        query: `
                            INSERT INTO ${schema}.asset_maintenance_activity (
                                asset_id, maintenance_schedule_id, status, scheduled_at
                            )
                            SELECT $1, id, 'pending', $2
                            FROM ${schema}.asset_maintenance_schedules
                            WHERE asset_id = $1 AND title = $3 AND deleted_at IS NULL
                            ORDER BY created_at DESC LIMIT 1
                            RETURNING *
                        `,
                        params: [
                            assetId,
                            schedule.nextDueDate,
                            schedule.title
                        ]
                    };
                    allQueries.push(activityQuery);

                    // 3. Insert reminder (3 days before scheduled date)
                    try {
                        const reminderDate = calculateReminderDate(
                            schedule.nextDueDate,
                            3, // 3 days before
                            schedule.timezone || 'UTC'
                        );

                        const reminderQuery = {
                            query: `
                                INSERT INTO ${schema}.asset_reminders (
                                    maintenance_schedule_id, notification_type, notified, 
                                    created_at, updated_at
                                )
                                SELECT id, 'email', false, $1, $1
                                FROM ${schema}.asset_maintenance_schedules
                                WHERE asset_id = $2 AND title = $3 AND deleted_at IS NULL
                                ORDER BY created_at DESC LIMIT 1
                                RETURNING *
                            `,
                            params: [
                                reminderDate,
                                assetId,
                                schedule.title
                            ]
                        };
                        allQueries.push(reminderQuery);
                    } catch (error) {
                        console.error('Error calculating reminder date:', error.message);
                        // Continue without reminder if calculation fails
                    }
                }
            });

            // Execute all queries in a transaction
            const results = await executeTransaction(schema, allQueries);

            // Extract only the schedule results (every 3rd or fewer result depending on queries)
            // Schedule is always the first query for each schedule
            const scheduleResults = [];
            let queryIndex = 0;

            for (let i = 0; i < schedules.length; i++) {
                const scheduleResult = results[queryIndex];
                scheduleResults.push(scheduleResult);

                // Skip activity query result if it exists
                queryIndex++;
                if (schedules[i].nextDueDate && queryIndex < results.length) {
                    queryIndex++; // Skip activity result
                    // Skip reminder query result if it exists
                    if (queryIndex < results.length) {
                        queryIndex++; // Skip reminder result
                    }
                }
            }

            return scheduleResults.map(result => {
                const row = result.rows[0];
                return {
                    id: row.id,
                    assetId: row.asset_id,
                    assetPartIds: row.asset_part_ids || [],
                    title: row.title,
                    description: row.description,
                    frequency: row.frequency,
                    frequencyValue: row.frequency_value,
                    startDate: row.start_date,
                    nextDueDate: row.next_due_date,
                    timeZone: row.time_zone || 'UTC',
                    assignedToUserIds: row.assigned_to_user_ids || [],
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            });
        },

        // ==================== Update Maintenance Schedules ====================
        updateMaintenanceSchedules: async (parent, { assetId, input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Extract maintenanceSchedules from input object
            const schedules = input.maintenanceSchedules;

            // Build update queries for all schedules
            const queries = schedules.map(schedule => {
                const updates = [];
                const params = [];
                let paramIndex = 1;

                if (schedule.assetPartIds !== undefined) {
                    updates.push(`asset_part_ids = $${paramIndex}`);
                    params.push(schedule.assetPartIds);
                    paramIndex++;
                }

                if (schedule.title !== undefined) {
                    updates.push(`title = $${paramIndex}`);
                    params.push(schedule.title);
                    paramIndex++;
                }

                if (schedule.description !== undefined) {
                    updates.push(`description = $${paramIndex}`);
                    params.push(schedule.description);
                    paramIndex++;
                }

                if (schedule.frequency !== undefined) {
                    updates.push(`frequency = $${paramIndex}`);
                    params.push(schedule.frequency);
                    paramIndex++;
                }

                if (schedule.frequencyValue !== undefined) {
                    updates.push(`frequency_value = $${paramIndex}`);
                    params.push(schedule.frequencyValue);
                    paramIndex++;
                }

                if (schedule.startDate !== undefined) {
                    updates.push(`start_date = $${paramIndex}`);
                    params.push(schedule.startDate);
                    paramIndex++;
                }

                if (schedule.nextDueDate !== undefined) {
                    updates.push(`next_due_date = $${paramIndex}`);
                    params.push(schedule.nextDueDate);
                    paramIndex++;
                }

                if (schedule.timezone !== undefined) {
                    updates.push(`time_zone = $${paramIndex}`);
                    params.push(schedule.timezone);
                    paramIndex++;
                }

                if (schedule.assignedToUserIds !== undefined) {
                    updates.push(`assigned_to_user_ids = $${paramIndex}`);
                    params.push(schedule.assignedToUserIds || []);
                    paramIndex++;
                }

                updates.push(`updated_at = NOW()`);

                const query = `
                    UPDATE ${schema}.asset_maintenance_schedules
                    SET ${updates.join(', ')}
                    WHERE id = $${paramIndex} AND asset_id = $${paramIndex + 1} AND deleted_at IS NULL
                    RETURNING *
                `;

                params.push(schedule.id, assetId);

                return { query, params };
            });

            const results = await executeTransaction(schema, queries);

            return results.map(result => {
                if (result.rows.length === 0) {
                    throw new Error('One or more maintenance schedules not found or do not belong to the specified asset');
                }
                const row = result.rows[0];
                return {
                    id: row.id,
                    assetId: row.asset_id,
                    assetPartIds: row.asset_part_ids || [],
                    title: row.title,
                    description: row.description,
                    frequency: row.frequency,
                    frequencyValue: row.frequency_value,
                    startDate: row.start_date,
                    nextDueDate: row.next_due_date,
                    timeZone: row.time_zone || 'UTC',
                    assignedToUserIds: row.assigned_to_user_ids || [],
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            });
        },

        // ==================== Delete Maintenance Schedule ====================
        deleteMaintenanceSchedules: async (parent, { assetId, maintenanceScheduleId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Soft delete the specific schedule for the specified asset
            const query = `
                UPDATE ${schema}.asset_maintenance_schedules
                SET deleted_at = NOW()
                WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL
            `;

            await executeQuery(schema, query, [maintenanceScheduleId, assetId]);
            return true;
        },

    },

    // ==================== Field Resolvers ====================
    MaintenanceSchedule: {
        asset: async (parent, args, context) => {
            if (!parent.assetId) return null;

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.assets
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [parent.assetId]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                id: row.id,
                name: row.name,
                description: row.description,
                assetTypeId: row.asset_type_id,
                locationIds: row.location_ids || [],
                fileIds: row.file_ids || [],
                maintenanceIds: row.maintenance_ids || [],
                userIds: row.user_ids || [],
                position: row.position,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        assetParts: async (parent, args, context) => {
            if (!parent.assetPartIds || parent.assetPartIds.length === 0) return [];

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_parts
                WHERE id = ANY($1) AND deleted_at IS NULL
                ORDER BY created_at
            `;

            const result = await executeQuery(schema, query, [parent.assetPartIds]);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                masterAssetPartId: row.master_asset_part_id,
                serialNumber: row.serial_number,
                manufacturerId: row.manufacturer_id,
                purchaseDate: row.purchase_date,
                warrantyExpiresOn: row.warranty_expires_on,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            }));
        },

        assignedToUsers: async (parent, args, context) => {
            if (!parent.assignedToUserIds || parent.assignedToUserIds.length === 0) return [];

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.users
                WHERE id = ANY($1) AND deleted_at IS NULL
                ORDER BY created_at
            `;

            const result = await executeQuery(schema, query, [parent.assignedToUserIds]);
            return result.rows.map(row => ({
                id: row.id,
                email: row.email,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone,
                emailConfirmed: row.email_confirmed,
                phoneConfirmed: row.phone_confirmed,
                jobTitle: row.job_title,
                role: row.role,
                active: row.active,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
    }
};

module.exports = maintenanceScheduleResolvers;
