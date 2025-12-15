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

// Helper function to validate document type
const validateDocumentType = (documentType) => {
    const validTypes = ['SOP', 'Incident_Plan', 'Maintenance_Guide', 'Safety_Protocol', 'User_Manual'];
    if (documentType && !validTypes.includes(documentType)) {
        throw new Error(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }
};

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

// Helper function to validate content or documentUrl constraint
const validateContentOrUrl = (content, documentUrl) => {
    if ((!content || content.trim() === '') && (!documentUrl || documentUrl.trim() === '')) {
        throw new Error('Either content or documentUrl must be provided');
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

// Helper function to get all child product type IDs recursively
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

// Helper function to determine if referenceId is a product or product_type
const determineReferenceType = async (referenceId, client) => {
    // Check if it's a product
    const productQuery = `
        SELECT id
        FROM public.products
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const productResult = await client.query(productQuery, [referenceId]);
    if (productResult.rows.length > 0) {
        return 'product';
    }

    // Check if it's a product_type
    const typeQuery = `
        SELECT id
        FROM public.product_types
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const typeResult = await client.query(typeQuery, [referenceId]);
    if (typeResult.rows.length > 0) {
        return 'product_type';
    }

    return null;
};

const masterSOPIncidentPlanResolvers = {
    JSON: JSONScalar,
    
    MasterSOPIncidentPlan: {
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
        masterSOPIncidentPlans: async (parent, { appliesTo, referenceId, documentType, isActive = true }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        title,
                        document_type as "documentType",
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        content,
                        document_url as "documentUrl",
                        source,
                        content_type as "contentType",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_sops_incident_plans
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramCount = 1;

                if (appliesTo) {
                    query += ` AND applies_to = $${paramCount}`;
                    params.push(appliesTo);
                    paramCount++;
                }

                // Enhanced referenceId filtering with hierarchical support
                if (referenceId) {
                    let referenceIds = [referenceId];
                    let determinedAppliesTo = appliesTo;

                    // If appliesTo is not provided, determine it from the referenceId
                    if (!determinedAppliesTo) {
                        determinedAppliesTo = await determineReferenceType(referenceId, client);
                        if (!determinedAppliesTo) {
                            throw new Error(`Reference ID ${referenceId} not found in products or product_types`);
                        }
                    }

                    // Get all child IDs recursively based on the entity type
                    if (determinedAppliesTo === 'product') {
                        const childIds = await getAllChildProductIds(referenceId, client);
                        referenceIds = [referenceId, ...childIds];
                    } else if (determinedAppliesTo === 'product_type') {
                        const childIds = await getAllChildTypeIds(referenceId, client);
                        referenceIds = [referenceId, ...childIds];
                    }

                    // Filter by reference_id matching any of the IDs (parent or children)
                    query += ` AND reference_id = ANY($${paramCount}::uuid[])`;
                    params.push(referenceIds);
                    paramCount++;

                    // Also filter by appliesTo to ensure we only get the correct entity type
                    if (!appliesTo) {
                        query += ` AND applies_to = $${paramCount}`;
                        params.push(determinedAppliesTo);
                        paramCount++;
                    }
                }

                if (documentType) {
                    query += ` AND document_type = $${paramCount}`;
                    params.push(documentType);
                    paramCount++;
                }

                if (context.user.role !== 'super_admin') {
                    query += ` AND is_active = $${paramCount}`;
                    params.push(isActive);
                    paramCount++;
                }

                query += ` ORDER BY created_at DESC`;

                const result = await client.query(query, params);
                return result.rows.map(row => formatSOPRow(row));
            } catch (error) {
                console.error('Error fetching master SOP/Incident Plans:', error);
                throw new Error(`Failed to fetch master SOP/Incident Plans: ${error.message}`);
            } finally {
                client.release();
            }
        },

        masterSOPIncidentPlan: async (parent, { id }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        title,
                        document_type as "documentType",
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        content,
                        document_url as "documentUrl",
                        source,
                        content_type as "contentType",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_sops_incident_plans
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Master SOP/Incident Plan not found');
                }

                return formatSOPRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching master SOP/Incident Plan:', error);
                throw new Error(`Failed to fetch master SOP/Incident Plan: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createMasterSOPIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Validate document type
                validateDocumentType(input.documentType);

                // Validate appliesTo
                validateAppliesTo(input.appliesTo);

                // Validate reference exists
                await validateReference(input.appliesTo, input.referenceId, client);

                // Validate content or documentUrl constraint
                validateContentOrUrl(input.content, input.documentUrl);

                const insertQuery = `
                    INSERT INTO public.master_sops_incident_plans (
                        title,
                        document_type,
                        applies_to,
                        reference_id,
                        content,
                        document_url,
                        source,
                        content_type,
                        is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING 
                        id,
                        title,
                        document_type as "documentType",
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        content,
                        document_url as "documentUrl",
                        source,
                        content_type as "contentType",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                if (input.documentUrl && input.source === 'file') {
                    input.documentUrl = `https://${process.env.CLOUDFRONT_URL}/${input.documentUrl}`;    
                }

                const result = await client.query(insertQuery, [
                    input.title,
                    input.documentType,
                    input.appliesTo,
                    input.referenceId,
                    input.content || null,
                    input.documentUrl || null,
                    input.source || null,
                    input.contentType || null,
                    input.isActive !== undefined ? input.isActive : true
                ]);

                await client.query('COMMIT');

                return formatSOPRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating master SOP/Incident Plan:', error);
                throw new Error(`Failed to create master SOP/Incident Plan: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateMasterSOPIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if SOP/Incident Plan exists
                const checkQuery = `
                    SELECT id, applies_to, reference_id, content, document_url
                    FROM public.master_sops_incident_plans
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master SOP/Incident Plan not found');
                }

                const currentSOP = checkResult.rows[0];
                const newAppliesTo = input.appliesTo !== undefined ? input.appliesTo : currentSOP.applies_to;
                const newReferenceId = input.referenceId !== undefined ? input.referenceId : currentSOP.reference_id;
                const newContent = input.content !== undefined ? input.content : currentSOP.content;
                const newDocumentUrl = input.documentUrl !== undefined ? input.documentUrl : currentSOP.document_url;

                // Validate document type if being updated
                if (input.documentType !== undefined) {
                    validateDocumentType(input.documentType);
                }

                // Validate appliesTo if being updated
                if (input.appliesTo !== undefined) {
                    validateAppliesTo(input.appliesTo);
                }

                // Validate reference if being updated
                if (input.appliesTo !== undefined || input.referenceId !== undefined) {
                    await validateReference(newAppliesTo, newReferenceId, client);
                }

                // Validate content or documentUrl constraint
                validateContentOrUrl(newContent, newDocumentUrl);

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.title !== undefined) {
                    updates.push(`title = $${paramCount}`);
                    values.push(input.title);
                    paramCount++;
                }

                if (input.documentType !== undefined) {
                    updates.push(`document_type = $${paramCount}`);
                    values.push(input.documentType);
                    paramCount++;
                }

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

                if (input.content !== undefined) {
                    updates.push(`content = $${paramCount}`);
                    values.push(input.content || null);
                    paramCount++;
                }

                if (input.documentUrl !== undefined) {
                    updates.push(`document_url = $${paramCount}`);
                    values.push(input.documentUrl || null);
                    paramCount++;
                }

                if (input.source !== undefined) {
                    updates.push(`source = $${paramCount}`);
                    values.push(input.source || null);
                    paramCount++;
                }

                if (input.contentType !== undefined) {
                    updates.push(`content_type = $${paramCount}`);
                    values.push(input.contentType || null);
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
                    UPDATE public.master_sops_incident_plans
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        title,
                        document_type as "documentType",
                        applies_to as "appliesTo",
                        reference_id as "referenceId",
                        content,
                        document_url as "documentUrl",
                        source,
                        content_type as "contentType",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                return formatSOPRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating master SOP/Incident Plan:', error);
                throw new Error(`Failed to update master SOP/Incident Plan: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteMasterSOPIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if SOP/Incident Plan exists
                const checkQuery = `
                    SELECT id
                    FROM public.master_sops_incident_plans
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Master SOP/Incident Plan not found');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.master_sops_incident_plans
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `;
                await client.query(deleteQuery, [input.id]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting master SOP/Incident Plan:', error);
                throw new Error(`Failed to delete master SOP/Incident Plan: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

// Helper function to format SOP row
function formatSOPRow(row) {
    return {
        id: row.id,
        title: row.title,
        documentType: row.documentType,
        appliesTo: row.appliesTo,
        referenceId: row.referenceId,
        content: row.content,
        documentUrl: row.documentUrl,
        source: row.source,
        contentType: row.contentType,
        isActive: row.isActive,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
    };
}

module.exports = masterSOPIncidentPlanResolvers;

