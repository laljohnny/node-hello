const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('../utils/db');

/**
 * Enable 2FA Handler
 * Generates secret and QR code for 2FA setup
 */
module.exports = async (req, res) => {
    const client = await db.getClient();

    try {
        const { input } = req.body;
        const { userId } = input || {};

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // We need to find the user's schema first
        // Since we don't have the schema in the request, we look it up
        // In a real app, the user ID would come from the authenticated token context

        // Check public schema first
        let userResult = await client.query(
            'SELECT id, email FROM public.users WHERE id = $1',
            [userId]
        );

        let schema = 'public';
        let user = userResult.rows[0];

        if (!user) {
            // Check tenant schemas using lookup view if possible, or search
            // Since we have userId, we can try to find where this user is

            // Get all active companies
            const companiesResult = await client.query(
                `SELECT schema_name FROM companies WHERE schema_status = 'active' AND schema_name IS NOT NULL`
            );

            for (const row of companiesResult.rows) {
                const tenantSchema = row.schema_name;
                userResult = await client.query(
                    `SELECT id, email FROM ${tenantSchema}.users WHERE id = $1`,
                    [userId]
                );

                if (userResult.rows.length > 0) {
                    user = userResult.rows[0];
                    schema = tenantSchema;
                    break;
                }
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `Critical Asset Management (${user.email})`
        });

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Store secret in database (but don't enable 2FA yet)
        await client.query(
            `UPDATE ${schema}.users SET two_factor_secret = $1 WHERE id = $2`,
            [secret.base32, userId]
        );

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });

    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ message: 'Failed to enable 2FA' });
    } finally {
        client.release();
    }
};
