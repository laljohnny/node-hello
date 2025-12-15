const db = require('../utils/db');

/**
 * Helper: Get schemas to query based on user schema
 * Returns array of schemas in priority order
 */
function getSchemasToQuery(userSchema) {
    return userSchema !== 'public' ? ['public', userSchema] : ['public'];
}

/**
 * Helper: Query all enums from a specific schema
 * Returns empty array if schema doesn't exist or has no enums
 */
async function queryEnumsFromSchema(schema) {
    const query = `
        SELECT 
            t.typname as name,
            $1::text as schema,
            COALESCE(json_agg(e.enumlabel ORDER BY e.enumsortorder), '[]'::json) as values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = $1::text
        GROUP BY t.typname
        ORDER BY t.typname
    `;
    
    try {
        const result = await db.query(query, [schema]);
        return result.rows;
    } catch (err) {
        console.error(`Error fetching enums from schema ${schema}:`, err.message);
        return [];
    }
}

/**
 * Get all enum types based on user's schema/company
 * Returns enums from public schema and user's tenant schema (if applicable)
 */
async function getEnums(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const userSchema = req.user.schema || 'public';
        const companyId = req.user.companyId;

        // Query enums from all relevant schemas
        const schemasToQuery = getSchemasToQuery(userSchema);
        const allEnums = [];

        for (const schema of schemasToQuery) {
            const schemaEnums = await queryEnumsFromSchema(schema);
            allEnums.push(...schemaEnums);
        }

        res.json({
            companyId: companyId || null,
            schema: userSchema,
            enums: allEnums
        });
    } catch (error) {
        console.error('Get enums error:', error);
        res.status(500).json({ message: 'Failed to get enums', error: error.message });
    }
}

/**
 * Helper: Query enum from a specific schema
 * Returns null if enum not found
 */
async function queryEnumFromSchema(schema, enumName) {
    const query = `
        SELECT 
            COALESCE(json_agg(e.enumlabel ORDER BY e.enumsortorder), '[]'::json) as values,
            $1::text as schema
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = $2::text AND n.nspname = $1::text
    `;
    
    try {
        const result = await db.query(query, [schema, enumName]);
        
        if (result.rows.length === 0 || !result.rows[0].values || result.rows[0].values.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (err) {
        console.error(`Error fetching enum '${enumName}' from schema ${schema}:`, err.message);
        return null;
    }
}

/**
 * Get enum values by enum name
 * Returns enum from public schema or user's tenant schema
 */
async function getEnumByName(req, res) {
    try {
        const { enumName } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const userSchema = req.user.schema || 'public';
        const companyId = req.user.companyId;

        // Try tenant schema first (if not public), then fallback to public
        // getSchemasToQuery returns ['public', userSchema], so reverse to try tenant first
        const schemasToTry = userSchema !== 'public' 
            ? [userSchema, 'public'] 
            : ['public'];
        let enumResult = null;
        for (const schema of schemasToTry) {
            enumResult = await queryEnumFromSchema(schema, enumName);
            if (enumResult) break;
        }

        if (!enumResult) {
            return res.status(404).json({ 
                message: `Enum '${enumName}' not found in schema '${userSchema}' or 'public'` 
            });
        }

        res.json({
            enumName,
            schema: enumResult.schema,
            companyId: companyId || null,
            values: enumResult.values
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to get enum', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Get all enum types (for admin/super_admin - shows all schemas)
 */
async function getAllEnums(req, res) {
    try {
        // User is already authenticated by middleware, get from req.user
        if (!req.user) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        // Only super_admin can see all enums from all schemas
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only super_admin can access all enums' });
        }

        const query = `
            SELECT 
                t.typname as name,
                n.nspname as schema,
                COALESCE(json_agg(e.enumlabel ORDER BY e.enumsortorder), '[]'::json) as values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE n.nspname IN ('public', 'ca_template_tenant')
               OR n.nspname LIKE 'ca_%'
            GROUP BY t.typname, n.nspname
            ORDER BY n.nspname, t.typname
        `;

        const result = await db.query(query);
        
        res.json({ enums: result.rows });
    } catch (error) {
        console.error('Get all enums error:', error);
        res.status(500).json({ message: 'Failed to get all enums', error: error.message });
    }
}

module.exports = {
    getEnums,
    getEnumByName,
    getAllEnums
};

