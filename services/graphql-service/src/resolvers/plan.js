const db = require('../utils/db');

const planResolvers = {
    Query: {
        plans: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT * FROM plans 
                    WHERE deleted_at IS NULL
                    ORDER BY amount ASC
                `;
                const result = await db.query(query);
                return result.rows;
            } catch (error) {
                console.error('Error fetching plans:', error);
                throw new Error('Failed to fetch plans: ' + error.message);
            }
        },

        plan: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT * FROM plans 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const result = await db.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                console.error('Error fetching plan:', error);
                throw new Error('Failed to fetch plan: ' + error.message);
            }
        }
    },

    Mutation: {
        createPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            // Only super_admin can manage plans
            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can create plans');
            }

            try {
                const {
                    name,
                    description,
                    amount,
                    currency = 'USD',
                    interval,
                    interval_count = 1,
                    features = {},
                    limits = {},
                    is_default = false,
                    prorata_amount,
                    stripe_product_id,
                    stripe_price_id
                } = input;

                const query = `
                    INSERT INTO plans (
                        name,
                        description,
                        amount,
                        currency,
                        "interval",
                        interval_count,
                        features,
                        limits,
                        is_default,
                        prorata_amount,
                        stripe_product_id,
                        stripe_price_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `;

                const params = [
                    name,
                    description || null,
                    amount,
                    currency,
                    interval,
                    interval_count,
                    features,
                    limits,
                    is_default,
                    prorata_amount || null,
                    stripe_product_id || 'manual_' + Date.now(), // Fallback if not provided
                    stripe_price_id || 'manual_' + Date.now()    // Fallback if not provided
                ];

                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error creating plan:', error);
                throw new Error('Failed to create plan: ' + error.message);
            }
        },

        updatePlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can update plans');
            }

            try {
                const { id, ...updates } = input;

                // Check if plan exists
                const checkQuery = `SELECT * FROM plans WHERE id = $1 AND deleted_at IS NULL`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('Plan not found');
                }

                // Build dynamic update query
                const updateFields = [];
                const params = [id];
                let paramIndex = 2;

                if (updates.name !== undefined) {
                    updateFields.push(`name = $${paramIndex}`);
                    params.push(updates.name);
                    paramIndex++;
                }

                if (updates.description !== undefined) {
                    updateFields.push(`description = $${paramIndex}`);
                    params.push(updates.description);
                    paramIndex++;
                }

                if (updates.amount !== undefined) {
                    updateFields.push(`amount = $${paramIndex}`);
                    params.push(updates.amount);
                    paramIndex++;
                }

                if (updates.currency !== undefined) {
                    updateFields.push(`currency = $${paramIndex}`);
                    params.push(updates.currency);
                    paramIndex++;
                }

                if (updates.interval !== undefined) {
                    updateFields.push(`"interval" = $${paramIndex}`);
                    params.push(updates.interval);
                    paramIndex++;
                }

                if (updates.interval_count !== undefined) {
                    updateFields.push(`interval_count = $${paramIndex}`);
                    params.push(updates.interval_count);
                    paramIndex++;
                }

                if (updates.features !== undefined) {
                    updateFields.push(`features = $${paramIndex}`);
                    params.push(updates.features);
                    paramIndex++;
                }

                if (updates.limits !== undefined) {
                    updateFields.push(`limits = $${paramIndex}`);
                    params.push(updates.limits);
                    paramIndex++;
                }

                if (updates.active !== undefined) {
                    updateFields.push(`active = $${paramIndex}`);
                    params.push(updates.active);
                    paramIndex++;
                }

                if (updates.is_default !== undefined) {
                    updateFields.push(`is_default = $${paramIndex}`);
                    params.push(updates.is_default);
                    paramIndex++;
                }

                if (updates.prorata_amount !== undefined) {
                    updateFields.push(`prorata_amount = $${paramIndex}`);
                    params.push(updates.prorata_amount);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                updateFields.push(`updated_at = $${paramIndex}`);
                params.push(new Date().toISOString());

                const updateQuery = `
                    UPDATE plans 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(updateQuery, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error updating plan:', error);
                throw new Error('Failed to update plan: ' + error.message);
            }
        },

        deletePlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can delete plans');
            }

            try {
                const { id } = input;

                // Check if plan exists
                const checkQuery = `SELECT * FROM plans WHERE id = $1 AND deleted_at IS NULL`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'Plan not found'
                    };
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE plans 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [new Date().toISOString(), id]);

                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0
                        ? 'Plan deleted successfully'
                        : 'Failed to delete plan'
                };
            } catch (error) {
                console.error('Error deleting plan:', error);
                return {
                    success: false,
                    message: 'Failed to delete plan: ' + error.message
                };
            }
        }
    }
};

module.exports = planResolvers;
