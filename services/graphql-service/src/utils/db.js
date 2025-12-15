const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000000, // Increased from 2s to 10s
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Export all functions - DO NOT add another module.exports below
module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool,
    executeTransaction,
    executeQuery,
    buildWhereClause,
    getAllSubLocationIds,
    formatAssetResponse,
    fetchAssetParts,
    fetchAssetFieldValues,
    fetchAssetPartFieldValues,
    fetchAssetRelations,
    fetchMaintenanceSchedules
};

/**
 * Execute multiple queries in a transaction
 * @param {string} schema - The schema to use
 * @param {Array<{query: string, params: Array}>} queries - Array of query objects
 * @returns {Promise<Array>} - Array of query results
 */
async function executeTransaction(schema, queries) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(`SET search_path TO ${schema}, public`);

        const results = [];
        for (const { query, params } of queries) {
            const result = await client.query(query, params);
            results.push(result);
        }

        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Execute a single query with schema context
 * @param {string} schema - The schema to use
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function executeQuery(schema, query, params = []) {
    const client = await pool.connect();

    try {
        await client.query(`SET search_path TO ${schema}, public`);
        const result = await client.query(query, params);
        return result;
    } finally {
        client.release();
    }
}

/**
 * Build WHERE clause from filters
 * @param {Object} filters - Filter object
 * @returns {Object} - { whereClause: string, params: Array }
 */
function buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (!filters) {
        return { whereClause: '', params: [] };
    }

    if (filters.productId) {
        conditions.push(`product_id = $${paramIndex}`);
        params.push(filters.productId);
        paramIndex++;
    }

    if (filters.productIds && filters.productIds.length > 0) {
        conditions.push(`product_id = ANY($${paramIndex}::uuid[])`);
        params.push(filters.productIds);
        paramIndex++;
    }

    if (filters.serialNumber) {
        conditions.push(`serial_number = $${paramIndex}`);
        params.push(filters.serialNumber);
        paramIndex++;
    }

    if (filters.locationIds && filters.locationIds.length > 0) {
        conditions.push(`location_ids && $${paramIndex}::uuid[]`);
        params.push(filters.locationIds);
        paramIndex++;
    }

    if (filters.userIds && filters.userIds.length > 0) {
        conditions.push(`user_ids && $${paramIndex}::uuid[]`);
        params.push(filters.userIds);
        paramIndex++;
    }

    if (filters.searchTerm) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        params.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }

    if (filters.createdBy) {
        conditions.push(`created_by = $${paramIndex}`);
        params.push(filters.createdBy);
        paramIndex++;
    }

    if (filters.name) {
        conditions.push(`name ILIKE $${paramIndex}`);
        params.push(`%${filters.name}%`);
        paramIndex++;
    }

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')} AND deleted_at IS NULL`
        : 'WHERE deleted_at IS NULL';

    return { whereClause, params };
}

/**
 * Helper function to get all sub-location IDs recursively
 * @param {string} locationId - The parent location ID
 * @param {string} schema - The schema to use
 * @returns {Promise<Array>} - Array of location IDs including the parent
 */
async function getAllSubLocationIds(locationId, schema) {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schema}, public`);

        const locationIds = [locationId];

        // Recursive function to get children
        async function getChildren(parentId) {
            const query = `
                SELECT id 
                FROM ${schema}.locations
                WHERE parent_id = $1 AND deleted_at IS NULL
            `;
            const result = await client.query(query, [parentId]);

            for (const row of result.rows) {
                locationIds.push(row.id);
                await getChildren(row.id); // Recursively get children
            }
        }

        await getChildren(locationId);
        return locationIds;
    } finally {
        client.release();
    }
}



/**
 * Format asset response with nested data
 * @param {Object} assetRow - Asset database row
 * @param {string} schema - Schema name
 * @returns {Promise<Object>} - Formatted asset object
 */
async function formatAssetResponse(assetRow, schema) {
    if (!assetRow) return null;

    const asset = {
        id: assetRow.id,
        name: assetRow.name,
        description: assetRow.description,
        locationIds: assetRow.location_ids || [],
        fileIds: assetRow.file_ids || [],
        productId: assetRow.product_id,
        serialNumber: assetRow.serial_number,
        installationDate: assetRow.installation_date,
        maintenanceIds: assetRow.maintenance_ids || [],
        userIds: assetRow.user_ids || [],
        position: assetRow.position,
        createdAt: assetRow.created_at,
        updatedAt: assetRow.updated_at,
        deletedAt: assetRow.deleted_at
    };

    return asset;
}

/**
 * Fetch asset parts for an asset
 * @param {string} assetId - Asset ID
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} - Array of asset parts
 */
async function fetchAssetParts(assetId, schema) {
    const query = `
        SELECT * FROM ${schema}.asset_parts
        WHERE asset_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
    `;

    const result = await executeQuery(schema, query, [assetId]);
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
}

/**
 * Fetch asset field values for an asset
 * @param {string} assetId - Asset ID
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} - Array of field values
 */
async function fetchAssetFieldValues(assetId, schema) {
    const query = `
        SELECT * FROM ${schema}.asset_field_values
        WHERE asset_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
    `;

    const result = await executeQuery(schema, query, [assetId]);
    return result.rows.map(row => ({
        id: row.id,
        assetId: row.asset_id,
        assetFieldId: row.asset_field_id,
        fieldValue: row.field_value,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

/**
 * Fetch asset part field values for an asset part
 * @param {string} assetPartId - Asset part ID
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} - Array of field values
 */
async function fetchAssetPartFieldValues(assetPartId, schema) {
    const query = `
        SELECT * FROM ${schema}.asset_part_field_values
        WHERE asset_part_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
    `;

    const result = await executeQuery(schema, query, [assetPartId]);
    return result.rows.map(row => ({
        id: row.id,
        assetPartId: row.asset_part_id,
        assetPartFieldId: row.asset_part_field_id,
        value: row.value,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

/**
 * Fetch asset relations for an asset
 * @param {string} assetId - Asset ID
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} - Array of relations
 */
async function fetchAssetRelations(assetId, schema) {
    const query = `
        SELECT * FROM ${schema}.asset_relations
        WHERE asset_id = $1
        ORDER BY created_at
    `;

    const result = await executeQuery(schema, query, [assetId]);
    return result.rows.map(row => ({
        id: row.id,
        assetId: row.asset_id,
        fedFromId: row.fed_from_id,
        fedFromPartId: row.fed_from_part_id,
        createdAt: row.created_at
    }));
}

/**
 * Fetch maintenance schedules for an asset
 * @param {string} assetId - Asset ID
 * @param {string} schema - Schema name
 * @returns {Promise<Array>} - Array of schedules
 */
async function fetchMaintenanceSchedules(assetId, schema) {
    const query = `
        SELECT * FROM ${schema}.asset_maintenance_schedules
        WHERE asset_id = $1 AND deleted_at IS NULL
        ORDER BY created_at
    `;

    const result = await executeQuery(schema, query, [assetId]);

    // Collect all user IDs
    const allUserIds = new Set();
    result.rows.forEach(row => {
        if (row.assigned_to_user_ids && Array.isArray(row.assigned_to_user_ids)) {
            row.assigned_to_user_ids.forEach(uid => allUserIds.add(uid));
        }
    });

    // Fetch users if any
    let userMap = {};
    if (allUserIds.size > 0) {
        const userQuery = `
            SELECT id, first_name, last_name, email, phone, role, active, created_at, updated_at
            FROM ${schema}.users
            WHERE id = ANY($1) AND deleted_at IS NULL
        `;
        const userResult = await executeQuery(schema, userQuery, [[...allUserIds]]);
        userResult.rows.forEach(u => {
            userMap[u.id] = {
                ...u,
                firstName: u.first_name,
                lastName: u.last_name,
                phoneNumber: u.phone,
                isActive: u.active,
                createdAt: u.created_at,
                updatedAt: u.updated_at
            };
        });
    }

    return result.rows.map(row => {
        const assignedIds = row.assigned_to_user_ids || [];
        const assignedUsers = assignedIds.map(uid => userMap[uid]).filter(u => u !== undefined);

        return {
            id: row.id,
            assetId: row.asset_id,
            title: row.title,
            description: row.description,
            frequency: row.frequency,
            frequencyValue: row.frequency_value,
            startDate: row.start_date,
            nextDueDate: row.next_due_date,
            assignedToUserIds: assignedIds,
            assignedToUsers: assignedUsers,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        };
    });
}


