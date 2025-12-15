const productServiceTypeResolvers = {
    ProductServiceType: {
        categories: async (parent, args, context) => {
            if (!parent.productCategoryIds || parent.productCategoryIds.length === 0) {
                return [];
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
                    WHERE id = ANY($1::uuid[])
                    AND deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query, [parent.productCategoryIds]);
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
                return [];
            } finally {
                client.release();
            }
        }
    },

    Query: {
        productServiceTypes: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        product_category_ids as "productCategoryIds",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_service_types
                    WHERE deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query);
                return result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    productCategoryIds: row.productCategoryIds || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                }));
            } catch (error) {
                console.error('Error fetching product service types:', error);
                throw new Error(`Failed to fetch product service types: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productServiceType: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        product_category_ids as "productCategoryIds",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.product_service_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Product service type not found');
                }

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    productCategoryIds: row.productCategoryIds || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                console.error('Error fetching product service type:', error);
                throw new Error(`Failed to fetch product service type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createProductServiceType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check for duplicate name (only for non-deleted records)
                const duplicateCheck = `
                    SELECT id
                    FROM public.product_service_types
                    WHERE LOWER(name) = LOWER($1)
                    AND deleted_at IS NULL
                `;
                const duplicateResult = await client.query(duplicateCheck, [input.name]);
                if (duplicateResult.rows.length > 0) {
                    throw new Error('A product service type with this name already exists');
                }

                // Validate category IDs if provided
                if (input.productCategoryIds && input.productCategoryIds.length > 0) {
                    // Filter out empty strings and invalid values
                    const validCategoryIds = input.productCategoryIds.filter(
                        id => id && id !== '' && typeof id === 'string'
                    );

                    if (validCategoryIds.length > 0) {
                        const categoryCheck = `
                            SELECT id
                            FROM public.product_categories
                            WHERE id = ANY($1::uuid[])
                            AND deleted_at IS NULL
                        `;
                        const categoryResult = await client.query(categoryCheck, [validCategoryIds]);
                        
                        if (categoryResult.rows.length !== validCategoryIds.length) {
                            throw new Error('One or more product category IDs are invalid or deleted');
                        }
                    }
                }

                // Prepare category IDs array (empty array if not provided)
                const categoryIds = (input.productCategoryIds && input.productCategoryIds.length > 0)
                    ? input.productCategoryIds.filter(id => id && id !== '' && typeof id === 'string')
                    : [];

                const insertQuery = `
                    INSERT INTO public.product_service_types (
                        name,
                        product_category_ids,
                        description
                    ) VALUES ($1, $2::uuid[], $3)
                    RETURNING 
                        id,
                        name,
                        product_category_ids as "productCategoryIds",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.name,
                    categoryIds.length > 0 ? categoryIds : null,
                    input.description || null
                ]);

                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    productCategoryIds: row.productCategoryIds || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating product service type:', error);
                throw new Error(`Failed to create product service type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateProductServiceType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if service type exists
                const checkQuery = `
                    SELECT id, name
                    FROM public.product_service_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product service type not found');
                }

                // Check for duplicate name if name is being updated
                if (input.name) {
                    const duplicateCheck = `
                        SELECT id
                        FROM public.product_service_types
                        WHERE LOWER(name) = LOWER($1)
                        AND id != $2
                        AND deleted_at IS NULL
                    `;
                    const duplicateResult = await client.query(duplicateCheck, [input.name, input.id]);
                    if (duplicateResult.rows.length > 0) {
                        throw new Error('A product service type with this name already exists');
                    }
                }

                // Validate category IDs if being updated
                if (input.productCategoryIds !== undefined) {
                    if (input.productCategoryIds && input.productCategoryIds.length > 0) {
                        // Filter out empty strings and invalid values
                        const validCategoryIds = input.productCategoryIds.filter(
                            id => id && id !== '' && typeof id === 'string'
                        );

                        if (validCategoryIds.length > 0) {
                            const categoryCheck = `
                                SELECT id
                                FROM public.product_categories
                                WHERE id = ANY($1::uuid[])
                                AND deleted_at IS NULL
                            `;
                            const categoryResult = await client.query(categoryCheck, [validCategoryIds]);
                            
                            if (categoryResult.rows.length !== validCategoryIds.length) {
                                throw new Error('One or more product category IDs are invalid or deleted');
                            }
                        }
                    }
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.name !== undefined) {
                    updates.push(`name = $${paramCount}`);
                    values.push(input.name);
                    paramCount++;
                }

                if (input.productCategoryIds !== undefined) {
                    const categoryIds = (input.productCategoryIds && input.productCategoryIds.length > 0)
                        ? input.productCategoryIds.filter(id => id && id !== '' && typeof id === 'string')
                        : [];
                    updates.push(`product_category_ids = $${paramCount}::uuid[]`);
                    values.push(categoryIds.length > 0 ? categoryIds : null);
                    paramCount++;
                }

                if (input.description !== undefined) {
                    updates.push(`description = $${paramCount}`);
                    values.push(input.description);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.product_service_types
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        name,
                        product_category_ids as "productCategoryIds",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    productCategoryIds: row.productCategoryIds || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating product service type:', error);
                throw new Error(`Failed to update product service type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteProductServiceType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if service type exists
                const checkQuery = `
                    SELECT id
                    FROM public.product_service_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product service type not found');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.product_service_types
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    AND deleted_at IS NULL
                `;
                await client.query(deleteQuery, [input.id]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting product service type:', error);
                throw new Error(`Failed to delete product service type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

module.exports = productServiceTypeResolvers;

