const { executeQuery } = require('../utils/db');

const resolvers = {
    AssetSOPIncidentPlan: {
        asset: async (parent, args, context) => {
            if (!parent.asset_id) return null;
            const result = await executeQuery(context.schema, `SELECT * FROM ${context.schema}.assets WHERE id = $1`, [parent.asset_id]);
            return result.rows[0];
        },
        file: async (parent, args, context) => {
            if (!parent.file_id) return null;
            const result = await executeQuery(context.schema, `SELECT * FROM ${context.schema}.files WHERE id = $1`, [parent.file_id]);
            return result.rows[0];
        },
        createdByUser: async (parent, args, context) => {
            if (!parent.created_by) return null;
            const result = await executeQuery('public', 'SELECT * FROM public.users WHERE id = $1', [parent.created_by]);
            return result.rows[0];
        },
        // Map snake_case database fields to camelCase GraphQL fields
        // Handle both snake_case (from DB) and camelCase (from other resolvers)
        assetId: (parent) => parent.assetId || parent.asset_id,
        docType: (parent) => parent.docType || parent.doc_type,
        contentType: (parent) => parent.contentType || parent.content_type,
        fileId: (parent) => parent.fileId || parent.file_id,
        aiMetadata: (parent) => parent.aiMetadata || parent.ai_metadata,
        isActive: (parent) => parent.isActive !== undefined ? parent.isActive : parent.is_active,
        actionType: (parent) => parent.actionType || parent.action_type,
        masterSOPIncidentPlanId: (parent) => parent.masterSOPIncidentPlanId || parent.master_sop_incident_plan_id,
        createdBy: (parent) => parent.createdBy || parent.created_by,
        createdAt: (parent) => parent.createdAt || parent.created_at,
        updatedAt: (parent) => parent.updatedAt || parent.updated_at,
        deletedAt: (parent) => parent.deletedAt || parent.deleted_at
    },
    Query: {
        assetSOPIncidentPlan: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            const schema = context.schema;
            const result = await executeQuery(schema, `SELECT * FROM ${schema}.asset_sops_incident_plans WHERE id = $1 AND deleted_at IS NULL`, [id]);
            if (result.rows.length === 0) return null;
            const row = result.rows[0];
            // Map snake_case to camelCase for GraphQL response
            return {
                id: row.id,
                assetId: row.asset_id,
                docType: row.doc_type,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                actionType: row.action_type,
                masterSOPIncidentPlanId: row.master_sop_incident_plan_id,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at,
                // Keep snake_case for nested resolvers
                asset_id: row.asset_id,
                file_id: row.file_id,
                created_by: row.created_by,
                master_sop_incident_plan_id: row.master_sop_incident_plan_id
            };
        },
        assetSOPIncidentPlans: async (parent, { assetId, filter, limit = 50, offset = 0 }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            const schema = context.schema;

            let query = `SELECT * FROM ${schema}.asset_sops_incident_plans WHERE deleted_at IS NULL`;
            const params = [];
            let paramIndex = 1;

            if (assetId) {
                query += ` AND asset_id = $${paramIndex}`;
                params.push(assetId);
                paramIndex++;
            }

            if (filter) {
                if (filter.assetId) {
                    query += ` AND asset_id = $${paramIndex}`;
                    params.push(filter.assetId);
                    paramIndex++;
                }
                if (filter.docType) {
                    query += ` AND doc_type = $${paramIndex}`;
                    params.push(filter.docType);
                    paramIndex++;
                }
                if (filter.isActive !== undefined) {
                    query += ` AND is_active = $${paramIndex}`;
                    params.push(filter.isActive);
                    paramIndex++;
                }
                if (filter.searchTerm) {
                    query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
                    params.push(`%${filter.searchTerm}%`);
                    paramIndex++;
                }
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, offset);

            const result = await executeQuery(schema, query, params);
            // Map snake_case to camelCase for GraphQL response
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                docType: row.doc_type,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                actionType: row.action_type,
                masterSOPIncidentPlanId: row.master_sop_incident_plan_id,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at,
                // Keep snake_case for nested resolvers
                asset_id: row.asset_id,
                file_id: row.file_id,
                created_by: row.created_by,
                master_sop_incident_plan_id: row.master_sop_incident_plan_id
            }));
        }
    },
    Mutation: {
        createAssetSOPIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            const schema = context.schema;
            const { assetId, docType, title, content, contentType, fileId, source, aiMetadata, version, isActive, actionType, masterSOPIncidentPlanId } = input;

            // Set default action_type to 'new' if not provided
            const effectiveActionType = actionType || 'new';

            // If action_type is 'extend', validate master_sop_incident_plan_id
            if (effectiveActionType === 'extend') {
                if (!masterSOPIncidentPlanId) {
                    throw new Error('master_sop_incident_plan_id is required when action_type is "extend"');
                }
                // Validate that master SOP exists
                const masterCheck = await executeQuery('public', 'SELECT id FROM public.master_sops_incident_plans WHERE id = $1 AND deleted_at IS NULL', [masterSOPIncidentPlanId]);
                if (masterCheck.rows.length === 0) {
                    throw new Error(`Invalid master_sop_incident_plan_id: ${masterSOPIncidentPlanId}`);
                }
            }

            const query = `
                INSERT INTO ${schema}.asset_sops_incident_plans (
                    asset_id, doc_type, title, content, content_type, file_id, source, ai_metadata, version, is_active, created_by, action_type, master_sop_incident_plan_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `;

            const params = [
                assetId,
                docType,
                title,
                content,
                contentType,
                fileId,
                source,
                aiMetadata,
                version || 1,
                isActive !== undefined ? isActive : true,
                context.user.userId,
                effectiveActionType,
                effectiveActionType === 'new' ? null : masterSOPIncidentPlanId
            ];

            const result = await executeQuery(schema, query, params);
            const row = result.rows[0];

            // Map snake_case to camelCase for GraphQL response
            return {
                id: row.id,
                assetId: row.asset_id,
                docType: row.doc_type,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                actionType: row.action_type,
                masterSOPIncidentPlanId: row.master_sop_incident_plan_id,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },
        updateAssetSOPIncidentPlan: async (parent, { id, input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            const schema = context.schema;

            // First, verify the record exists and check authorization
            const checkQuery = `SELECT asset_id, created_by FROM ${schema}.asset_sops_incident_plans WHERE id = $1 AND deleted_at IS NULL`;
            const checkResult = await executeQuery(schema, checkQuery, [id]);

            if (checkResult.rows.length === 0) {
                throw new Error('Record not found or already deleted');
            }

            const record = checkResult.rows[0];

            // Check if user is the creator
            if (record.created_by !== context.userId && record.created_by !== context.user.id) {
                throw new Error('Unauthorized: Only the creator can update this record');
            }

            // If updating master_sop_incident_plan_id or action_type, validate
            if (input.actionType === 'extend' && input.masterSOPIncidentPlanId) {
                const masterCheck = await executeQuery('public', 'SELECT id FROM public.master_sops_incident_plans WHERE id = $1 AND deleted_at IS NULL', [input.masterSOPIncidentPlanId]);
                if (masterCheck.rows.length === 0) {
                    throw new Error(`Invalid master_sop_incident_plan_id: ${input.masterSOPIncidentPlanId}`);
                }
            }

            let query = `UPDATE ${schema}.asset_sops_incident_plans SET updated_at = NOW()`;
            const params = [id];
            let paramIndex = 2;

            Object.keys(input).forEach(key => {
                const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query += `, ${dbKey} = $${paramIndex}`;
                params.push(input[key]);
                paramIndex++;
            });

            query += ` WHERE id = $1 AND deleted_at IS NULL RETURNING *`;

            const result = await executeQuery(schema, query, params);
            const row = result.rows[0];

            // Map snake_case to camelCase for GraphQL response
            return {
                id: row.id,
                assetId: row.asset_id,
                docType: row.doc_type,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                actionType: row.action_type,
                masterSOPIncidentPlanId: row.master_sop_incident_plan_id,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },
        deleteAssetSOPIncidentPlan: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            const schema = context.schema;
            const query = `UPDATE ${schema}.asset_sops_incident_plans SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
            const result = await executeQuery(schema, query, [id]);
            return result.rowCount > 0;
        }
    }
};

module.exports = resolvers;
