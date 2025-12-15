const locationManagementResolvers = {
    Query: {
        // Get all location types
        masterLocationTypes: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();

            try {
                const query = `
                    SELECT 
                        id, 
                        name,
                        allowed_parents as "allowedParents",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.location_types
                    WHERE deleted_at IS NULL
                    ORDER BY name ASC
                `;

                const result = await client.query(query);
                
                return result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    allowedParents: row.allowedParents || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                }));
            } catch (error) {
                console.error('Error fetching location types:', error);
                throw new Error(`Failed to fetch location types: ${error.message}`);
            } finally {
                client.release();
            }
        },

        // Get single location type
        masterLocationType: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();

            try {
                const query = `
                    SELECT 
                        id, 
                        name,
                        allowed_parents as "allowedParents",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.location_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                
                if (result.rows.length === 0) {
                    throw new Error('Location type not found');
                }

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    allowedParents: row.allowedParents || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                console.error('Error fetching location type:', error);
                throw new Error(`Failed to fetch location type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        // Create location type
        createMasterLocationType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Check if name already exists
                const checkQuery = `
                    SELECT id FROM public.location_types
                    WHERE name = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.name]);
                
                if (checkResult.rows.length > 0) {
                    throw new Error('Location type with this name already exists');
                }

                // Validate allowedParents are UUIDs
                const allowedParents = input.allowedParents || [];
                if (allowedParents.length > 0) {
                    // Validate each ID is a valid UUID format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    for (const parentId of allowedParents) {
                        if (!uuidRegex.test(parentId)) {
                            throw new Error(`Invalid UUID format in allowedParents: ${parentId}`);
                        }
                    }
                    
                    // Validate allowedParents exist
                    const validateQuery = `
                        SELECT id 
                        FROM public.location_types
                        WHERE id = ANY($1) AND deleted_at IS NULL
                    `;
                    const validateResult = await client.query(validateQuery, [allowedParents]);
                    if (validateResult.rows.length !== allowedParents.length) {
                        throw new Error('One or more allowedParents location types not found');
                    }
                }

                const insertQuery = `
                    INSERT INTO public.location_types (id, name, allowed_parents, description, created_at, updated_at)
                    VALUES (gen_random_uuid(), $1, $2::uuid[], $3, NOW(), NOW())
                    RETURNING 
                        id,
                        name,
                        allowed_parents as "allowedParents",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.name,
                    allowedParents,
                    input.description || null
                ]);

                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    allowedParents: row.allowedParents || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating location type:', error);
                throw new Error(`Failed to create location type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        // Update location type
        updateMasterLocationType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Check if location type exists and get current allowed_parents if needed
                let existingAllowedParents = [];
                if (input.allowedParents !== undefined) {
                    const checkQuery = `
                        SELECT id, allowed_parents FROM public.location_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const checkResult = await client.query(checkQuery, [input.id]);
                    
                    if (checkResult.rows.length === 0) {
                        throw new Error('Location type not found');
                    }
                    
                    existingAllowedParents = checkResult.rows[0].allowed_parents || [];
                } else {
                    const checkQuery = `
                        SELECT id FROM public.location_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const checkResult = await client.query(checkQuery, [input.id]);
                    
                    if (checkResult.rows.length === 0) {
                        throw new Error('Location type not found');
                    }
                }

                // Check if new name conflicts with existing (excluding current)
                if (input.name) {
                    const nameCheckQuery = `
                        SELECT id FROM public.location_types
                        WHERE name = $1 AND id != $2 AND deleted_at IS NULL
                    `;
                    const nameCheckResult = await client.query(nameCheckQuery, [input.name, input.id]);
                    
                    if (nameCheckResult.rows.length > 0) {
                        throw new Error('Location type with this name already exists');
                    }
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.name !== undefined) {
                    updates.push(`name = $${paramCount++}`);
                    values.push(input.name);
                }
                if (input.allowedParents !== undefined) {
                    // Validate allowedParents are UUIDs
                    const newAllowedParents = input.allowedParents || [];
                    if (newAllowedParents.length > 0) {
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        for (const parentId of newAllowedParents) {
                            if (!uuidRegex.test(parentId)) {
                                throw new Error(`Invalid UUID format in allowedParents: ${parentId}`);
                            }
                        }
                        
                        // Validate allowedParents exist
                        const validateQuery = `
                            SELECT id 
                            FROM public.location_types
                            WHERE id = ANY($1) AND deleted_at IS NULL
                        `;
                        const validateResult = await client.query(validateQuery, [newAllowedParents]);
                        if (validateResult.rows.length !== newAllowedParents.length) {
                            throw new Error('One or more allowedParents location types not found');
                        }
                    }
                    
                    // Merge existing and new allowedParents (append new values, remove duplicates)
                    const mergedAllowedParents = [...new Set([...existingAllowedParents, ...newAllowedParents])];
                    
                    updates.push(`allowed_parents = $${paramCount++}::uuid[]`);
                    values.push(mergedAllowedParents);
                }
                if (input.description !== undefined) {
                    updates.push(`description = $${paramCount++}`);
                    values.push(input.description);
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                updates.push(`updated_at = NOW()`);
                values.push(input.id);

                const updateQuery = `
                    UPDATE public.location_types
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCount} AND deleted_at IS NULL
                    RETURNING 
                        id,
                        name,
                        allowed_parents as "allowedParents",
                        description,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);

                if (result.rows.length === 0) {
                    throw new Error('Location type not found');
                }

                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    name: row.name,
                    allowedParents: row.allowedParents || [],
                    description: row.description,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating location type:', error);
                throw new Error(`Failed to update location type: ${error.message}`);
            } finally {
                client.release();
            }
        },

        // Delete location type
        deleteMasterLocationType: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Check if location type exists
                const checkQuery = `
                    SELECT id FROM public.location_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                
                if (checkResult.rows.length === 0) {
                    throw new Error('Location type not found');
                }

                // Check if location type is being used by any locations
                // Query all tenant schemas
                const schemasQuery = `
                    SELECT schema_name 
                    FROM companies 
                    WHERE schema_status = 'active' AND schema_name IS NOT NULL
                `;
                const schemasResult = await client.query(schemasQuery);
                
                let isUsed = false;
                for (const schemaRow of schemasResult.rows) {
                    const schema = schemaRow.schema_name;
                    const usageQuery = `
                        SELECT COUNT(*)::int as count
                        FROM ${schema}.locations
                        WHERE location_type = $1 AND deleted_at IS NULL
                    `;
                    const usageResult = await client.query(usageQuery, [input.id]);
                    if (parseInt(usageResult.rows[0].count) > 0) {
                        isUsed = true;
                        break;
                    }
                }

                if (isUsed) {
                    throw new Error('Cannot delete location type that is in use by locations');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.location_types
                    SET deleted_at = NOW()
                    WHERE id = $1 AND deleted_at IS NULL
                    RETURNING id
                `;

                const result = await client.query(deleteQuery, [input.id]);

                if (result.rows.length === 0) {
                    throw new Error('Location type not found');
                }

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting location type:', error);
                throw new Error(`Failed to delete location type: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

module.exports = locationManagementResolvers;

