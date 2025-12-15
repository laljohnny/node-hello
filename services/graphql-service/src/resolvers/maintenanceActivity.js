const {
    executeTransaction,
    executeQuery
} = require('../utils/db');
const { calculateReminderDate, calculateNextDueDate } = require('../utils/dateUtils');

const maintenanceActivityResolvers = {
    Query: {
        // ==================== Get Asset Maintenance Activities ====================
        getAssetMaintenanceActivities: async (parent, { filter, limit = 50, offset = 0 }, context) => {
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

                if (filter.maintenanceScheduleId) {
                    conditions.push(`maintenance_schedule_id = $${paramIndex}`);
                    params.push(filter.maintenanceScheduleId);
                    paramIndex++;
                }
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const query = `
                SELECT * FROM ${schema}.asset_maintenance_activity
                ${whereClause}
                ORDER BY scheduled_at DESC, created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            params.push(limit, offset);

            const result = await executeQuery(schema, query, params);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                maintenanceScheduleId: row.maintenance_schedule_id,
                status: row.status,
                completedBy: row.completed_by,
                completedOn: row.completed_on,
                duration: row.duration,
                scheduledAt: row.scheduled_at,
                workOrderId: row.work_order_id,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
    },

    Mutation: {
        // ==================== Complete Maintenance Activity ====================
        completeMaintenanceActivity: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const { activityId, completedBy, duration } = input;

            // Get the activity details including the schedule
            const getActivityQuery = `
                SELECT ama.*, ams.frequency, ams.frequency_value, ams.time_zone, ams.asset_id
                FROM ${schema}.asset_maintenance_activity ama
                JOIN ${schema}.asset_maintenance_schedules ams ON ama.maintenance_schedule_id = ams.id
                WHERE ama.id = $1 AND ama.deleted_at IS NULL
            `;

            const activityResult = await executeQuery(schema, getActivityQuery, [activityId]);

            if (activityResult.rows.length === 0) {
                throw new Error('Maintenance activity not found');
            }

            const activity = activityResult.rows[0];

            // Prepare transaction queries
            const queries = [];

            // 1. Update current activity to completed
            queries.push({
                query: `
                    UPDATE ${schema}.asset_maintenance_activity
                    SET status = 'completed', 
                        completed_by = $1, 
                        completed_on = NOW(),
                        duration = $2,
                        updated_at = NOW()
                    WHERE id = $3
                    RETURNING *
                `,
                params: [completedBy, duration || null, activityId]
            });

            // 2. Calculate next due date and create next activity (skip for One-Time schedules)
            if (activity.frequency !== 'One-Time' && activity.scheduled_at) {
                const nextDueDate = calculateNextDueDate(
                    activity.scheduled_at,
                    activity.frequency,
                    activity.frequency_value,
                    activity.time_zone
                );

                if (nextDueDate) {
                    // Create next maintenance activity
                    queries.push({
                        query: `
                            INSERT INTO ${schema}.asset_maintenance_activity (
                                asset_id, maintenance_schedule_id, status, scheduled_at
                            )
                            VALUES ($1, $2, 'pending', $3)
                            RETURNING *
                        `,
                        params: [
                            activity.asset_id,
                            activity.maintenance_schedule_id,
                            nextDueDate
                        ]
                    });

                    // Create reminder for next activity
                    const reminderDate = calculateReminderDate(
                        nextDueDate,
                        3, // 3 days before
                        activity.time_zone
                    );

                    queries.push({
                        query: `
                            INSERT INTO ${schema}.asset_reminders (
                                maintenance_schedule_id, notification_type, notified,
                                created_at, updated_at
                            )
                            VALUES ($1, 'email', false, $2, $2)
                            RETURNING *
                        `,
                        params: [
                            activity.maintenance_schedule_id,
                            reminderDate
                        ]
                    });

                    // Update schedule's next_due_date
                    queries.push({
                        query: `
                            UPDATE ${schema}.asset_maintenance_schedules
                            SET next_due_date = $1, updated_at = NOW()
                            WHERE id = $2
                        `,
                        params: [nextDueDate, activity.maintenance_schedule_id]
                    });
                }
            }

            // Execute all queries in transaction
            const results = await executeTransaction(schema, queries);
            const completedActivity = results[0].rows[0];

            return {
                id: completedActivity.id,
                assetId: completedActivity.asset_id,
                maintenanceScheduleId: completedActivity.maintenance_schedule_id,
                status: completedActivity.status,
                completedBy: completedActivity.completed_by,
                completedOn: completedActivity.completed_on,
                duration: completedActivity.duration,
                scheduledAt: completedActivity.scheduled_at,
                workOrderId: completedActivity.work_order_id,
                createdAt: completedActivity.created_at,
                updatedAt: completedActivity.updated_at
            };
        }
    }
};

module.exports = maintenanceActivityResolvers;

