const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const authResolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.user.schema || 'public';
            const userId = context.user.userId;
            const companyId = context.user.companyId;

            try {
                // Fetch user and company data (logged-in users have already accepted invitations)
                let result;

                if (schema === 'public') {
                    // Public schema query
                    const query = `
                        SELECT 
                            u.id, 
                            u.email, 
                            u.first_name, 
                            u.last_name, 
                            u.phone_number,
                            u.role, 
                            u.two_factor_enabled, 
                            u.invited_by, 
                            u.active, 
                            u.deleted_at, 
                            u.company_id,
                            c.name as company_name
                        FROM users u
                        LEFT JOIN companies c ON c.id = COALESCE($2, u.company_id) AND c.deleted_at IS NULL
                        WHERE u.id = $1 AND u.deleted_at IS NULL
                    `;
                    result = await context.db.query(query, [userId, companyId]);
                } else {
                    // For tenant schemas, use client connection with search_path
                    const client = await context.db.connect();
                    try {
                        await client.query(`SET search_path TO ${schema}, public`);
                        const query = `
                            SELECT 
                                u.id, 
                                u.email, 
                                u.first_name, 
                                u.last_name, 
                                u.phone,
                                u.role, 
                                u.two_factor_enabled, 
                                u.invited_by, 
                                u.active, 
                                u.deleted_at,
                                c.name as company_name
                            FROM ${schema}.users u
                            LEFT JOIN companies c ON c.id = $2 AND c.deleted_at IS NULL
                            WHERE u.id = $1 AND u.deleted_at IS NULL
                        `;
                        result = await client.query(query, [userId, companyId]);
                    } finally {
                        client.release();
                    }
                }

                console.log(`[me resolver] Query result: found ${result?.rows?.length || 0} row(s)`);

                if (!result || result.rows.length === 0) {
                    // User not found in database, return JWT data as fallback
                    console.warn(`[me resolver] User not found in database: userId=${userId}, schema=${schema}`);
                    return {
                        id: context.user.userId,
                        email: context.user.email,
                        firstName: null,
                        lastName: null,
                        phoneNumber: null,
                        role: context.user.role,
                        companyId: context.user.companyId,
                        companyName: context.user.companyName,
                        schema: schema,
                        twoFactorEnabled: null,
                        invitationStatus: null,
                        invitedBy: null,
                        invitedOn: null,
                        active: null,
                        deletedAt: null
                    };
                }

                const row = result.rows[0];
                const companyName = row.company_name || context.user.companyName;

                return {
                    id: row.id,
                    email: row.email,
                    firstName: row.first_name || null,
                    lastName: row.last_name || null,
                    phoneNumber: row.phone_number || row.phone || null,
                    role: row.role,
                    companyId: companyId || row.company_id,
                    companyName: companyName,
                    schema: schema,
                    twoFactorEnabled: row.two_factor_enabled || false,
                    invitationStatus: null, // Logged-in users have already accepted invitations
                    invitedBy: row.invited_by || null,
                    invitedOn: null, // Logged-in users have already accepted invitations
                    active: row.active !== undefined ? row.active : null,
                    deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null
                };
            } catch (error) {
                // Return JWT data as fallback on error
                console.error('[me resolver] Error:', error.message);
                return {
                    id: context.user.userId,
                    email: context.user.email,
                    firstName: null,
                    lastName: null,
                    phoneNumber: null,
                    role: context.user.role,
                    companyId: context.user.companyId,
                    companyName: context.user.companyName,
                    schema: schema,
                    twoFactorEnabled: null,
                    invitationStatus: null,
                    invitedBy: null,
                    invitedOn: null,
                    active: null,
                    deletedAt: null
                };
            }
        },




        companyUsers: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const { companyId, schema } = context.user;
            if (!companyId || !schema) {
                throw new Error('User does not belong to a company');
            }

            try {
                // Fetch users with invitation data from both public and tenant schema
                // Public invitations: sent by super_admin/partner_admin
                // Tenant invitations: sent by company_admin
                const query = `
                    SELECT DISTINCT ON (id)
                        id, 
                        email, 
                        first_name, 
                        last_name, 
                        role, 
                        two_factor_enabled,
                        active,
                        deleted_at,
                        invitation_status,
                        invited_by,
                        invited_on
                    FROM (
                        SELECT 
                            u.id, 
                            u.email, 
                            u.first_name, 
                            u.last_name, 
                            u.role, 
                            u.two_factor_enabled,
                            u.active,
                            u.deleted_at,
                            COALESCE(ti.status, pi.status) as invitation_status,
                            COALESCE(ti.invited_by, pi.invited_by) as invited_by,
                            COALESCE(ti.created_at::text, pi.created_at::text) as invited_on,
                            1 as priority
                        FROM ${schema}.users u
                        LEFT JOIN ${schema}.user_invitations ti ON u.email = ti.email AND ti.status = 'pending' AND ti.expires_at > NOW()
                        LEFT JOIN public.user_invitations pi ON u.email = pi.email AND pi.company_id = $1 AND pi.status = 'pending' AND pi.expires_at > NOW()
                        WHERE u.deleted_at IS NULL
                        
                        UNION ALL
                        
                        SELECT 
                            ti.id,
                            ti.email,
                            NULL as first_name,
                            NULL as last_name,
                            ti.role,
                            false as two_factor_enabled,
                            true as active,
                            NULL as deleted_at,
                            ti.status as invitation_status,
                            ti.invited_by,
                            ti.created_at::text as invited_on,
                            2 as priority
                        FROM ${schema}.user_invitations ti
                        WHERE ti.status = 'pending'
                          AND ti.expires_at > NOW()
                          AND NOT EXISTS (
                            SELECT 1 FROM ${schema}.users u WHERE u.email = ti.email AND u.deleted_at IS NULL
                          )
                        
                        UNION ALL
                        
                        SELECT 
                            pi.id,
                            pi.email,
                            NULL as first_name,
                            NULL as last_name,
                            pi.role,
                            false as two_factor_enabled,
                            true as active,
                            NULL as deleted_at,
                            pi.status as invitation_status,
                            pi.invited_by,
                            pi.created_at::text as invited_on,
                            2 as priority
                        FROM public.user_invitations pi
                        WHERE pi.company_id = $1
                          AND pi.status = 'pending'
                          AND pi.expires_at > NOW()
                          AND NOT EXISTS (
                            SELECT 1 FROM ${schema}.users u WHERE u.email = pi.email AND u.deleted_at IS NULL
                          )
                    ) combined
                    ORDER BY id, priority, invited_on DESC NULLS LAST
                `;
                const result = await context.db.query(query, [companyId]);

                return result.rows.map(user => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    companyId: companyId,
                    schema: schema,
                    twoFactorEnabled: user.two_factor_enabled || false,
                    invitationStatus: user.invitation_status,
                    invitedBy: user.invited_by,
                    invitedOn: user.invited_on,
                    active: user.active,
                    deletedAt: user.deleted_at
                }));
            } catch (error) {
                console.error('Error fetching company users:', error);
                throw new Error('Failed to fetch company users');
            }
        },

        company: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.get(
                    `${AUTH_SERVICE_URL}/auth/company/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to fetch company';
                throw new Error(message);
            }
        },

        companies: async (parent, { parentCompanyId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const params = parentCompanyId ? `?parentCompanyId=${parentCompanyId}` : '';
                const response = await axios.get(
                    `${AUTH_SERVICE_URL}/auth/companies${params}`,
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to fetch companies';
                throw new Error(message);
            }
        }
    },

    Mutation: {
        // ==================== Authentication ====================
        signup: async (parent, { input }) => {
            try {
                // Wrap input to match auth service expectation: { input: { ... } }
                const response = await axios.post(`${AUTH_SERVICE_URL}/auth/signup`, { input });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Signup failed';
                throw new Error(message);
            }
        },

        partnerSignup: async (parent, { input }) => {
            try {
                const response = await axios.post(`${AUTH_SERVICE_URL}/auth/partner-signup`, { input });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Partner signup failed';
                throw new Error(message);
            }
        },

        login: async (parent, { input }) => {
            try {
                const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, { input });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Login failed';
                throw new Error(message);
            }
        },

        refreshToken: async (parent, { refreshToken }) => {
            try {
                const response = await axios.post(`${AUTH_SERVICE_URL}/auth/refresh-token`, {
                    input: { refreshToken }
                });

                // Auth service might not return a new refresh token
                // Return the input one if missing to satisfy schema
                return {
                    ...response.data,
                    refreshToken: response.data.refreshToken || refreshToken
                };
            } catch (error) {
                const message = error.response?.data?.message || 'Token refresh failed';
                throw new Error(message);
            }
        },

        logout: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            // TODO: Invalidate refresh token in database
            // For now, client should discard tokens
            return true;
        },

        // ==================== Invitations ====================
        sendInvitation: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(
                    `${AUTH_SERVICE_URL}/auth/send-invitation`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to send invitation';
                throw new Error(message);
            }
        },

        resendInvitation: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(
                    `${AUTH_SERVICE_URL}/auth/resend-invitation`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to resend invitation';
                throw new Error(message);
            }
        },

        acceptInvitation: async (parent, { input }) => {
            try {
                const response = await axios.post(`${AUTH_SERVICE_URL}/auth/accept-invitation`, { input });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to accept invitation';
                throw new Error(message);
            }
        },

        // ==================== Password Reset ====================
        requestPasswordReset: async (parent, { input }) => {
            try {
                await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password-request`, { input });
                return true;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to send reset email';
                throw new Error(message);
            }
        },

        resetPassword: async (parent, { input }) => {
            try {
                await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password`, { input });
                return true;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to reset password';
                throw new Error(message);
            }
        },

        // ==================== Two-Factor Authentication ====================
        enable2FA: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(
                    `${AUTH_SERVICE_URL}/auth/enable-2fa`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to enable 2FA';
                throw new Error(message);
            }
        },

        verify2FA: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(
                    `${AUTH_SERVICE_URL}/auth/verify-2fa`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data.verified || false;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to verify 2FA';
                throw new Error(message);
            }
        },

        // ==================== Company Context ====================
        switchCompanyContext: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.post(
                    `${AUTH_SERVICE_URL}/auth/switch-company-context`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to switch company context';
                throw new Error(message);
            }
        },

        // ==================== Company Management ====================
        updateCompany: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.put(
                    `${AUTH_SERVICE_URL}/auth/company`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to update company';
                throw new Error(message);
            }
        },

        deleteCompany: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                await axios.delete(
                    `${AUTH_SERVICE_URL}/auth/company/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return true;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to delete company';
                throw new Error(message);
            }
        },

        // ==================== Company User Management ====================
        updateCompanyUser: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const response = await axios.put(
                    `${AUTH_SERVICE_URL}/auth/company-user`,
                    { input },
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to update company user';
                throw new Error(message);
            }
        },

        deleteCompanyUser: async (parent, { userId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                await axios.delete(
                    `${AUTH_SERVICE_URL}/auth/company-user/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return true;
            } catch (error) {
                const message = error.response?.data?.message || 'Failed to delete company user';
                throw new Error(message);
            }
        }
    },

    Company: {
        parentCompany: async (parent, args, context) => {
            if (!parent.parentCompanyId) {
                return null;
            }

            try {
                const response = await axios.get(
                    `${AUTH_SERVICE_URL}/auth/company/${parent.parentCompanyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${context.req?.headers?.authorization?.split(' ')[1]}`
                        }
                    }
                );
                return response.data;
            } catch (error) {
                console.error('Failed to fetch parent company:', error);
                return null;
            }
        }
    }
};

module.exports = authResolvers;
