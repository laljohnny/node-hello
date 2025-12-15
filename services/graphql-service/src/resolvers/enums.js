const axios = require('axios');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const enumResolvers = {
    Query: {
        getEnums: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            
            try {
                const token = context.req?.headers?.authorization?.split(' ')[1];
                if (!token) {
                    throw new Error('No token found in request');
                }

                const response = await axios.get(`${AUTH_SERVICE_URL}/enums`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to get enums';
                throw new Error(message);
            }
        },

        getEnumByName: async (parent, { enumName }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            
            try {
                const token = context.req?.headers?.authorization?.split(' ')[1];
                if (!token) {
                    throw new Error('No token found in request');
                }

                const response = await axios.get(`${AUTH_SERVICE_URL}/enums/${enumName}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to get enum by name';
                throw new Error(message);
            }
        },

        getAllEnums: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            
            // Only super_admin can access all enums
            if (context.user.role !== 'super_admin') {
                throw new Error('Only super_admin can access all enums');
            }
            
            try {
                const token = context.req?.headers?.authorization?.split(' ')[1];
                if (!token) {
                    throw new Error('No token found in request');
                }

                const response = await axios.get(`${AUTH_SERVICE_URL}/enums/all`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                return response.data;
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to get all enums';
                throw new Error(message);
            }
        }
    }
};

module.exports = enumResolvers;

