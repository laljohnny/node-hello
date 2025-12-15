const { GraphQLScalarType } = require('graphql');

// JSON Scalar Type (reuse from location resolver pattern)
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

// Helper function to build hierarchical tree structure
const buildTypeHierarchy = (types) => {
    const typeMap = new Map();
    const rootTypes = [];

    // First pass: create map of all types
    types.forEach(type => {
        typeMap.set(type.id, {
            ...type,
            children: []
        });
    });

    // Second pass: build tree structure
    types.forEach(type => {
        const typeNode = typeMap.get(type.id);
        if (type.parentId && typeMap.has(type.parentId)) {
            const parent = typeMap.get(type.parentId);
            parent.children.push(typeNode);
        } else {
            rootTypes.push(typeNode);
        }
    });

    return rootTypes;
};

// Helper function to validate parent-child relationship (prevent circular references)
const validateTypeHierarchy = async (typeId, parentId, client) => {
    if (!parentId) return;

    // Check if parentId is the same as typeId (self-reference)
    if (typeId === parentId) {
        throw new Error('Product type cannot be its own parent');
    }

    // Check for circular reference by traversing up the tree
    let currentParentId = parentId;
    const visitedIds = new Set([typeId]);

    while (currentParentId) {
        if (visitedIds.has(currentParentId)) {
            throw new Error('Circular reference detected: cannot set parent that would create a cycle');
        }
        visitedIds.add(currentParentId);

        const parentQuery = `
            SELECT parent_id
            FROM public.product_types
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const parentResult = await client.query(parentQuery, [currentParentId]);

        if (parentResult.rows.length === 0) {
            break;
        }

        currentParentId = parentResult.rows[0].parent_id;
    }
};

// Helper function to get all child type IDs recursively
const getAllChildTypeIds = async (typeId, client) => {
    const childIds = [];
    const query = `
        WITH RECURSIVE type_tree AS (
            SELECT id, parent_id
            FROM public.product_types
            WHERE parent_id = $1 AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT pt.id, pt.parent_id
            FROM public.product_types pt
            INNER JOIN type_tree tt ON pt.parent_id = tt.id
            WHERE pt.deleted_at IS NULL
        )
        SELECT id FROM type_tree
    `;
    
    const result = await client.query(query, [typeId]);
    result.rows.forEach(row => {
        childIds.push(row.id);
    });
    
    return childIds;
};

const productTypeResolvers = {
    JSON: JSONScalar,
    
    ProductType: {
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
                        icon_name as "iconName",
                        icon_color as "iconColor",
                        icon_type as "iconType",
                        icon_url as "iconUrl",
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
                    iconName: row.iconName,
                    iconColor: row.iconColor,
                    iconType: row.iconType,
                    iconUrl: row.iconUrl,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } finally {
                client.release();
            }
        },

        parent: async (parent, args, context) => {
            if (!parent.parentId) return null;

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
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.parentId]);
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
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
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
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE parent_id = $1 AND deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query, [parent.id]);
                return result.rows.map(row => ({
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                }));
            } finally {
                client.release();
            }
        }
    },

    Query: {
        productTypes: async (parent, { categoryId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE deleted_at IS NULL
                `;
                const params = [];

                if (categoryId) {
                    query += ` AND category_id = $1`;
                    params.push(categoryId);
                }

                query += ` ORDER BY name ASC`;

                const result = await client.query(query, params);
                return result.rows.map(row => ({
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                }));
            } catch (error) {
                console.error('Error fetching product types:', error);
                throw new Error(`Failed to fetch product types: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productTypesTree: async (parent, { categoryId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE deleted_at IS NULL
                `;
                const params = [];

                if (categoryId) {
                    query += ` AND category_id = $1`;
                    params.push(categoryId);
                }

                query += ` ORDER BY name ASC`;

                const result = await client.query(query, params);
                const types = result.rows.map(row => ({
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                }));

                return buildTypeHierarchy(types);
            } catch (error) {
                console.error('Error fetching product types tree:', error);
                throw new Error(`Failed to fetch product types tree: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productType: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

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
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Product type not found');
                }

                const row = result.rows[0];
                return {
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                console.error('Error fetching product type:', error);
                throw new Error(`Failed to fetch product type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createProductType: async (parent, { input }, context) => {
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

                // Validate parent if provided
                if (input.parentId) {
                    const parentCheck = `
                        SELECT id, category_id
                        FROM public.product_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const parentResult = await client.query(parentCheck, [input.parentId]);
                    if (parentResult.rows.length === 0) {
                        throw new Error('Parent product type not found');
                    }
                    // Ensure parent belongs to the same category
                    if (parentResult.rows[0].category_id !== input.categoryId) {
                        throw new Error('Parent product type must belong to the same category');
                    }
                }

                // Check for duplicate name at the same level within the same category
                const duplicateCheck = `
                    SELECT id
                    FROM public.product_types
                    WHERE LOWER(name) = LOWER($1)
                    AND category_id = $2
                    AND (parent_id IS NULL AND $3::uuid IS NULL OR parent_id = $3)
                    AND deleted_at IS NULL
                `;
                const duplicateResult = await client.query(duplicateCheck, [
                    input.name,
                    input.categoryId,
                    input.parentId || null
                ]);
                if (duplicateResult.rows.length > 0) {
                    throw new Error('A product type with this name already exists at this level in this category');
                }

                // Handle fieldDefinitions - default to empty array if not provided
                let fieldDefinitions = input.fieldDefinitions || [];
                if (typeof fieldDefinitions === 'string') {
                    try {
                        fieldDefinitions = JSON.parse(fieldDefinitions);
                    } catch (e) {
                        throw new Error('Invalid JSON format for fieldDefinitions');
                    }
                }

                const insertQuery = `
                    INSERT INTO public.product_types (
                        category_id,
                        parent_id,
                        name,
                        description,
                        field_definitions,
                        is_active,
                        icon_name,
                        icon_type,
                        icon_color
                    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
                    RETURNING 
                        id,
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.categoryId,
                    input.parentId || null,
                    input.name,
                    input.description || null,
                    JSON.stringify(fieldDefinitions),
                    input.isActive !== undefined ? input.isActive : true,
                    input.iconName || null,
                    input.iconType || null,
                    input.iconColor || null
                ]);

                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating product type:', error);
                throw new Error(`Failed to create product type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateProductType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if type exists
                const checkQuery = `
                    SELECT id, category_id, parent_id
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product type not found');
                }

                const currentType = checkResult.rows[0];
                const newCategoryId = input.categoryId !== undefined ? input.categoryId : currentType.category_id;

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

                // Validate parent if being updated
                if (input.parentId !== undefined) {
                    if (input.parentId) {
                        // Validate hierarchy to prevent circular references
                        await validateTypeHierarchy(input.id, input.parentId, client);

                        // Check if parent exists
                        const parentCheck = `
                            SELECT id, category_id
                            FROM public.product_types
                            WHERE id = $1 AND deleted_at IS NULL
                        `;
                        const parentResult = await client.query(parentCheck, [input.parentId]);
                        if (parentResult.rows.length === 0) {
                            throw new Error('Parent product type not found');
                        }
                        // Ensure parent belongs to the same category
                        if (parentResult.rows[0].category_id !== newCategoryId) {
                            throw new Error('Parent product type must belong to the same category');
                        }
                    }
                }

                // Check for duplicate name if name is being updated
                if (input.name) {
                    const duplicateCheck = `
                        SELECT id
                        FROM public.product_types
                        WHERE LOWER(name) = LOWER($1)
                        AND id != $2
                        AND category_id = $3
                        AND (parent_id IS NULL AND $4::uuid IS NULL OR parent_id = $4)
                        AND deleted_at IS NULL
                    `;
                    const newParentId = input.parentId !== undefined ? input.parentId : currentType.parent_id;
                    const duplicateResult = await client.query(duplicateCheck, [
                        input.name,
                        input.id,
                        newCategoryId,
                        newParentId || null
                    ]);
                    if (duplicateResult.rows.length > 0) {
                        throw new Error('A product type with this name already exists at this level in this category');
                    }
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.categoryId !== undefined) {
                    updates.push(`category_id = $${paramCount}`);
                    values.push(input.categoryId);
                    paramCount++;
                }

                if (input.parentId !== undefined) {
                    updates.push(`parent_id = $${paramCount}`);
                    values.push(input.parentId || null);
                    paramCount++;
                }

                if (input.name !== undefined) {
                    updates.push(`name = $${paramCount}`);
                    values.push(input.name);
                    paramCount++;
                }

                if (input.description !== undefined) {
                    updates.push(`description = $${paramCount}`);
                    values.push(input.description);
                    paramCount++;
                }

                if (input.fieldDefinitions !== undefined) {
                    let fieldDefinitions = input.fieldDefinitions;
                    if (typeof fieldDefinitions === 'string') {
                        try {
                            fieldDefinitions = JSON.parse(fieldDefinitions);
                        } catch (e) {
                            throw new Error('Invalid JSON format for fieldDefinitions');
                        }
                    }
                    updates.push(`field_definitions = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(fieldDefinitions));
                    paramCount++;
                }

                if (input.isActive !== undefined) {
                    updates.push(`is_active = $${paramCount}`);
                    values.push(input.isActive);
                    paramCount++;
                }

                if (input.iconName !== undefined) {
                    updates.push(`icon_name = $${paramCount}`);
                    values.push(input.iconName || null);
                    paramCount++;
                }

                if (input.iconType !== undefined) {
                    updates.push(`icon_type = $${paramCount}`);
                    values.push(input.iconType || null);
                    paramCount++;
                }

                if (input.iconColor !== undefined) {
                    updates.push(`icon_color = $${paramCount}`);
                    values.push(input.iconColor || null);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.product_types
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        category_id as "categoryId",
                        parent_id as "parentId",
                        name,
                        description,
                        field_definitions as "fieldDefinitions",
                        is_active as "isActive",
                        icon_name as "iconName",
                        icon_type as "iconType",
                        icon_color as "iconColor",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    categoryId: row.categoryId,
                    parentId: row.parentId,
                    name: row.name,
                    description: row.description,
                    fieldDefinitions: row.fieldDefinitions,
                    isActive: row.isActive,
                    iconName: row.iconName,
                    iconType: row.iconType,
                    iconColor: row.iconColor,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating product type:', error);
                throw new Error(`Failed to update product type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteProductType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if type exists
                const checkQuery = `
                    SELECT id
                    FROM public.product_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product type not found');
                }

                // Get all child type IDs recursively
                const allTypeIds = await getAllChildTypeIds(input.id, client);
                allTypeIds.push(input.id);

                // Soft delete all types (parent and children)
                const deleteQuery = `
                    UPDATE public.product_types
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($1::uuid[])
                    AND deleted_at IS NULL
                `;
                await client.query(deleteQuery, [allTypeIds]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting product type:', error);
                throw new Error(`Failed to delete product type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

module.exports = productTypeResolvers;

