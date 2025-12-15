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

// Helper function to validate appliesTo
const validateAppliesTo = (appliesTo) => {
    const validTypes = ['product_type', 'product'];
    if (appliesTo && !validTypes.includes(appliesTo)) {
        throw new Error(`Invalid appliesTo. Must be one of: ${validTypes.join(', ')}`);
    }
};

// Helper function to validate reference exists
const validateReference = async (appliesTo, referenceId, client) => {
    if (!appliesTo || !referenceId) return;

    let query;
    if (appliesTo === 'product_type') {
        query = `
            SELECT id
            FROM public.product_types
            WHERE id = $1 AND deleted_at IS NULL
        `;
    } else if (appliesTo === 'product') {
        query = `
            SELECT id
            FROM public.products
            WHERE id = $1 AND deleted_at IS NULL
        `;
    } else {
        throw new Error(`Invalid appliesTo value: ${appliesTo}`);
    }

    const result = await client.query(query, [referenceId]);
    if (result.rows.length === 0) {
        const entityName = appliesTo === 'product_type' ? 'Product type' : 'Product';
        throw new Error(`${entityName} not found`);
    }
};

const masterFAQResolvers = {
    JSON: JSONScalar,
    
    MasterFAQ: {
        reference: async (parent, args, context) => {
            if (!parent.appliesTo || !parent.referenceId) return null;

            const client = await context.db.connect();
            try {
                let query;
                if (parent.appliesTo === 'product_type') {
                    query = `
                        SELECT 
                            id,
                            category_id as "categoryId",
                            parent_id as "parentId",
                            name,
                            description,
                            field_definitions as "fieldDefinitions",
                            is_active as "isActive"
                        FROM public.product_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                } else if (parent.appliesTo === 'product') {
                    query = `
                        SELECT 
                            id,
                            parent_id as "parentId",
                            category_id as "categoryId",
                            type_id as "typeId",
                            manufacturer_id as "manufacturerId",
                            name,
                            make,
                            model,
                            description,
                            is_active as "isActive"
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                } else {
                    return null;
                }

                const result = await client.query(query, [parent.referenceId]);
                if (result.rows.length === 0) return null;

                return result.rows[0];
            } finally {
                client.release();
            }
        }
    },

    Query: {
        masterFAQs: async (parent, { appliesTo, referenceId, isActive }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        question,
                        answer,
                        tags,
                        display_order as "displayOrder",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_faqs
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramCount = 1;

                if (appliesTo) {
                    query += ` AND applies_to = $${paramCount}`;
                    params.push(appliesTo);
                    paramCount++;
                }

                if (referenceId) {
                    query += ` AND reference_id = $${paramCount}`;
                    params.push(referenceId);
                    paramCount++;
                }

                if (isActive !== undefined && isActive !== null) {
                    query += ` AND is_active = $${paramCount}`;
                    params.push(isActive);
                    paramCount++;
                }

                query += ` ORDER BY display_order ASC, created_at DESC`;

                const result = await client.query(query, params);
                return result.rows.map(row => formatFAQRow(row));
            } catch (error) {
                console.error('Error fetching master FAQs:', error);
                throw new Error(`Failed to fetch master FAQs: ${error.message}`);
            } finally {
                client.release();
            }
        },

        masterFAQ: async (parent, { id }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        question,
                        answer,
                        tags,
                        display_order as "displayOrder",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_faqs
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Master FAQ not found');
                }

                return formatFAQRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching master FAQ:', error);
                throw new Error(`Failed to fetch master FAQ: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createMasterFAQ: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Validate appliesTo
                validateAppliesTo(input.appliesTo);

                // Validate reference exists
                await validateReference(input.appliesTo, input.referenceId, client);

                // Handle tags - default to empty array if not provided
                let tags = input.tags || [];
                if (typeof tags === 'string') {
                    try {
                        tags = JSON.parse(tags);
                    } catch (e) {
                        throw new Error('Invalid JSON format for tags');
                    }
                }

                const insertQuery = `
                    INSERT INTO public.master_faqs (
                        applies_to,
                        reference_id,
                        question,
                        answer,
                        tags,
                        display_order,
                        is_active
                    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
                    RETURNING 
                        id,
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        question,
                        answer,
                        tags,
                        display_order as "displayOrder",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.appliesTo,
                    input.referenceId,
                    input.question,
                    input.answer,
                    JSON.stringify(tags),
                    input.displayOrder !== undefined ? input.displayOrder : 0,
                    input.isActive !== undefined ? input.isActive : true
                ]);

                await client.query('COMMIT');

                return formatFAQRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating master FAQ:', error);
                throw new Error(`Failed to create master FAQ: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateMasterFAQ: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if FAQ exists
                const checkQuery = `
                    SELECT id, applies_to, reference_id
                    FROM public.master_faqs
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master FAQ not found');
                }

                const currentFAQ = checkResult.rows[0];
                const newAppliesTo = input.appliesTo !== undefined ? input.appliesTo : currentFAQ.applies_to;
                const newReferenceId = input.referenceId !== undefined ? input.referenceId : currentFAQ.reference_id;

                // Validate appliesTo if being updated
                if (input.appliesTo !== undefined) {
                    validateAppliesTo(input.appliesTo);
                }

                // Validate reference if being updated
                if (input.appliesTo !== undefined || input.referenceId !== undefined) {
                    await validateReference(newAppliesTo, newReferenceId, client);
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.appliesTo !== undefined) {
                    updates.push(`applies_to = $${paramCount}`);
                    values.push(input.appliesTo);
                    paramCount++;
                }

                if (input.referenceId !== undefined) {
                    updates.push(`reference_id = $${paramCount}`);
                    values.push(input.referenceId);
                    paramCount++;
                }

                if (input.question !== undefined) {
                    updates.push(`question = $${paramCount}`);
                    values.push(input.question);
                    paramCount++;
                }

                if (input.answer !== undefined) {
                    updates.push(`answer = $${paramCount}`);
                    values.push(input.answer);
                    paramCount++;
                }

                if (input.tags !== undefined) {
                    let tags = input.tags;
                    if (typeof tags === 'string') {
                        try {
                            tags = JSON.parse(tags);
                        } catch (e) {
                            throw new Error('Invalid JSON format for tags');
                        }
                    }
                    updates.push(`tags = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(tags));
                    paramCount++;
                }

                if (input.displayOrder !== undefined) {
                    updates.push(`display_order = $${paramCount}`);
                    values.push(input.displayOrder);
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
                    UPDATE public.master_faqs
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        question,
                        answer,
                        tags,
                        display_order as "displayOrder",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                return formatFAQRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating master FAQ:', error);
                throw new Error(`Failed to update master FAQ: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteMasterFAQ: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if FAQ exists
                const checkQuery = `
                    SELECT id
                    FROM public.master_faqs
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master FAQ not found');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.master_faqs
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `;
                await client.query(deleteQuery, [input.id]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting master FAQ:', error);
                throw new Error(`Failed to delete master FAQ: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

// Helper function to format FAQ row
function formatFAQRow(row) {
    return {
        id: row.id,
        appliesTo: row.appliesTo,
        referenceId: row.referenceId,
        question: row.question,
        answer: row.answer,
        tags: row.tags,
        displayOrder: row.displayOrder !== null && row.displayOrder !== undefined ? row.displayOrder : 0,
        isActive: row.isActive,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
    };
}

module.exports = masterFAQResolvers;

