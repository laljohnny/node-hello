const {
    executeQuery
} = require('../utils/db');
const moment = require('moment-timezone');

/**
 * Calculate the next due date based on interval_unit and interval_value
 * @param {Date|string} startDate - The start date
 * @param {string} intervalUnit - Interval type (days, weeks, months, years)
 * @param {number} intervalValue - Multiplier for interval
 * @param {string} timezone - Timezone for calculation
 * @returns {Date} Next due date
 */
function calculateNextDueDate(startDate, intervalUnit, intervalValue = 1, timezone = 'UTC') {
    if (!startDate || !intervalUnit) {
        return null;
    }

    const date = moment.tz(startDate, timezone);

    switch (intervalUnit.toLowerCase()) {
        case 'days':
            return date.add(intervalValue, 'days').toDate();
        case 'weeks':
            return date.add(intervalValue, 'weeks').toDate();
        case 'months':
            return date.add(intervalValue, 'months').toDate();
        case 'years':
            return date.add(intervalValue, 'years').toDate();
        default:
            throw new Error(`Invalid interval unit: ${intervalUnit}`);
    }
}

const assetMaintenanceScheduleResolvers = {
    Query: {
        assetMaintenanceSchedules: async (parent, { assetId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT 
                    ams.*,
                    a.id as asset_id_ref,
                    a.name as asset_name,
                    a.description as asset_description,
                    a.product_id as asset_product_id,
                    a.serial_number as asset_serial_number,
                    a.installation_date as asset_installation_date,
                    a.location_ids as asset_location_ids,
                    a.file_ids as asset_file_ids,
                    a.user_ids as asset_user_ids,
                    a.position as asset_position,
                    a.status as asset_status,
                    a.created_at as asset_created_at,
                    a.updated_at as asset_updated_at,
                    a.deleted_at as asset_deleted_at
                FROM ${schema}.asset_maintenance_schedules ams
                LEFT JOIN ${schema}.assets a ON ams.asset_id = a.id
                WHERE ams.asset_id = $1 AND ams.deleted_at IS NULL
                ORDER BY ams.created_at DESC
            `;

            const result = await executeQuery(schema, query, [assetId]);

            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                description: row.description,
                scheduleType: row.schedule_type,
                intervalUnit: row.interval_unit,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                intervalValue: row.interval_value,
                timeZone: row.time_zone,
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at,
                // Include asset details directly
                asset: row.asset_id_ref ? {
                    id: row.asset_id_ref,
                    name: row.asset_name,
                    description: row.asset_description,
                    productId: row.asset_product_id,
                    serialNumber: row.asset_serial_number,
                    installationDate: row.asset_installation_date,
                    locationIds: row.asset_location_ids || [],
                    fileIds: row.asset_file_ids || [],
                    userIds: row.asset_user_ids || [],
                    position: row.asset_position,
                    status: row.asset_status,
                    createdAt: row.asset_created_at,
                    updatedAt: row.asset_updated_at,
                    deletedAt: row.asset_deleted_at
                } : null
            }));
        },

        assetMaintenanceSchedule: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT 
                    ams.*,
                    a.id as asset_id_ref,
                    a.name as asset_name,
                    a.description as asset_description,
                    a.product_id as asset_product_id,
                    a.serial_number as asset_serial_number,
                    a.installation_date as asset_installation_date,
                    a.location_ids as asset_location_ids,
                    a.file_ids as asset_file_ids,
                    a.user_ids as asset_user_ids,
                    a.position as asset_position,
                    a.status as asset_status,
                    a.created_at as asset_created_at,
                    a.updated_at as asset_updated_at,
                    a.deleted_at as asset_deleted_at
                FROM ${schema}.asset_maintenance_schedules ams
                LEFT JOIN ${schema}.assets a ON ams.asset_id = a.id
                WHERE ams.id = $1 AND ams.deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                description: row.description,
                scheduleType: row.schedule_type,
                intervalUnit: row.interval_unit,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                intervalValue: row.interval_value,
                timeZone: row.time_zone,
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at,
                // Include asset details directly
                asset: row.asset_id_ref ? {
                    id: row.asset_id_ref,
                    name: row.asset_name,
                    description: row.asset_description,
                    productId: row.asset_product_id,
                    serialNumber: row.asset_serial_number,
                    installationDate: row.asset_installation_date,
                    locationIds: row.asset_location_ids || [],
                    fileIds: row.asset_file_ids || [],
                    userIds: row.asset_user_ids || [],
                    position: row.asset_position,
                    status: row.asset_status,
                    createdAt: row.asset_created_at,
                    updatedAt: row.asset_updated_at,
                    deletedAt: row.asset_deleted_at
                } : null
            };
        }
    },

    Mutation: {
        createAssetMaintenanceSchedule: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const {
                assetId,
                title,
                description,
                scheduleType,
                intervalUnit,
                startDate,
                nextDueDate,
                intervalValue,
                timeZone,
                assignedToUserIds
            } = input;

            // Calculate next_due_date if not provided
            let calculatedNextDueDate = nextDueDate;
            if (!calculatedNextDueDate && intervalUnit && startDate) {
                calculatedNextDueDate = calculateNextDueDate(
                    startDate,
                    intervalUnit,
                    intervalValue || 1,
                    timeZone || 'UTC'
                );
            }

            const query = `
                INSERT INTO ${schema}.asset_maintenance_schedules (
                    asset_id,
                    title,
                    description,
                    schedule_type,
                    interval_unit,
                    start_date,
                    next_due_date,
                    interval_value,
                    time_zone,
                    assigned_to_user_ids
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const params = [
                assetId,
                title,
                description,
                scheduleType,
                intervalUnit,
                startDate,
                calculatedNextDueDate,
                intervalValue || 1,
                timeZone,
                assignedToUserIds || []
            ];

            const result = await executeQuery(schema, query, params);
            const row = result.rows[0];

            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                description: row.description,
                scheduleType: row.schedule_type,
                intervalUnit: row.interval_unit,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                intervalValue: row.interval_value,
                timeZone: row.time_zone,
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        updateAssetMaintenanceSchedule: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const {
                id,
                assetId,
                title,
                description,
                scheduleType,
                intervalUnit,
                startDate,
                nextDueDate,
                intervalValue,
                timeZone,
                assignedToUserIds
            } = input;

            // First, get the current record to determine what needs to be recalculated
            const getCurrentQuery = `
                SELECT * FROM ${schema}.asset_maintenance_schedules
                WHERE id = $1 AND deleted_at IS NULL
            `;
            const currentResult = await executeQuery(schema, getCurrentQuery, [id]);

            if (currentResult.rows.length === 0) {
                throw new Error('Asset maintenance schedule not found');
            }

            const currentRecord = currentResult.rows[0];

            const updates = [];
            const params = [];
            let paramIndex = 1;

            // Track if we need to recalculate next_due_date
            let shouldRecalculateNextDueDate = false;
            let newStartDate = currentRecord.start_date;
            let newIntervalUnit = currentRecord.interval_unit;
            let newIntervalValue = currentRecord.interval_value;
            let newTimeZone = currentRecord.time_zone;

            if (title !== undefined) {
                updates.push(`title = $${paramIndex}`);
                params.push(title);
                paramIndex++;
            }
            if (description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                params.push(description);
                paramIndex++;
            }
            if (scheduleType !== undefined) {
                updates.push(`schedule_type = $${paramIndex}`);
                params.push(scheduleType);
                paramIndex++;
            }
            if (intervalUnit !== undefined) {
                updates.push(`interval_unit = $${paramIndex}`);
                params.push(intervalUnit);
                paramIndex++;
                newIntervalUnit = intervalUnit;
                shouldRecalculateNextDueDate = true;
            }
            if (startDate !== undefined) {
                updates.push(`start_date = $${paramIndex}`);
                params.push(startDate);
                paramIndex++;
                newStartDate = startDate;
                shouldRecalculateNextDueDate = true;
            }
            if (intervalValue !== undefined) {
                updates.push(`interval_value = $${paramIndex}`);
                params.push(intervalValue);
                paramIndex++;
                newIntervalValue = intervalValue;
                shouldRecalculateNextDueDate = true;
            }
            if (timeZone !== undefined) {
                updates.push(`time_zone = $${paramIndex}`);
                params.push(timeZone);
                paramIndex++;
                newTimeZone = timeZone;
                shouldRecalculateNextDueDate = true;
            }

            // Handle next_due_date
            if (nextDueDate !== undefined) {
                // Explicit next_due_date provided, use it
                updates.push(`next_due_date = $${paramIndex}`);
                params.push(nextDueDate);
                paramIndex++;
            } else if (shouldRecalculateNextDueDate) {
                // Recalculate based on updated values
                const calculatedNextDueDate = calculateNextDueDate(
                    newStartDate,
                    newIntervalUnit,
                    newIntervalValue,
                    newTimeZone
                );
                updates.push(`next_due_date = $${paramIndex}`);
                params.push(calculatedNextDueDate);
                paramIndex++;
            }

            if (assignedToUserIds !== undefined) {
                updates.push(`assigned_to_user_ids = $${paramIndex}`);
                params.push(assignedToUserIds);
                paramIndex++;
            }

            updates.push(`updated_at = NOW()`);

            params.push(id);
            const idIndex = paramIndex;

            const query = `
                UPDATE ${schema}.asset_maintenance_schedules
                SET ${updates.join(', ')}
                WHERE id = $${idIndex} AND deleted_at IS NULL
                RETURNING *
            `;

            const result = await executeQuery(schema, query, params);

            if (result.rows.length === 0) {
                throw new Error('Asset maintenance schedule not found');
            }

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                description: row.description,
                scheduleType: row.schedule_type,
                intervalUnit: row.interval_unit,
                startDate: row.start_date,
                nextDueDate: row.next_due_date,
                intervalValue: row.interval_value,
                timeZone: row.time_zone,
                assignedToUserIds: row.assigned_to_user_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        deleteAssetMaintenanceSchedule: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                UPDATE ${schema}.asset_maintenance_schedules
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
            `;

            await executeQuery(schema, query, [id]);
            return true;
        }
    },

    AssetMaintenanceSchedule: {
        asset: async (parent, args, context) => {
            // If asset is already populated from the query, return it
            if (parent.asset) {
                return parent.asset;
            }

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
                productId: row.product_id,
                serialNumber: row.serial_number,
                installationDate: row.installation_date,
                locationIds: row.location_ids || [],
                fileIds: row.file_ids || [],
                userIds: row.user_ids || [],
                position: row.position,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        assignedToUsers: async (parent, args, context) => {
            if (!parent.assignedToUserIds || parent.assignedToUserIds.length === 0) {
                return [];
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.users
                WHERE id = ANY($1) AND deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [parent.assignedToUserIds]);

            return result.rows.map(row => ({
                id: row.id,
                email: row.email,
                firstName: row.first_name,
                lastName: row.last_name,
                phone: row.phone,
                jobTitle: row.job_title,
                role: row.role
            }));
        }
    }
};

module.exports = assetMaintenanceScheduleResolvers;
