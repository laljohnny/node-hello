const db = require('../utils/db');

/**
 * Get File Handler
 * Retrieves file metadata by ID
 */
async function getFile(req, res) {
    try {
        // 1. Get User Context from Auth Middleware
        const { schema } = req.user;

        if (!schema) {
            return res.status(400).json({ message: 'User context missing schema information' });
        }

        const fileId = req.params.id;

        if (!fileId) {
            return res.status(400).json({ message: 'File ID is required' });
        }

        // Fetch file record from tenant schema
        const result = await db.query(
            `SELECT id, file_name, file_path, file_url, mime_type, file_size, 
                    folder_id, belongs_to_type, belongs_to_id, created_by, 
                    upload_status, created_at, updated_at
             FROM ${schema}.files 
             WHERE id = $1 AND deleted_at IS NULL`,
            [fileId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Failed to retrieve file' });
    }
}

module.exports = getFile;
