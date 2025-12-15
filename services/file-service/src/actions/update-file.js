const Joi = require('joi');
const db = require('../utils/db');

const updateFileSchema = Joi.object({
    id: Joi.string().uuid().required(),
    fileName: Joi.string().optional(),
    folderId: Joi.string().uuid().optional().allow(null),
    belongsToType: Joi.string().valid('location', 'asset', 'work_order', 'sop', 'incident_plan').optional().allow(null),
    belongsToId: Joi.string().uuid().optional().allow(null)
}).min(2); // At least id and one other field

/**
 * Update File Handler
 * Updates file metadata in database
 */
async function updateFile(req, res) {
    try {
        // 1. Get User Context from Auth Middleware
        const { schema } = req.user;

        if (!schema) {
            return res.status(400).json({ message: 'User context missing schema information' });
        }

        // 2. Validate Input
        const { error, value } = updateFileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { id, fileName, folderId, belongsToType, belongsToId } = value;

        // 3. Check if file exists
        const checkResult = await db.query(
            `SELECT id FROM ${schema}.files 
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        // 4. Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (fileName !== undefined) {
            updateFields.push(`file_name = $${paramIndex++}`);
            updateValues.push(fileName);
        }

        if (folderId !== undefined) {
            updateFields.push(`folder_id = $${paramIndex++}`);
            updateValues.push(folderId);
        }

        if (belongsToType !== undefined) {
            updateFields.push(`belongs_to_type = $${paramIndex++}`);
            updateValues.push(belongsToType);
        }

        if (belongsToId !== undefined) {
            updateFields.push(`belongs_to_id = $${paramIndex++}`);
            updateValues.push(belongsToId);
        }

        // Ensure at least one field (besides id) is being updated
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'At least one field must be provided for update' });
        }

        // Add updated_at timestamp
        updateFields.push(`updated_at = NOW()`);

        // Add id as the last parameter
        updateValues.push(id);

        // 5. Execute update
        const updateQuery = `
            UPDATE ${schema}.files 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex} AND deleted_at IS NULL
            RETURNING id, file_name, file_path, file_url, mime_type, file_size, 
                      folder_id, belongs_to_type, belongs_to_id, created_by, 
                      upload_status, created_at, updated_at
        `;

        const result = await db.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'File not found or could not be updated' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Failed to update file' });
    }
}

module.exports = updateFile;

