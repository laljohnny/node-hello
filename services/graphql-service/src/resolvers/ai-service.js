const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3004';

const getAuthHeaders = (context) => {
    const headers = {};
    if (context.req && context.req.headers && context.req.headers.authorization) {
        headers['Authorization'] = context.req.headers.authorization;
    }
    return headers;
};

const getSessionVariables = (context) => {
    return {
        'x-hasura-user-id': context.userId || '',
        'x-hasura-company-id': context.companyId || '',
        'x-hasura-schema': context.schema || 'public',
        'x-hasura-role': context.role || 'user'
    };
};

const aiServiceResolvers = {
    Query: {
        creditUsageHistory: async (parent, { limit = 50, offset = 0 }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT id, company_id as "companyId", ai_addon_id as "aiAddonId",
                           company_ai_addon_id as "companyAIAddonId", credits_used as "creditsUsed",
                           action_type as "actionType", feature_used as "featureUsed",
                           performed_by as "performedBy", metadata,
                           created_at as "createdAt", updated_at as "updatedAt"
                    FROM public.ai_addon_credit_usage
                    WHERE company_id = $1
                    ORDER BY created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                const result = await context.db.query(query, [context.companyId, limit, offset]);
                return result.rows.map(row => ({
                    ...row,
                    createdAt: row.createdAt?.toISOString(),
                    updatedAt: row.updatedAt?.toISOString()
                }));
            } catch (error) {
                console.error('Error fetching credit usage history:', error.message);
                throw new Error('Failed to fetch credit usage history');
            }
        },

        checkCreditLimit: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT caa.credits_remaining, aa.name as addon_name
                    FROM public.company_ai_addons caa
                    JOIN public.ai_addons aa ON caa.ai_addon_id = aa.id
                    WHERE caa.company_id = $1 AND caa.status = 'active'
                    ORDER BY caa.created_at ASC
                    LIMIT 1
                `;
                const result = await context.db.query(query, [context.companyId]);

                if (result.rows.length === 0) {
                    return {
                        hasCredits: false,
                        remainingCredits: 0,
                        addonName: null
                    };
                }

                const row = result.rows[0];
                return {
                    hasCredits: row.credits_remaining === null || row.credits_remaining > 0,
                    remainingCredits: row.credits_remaining,
                    addonName: row.addon_name
                };
            } catch (error) {
                console.error('Error checking credit limit:', error.message);
                throw new Error('Failed to check credit limit');
            }
        }
    },

    Mutation: {
        consumeCredits: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(`${AI_SERVICE_URL}/ai-addon/consume-credits`, input, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error consuming credits:', error.message);
                if (error.response?.status === 402) {
                    throw new Error('Insufficient credits or no active AI subscription');
                }
                throw new Error(error.response?.data?.message || 'Failed to consume credits');
            }
        },

        generateDocument: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(`${AI_SERVICE_URL}/ai-addon/generate-document`, input, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error generating document:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to generate document');
            }
        }
    }
};

module.exports = aiServiceResolvers;
