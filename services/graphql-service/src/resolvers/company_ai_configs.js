const db = require('../utils/db');

const companyAiConfigsResolvers = {
    Query: {
        companyAiConfigs: async (parent, { company_id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                let query = `
                    SELECT * FROM company_ai_configs 
                    WHERE 1=1
                `;
                const params = [];

                // Filter by company_id if provided
                if (company_id) {
                    // Super admin and partner admin can view any company
                    if (!['super_admin', 'partner_admin'].includes(context.user.role)) {
                        // Regular users can only view their own company
                        if (company_id !== context.user.company_id) {
                            throw new Error('Access denied: Cannot view other company data');
                        }
                    }
                    query += ` AND company_id = $1`;
                    params.push(company_id);
                } else {
                    // If no company_id provided
                    if (['super_admin', 'partner_admin'].includes(context.user.role)) {
                        // Admin users can see all configs
                    } else if (context.user.company_id) {
                        query += ` AND company_id = $1`;
                        params.push(context.user.company_id);
                    } else {
                        return [];
                    }
                }

                query += ` ORDER BY created_at DESC`;

                const result = await db.query(query, params);
                const configs = result.rows;

                if (configs.length === 0) {
                    return [];
                }

                // Fetch company data for each config
                const enrichedConfigs = await Promise.all(configs.map(async (config) => {
                    const companyResult = await db.query(
                        'SELECT id, name, email, sub_domain, role, active FROM companies WHERE id = $1',
                        [config.company_id]
                    );

                    return {
                        ...config,
                        company: companyResult.rows[0] || null
                    };
                }));

                return enrichedConfigs;
            } catch (error) {
                console.error('Error fetching company AI configs:', error);
                throw new Error('Failed to fetch company AI configs: ' + error.message);
            }
        },

        companyAiConfig: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT * FROM company_ai_configs 
                    WHERE id = $1
                `;
                const result = await db.query(query, [id]);

                if (result.rows.length === 0) {
                    return null;
                }

                const config = result.rows[0];

                // Check access permissions
                if (!['super_admin', 'partner_admin'].includes(context.user.role)) {
                    if (config.company_id !== context.user.company_id) {
                        throw new Error('Access denied: Cannot view other company data');
                    }
                }

                // Fetch company data
                const companyResult = await db.query(
                    'SELECT id, name, email, sub_domain, role, active FROM companies WHERE id = $1',
                    [config.company_id]
                );

                return {
                    ...config,
                    company: companyResult.rows[0] || null
                };
            } catch (error) {
                console.error('Error fetching company AI config:', error);
                throw new Error('Failed to fetch company AI config: ' + error.message);
            }
        }
    },

    Mutation: {
        createCompanyAIConfig: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            // Only super_admin, partner_admin, owner, and company_admin can create configs
            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const {
                    company_id,
                    provider,
                    model,
                    api_key,
                    base_url,
                    is_enabled = true,
                    settings = {}
                } = input;

                // Verify user has access to this company
                if ((context.user.role === 'company_admin' || context.user.role === 'owner') && company_id !== context.user.company_id) {
                    throw new Error('Access denied: Cannot create configs for other companies');
                }

                const query = `
                    INSERT INTO company_ai_configs (
                        company_id,
                        provider,
                        model,
                        api_key,
                        base_url,
                        is_enabled,
                        settings
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;

                const params = [
                    company_id,
                    provider,
                    model || null,
                    api_key || null,
                    base_url || null,
                    is_enabled,
                    settings
                ];

                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error creating company AI config:', error);
                throw new Error('Failed to create company AI config: ' + error.message);
            }
        },

        updateCompanyAIConfig: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const { id, ...updates } = input;

                // Check if config exists and verify access
                const checkQuery = `SELECT * FROM company_ai_configs WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('Company AI config not found');
                }

                const existingConfig = checkResult.rows[0];

                // Verify access
                if ((context.user.role === 'company_admin' || context.user.role === 'owner') && existingConfig.company_id !== context.user.company_id) {
                    throw new Error('Access denied: Cannot update other company configs');
                }

                // Build dynamic update query
                const updateFields = [];
                const params = [id];
                let paramIndex = 2;

                if (updates.provider !== undefined) {
                    updateFields.push(`provider = $${paramIndex}`);
                    params.push(updates.provider);
                    paramIndex++;
                }

                if (updates.model !== undefined) {
                    updateFields.push(`model = $${paramIndex}`);
                    params.push(updates.model);
                    paramIndex++;
                }

                if (updates.api_key !== undefined) {
                    updateFields.push(`api_key = $${paramIndex}`);
                    params.push(updates.api_key);
                    paramIndex++;
                }

                if (updates.base_url !== undefined) {
                    updateFields.push(`base_url = $${paramIndex}`);
                    params.push(updates.base_url);
                    paramIndex++;
                }

                if (updates.is_enabled !== undefined) {
                    updateFields.push(`is_enabled = $${paramIndex}`);
                    params.push(updates.is_enabled);
                    paramIndex++;
                }

                if (updates.settings !== undefined) {
                    updateFields.push(`settings = $${paramIndex}`);
                    params.push(updates.settings);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                updateFields.push(`updated_at = $${paramIndex}`);
                params.push(new Date().toISOString());

                const updateQuery = `
                    UPDATE company_ai_configs 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(updateQuery, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error updating company AI config:', error);
                throw new Error('Failed to update company AI config: ' + error.message);
            }
        },

        deleteCompanyAIConfig: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const { id } = input;

                // Check if config exists and verify access
                const checkQuery = `SELECT * FROM company_ai_configs WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return false;
                }

                const existingConfig = checkResult.rows[0];

                // Verify access
                if ((context.user.role === 'company_admin' || context.user.role === 'owner') && existingConfig.company_id !== context.user.company_id) {
                    throw new Error('Access denied: Cannot delete other company configs');
                }

                // Hard delete
                const deleteQuery = `
                    DELETE FROM company_ai_configs 
                    WHERE id = $1
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [id]);
                return result.rows.length > 0;
            } catch (error) {
                console.error('Error deleting company AI config:', error);
                throw new Error('Failed to delete company AI config: ' + error.message);
            }
        }
    }
};

module.exports = companyAiConfigsResolvers;
