const { GraphQLScalarType } = require('graphql');

// JSON Scalar Type
const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        return value;
    },
    parseLiteral(ast) {
        if (ast.kind === 'StringValue') {
            try {
                return JSON.parse(ast.value);
            } catch {
                return ast.value;
            }
        }
        return null;
    }
});

// Helper function to validate request status
const validateRequestStatus = (status) => {
    const validStatuses = ['draft', 'in_review', 'published'];
    if (status && !validStatuses.includes(status)) {
        throw new Error(`Invalid request status. Must be one of: ${validStatuses.join(', ')}`);
    }
};

// Helper function to validate lifecycle status
const validateLifecycleStatus = (status) => {
    const validStatuses = ['active', 'limited_support', 'end_of_sale', 'end_of_support', 'obsolete', 'decommissioned'];
    if (status && !validStatuses.includes(status)) {
        throw new Error(`Invalid lifecycle status. Must be one of: ${validStatuses.join(', ')}`);
    }
};

// Helper function to validate manufacturer status
const validateManufacturerStatus = (status) => {
    const validStatuses = ['operational', 'discontinued', 'eol'];
    if (status && !validStatuses.includes(status)) {
        throw new Error(`Invalid manufacturer status. Must be one of: ${validStatuses.join(', ')}`);
    }
};

// Helper function to validate rating
const validateRating = (rating) => {
    if (rating !== null && rating !== undefined) {
        if (rating < 0 || rating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }
    }
};

// Helper function to validate UUID format
const validateUUID = (value, fieldName) => {
    if (!value || typeof value !== 'string') {
        throw new Error(`${fieldName} must be a non-empty string`);
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
        throw new Error(`Invalid UUID format for ${fieldName}: "${value}"`);
    }
};

// Valid Product fields (from Product type schema - excluding system fields)
const validProductFields = new Set([
    'parentId', 'parent_id',
    'categoryId', 'category_id',
    'typeId', 'type_id',
    'manufacturerId', 'manufacturer_id',
    'successorId', 'successor_id',
    'predecessorId', 'predecessor_id',
    'name',
    'make',
    'model',
    'serialNumber', 'serial_number',
    'dataSheet', 'data_sheet',
    'lifespan',
    'rating',
    'specifications',
    'images',
    'description',
    'lifecycleStatus', 'lifecycle_status',
    'manufacturerStatus', 'manufacturer_status',
    'isActive', 'is_active'
]);

// Helper function to validate requestJson structure (only Product fields allowed)
const validateProductRequestJson = (requestJson) => {
    if (!requestJson || typeof requestJson !== 'object' || Array.isArray(requestJson)) {
        throw new Error('requestJson must be a valid JSON object');
    }

    // Check for invalid fields (fields that are not valid Product fields)
    const invalidFields = Object.keys(requestJson).filter(key => !validProductFields.has(key));
    if (invalidFields.length > 0) {
        throw new Error(`Invalid fields in requestJson: ${invalidFields.join(', ')}. Only Product type fields are allowed.`);
    }

    // Validate UUID fields if present
    const uuidFields = [
        { camel: 'categoryId', snake: 'category_id' },
        { camel: 'typeId', snake: 'type_id' },
        { camel: 'manufacturerId', snake: 'manufacturer_id' },
        { camel: 'parentId', snake: 'parent_id' },
        { camel: 'successorId', snake: 'successor_id' },
        { camel: 'predecessorId', snake: 'predecessor_id' }
    ];

    for (const field of uuidFields) {
        const value = requestJson[field.camel] || requestJson[field.snake];
        if (value !== undefined && value !== null) {
            if (typeof value !== 'string') {
                throw new Error(`${field.camel} must be a string (UUID)`);
            }
            validateUUID(value, field.camel);
        }
    }

    // Validate name is a string if provided
    const name = requestJson.name;
    if (name !== undefined && name !== null) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('name must be a non-empty string');
        }
    }
};

// Helper function to normalize field names (supports both camelCase and snake_case)
const normalizeField = (obj, camelName, snakeName) => {
    return obj[camelName] !== undefined ? obj[camelName] : (obj[snakeName] !== undefined ? obj[snakeName] : undefined);
};

// Helper function to create product from request_json
const createProductFromRequest = async (requestJson, client) => {
    // Fields to exclude from request_json (system fields)
    const excludedFields = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'created_at', 'updated_at', 'deleted_at'];
    
    // Required fields for products table (check both camelCase and snake_case)
    const requiredFields = [
        { camel: 'categoryId', snake: 'category_id' },
        { camel: 'typeId', snake: 'type_id' },
        { camel: 'manufacturerId', snake: 'manufacturer_id' },
        { camel: 'name', snake: 'name' }
    ];
    
    // Validate required fields
    for (const field of requiredFields) {
        const value = normalizeField(requestJson, field.camel, field.snake);
        if (!value && value !== 0) {
            throw new Error(`Missing required field in request_json: ${field.camel} or ${field.snake}`);
        }
    }
    
    // Normalize all field names to camelCase for processing
    const normalized = {
        categoryId: normalizeField(requestJson, 'categoryId', 'category_id'),
        typeId: normalizeField(requestJson, 'typeId', 'type_id'),
        manufacturerId: normalizeField(requestJson, 'manufacturerId', 'manufacturer_id'),
        parentId: normalizeField(requestJson, 'parentId', 'parent_id'),
        successorId: normalizeField(requestJson, 'successorId', 'successor_id'),
        predecessorId: normalizeField(requestJson, 'predecessorId', 'predecessor_id'),
        name: normalizeField(requestJson, 'name', 'name'),
        make: normalizeField(requestJson, 'make', 'make'),
        model: normalizeField(requestJson, 'model', 'model'),
        serialNumber: normalizeField(requestJson, 'serialNumber', 'serial_number'),
        dataSheet: normalizeField(requestJson, 'dataSheet', 'data_sheet'),
        lifespan: normalizeField(requestJson, 'lifespan', 'lifespan'),
        rating: normalizeField(requestJson, 'rating', 'rating'),
        specifications: normalizeField(requestJson, 'specifications', 'specifications'),
        images: normalizeField(requestJson, 'images', 'images'),
        description: normalizeField(requestJson, 'description', 'description'),
        lifecycleStatus: normalizeField(requestJson, 'lifecycleStatus', 'lifecycle_status'),
        manufacturerStatus: normalizeField(requestJson, 'manufacturerStatus', 'manufacturer_status'),
        isActive: normalizeField(requestJson, 'isActive', 'is_active')
    };
    
    // Validate category exists
    const categoryCheck = `
        SELECT id
        FROM public.product_categories
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const categoryResult = await client.query(categoryCheck, [normalized.categoryId]);
    if (categoryResult.rows.length === 0) {
        throw new Error('Product category not found');
    }
    
    // Validate type exists
    const typeCheck = `
        SELECT id
        FROM public.product_types
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const typeResult = await client.query(typeCheck, [normalized.typeId]);
    if (typeResult.rows.length === 0) {
        throw new Error('Product type not found');
    }
    
    // Validate manufacturer exists
    const manufacturerCheck = `
        SELECT id
        FROM public.manufacturers
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const manufacturerResult = await client.query(manufacturerCheck, [normalized.manufacturerId]);
    if (manufacturerResult.rows.length === 0) {
        throw new Error('Manufacturer not found');
    }
    
    // Validate parent if provided
    if (normalized.parentId) {
        const parentCheck = `
            SELECT id
            FROM public.products
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const parentResult = await client.query(parentCheck, [normalized.parentId]);
        if (parentResult.rows.length === 0) {
            throw new Error('Parent product not found');
        }
    }
    
    // Validate successor if provided
    if (normalized.successorId) {
        const successorCheck = `
            SELECT id
            FROM public.products
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const successorResult = await client.query(successorCheck, [normalized.successorId]);
        if (successorResult.rows.length === 0) {
            throw new Error('Successor product not found');
        }
    }
    
    // Validate predecessor if provided
    if (normalized.predecessorId) {
        const predecessorCheck = `
            SELECT id
            FROM public.products
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const predecessorResult = await client.query(predecessorCheck, [normalized.predecessorId]);
        if (predecessorResult.rows.length === 0) {
            throw new Error('Predecessor product not found');
        }
    }
    
    // Validate status enums
    if (normalized.lifecycleStatus) {
        validateLifecycleStatus(normalized.lifecycleStatus);
    }
    if (normalized.manufacturerStatus) {
        validateManufacturerStatus(normalized.manufacturerStatus);
    }
    
    // Validate rating
    if (normalized.rating !== undefined && normalized.rating !== null) {
        validateRating(normalized.rating);
    }
    
    // Handle JSON fields
    let specifications = normalized.specifications;
    if (specifications !== null && specifications !== undefined) {
        if (typeof specifications === 'string') {
            try {
                specifications = JSON.parse(specifications);
            } catch (e) {
                throw new Error('Invalid JSON format for specifications');
            }
        }
    } else {
        specifications = null;
    }
    
    let images = normalized.images || [];
    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch (e) {
            throw new Error('Invalid JSON format for images');
        }
    }
    
    // Build product data, excluding system fields
    const productData = {
        parentId: normalized.parentId || null,
        categoryId: normalized.categoryId,
        typeId: normalized.typeId,
        manufacturerId: normalized.manufacturerId,
        successorId: normalized.successorId || null,
        predecessorId: normalized.predecessorId || null,
        name: normalized.name,
        make: normalized.make || null,
        model: normalized.model || null,
        serialNumber: normalized.serialNumber || null,
        dataSheet: normalized.dataSheet || null,
        lifespan: normalized.lifespan || null,
        rating: normalized.rating || null,
        specifications: specifications,
        images: images,
        description: normalized.description || null,
        lifecycleStatus: normalized.lifecycleStatus || 'active',
        manufacturerStatus: normalized.manufacturerStatus || 'operational',
        isActive: normalized.isActive !== undefined ? normalized.isActive : true
    };
    
    // Insert product
    const insertQuery = `
        INSERT INTO public.products (
            parent_id,
            category_id,
            type_id,
            manufacturer_id,
            successor_id,
            predecessor_id,
            name,
            make,
            model,
            serial_number,
            data_sheet,
            lifespan,
            rating,
            specifications,
            images,
            description,
            lifecycle_status,
            manufacturer_status,
            is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18, $19)
        RETURNING id
    `;
    
    const result = await client.query(insertQuery, [
        productData.parentId,
        productData.categoryId,
        productData.typeId,
        productData.manufacturerId,
        productData.successorId,
        productData.predecessorId,
        productData.name,
        productData.make,
        productData.model,
        productData.serialNumber,
        productData.dataSheet,
        productData.lifespan,
        productData.rating,
        specifications ? JSON.stringify(specifications) : null,
        JSON.stringify(images),
        productData.description,
        productData.lifecycleStatus,
        productData.manufacturerStatus,
        productData.isActive
    ]);
    
    return result.rows[0].id;
};

const masterDataRequestResolvers = {
    JSON: JSONScalar,
    
    MasterDataRequest: {
        company: async (parent, args, context) => {
            // Check if companyId exists in parent - try both camelCase and the raw data
            const companyId = parent.companyId || (parent.company_id);
            
            if (!companyId) {
                return null;
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        email,
                        sub_domain as "subdomain",
                        role,
                        parent_company as "parentCompanyId",
                        schema_name as "schemaName",
                        schema_status as "schemaStatus",
                        address,
                        city,
                        state,
                        country,
                        zip,
                        phone_number as "phoneNumber",
                        country_code as "countryCode",
                        industry,
                        website,
                        business_type as "businessType",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.companies
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [companyId]);
                
                if (result.rows.length === 0) {
                    return null;
                }

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    subdomain: row.subdomain,
                    role: row.role,
                    parentCompanyId: row.parentCompanyId,
                    parentCompany: null, // Can be resolved separately if needed
                    schemaName: row.schemaName,
                    schemaStatus: row.schemaStatus,
                    address: row.address,
                    city: row.city,
                    state: row.state,
                    country: row.country,
                    zip: row.zip,
                    phoneNumber: row.phoneNumber,
                    countryCode: row.countryCode,
                    industry: row.industry,
                    website: row.website,
                    businessType: row.businessType,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
                    owner: null // Can be resolved separately if needed
                };
            } catch (error) {
                console.error('Error fetching company for master data request:', error);
                console.error('CompanyId:', companyId);
                return null;
            } finally {
                client.release();
            }
        }
    },
    
    Query: {
        masterDataRequests: async (parent, { status, userId }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        type,
                        request_json as "requestJson",
                        request_by as "requestBy",
                        user_id as "userId",
                        company_id as "companyId",
                        status,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_data_requests
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramCount = 1;

                // Filter by company_id if it exists in context
                if (context.companyId && context.role !== 'super_admin') {
                    query += ` AND company_id = $${paramCount}`;
                    params.push(context.companyId);
                    paramCount++;
                }

                if (status) {
                    query += ` AND status = $${paramCount}`;
                    params.push(status);
                    paramCount++;
                }

                if (userId) {
                    query += ` AND user_id = $${paramCount}`;
                    params.push(userId);
                    paramCount++;
                }

                query += ` ORDER BY created_at DESC`;

                const result = await client.query(query, params);
                return result.rows.map(row => formatDataRequestRow(row));
            } catch (error) {
                console.error('Error fetching master data requests:', error);
                throw new Error(`Failed to fetch master data requests: ${error.message}`);
            } finally {
                client.release();
            }
        },

        masterDataRequest: async (parent, { id }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        type,
                        request_json as "requestJson",
                        request_by as "requestBy",
                        user_id as "userId",
                        company_id as "companyId",
                        status,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_data_requests
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const params = [id];
                let paramCount = 2;

                // Filter by company_id if it exists in context
                if (context.companyId && context.role !== 'super_admin') {
                    query += ` AND company_id = $${paramCount}`;
                    params.push(context.companyId);
                }

                const result = await client.query(query, params);
                if (result.rows.length === 0) {
                    throw new Error('Master data request not found');
                }

                return formatDataRequestRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching master data request:', error);
                throw new Error(`Failed to fetch master data request: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createMasterDataRequest: async (parent, { input }, context) => {
            // All authenticated users can create
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Handle requestJson - must be valid JSON
                let requestJson = input.requestJson;
                if (typeof requestJson === 'string') {
                    try {
                        requestJson = JSON.parse(requestJson);
                    } catch (e) {
                        throw new Error('Invalid JSON format for requestJson');
                    }
                }

                // Validate requestJson - only Product fields allowed
                validateProductRequestJson(requestJson);

                // Use current user's ID if userId is not provided
                const userId = input.userId || context.user.userId || null;
                
                // Get company_id from context/JWT
                const companyId = context.companyId || null;

                // Status should always be 'in_review' when creating, regardless of input
                const status = "in_review";

                const insertQuery = `
                    INSERT INTO public.master_data_requests (
                        type,
                        request_json,
                        request_by,
                        user_id,
                        company_id,
                        status
                    ) VALUES ($1, $2::jsonb, $3, $4, $5, $6)
                    RETURNING 
                        id,
                        type,
                        request_json as "requestJson",
                        request_by as "requestBy",
                        user_id as "userId",
                        company_id as "companyId",
                        status,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.type,
                    JSON.stringify(requestJson),
                    input.requestBy || null,
                    userId,
                    companyId,
                    status
                ]);

                await client.query('COMMIT');

                return formatDataRequestRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating master data request:', error);
                throw new Error(`Failed to create master data request: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateMasterDataRequest: async (parent, { input }, context) => {
            // All authenticated users can update
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if data request exists and get current status and request_json
                let checkQuery = `
                    SELECT id, status, request_json, company_id
                    FROM public.master_data_requests
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkParams = [input.id];
                
                // Filter by company_id if it exists in context
                if (context.companyId && context.role !== 'super_admin') {
                    checkQuery += ` AND company_id = $2`;
                    checkParams.push(context.companyId);
                }
                
                const checkResult = await client.query(checkQuery, checkParams);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master data request not found');
                }

                const currentStatus = checkResult.rows[0].status;
                const currentRequestJson = checkResult.rows[0].request_json;
                const isStatusChange = input.status !== undefined && input.status !== currentStatus;
                const newStatus = input.status !== undefined ? input.status : currentStatus;

                // Only super_admin can change status (other than draft)
                if (isStatusChange && context.user.role !== 'super_admin') {
                    throw new Error('Unauthorized: Only super_admin can change request status');
                }

                // Validate status if being updated
                if (input.status !== undefined) {
                    validateRequestStatus(input.status);
                }

                // If status is being changed to 'published', create product from request_json
                if (isStatusChange && newStatus === 'published') {
                    // Use updated request_json if provided, otherwise use current
                    let requestJson = input.requestJson !== undefined ? input.requestJson : currentRequestJson;
                    
                    if (typeof requestJson === 'string') {
                        try {
                            requestJson = JSON.parse(requestJson);
                        } catch (e) {
                            throw new Error('Invalid JSON format for requestJson');
                        }
                    }
                    
                    // Validate requestJson before creating product
                    validateProductRequestJson(requestJson);
                    
                    // Create product from request_json
                    await createProductFromRequest(requestJson, client);
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.type !== undefined) {
                    updates.push(`type = $${paramCount}`);
                    values.push(input.type);
                    paramCount++;
                }

                if (input.requestJson !== undefined) {
                    let requestJson = input.requestJson;
                    if (typeof requestJson === 'string') {
                        try {
                            requestJson = JSON.parse(requestJson);
                        } catch (e) {
                            throw new Error('Invalid JSON format for requestJson');
                        }
                    }
                    
                    // Validate requestJson - only Product fields allowed
                    validateProductRequestJson(requestJson);
                    
                    updates.push(`request_json = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(requestJson));
                    paramCount++;
                }

                if (input.requestBy !== undefined) {
                    updates.push(`request_by = $${paramCount}`);
                    values.push(input.requestBy || null);
                    paramCount++;
                }

                if (input.userId !== undefined) {
                    updates.push(`user_id = $${paramCount}`);
                    values.push(input.userId || null);
                    paramCount++;
                }

                if (input.status !== undefined) {
                    updates.push(`status = $${paramCount}`);
                    values.push(input.status);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.master_data_requests
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        type,
                        request_json as "requestJson",
                        request_by as "requestBy",
                        user_id as "userId",
                        company_id as "companyId",
                        status,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                return formatDataRequestRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating master data request:', error);
                throw new Error(`Failed to update master data request: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteMasterDataRequest: async (parent, { input }, context) => {
            // All authenticated users can delete
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if data request exists
                let checkQuery = `
                    SELECT id
                    FROM public.master_data_requests
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkParams = [input.id];
                
                // Filter by company_id if it exists in context
                if (context.companyId && context.role !== 'super_admin') {
                    checkQuery += ` AND company_id = $2`;
                    checkParams.push(context.companyId);
                }
                
                const checkResult = await client.query(checkQuery, checkParams);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master data request not found');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.master_data_requests
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `;
                await client.query(deleteQuery, [input.id]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting master data request:', error);
                throw new Error(`Failed to delete master data request: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

// Helper function to format data request row
function formatDataRequestRow(row) {
    return {
        id: row.id,
        type: row.type,
        requestJson: row.requestJson,
        requestBy: row.requestBy,
        userId: row.userId,
        companyId: row.companyId,
        status: row.status,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
    };
}

module.exports = masterDataRequestResolvers;

