const Joi = require('joi');
const db = require('../utils/db');
const { getPublicUrl } = require('../utils/s3');

const confirmUploadSchema = Joi.object({
    fileKey: Joi.string().required(),
    fileName: Joi.string().required(),
    contentType: Joi.string().required(),
    size: Joi.number().required(),
    folderId: Joi.string().uuid().optional().allow(null),
    belongsToType: Joi.string().valid('location', 'asset', 'work_order', 'sop', 'incident_plan').optional().allow(null),
    belongsToId: Joi.string().uuid().optional().allow(null)
});

/**
 * Confirm Upload Handler
 * Saves file metadata to database after successful S3 upload
 */
async function confirmUpload(req, res) {
    try {
        // 1. Get User Context from Auth Middleware
        const { userId, schema } = req.user;

        if (!userId || !schema) {
            return res.status(400).json({ message: 'User context missing user information' });
        }

        // 2. Validate Input
        const { error, value } = confirmUploadSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const input = value;
        const publicUrl = getPublicUrl(input.fileKey);

        // Get company ID from schema
        const companyQuery = 'SELECT id FROM companies WHERE schema_name = $1';
        const companyResult = await db.query(companyQuery, [schema]);

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const companyId = companyResult.rows[0].id;

        // Check Storage Limits
        // Get current storage usage from companies table
        const storageQuery = 'SELECT file_size_total FROM companies WHERE id = $1';
        const storageResult = await db.query(storageQuery, [companyId]);
        const currentStorageBytes = storageResult.rows.length > 0 ? parseInt(storageResult.rows[0].file_size_total || '0', 10) : 0;

        // Get the company's active plan and limits
        const planQuery = `
            SELECT p.limits
            FROM company_plans cp
            JOIN plans p ON cp.plan_id = p.id
            WHERE cp.company_id = $1 
            AND cp.status IN ('active', 'trialing', 'past_due')
            ORDER BY cp.created_at DESC
            LIMIT 1
        `;
        const planResult = await db.query(planQuery, [companyId]);

        if (planResult.rows.length > 0) {
            const limits = planResult.rows[0].limits;
            const storageLimit = limits?.storage;

            if (storageLimit !== null && storageLimit !== undefined && storageLimit !== -1) {
                const limitBytes = storageLimit * 1024 * 1024 * 1024; // Convert GB to bytes
                const newTotalBytes = currentStorageBytes + input.size;

                if (newTotalBytes > limitBytes) {
                    const usedGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
                    const fileGB = (input.size / (1024 * 1024 * 1024)).toFixed(2);
                    return res.status(403).json({
                        message: `Storage limit exceeded. Current usage: ${usedGB}GB, File size: ${fileGB}GB, Limit: ${storageLimit}GB. Please upgrade your plan.`
                    });
                }
            }
        }

        // Insert file record into tenant schema
        const result = await db.query(
            `INSERT INTO ${schema}.files (
        file_name, file_path, file_url, mime_type, file_size, folder_id, 
        belongs_to_type, belongs_to_id, created_by, upload_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed')
      RETURNING id, file_name, file_url, created_at`,
            [
                input.fileName,
                input.fileKey,
                publicUrl,
                input.contentType,
                input.size,
                input.folderId || null,
                input.belongsToType || null,
                input.belongsToId || null,
                userId
            ]
        );

        // Update company's file_size_total counter
        await db.query(
            'UPDATE companies SET file_size_total = file_size_total + $1 WHERE id = $2',
            [input.size, companyId]
        );

        // Materialized view will be automatically refreshed by the trigger on companies table
        // Adding explicit refresh as requested for certainty
        await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details');

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Confirm upload error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({ message: 'Failed to confirm upload', error: error.message });
    }
}

module.exports = confirmUpload;
