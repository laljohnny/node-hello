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
const buildCategoryHierarchy = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map of all categories
    categories.forEach(cat => {
        categoryMap.set(cat.id, {
            ...cat,
            children: []
        });
    });

    // Second pass: build tree structure
    categories.forEach(cat => {
        const categoryNode = categoryMap.get(cat.id);
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            const parent = categoryMap.get(cat.parentId);
            parent.children.push(categoryNode);
        } else {
            rootCategories.push(categoryNode);
        }
    });

    return rootCategories;
};

// Helper function to validate parent-child relationship (prevent circular references)
const validateCategoryHierarchy = async (categoryId, parentId, client) => {
    if (!parentId) return;

    // Check if parentId is the same as categoryId (self-reference)
    if (categoryId === parentId) {
        throw new Error('Category cannot be its own parent');
    }

    // Check for circular reference by traversing up the tree
    let currentParentId = parentId;
    const visitedIds = new Set([categoryId]);

    while (currentParentId) {
        if (visitedIds.has(currentParentId)) {
            throw new Error('Circular reference detected: cannot set parent that would create a cycle');
        }
        visitedIds.add(currentParentId);

        const parentQuery = `
            SELECT parent_id
            FROM public.product_categories
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const parentResult = await client.query(parentQuery, [currentParentId]);

        if (parentResult.rows.length === 0) {
            break;
        }

        currentParentId = parentResult.rows[0].parent_id;
    }
};

// Helper function to get all child category IDs recursively
const getAllChildCategoryIds = async (categoryId, client) => {
    const childIds = [];
    const query = `
        WITH RECURSIVE category_tree AS (
            SELECT id, parent_id
            FROM public.product_categories
            WHERE parent_id = $1 AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT pc.id, pc.parent_id
            FROM public.product_categories pc
            INNER JOIN category_tree ct ON pc.parent_id = ct.id
            WHERE pc.deleted_at IS NULL
        )
        SELECT id FROM category_tree
    `;
    
    const result = await client.query(query, [categoryId]);
    result.rows.forEach(row => {
        childIds.push(row.id);
    });
    
    return childIds;
};

const productCategoryResolvers = {
    JSON: JSONScalar,
    
    ProductCategory: {
        parent: async (parent, args, context) => {
            if (!parent.parentId) return null;

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

                const result = await client.query(query, [parent.parentId]);
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

        children: async (parent, args, context) => {
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
                    WHERE parent_id = $1 AND deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query, [parent.id]);
                return result.rows.map(row => ({
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
                }));
            } finally {
                client.release();
            }
        }
    },

    Query: {
        productCategories: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

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
                    WHERE deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query);
                return result.rows.map(row => ({
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
                }));
            } catch (error) {
                console.error('Error fetching product categories:', error);
                throw new Error(`Failed to fetch product categories: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productCategoriesTree: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

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
                    WHERE deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query);
                const categories = result.rows.map(row => ({
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
                }));

                return buildCategoryHierarchy(categories);
            } catch (error) {
                console.error('Error fetching product categories tree:', error);
                throw new Error(`Failed to fetch product categories tree: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productCategory: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

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

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Product category not found');
                }

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
            } catch (error) {
                console.error('Error fetching product category:', error);
                throw new Error(`Failed to fetch product category: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createProductCategory: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Validate parent if provided
                if (input.parentId) {
                    const parentCheck = `
                        SELECT id
                        FROM public.product_categories
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const parentResult = await client.query(parentCheck, [input.parentId]);
                    if (parentResult.rows.length === 0) {
                        throw new Error('Parent category not found');
                    }
                }

                // Check for duplicate name at the same level
                const duplicateCheck = `
                    SELECT id
                    FROM public.product_categories
                    WHERE LOWER(name) = LOWER($1)
                    AND (parent_id IS NULL AND $2::uuid IS NULL OR parent_id = $2)
                    AND deleted_at IS NULL
                `;
                const duplicateResult = await client.query(duplicateCheck, [input.name, input.parentId || null]);
                if (duplicateResult.rows.length > 0) {
                    throw new Error('A category with this name already exists at this level');
                }

                const insertQuery = `
                    INSERT INTO public.product_categories (
                        parent_id,
                        name,
                        description,
                        is_active,
                        icon_name,
                        icon_color,
                        icon_type,
                        icon_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING 
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
                `;

                const result = await client.query(insertQuery, [
                    input.parentId || null,
                    input.name,
                    input.description || null,
                    input.isActive !== undefined ? input.isActive : true,
                    input.iconName || null,
                    input.iconColor || null,
                    input.iconType || null,
                    input.iconUrl || null
                ]);

                await client.query('COMMIT');

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
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating product category:', error);
                throw new Error(`Failed to create product category: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateProductCategory: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if category exists
                const checkQuery = `
                    SELECT id, parent_id
                    FROM public.product_categories
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product category not found');
                }

                const currentCategory = checkResult.rows[0];

                // Validate parent if being updated
                if (input.parentId !== undefined) {
                    if (input.parentId) {
                        // Validate hierarchy to prevent circular references
                        await validateCategoryHierarchy(input.id, input.parentId, client);

                        // Check if parent exists
                        const parentCheck = `
                            SELECT id
                            FROM public.product_categories
                            WHERE id = $1 AND deleted_at IS NULL
                        `;
                        const parentResult = await client.query(parentCheck, [input.parentId]);
                        if (parentResult.rows.length === 0) {
                            throw new Error('Parent category not found');
                        }
                    }
                }

                // Check for duplicate name if name is being updated
                if (input.name) {
                    const duplicateCheck = `
                        SELECT id
                        FROM public.product_categories
                        WHERE LOWER(name) = LOWER($1)
                        AND id != $2
                        AND (parent_id IS NULL AND $3::uuid IS NULL OR parent_id = $3)
                        AND deleted_at IS NULL
                    `;
                    const newParentId = input.parentId !== undefined ? input.parentId : currentCategory.parent_id;
                    const duplicateResult = await client.query(duplicateCheck, [input.name, input.id, newParentId || null]);
                    if (duplicateResult.rows.length > 0) {
                        throw new Error('A category with this name already exists at this level');
                    }
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

                if (input.iconColor !== undefined) {
                    updates.push(`icon_color = $${paramCount}`);
                    values.push(input.iconColor || null);
                    paramCount++;
                }

                if (input.iconType !== undefined) {
                    updates.push(`icon_type = $${paramCount}`);
                    values.push(input.iconType || null);
                    paramCount++;
                }

                if (input.iconUrl !== undefined) {
                    updates.push(`icon_url = $${paramCount}`);
                    values.push(input.iconUrl || null);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.product_categories
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
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
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

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
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating product category:', error);
                throw new Error(`Failed to update product category: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteProductCategory: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if category exists
                const checkQuery = `
                    SELECT id
                    FROM public.product_categories
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product category not found');
                }

                // Get all child category IDs recursively
                const allCategoryIds = await getAllChildCategoryIds(input.id, client);
                allCategoryIds.push(input.id);

                // Soft delete all categories (parent and children)
                const deleteQuery = `
                    UPDATE public.product_categories
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($1::uuid[])
                    AND deleted_at IS NULL
                `;
                await client.query(deleteQuery, [allCategoryIds]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting product category:', error);
                throw new Error(`Failed to delete product category: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

module.exports = productCategoryResolvers;

