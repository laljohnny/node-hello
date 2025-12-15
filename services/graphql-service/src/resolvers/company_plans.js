const db = require('../utils/db');

const companyPlansResolvers = {
    Query: {
        companyPlans: async (parent, { company_id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                let query = `
                    SELECT * FROM company_plans 
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
                        // Admin users can see all company plans
                        // No filter needed
                    } else if (context.user.company_id) {
                        // Regular users see only their company data
                        query += ` AND company_id = $1`;
                        params.push(context.user.company_id);
                    } else {
                        // No company_id available, return empty
                        return [];
                    }
                }

                query += ` ORDER BY created_at DESC`;

                const result = await db.query(query, params);
                const companyPlans = result.rows;

                // If no records, return empty array
                if (companyPlans.length === 0) {
                    return [];
                }

                // Fetch company and plan data for each record
                const enrichedPlans = await Promise.all(companyPlans.map(async (companyPlan) => {
                    // Fetch company data
                    const companyResult = await db.query(
                        'SELECT id, name, email, sub_domain, role, active FROM companies WHERE id = $1',
                        [companyPlan.company_id]
                    );

                    // Fetch plan data
                    const planResult = await db.query(
                        'SELECT id, name, description, amount, currency, "interval", interval_count, features, limits, active FROM plans WHERE id = $1',
                        [companyPlan.plan_id]
                    );

                    return {
                        ...companyPlan,
                        company: companyResult.rows[0] || null,
                        plan: planResult.rows[0] || null
                    };
                }));

                return enrichedPlans;
            } catch (error) {
                console.error('Error fetching company plans:', error);
                throw new Error('Failed to fetch company plans: ' + error.message);
            }
        },

        companyPlan: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT * FROM company_plans 
                    WHERE id = $1
                `;
                const result = await db.query(query, [id]);

                if (result.rows.length === 0) {
                    return null;
                }

                const companyPlan = result.rows[0];

                // Check access permissions
                if (!['super_admin', 'partner_admin'].includes(context.user.role)) {
                    if (companyPlan.company_id !== context.user.company_id) {
                        throw new Error('Access denied: Cannot view other company data');
                    }
                }

                // Fetch company data
                const companyResult = await db.query(
                    'SELECT id, name, email, sub_domain, role, active FROM companies WHERE id = $1',
                    [companyPlan.company_id]
                );

                // Fetch plan data
                const planResult = await db.query(
                    'SELECT id, name, description, amount, currency, "interval", interval_count, features, limits, active FROM plans WHERE id = $1',
                    [companyPlan.plan_id]
                );

                return {
                    ...companyPlan,
                    company: companyResult.rows[0] || null,
                    plan: planResult.rows[0] || null
                };
            } catch (error) {
                console.error('Error fetching company plan:', error);
                throw new Error('Failed to fetch company plan: ' + error.message);
            }
        }
    },

    Mutation: {
        createCompanyPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            // Only super_admin, partner_admin, owner, and company_admin can create plans
            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const {
                    company_id,
                    plan_id,
                    stripe_customer_id,
                    stripe_subscription_id,
                    stripe_transaction_id,
                    stripe_transaction_status,
                    status = 'active',
                    start_date = new Date().toISOString(),
                    next_due_date,
                    ends_on
                } = input;

                // Verify user has access to this company
                if ((context.user.role === 'company_admin' || context.user.role === 'owner' || context.user.role === 'super_admin') && company_id !== context.user.companyId) {
                    throw new Error('Access denied: Cannot create plans for other companies');
                }

                // Verify the plan exists
                const planCheck = await db.query(
                    'SELECT id FROM plans WHERE id = $1 AND deleted_at IS NULL',
                    [plan_id]
                );

                if (planCheck.rows.length === 0) {
                    throw new Error('Plan not found');
                }

                const query = `
                    INSERT INTO company_plans (
                        company_id,
                        plan_id,
                        stripe_customer_id,
                        stripe_subscription_id,
                        stripe_transaction_id,
                        stripe_transaction_status,
                        status,
                        start_date,
                        next_due_date,
                        ends_on
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;

                const params = [
                    company_id,
                    plan_id,
                    stripe_customer_id || null,
                    stripe_subscription_id || null,
                    stripe_transaction_id || null,
                    stripe_transaction_status || null,
                    status,
                    start_date,
                    next_due_date || null,
                    ends_on || null
                ];

                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error creating company plan:', error);
                throw new Error('Failed to create company plan: ' + error.message);
            }
        },

        updateCompanyPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const { id, ...updates } = input;

                // Check if plan exists and verify access
                const checkQuery = `SELECT * FROM company_plans WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('Company plan not found');
                }

                const existingPlan = checkResult.rows[0];

                // Verify access
                if ((context.user.role === 'company_admin' || context.user.role === 'owner') && existingPlan.company_id !== context.user.companyId) {
                    throw new Error('Access denied: Cannot update other company plans');
                }

                // Build dynamic update query
                const updateFields = [];
                const params = [id];
                let paramIndex = 2;

                if (updates.company_id !== undefined) {
                    updateFields.push(`company_id = $${paramIndex}`);
                    params.push(updates.company_id);
                    paramIndex++;
                }

                if (updates.plan_id !== undefined) {
                    updateFields.push(`plan_id = $${paramIndex}`);
                    params.push(updates.plan_id);
                    paramIndex++;
                }

                if (updates.stripe_customer_id !== undefined) {
                    updateFields.push(`stripe_customer_id = $${paramIndex}`);
                    params.push(updates.stripe_customer_id);
                    paramIndex++;
                }

                if (updates.stripe_subscription_id !== undefined) {
                    updateFields.push(`stripe_subscription_id = $${paramIndex}`);
                    params.push(updates.stripe_subscription_id);
                    paramIndex++;
                }

                if (updates.stripe_transaction_id !== undefined) {
                    updateFields.push(`stripe_transaction_id = $${paramIndex}`);
                    params.push(updates.stripe_transaction_id);
                    paramIndex++;
                }

                if (updates.stripe_transaction_status !== undefined) {
                    updateFields.push(`stripe_transaction_status = $${paramIndex}`);
                    params.push(updates.stripe_transaction_status);
                    paramIndex++;
                }

                if (updates.status !== undefined) {
                    updateFields.push(`status = $${paramIndex}`);
                    params.push(updates.status);
                    paramIndex++;
                }

                if (updates.start_date !== undefined) {
                    updateFields.push(`start_date = $${paramIndex}`);
                    params.push(updates.start_date);
                    paramIndex++;
                }

                if (updates.next_due_date !== undefined) {
                    updateFields.push(`next_due_date = $${paramIndex}`);
                    params.push(updates.next_due_date);
                    paramIndex++;
                }

                if (updates.ends_on !== undefined) {
                    updateFields.push(`ends_on = $${paramIndex}`);
                    params.push(updates.ends_on);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                updateFields.push(`updated_at = $${paramIndex}`);
                params.push(new Date().toISOString());

                const updateQuery = `
                    UPDATE company_plans 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(updateQuery, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error updating company plan:', error);
                throw new Error('Failed to update company plan: ' + error.message);
            }
        },

        deleteCompanyPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (!['super_admin', 'partner_admin', 'owner', 'company_admin'].includes(context.user.role)) {
                throw new Error('Access denied: Insufficient permissions');
            }

            try {
                const { id } = input;

                // Check if plan exists and verify access
                const checkQuery = `SELECT * FROM company_plans WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return false;
                }

                const existingPlan = checkResult.rows[0];

                // Verify access
                if ((context.user.role === 'company_admin' || context.user.role === 'owner') && existingPlan.company_id !== context.user.company_id) {
                    throw new Error('Access denied: Cannot delete other company plans');
                }

                // Hard delete
                const deleteQuery = `
                    DELETE FROM company_plans 
                    WHERE id = $1
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [id]);
                return result.rows.length > 0;
            } catch (error) {
                console.error('Error deleting company plan:', error);
                throw new Error('Failed to delete company plan: ' + error.message);
            }
        }
    }
};

module.exports = companyPlansResolvers;
