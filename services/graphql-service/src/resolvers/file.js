const axios = require('axios');

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:3002';

const getAuthHeaders = (context) => {
    const headers = {};
    if (context.req && context.req.headers && context.req.headers.authorization) {
        headers['Authorization'] = context.req.headers.authorization;
    }
    return headers;
};

const fileResolvers = {
    Query: {
        file: async (parent, { id }, context) => {
            try {
                const response = await axios.get(`${FILE_SERVICE_URL}/files/${id}`, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error fetching file:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to fetch file');
            }
        },
        getFilesByBelongsTo: async (parent, { belongsToType, belongsToId }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Not authenticated');
                }

                const schema = context.schema;
                const client = await context.db.connect();

                try {
                    const query = `
                        SELECT 
                            id,
                            file_name,
                            file_url,
                            mime_type,
                            file_size,
                            folder_id,
                            created_at,
                            created_by,
                            upload_status
                        FROM ${schema}.files
                        WHERE belongs_to_type = $1 
                        AND belongs_to_id = $2 
                        AND deleted_at IS NULL
                        ORDER BY created_at DESC
                    `;

                    const result = await client.query(query, [belongsToType.toLowerCase(), belongsToId]);
                    return result.rows;
                } finally {
                    client.release();
                }
            } catch (error) {
                console.error('Error fetching files by belongs to:', error.message);
                throw new Error(error.message || 'Failed to fetch files');
            }
        }
    },
    Mutation: {
        generateUploadUrl: async (parent, { input }, context) => {
            try {
                const response = await axios.post(`${FILE_SERVICE_URL}/files/generate-upload-url`, input, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error generating upload URL:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to generate upload URL');
            }
        },
        confirmUpload: async (parent, { input }, context) => {
            try {
                const payload = { ...input };
                if (payload.belongsToType) {
                    payload.belongsToType = payload.belongsToType.toLowerCase();
                }

                const response = await axios.post(`${FILE_SERVICE_URL}/files/confirm-upload`, payload, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error confirming upload:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to confirm upload');
            }
        },
        updateFile: async (parent, { input }, context) => {
            try {
                const payload = { ...input };
                if (payload.belongsToType) {
                    payload.belongsToType = payload.belongsToType.toLowerCase();
                }

                const response = await axios.put(`${FILE_SERVICE_URL}/files/update-file`, payload, {
                    headers: getAuthHeaders(context)
                });
                return response.data;
            } catch (error) {
                console.error('Error updating file:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to update file');
            }
        },
        deleteFile: async (parent, { input }, context) => {
            try {
                const response = await axios.post(`${FILE_SERVICE_URL}/files/delete-file`, input, {
                    headers: getAuthHeaders(context)
                });
                return true;
            } catch (error) {
                console.error('Error deleting file:', error.message);
                throw new Error(error.response?.data?.message || 'Failed to delete file');
            }
        }
    }
};

module.exports = fileResolvers;
