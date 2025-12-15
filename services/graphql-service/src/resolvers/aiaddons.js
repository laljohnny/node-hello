const db = require('../utils/db');

const aiaddonsResolvers = {
    Query: {
        // ==================== AI Addons Queries ====================
        aiAddons: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        description,
                        pricing_type as "pricingType",
                        amount,
                        currency,
                        "interval",
                        interval_count as "intervalCount",
                        credit_pool_size as "creditPoolSize",
                        credits_usage as "credits",
                        stripe_product_id as "stripeProductId",
                        stripe_price_id as "stripePriceId",
                        eligible_plan_ids as "eligiblePlanIds",
                        active,
                        type,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.ai_addons 
                    WHERE deleted_at IS NULL
                    ORDER BY created_at DESC
                `;
                const result = await db.query(query);
                return result.rows.map(row => ({
                    ...row,
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    deletedAt: row.deletedAt?.toISOString()
                }));
            } catch (error) {
                console.error('Error fetching AI addons:', error);
                throw new Error('Failed to fetch AI addons: ' + error.message);
            }
        },

        aiAddon: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT 
                        id,
                        name,
                        description,
                        pricing_type as "pricingType",
                        amount,
                        currency,
                        "interval",
                        interval_count as "intervalCount",
                        credit_pool_size as "creditPoolSize",
                        credits_usage as "credits",
                        stripe_product_id as "stripeProductId",
                        stripe_price_id as "stripePriceId",
                        eligible_plan_ids as "eligiblePlanIds",
                        active,
                        type,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.ai_addons 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const result = await db.query(query, [id]);
                if (result.rows.length === 0) {
                    return null;
                }
                const row = result.rows[0];
                return {
                    ...row,
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    deletedAt: row.deletedAt?.toISOString()
                };
            } catch (error) {
                console.error('Error fetching AI addon:', error);
                throw new Error('Failed to fetch AI addon: ' + error.message);
            }
        },

        // ==================== Company AI Addons Queries ====================
        companyAIAddons: async (parent, { companyId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                // Use companyId from args if provided, otherwise use context.companyId
                const targetCompanyId = companyId || context.companyId;

                if (!targetCompanyId) {
                    throw new Error('Company ID is required');
                }

                const query = `
                    SELECT 
                        caa.id,
                        caa.company_id as "companyId",
                        caa.ai_addon_id as "aiAddonId",
                        caa.stripe_subscription_id as "stripeSubscriptionId",
                        caa.stripe_customer_id as "stripeCustomerId",
                        caa.credits_remaining as "creditsRemaining",
                        caa.credits_used as "creditsUsed",
                        caa.status,
                        caa.start_date as "startDate",
                        caa.next_billing_date as "nextBillingDate",
                        caa.ends_on as "endsOn",
                        caa.created_at as "createdAt",
                        caa.updated_at as "updatedAt",
                        aa.id as "addon_id",
                        aa.name as "addon_name",
                        aa.description as "addon_description",
                        aa.pricing_type as "addon_pricingType",
                        aa.amount as "addon_amount",
                        aa.currency as "addon_currency",
                        aa."interval" as "addon_interval",
                        aa.interval_count as "addon_intervalCount",
                        aa.credit_pool_size as "addon_creditPoolSize",
                        aa.credits_usage as "addon_credits",
                        aa.stripe_product_id as "addon_stripeProductId",
                        aa.stripe_price_id as "addon_stripePriceId",
                        aa.eligible_plan_ids as "addon_eligiblePlanIds",
                        aa.active as "addon_active",
                        aa.type as "addon_type",
                        aa.created_at as "addon_createdAt",
                        aa.updated_at as "addon_updatedAt",
                        c.id as "company_id",
                        c.name as "company_name",
                        c.email as "company_email",
                        c.role as "company_role"
                    FROM public.company_ai_addons caa
                    LEFT JOIN public.ai_addons aa ON caa.ai_addon_id = aa.id
                    LEFT JOIN public.companies c ON caa.company_id = c.id
                    WHERE caa.company_id = $1
                    ORDER BY caa.created_at DESC
                `;
                const result = await db.query(query, [targetCompanyId]);

                return result.rows.map(row => ({
                    id: row.id,
                    companyId: row.companyId,
                    aiAddonId: row.aiAddonId,
                    stripeSubscriptionId: row.stripeSubscriptionId,
                    stripeCustomerId: row.stripeCustomerId,
                    creditsRemaining: row.creditsRemaining,
                    creditsUsed: row.creditsUsed,
                    status: row.status,
                    startDate: row.startDate?.toISOString(),
                    nextBillingDate: row.nextBillingDate?.toISOString(),
                    endsOn: row.endsOn?.toISOString(),
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    aiAddon: row.addon_id ? {
                        id: row.addon_id,
                        name: row.addon_name,
                        description: row.addon_description,
                        pricingType: row.addon_pricingType,
                        amount: row.addon_amount,
                        currency: row.addon_currency,
                        interval: row.addon_interval,
                        intervalCount: row.addon_intervalCount,
                        creditPoolSize: row.addon_creditPoolSize,
                        credits: row.addon_credits,
                        stripeProductId: row.addon_stripeProductId,
                        stripePriceId: row.addon_stripePriceId,
                        eligiblePlanIds: row.addon_eligiblePlanIds,
                        active: row.addon_active,
                        type: row.addon_type,
                        createdAt: row.addon_createdAt?.toISOString(),
                        updatedAt: row.addon_updatedAt?.toISOString()
                    } : null,
                    company: row.company_id ? {
                        id: row.company_id,
                        name: row.company_name,
                        email: row.company_email,
                        role: row.company_role,
                        createdAt: row.createdAt?.toISOString(),
                        updatedAt: row.updatedAt?.toISOString()
                    } : null
                }));
            } catch (error) {
                console.error('Error fetching company AI addons:', error);
                throw new Error('Failed to fetch company AI addons: ' + error.message);
            }
        },

        companyAIAddon: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT 
                        caa.id,
                        caa.company_id as "companyId",
                        caa.ai_addon_id as "aiAddonId",
                        caa.stripe_subscription_id as "stripeSubscriptionId",
                        caa.stripe_customer_id as "stripeCustomerId",
                        caa.credits_remaining as "creditsRemaining",
                        caa.credits_used as "creditsUsed",
                        caa.status,
                        caa.start_date as "startDate",
                        caa.next_billing_date as "nextBillingDate",
                        caa.ends_on as "endsOn",
                        caa.created_at as "createdAt",
                        caa.updated_at as "updatedAt",
                        aa.id as "addon_id",
                        aa.name as "addon_name",
                        aa.description as "addon_description",
                        aa.pricing_type as "addon_pricingType",
                        aa.amount as "addon_amount",
                        aa.currency as "addon_currency",
                        aa."interval" as "addon_interval",
                        aa.interval_count as "addon_intervalCount",
                        aa.credit_pool_size as "addon_creditPoolSize",
                        aa.credits_usage as "addon_credits",
                        aa.stripe_product_id as "addon_stripeProductId",
                        aa.stripe_price_id as "addon_stripePriceId",
                        aa.eligible_plan_ids as "addon_eligiblePlanIds",
                        aa.active as "addon_active",
                        aa.type as "addon_type",
                        aa.created_at as "addon_createdAt",
                        aa.updated_at as "addon_updatedAt",
                        c.id as "company_id",
                        c.name as "company_name",
                        c.email as "company_email",
                        c.role as "company_role"
                    FROM public.company_ai_addons caa
                    LEFT JOIN public.ai_addons aa ON caa.ai_addon_id = aa.id
                    LEFT JOIN public.companies c ON caa.company_id = c.id
                    WHERE caa.id = $1
                `;
                const result = await db.query(query, [id]);

                if (result.rows.length === 0) {
                    return null;
                }

                const row = result.rows[0];
                return {
                    id: row.id,
                    companyId: row.companyId,
                    aiAddonId: row.aiAddonId,
                    stripeSubscriptionId: row.stripeSubscriptionId,
                    stripeCustomerId: row.stripeCustomerId,
                    creditsRemaining: row.creditsRemaining,
                    creditsUsed: row.creditsUsed,
                    status: row.status,
                    startDate: row.startDate?.toISOString(),
                    nextBillingDate: row.nextBillingDate?.toISOString(),
                    endsOn: row.endsOn?.toISOString(),
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    aiAddon: row.addon_id ? {
                        id: row.addon_id,
                        name: row.addon_name,
                        description: row.addon_description,
                        pricingType: row.addon_pricingType,
                        amount: row.addon_amount,
                        currency: row.addon_currency,
                        interval: row.addon_interval,
                        intervalCount: row.addon_intervalCount,
                        creditPoolSize: row.addon_creditPoolSize,
                        credits: row.addon_credits,
                        stripeProductId: row.addon_stripeProductId,
                        stripePriceId: row.addon_stripePriceId,
                        eligiblePlanIds: row.addon_eligiblePlanIds,
                        active: row.addon_active,
                        type: row.addon_type,
                        createdAt: row.addon_createdAt?.toISOString(),
                        updatedAt: row.addon_updatedAt?.toISOString()
                    } : null,
                    company: row.company_id ? {
                        id: row.company_id,
                        name: row.company_name,
                        email: row.company_email,
                        role: row.company_role
                    } : null
                };
            } catch (error) {
                console.error('Error fetching company AI addon:', error);
                throw new Error('Failed to fetch company AI addon: ' + error.message);
            }
        }
    },

    Mutation: {
        // ==================== AI Addons Mutations ====================
        createAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            // Only super_admin can manage AI addons
            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can create AI addons');
            }

            try {
                const {
                    name,
                    description,
                    pricingType,
                    amount,
                    currency = 'USD',
                    interval,
                    intervalCount = 1,
                    creditPoolSize,
                    credits = 0,
                    stripeProductId,
                    stripePriceId,
                    eligiblePlanIds = [],
                    active = true,
                    type = 'one_time'
                } = input;

                const query = `
                    INSERT INTO public.ai_addons (
                        name,
                        description,
                        pricing_type,
                        amount,
                        currency,
                        "interval",
                        interval_count,
                        credit_pool_size,
                        credits_usage,
                        stripe_product_id,
                        stripe_price_id,
                        eligible_plan_ids,
                        active,
                        type
                    ) VALUES ($1, $2, $3::pricing_type, $4, $5, $6::plan_interval, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING 
                        id,
                        name,
                        description,
                        pricing_type as "pricingType",
                        amount,
                        currency,
                        "interval",
                        interval_count as "intervalCount",
                        credit_pool_size as "creditPoolSize",
                        credits_usage as "credits",
                        stripe_product_id as "stripeProductId",
                        stripe_price_id as "stripePriceId",
                        eligible_plan_ids as "eligiblePlanIds",
                        active,
                        type,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const params = [
                    name,
                    description || null,
                    pricingType,
                    amount,
                    currency,
                    interval || null,
                    intervalCount,
                    creditPoolSize || null,
                    credits,
                    stripeProductId || null,
                    stripePriceId || null,
                    eligiblePlanIds,
                    active,
                    type
                ];

                const result = await db.query(query, params);
                const row = result.rows[0];
                return {
                    ...row,
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    deletedAt: row.deletedAt?.toISOString()
                };
            } catch (error) {
                console.error('Error creating AI addon:', error);
                throw new Error('Failed to create AI addon: ' + error.message);
            }
        },

        updateAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can update AI addons');
            }

            try {
                const { id, ...updates } = input;

                // Check if AI addon exists
                const checkQuery = `SELECT * FROM public.ai_addons WHERE id = $1 AND deleted_at IS NULL`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('AI addon not found');
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

                if (updates.pricingType !== undefined) {
                    updateFields.push(`pricing_type = $${paramIndex}::pricing_type`);
                    params.push(updates.pricingType);
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
                    updateFields.push(`"interval" = $${paramIndex}::plan_interval`);
                    params.push(updates.interval);
                    paramIndex++;
                }

                if (updates.intervalCount !== undefined) {
                    updateFields.push(`interval_count = $${paramIndex}`);
                    params.push(updates.intervalCount);
                    paramIndex++;
                }

                if (updates.creditPoolSize !== undefined) {
                    updateFields.push(`credit_pool_size = $${paramIndex}`);
                    params.push(updates.creditPoolSize);
                    paramIndex++;
                }

                if (updates.credits !== undefined) {
                    updateFields.push(`credits_usage = $${paramIndex}`);
                    params.push(updates.credits);
                    paramIndex++;
                }

                if (updates.stripeProductId !== undefined) {
                    updateFields.push(`stripe_product_id = $${paramIndex}`);
                    params.push(updates.stripeProductId);
                    paramIndex++;
                }

                if (updates.stripePriceId !== undefined) {
                    updateFields.push(`stripe_price_id = $${paramIndex}`);
                    params.push(updates.stripePriceId);
                    paramIndex++;
                }

                if (updates.eligiblePlanIds !== undefined) {
                    updateFields.push(`eligible_plan_ids = $${paramIndex}`);
                    params.push(updates.eligiblePlanIds);
                    paramIndex++;
                }

                if (updates.active !== undefined) {
                    updateFields.push(`active = $${paramIndex}`);
                    params.push(updates.active);
                    paramIndex++;
                }

                if (updates.type !== undefined) {
                    updateFields.push(`type = $${paramIndex}`);
                    params.push(updates.type);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                updateFields.push(`updated_at = NOW()`);

                const updateQuery = `
                    UPDATE public.ai_addons 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING 
                        id,
                        name,
                        description,
                        pricing_type as "pricingType",
                        amount,
                        currency,
                        "interval",
                        interval_count as "intervalCount",
                        credit_pool_size as "creditPoolSize",
                        credits_usage as "credits",
                        stripe_product_id as "stripeProductId",
                        stripe_price_id as "stripePriceId",
                        eligible_plan_ids as "eligiblePlanIds",
                        active,
                        type,
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await db.query(updateQuery, params);
                const row = result.rows[0];
                return {
                    ...row,
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    deletedAt: row.deletedAt?.toISOString()
                };
            } catch (error) {
                console.error('Error updating AI addon:', error);
                throw new Error('Failed to update AI addon: ' + error.message);
            }
        },

        deleteAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            if (context.user.role !== 'super_admin') {
                throw new Error('Access denied: Only super admins can delete AI addons');
            }

            try {
                const { id } = input;

                // Check if AI addon exists
                const checkQuery = `SELECT * FROM public.ai_addons WHERE id = $1 AND deleted_at IS NULL`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'AI addon not found'
                    };
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.ai_addons 
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = $1
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [id]);

                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0
                        ? 'AI addon deleted successfully'
                        : 'Failed to delete AI addon'
                };
            } catch (error) {
                console.error('Error deleting AI addon:', error);
                return {
                    success: false,
                    message: 'Failed to delete AI addon: ' + error.message
                };
            }
        },

        // ==================== Company AI Addons Mutations ====================
        createCompanyAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const {
                    companyId,
                    aiAddonId,
                    stripeSubscriptionId,
                    stripeCustomerId,
                    status = 'active'
                } = input;

                // Fetch AI addon details to get credit values and billing info
                const addonQuery = `
                    SELECT 
                        id,
                        name,
                        credits_usage as "credits",
                        "interval",
                        interval_count as "intervalCount",
                        pricing_type as "pricingType"
                    FROM public.ai_addons 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const addonResult = await db.query(addonQuery, [aiAddonId]);

                if (addonResult.rows.length === 0) {
                    throw new Error('AI addon not found');
                }

                const addon = addonResult.rows[0];

                // Calculate dates based on addon interval
                const startDate = input.startDate || new Date();
                let nextBillingDate = null;
                let endsOn = null;

                if (addon.interval && addon.intervalCount) {
                    const billingDate = new Date(startDate);

                    switch (addon.interval) {
                        case 'month':
                            billingDate.setMonth(billingDate.getMonth() + addon.intervalCount);
                            break;
                        case 'year':
                            billingDate.setFullYear(billingDate.getFullYear() + addon.intervalCount);
                            break;
                        case 'week':
                            billingDate.setDate(billingDate.getDate() + (7 * addon.intervalCount));
                            break;
                        case 'day':
                            billingDate.setDate(billingDate.getDate() + addon.intervalCount);
                            break;
                    }

                    nextBillingDate = billingDate;
                    // Set ends_on to the same as next billing date for recurring subscriptions
                    endsOn = new Date(billingDate);
                }

                // Set credits_remaining from addon credits
                // If addon.credits is null or -1, it means unlimited credits
                const creditsRemaining = (addon.credits === null || addon.credits === -1)
                    ? null
                    : addon.credits;

                // Override with input values if provided
                const finalCreditsRemaining = input.creditsRemaining !== undefined
                    ? input.creditsRemaining
                    : creditsRemaining;

                const finalCreditsUsed = input.creditsUsed !== undefined
                    ? input.creditsUsed
                    : 0;

                const finalNextBillingDate = input.nextBillingDate !== undefined
                    ? input.nextBillingDate
                    : nextBillingDate;

                const finalEndsOn = input.endsOn !== undefined
                    ? input.endsOn
                    : endsOn;

                const query = `
                    INSERT INTO public.company_ai_addons (
                        company_id,
                        ai_addon_id,
                        stripe_subscription_id,
                        stripe_customer_id,
                        credits_remaining,
                        credits_used,
                        status,
                        start_date,
                        next_billing_date,
                        ends_on
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7::subscription_status, $8, $9, $10)
                    RETURNING 
                        id,
                        company_id as "companyId",
                        ai_addon_id as "aiAddonId",
                        stripe_subscription_id as "stripeSubscriptionId",
                        stripe_customer_id as "stripeCustomerId",
                        credits_remaining as "creditsRemaining",
                        credits_used as "creditsUsed",
                        status,
                        start_date as "startDate",
                        next_billing_date as "nextBillingDate",
                        ends_on as "endsOn",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                `;

                const params = [
                    companyId,
                    aiAddonId,
                    stripeSubscriptionId || null,
                    stripeCustomerId || null,
                    finalCreditsRemaining,
                    finalCreditsUsed,
                    status,
                    startDate.toISOString ? startDate.toISOString() : startDate,
                    finalNextBillingDate ? (finalNextBillingDate.toISOString ? finalNextBillingDate.toISOString() : finalNextBillingDate) : null,
                    finalEndsOn ? (finalEndsOn.toISOString ? finalEndsOn.toISOString() : finalEndsOn) : null
                ];

                const result = await db.query(query, params);
                const row = result.rows[0];
                return {
                    ...row,
                    startDate: row.startDate?.toISOString(),
                    nextBillingDate: row.nextBillingDate?.toISOString(),
                    endsOn: row.endsOn?.toISOString(),
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    aiAddon: null,
                    company: null
                };
            } catch (error) {
                console.error('Error creating company AI addon:', error);
                throw new Error('Failed to create company AI addon: ' + error.message);
            }
        },

        updateCompanyAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id, ...updates } = input;

                // Check if company AI addon exists
                const checkQuery = `SELECT * FROM public.company_ai_addons WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('Company AI addon not found');
                }

                // Build dynamic update query
                const updateFields = [];
                const params = [id];
                let paramIndex = 2;

                if (updates.stripeSubscriptionId !== undefined) {
                    updateFields.push(`stripe_subscription_id = $${paramIndex}`);
                    params.push(updates.stripeSubscriptionId);
                    paramIndex++;
                }

                if (updates.stripeCustomerId !== undefined) {
                    updateFields.push(`stripe_customer_id = $${paramIndex}`);
                    params.push(updates.stripeCustomerId);
                    paramIndex++;
                }

                if (updates.creditsRemaining !== undefined) {
                    updateFields.push(`credits_remaining = $${paramIndex}`);
                    params.push(updates.creditsRemaining);
                    paramIndex++;
                }

                if (updates.creditsUsed !== undefined) {
                    updateFields.push(`credits_used = $${paramIndex}`);
                    params.push(updates.creditsUsed);
                    paramIndex++;
                }

                if (updates.status !== undefined) {
                    updateFields.push(`status = $${paramIndex}::subscription_status`);
                    params.push(updates.status);
                    paramIndex++;
                }

                if (updates.nextBillingDate !== undefined) {
                    updateFields.push(`next_billing_date = $${paramIndex}`);
                    params.push(updates.nextBillingDate);
                    paramIndex++;
                }

                if (updates.endsOn !== undefined) {
                    updateFields.push(`ends_on = $${paramIndex}`);
                    params.push(updates.endsOn);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                updateFields.push(`updated_at = NOW()`);

                const updateQuery = `
                    UPDATE public.company_ai_addons 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING 
                        id,
                        company_id as "companyId",
                        ai_addon_id as "aiAddonId",
                        stripe_subscription_id as "stripeSubscriptionId",
                        stripe_customer_id as "stripeCustomerId",
                        credits_remaining as "creditsRemaining",
                        credits_used as "creditsUsed",
                        status,
                        start_date as "startDate",
                        next_billing_date as "nextBillingDate",
                        ends_on as "endsOn",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                `;

                const result = await db.query(updateQuery, params);
                const row = result.rows[0];
                return {
                    ...row,
                    startDate: row.startDate?.toISOString(),
                    nextBillingDate: row.nextBillingDate?.toISOString(),
                    endsOn: row.endsOn?.toISOString(),
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString(),
                    aiAddon: null,
                    company: null
                };
            } catch (error) {
                console.error('Error updating company AI addon:', error);
                throw new Error('Failed to update company AI addon: ' + error.message);
            }
        },

        deleteCompanyAIAddon: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id } = input;

                // Check if company AI addon exists
                const checkQuery = `SELECT * FROM public.company_ai_addons WHERE id = $1`;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'Company AI addon not found'
                    };
                }

                // Hard delete (no deleted_at column in company_ai_addons)
                const deleteQuery = `
                    DELETE FROM public.company_ai_addons 
                    WHERE id = $1
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [id]);

                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0
                        ? 'Company AI addon deleted successfully'
                        : 'Failed to delete company AI addon'
                };
            } catch (error) {
                console.error('Error deleting company AI addon:', error);
                return {
                    success: false,
                    message: 'Failed to delete company AI addon: ' + error.message
                };
            }
        }
    }
};

module.exports = aiaddonsResolvers;
