const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { getSignedUploadUrl } = require('../utils/s3');

const generateUrlSchema = Joi.object({
    fileName: Joi.string().required(),
    contentType: Joi.string().required(),
    folderId: Joi.string().uuid().optional().allow(null)
});

/**
 * Generate Upload URL Handler
 */
async function generateUploadUrl(req, res) {
    try {
        // 1. Get User Context from Auth Middleware
        const { companyId, schema } = req.user;

        if (!companyId || !schema) {
            return res.status(400).json({ message: 'User context missing company information' });
        }

        // Check Storage Limits
        const db = require('../utils/db');

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

                if (currentStorageBytes >= limitBytes) {
                    const usedGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
                    return res.status(403).json({
                        message: `Storage limit reached (${usedGB}GB/${storageLimit}GB). Please upgrade your plan.`
                    });
                }
            }
        }

        // 2. Validate Input
        const { error, value } = generateUrlSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const input = value;

        // Generate unique file key: company_id/year/month/uuid-filename
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const fileUuid = uuidv4();
        const key = `${companyId}/${year}/${month}/${fileUuid}-${input.fileName}`;

        // Get pre-signed URL
        const uploadUrl = getSignedUploadUrl(key, input.contentType);

        res.json({
            uploadUrl,
            fileKey: key,
            fileId: fileUuid
        });

    } catch (error) {
        console.error('Generate upload URL error:', error);
        res.status(500).json({ message: 'Failed to generate upload URL' });
    }
}

module.exports = generateUploadUrl;
