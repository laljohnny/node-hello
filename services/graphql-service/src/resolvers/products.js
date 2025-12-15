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

// Helper function to get all child product IDs recursively
const getAllChildProductIds = async (productId, client) => {
    const childIds = [];
    const query = `
        WITH RECURSIVE product_tree AS (
            SELECT id, parent_id
            FROM public.products
            WHERE parent_id = $1 AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT p.id, p.parent_id
            FROM public.products p
            INNER JOIN product_tree pt ON p.parent_id = pt.id
            WHERE p.deleted_at IS NULL
        )
        SELECT id FROM product_tree
    `;
    
    const result = await client.query(query, [productId]);
    result.rows.forEach(row => {
        childIds.push(row.id);
    });
    
    return childIds;
};

const productResolvers = {
    JSON: JSONScalar,
    
    Product: {
        parent: async (parent, args, context) => {
            if (!parent.parentId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.parentId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return formatProductRow(row);
            } finally {
                client.release();
            }
        },

        children: async (parent, args, context) => {
            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE parent_id = $1 AND deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query, [parent.id]);
                return result.rows.map(row => formatProductRow(row));
            } finally {
                client.release();
            }
        },

        category: async (parent, args, context) => {
            if (!parent.categoryId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        name,
                        description,
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_categories
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.categoryId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return {
                    id: row.id,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    isActive: row.isActive,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } finally {
                client.release();
            }
        },

        type: async (parent, args, context) => {
            if (!parent.typeId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.typeId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return {
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } finally {
                client.release();
            }
        },

        manufacturer: async (parent, args, context) => {
            if (!parent.manufacturerId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        country_code as "countryCode",
                        country,
                        website,
                        contact_email as "contactEmail",
                        phone_number as "phoneNumber",
                        description,
                        is_active as "isActive",
                        contact_person as "contactPerson",
                        address,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.manufacturers
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.manufacturerId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    country_code: row.countryCode || '', // Ensure non-null for required field
                    country: row.country,
                    website: row.website,
                    contact_email: row.contactEmail,
                    phone_number: row.phoneNumber,
                    description: row.description,
                    is_active: row.isActive !== null && row.isActive !== undefined ? row.isActive : true, // Ensure non-null for required field
                    contact_person: row.contactPerson,
                    address: row.address,
                    created_at: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
                    updated_at: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
                    deleted_at: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } finally {
                client.release();
            }
        },

        successor: async (parent, args, context) => {
            if (!parent.successorId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.successorId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return formatProductRow(row);
            } finally {
                client.release();
            }
        },

        predecessor: async (parent, args, context) => {
            if (!parent.predecessorId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.predecessorId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return formatProductRow(row);
            } finally {
                client.release();
            }
        }
    },

    Query: {
        products: async (parent, { categoryId, typeId, manufacturerId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramCount = 1;

                if (categoryId) {
                    query += ` AND category_id = $${paramCount}`;
                    params.push(categoryId);
                    paramCount++;
                }

                if (typeId) {
                    query += ` AND type_id = $${paramCount}`;
                    params.push(typeId);
                    paramCount++;
                }

                if (manufacturerId) {
                    query += ` AND manufacturer_id = $${paramCount}`;
                    params.push(manufacturerId);
                    paramCount++;
                }

                query += ` ORDER BY name ASC`;

                const result = await client.query(query, params);
                return result.rows.map(row => formatProductRow(row));
            } catch (error) {
                console.error('Error fetching products:', error);
                throw new Error(`Failed to fetch products: ${error.message}`);
            } finally {
                client.release();
            }
        },

        product: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Product not found');
                }

                return formatProductRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching product:', error);
                throw new Error(`Failed to fetch product: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createProduct: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Validate category exists
                const categoryCheck = `
                    SELECT id
                    FROM public.product_categories
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const categoryResult = await client.query(categoryCheck, [input.categoryId]);
                if (categoryResult.rows.length === 0) {
                    throw new Error('Product category not found');
                }

                // Validate type exists
                const typeCheck = `
                    SELECT id
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const typeResult = await client.query(typeCheck, [input.typeId]);
                if (typeResult.rows.length === 0) {
                    throw new Error('Product type not found');
                }

                // Validate manufacturer exists
                const manufacturerCheck = `
                    SELECT id
                    FROM public.manufacturers
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const manufacturerResult = await client.query(manufacturerCheck, [input.manufacturerId]);
                if (manufacturerResult.rows.length === 0) {
                    throw new Error('Manufacturer not found');
                }

                // Validate parent if provided
                if (input.parentId) {
                    const parentCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const parentResult = await client.query(parentCheck, [input.parentId]);
                    if (parentResult.rows.length === 0) {
                        throw new Error('Parent product not found');
                    }
                }

                // Validate successor if provided
                if (input.successorId) {
                    const successorCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const successorResult = await client.query(successorCheck, [input.successorId]);
                    if (successorResult.rows.length === 0) {
                        throw new Error('Successor product not found');
                    }
                }

                // Validate predecessor if provided
                if (input.predecessorId) {
                    const predecessorCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const predecessorResult = await client.query(predecessorCheck, [input.predecessorId]);
                    if (predecessorResult.rows.length === 0) {
                        throw new Error('Predecessor product not found');
                    }
                }

                // Validate status enums
                if (input.lifecycleStatus) {
                    validateLifecycleStatus(input.lifecycleStatus);
                }
                if (input.manufacturerStatus) {
                    validateManufacturerStatus(input.manufacturerStatus);
                }

                // Validate rating
                if (input.rating !== undefined && input.rating !== null) {
                    validateRating(input.rating);
                }

                // Handle JSON fields
                let specifications = input.specifications;
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

                let images = input.images || [];
                if (typeof images === 'string') {
                    try {
                        images = JSON.parse(images);
                    } catch (e) {
                        throw new Error('Invalid JSON format for images');
                    }
                }

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
                    RETURNING 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.parentId || null,
                    input.categoryId,
                    input.typeId,
                    input.manufacturerId,
                    input.successorId || null,
                    input.predecessorId || null,
                    input.name,
                    input.make || null,
                    input.model || null,
                    input.serialNumber || null,
                    input.dataSheet || null,
                    input.lifespan || null,
                    input.rating || null,
                    specifications ? JSON.stringify(specifications) : null,
                    JSON.stringify(images),
                    input.description || null,
                    input.lifecycleStatus || 'active',
                    input.manufacturerStatus || 'operational',
                    input.isActive !== undefined ? input.isActive : true
                ]);

                await client.query('COMMIT');

                return formatProductRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating product:', error);
                throw new Error(`Failed to create product: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateProduct: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if product exists
                const checkQuery = `
                    SELECT id
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product not found');
                }

                // Validate category if being updated
                if (input.categoryId !== undefined) {
                    const categoryCheck = `
                        SELECT id
                        FROM public.product_categories
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const categoryResult = await client.query(categoryCheck, [input.categoryId]);
                    if (categoryResult.rows.length === 0) {
                        throw new Error('Product category not found');
                    }
                }

                // Validate type if being updated
                if (input.typeId !== undefined) {
                    const typeCheck = `
                        SELECT id
                        FROM public.product_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const typeResult = await client.query(typeCheck, [input.typeId]);
                    if (typeResult.rows.length === 0) {
                        throw new Error('Product type not found');
                    }
                }

                // Validate manufacturer if being updated
                if (input.manufacturerId !== undefined) {
                    const manufacturerCheck = `
                        SELECT id
                        FROM public.manufacturers
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const manufacturerResult = await client.query(manufacturerCheck, [input.manufacturerId]);
                    if (manufacturerResult.rows.length === 0) {
                        throw new Error('Manufacturer not found');
                    }
                }

                // Validate parent if being updated
                if (input.parentId !== undefined && input.parentId !== null) {
                    const parentCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const parentResult = await client.query(parentCheck, [input.parentId]);
                    if (parentResult.rows.length === 0) {
                        throw new Error('Parent product not found');
                    }
                }

                // Validate successor if being updated
                if (input.successorId !== undefined && input.successorId !== null) {
                    const successorCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const successorResult = await client.query(successorCheck, [input.successorId]);
                    if (successorResult.rows.length === 0) {
                        throw new Error('Successor product not found');
                    }
                }

                // Validate predecessor if being updated
                if (input.predecessorId !== undefined && input.predecessorId !== null) {
                    const predecessorCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const predecessorResult = await client.query(predecessorCheck, [input.predecessorId]);
                    if (predecessorResult.rows.length === 0) {
                        throw new Error('Predecessor product not found');
                    }
                }

                // Validate status enums
                if (input.lifecycleStatus !== undefined) {
                    validateLifecycleStatus(input.lifecycleStatus);
                }
                if (input.manufacturerStatus !== undefined) {
                    validateManufacturerStatus(input.manufacturerStatus);
                }

                // Validate rating
                if (input.rating !== undefined && input.rating !== null) {
                    validateRating(input.rating);
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.parentId !== undefined) {
                    updates.push(`parent_id = $${paramCount}`);
                    values.push(input.parentId || null);
                    paramCount++;
                }

                if (input.categoryId !== undefined) {
                    updates.push(`category_id = $${paramCount}`);
                    values.push(input.categoryId);
                    paramCount++;
                }

                if (input.typeId !== undefined) {
                    updates.push(`type_id = $${paramCount}`);
                    values.push(input.typeId);
                    paramCount++;
                }

                if (input.manufacturerId !== undefined) {
                    updates.push(`manufacturer_id = $${paramCount}`);
                    values.push(input.manufacturerId);
                    paramCount++;
                }

                if (input.successorId !== undefined) {
                    updates.push(`successor_id = $${paramCount}`);
                    values.push(input.successorId || null);
                    paramCount++;
                }

                if (input.predecessorId !== undefined) {
                    updates.push(`predecessor_id = $${paramCount}`);
                    values.push(input.predecessorId || null);
                    paramCount++;
                }

                if (input.name !== undefined) {
                    updates.push(`name = $${paramCount}`);
                    values.push(input.name);
                    paramCount++;
                }

                if (input.make !== undefined) {
                    updates.push(`make = $${paramCount}`);
                    values.push(input.make);
                    paramCount++;
                }

                if (input.model !== undefined) {
                    updates.push(`model = $${paramCount}`);
                    values.push(input.model);
                    paramCount++;
                }

                if (input.serialNumber !== undefined) {
                    updates.push(`serial_number = $${paramCount}`);
                    values.push(input.serialNumber);
                    paramCount++;
                }

                if (input.dataSheet !== undefined) {
                    updates.push(`data_sheet = $${paramCount}`);
                    values.push(input.dataSheet);
                    paramCount++;
                }

                if (input.lifespan !== undefined) {
                    updates.push(`lifespan = $${paramCount}`);
                    values.push(input.lifespan);
                    paramCount++;
                }

                if (input.rating !== undefined) {
                    updates.push(`rating = $${paramCount}`);
                    values.push(input.rating);
                    paramCount++;
                }

                if (input.specifications !== undefined) {
                    let specifications = input.specifications;
                    if (specifications === null) {
                        updates.push(`specifications = $${paramCount}`);
                        values.push(null);
                    } else {
                        if (typeof specifications === 'string') {
                            try {
                                specifications = JSON.parse(specifications);
                            } catch (e) {
                                throw new Error('Invalid JSON format for specifications');
                            }
                        }
                        updates.push(`specifications = $${paramCount}::jsonb`);
                        values.push(JSON.stringify(specifications));
                    }
                    paramCount++;
                }

                if (input.images !== undefined) {
                    let images = input.images;
                    if (typeof images === 'string') {
                        try {
                            images = JSON.parse(images);
                        } catch (e) {
                            throw new Error('Invalid JSON format for images');
                        }
                    }
                    updates.push(`images = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(images));
                    paramCount++;
                }

                if (input.description !== undefined) {
                    updates.push(`description = $${paramCount}`);
                    values.push(input.description);
                    paramCount++;
                }

                if (input.lifecycleStatus !== undefined) {
                    updates.push(`lifecycle_status = $${paramCount}`);
                    values.push(input.lifecycleStatus);
                    paramCount++;
                }

                if (input.manufacturerStatus !== undefined) {
                    updates.push(`manufacturer_status = $${paramCount}`);
                    values.push(input.manufacturerStatus);
                    paramCount++;
                }

                if (input.isActive !== undefined) {
                    updates.push(`is_active = $${paramCount}`);
                    values.push(input.isActive);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.products
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                return formatProductRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating product:', error);
                throw new Error(`Failed to update product: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteProduct: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if product exists
                const checkQuery = `
                    SELECT id
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product not found');
                }

                // Get all child product IDs recursively
                const allProductIds = await getAllChildProductIds(input.id, client);
                allProductIds.push(input.id);

                // Soft delete all products (parent and children)
                const deleteQuery = `
                    UPDATE public.products
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($1::uuid[])
                    AND deleted_at IS NULL
                `;
                await client.query(deleteQuery, [allProductIds]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting product:', error);
                throw new Error(`Failed to delete product: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

// Helper function to format product row
function formatProductRow(row) {
    return {
        id: row.id,
        parentId: row.parentId,
        categoryId: row.categoryId,
        typeId: row.typeId,
        manufacturerId: row.manufacturerId,
        successorId: row.successorId,
        predecessorId: row.predecessorId,
        name: row.name,
        make: row.make,
        model: row.model,
        serialNumber: row.serialNumber,
        dataSheet: row.dataSheet,
        lifespan: row.lifespan ? parseFloat(row.lifespan) : null,
        rating: row.rating ? parseFloat(row.rating) : null,
        specifications: row.specifications,
        images: row.images,
        description: row.description,
        lifecycleStatus: row.lifecycleStatus,
        manufacturerStatus: row.manufacturerStatus,
        isActive: row.isActive,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
    };
}

module.exports = productResolvers;

