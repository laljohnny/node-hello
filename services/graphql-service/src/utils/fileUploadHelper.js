const axios = require('axios');

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:3002';

/**
 * Process file uploads by calling the file-service confirmUpload endpoint
 * for each file in the array
 * 
 * @param {Array} fileUploads - Array of file upload objects with fileKey, fileName, contentType, size, folderId
 * @param {string} belongsToType - Type of entity (work_order, location, sop, etc.)
 * @param {string} belongsToId - UUID of the parent entity
 * @param {object} context - GraphQL context containing auth headers
 * @returns {Promise<Array>} Array of file IDs created
 * @throws {Error} If any file upload fails
 */
async function processFileUploads(fileUploads, belongsToType, belongsToId, context) {
    if (!fileUploads || !Array.isArray(fileUploads) || fileUploads.length === 0) {
        return [];
    }

    const fileIds = [];
    const authHeaders = getAuthHeaders(context);

    try {
        // Process each file upload sequentially to maintain order
        for (const fileUpload of fileUploads) {
            const payload = {
                fileKey: fileUpload.fileKey,
                fileName: fileUpload.fileName,
                contentType: fileUpload.contentType,
                size: fileUpload.size,
                folderId: fileUpload.folderId || null,
                belongsToType: belongsToType,
                belongsToId: belongsToId
            };

            const response = await axios.post(
                `${FILE_SERVICE_URL}/files/confirm-upload`,
                payload,
                { headers: authHeaders }
            );

            if (response.data && response.data.id) {
                fileIds.push(response.data.id);
            } else {
                throw new Error(`Failed to get file ID from confirmUpload response for file: ${fileUpload.fileName}`);
            }
        }

        return fileIds;
    } catch (error) {
        console.error('Error processing file uploads:', error.message);
        console.error('File service error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data
            }
        });
        throw new Error(`File upload processing failed: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Extract authorization headers from GraphQL context
 * @param {object} context - GraphQL context
 * @returns {object} Headers object with Authorization
 */
function getAuthHeaders(context) {
    const headers = {};
    if (context.req && context.req.headers && context.req.headers.authorization) {
        headers['Authorization'] = context.req.headers.authorization;
    }
    return headers;
}

module.exports = {
    processFileUploads
};
