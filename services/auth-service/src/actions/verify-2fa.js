const speakeasy = require('speakeasy');
const db = require('../utils/db');

/**
 * Verify 2FA Handler
 * Verifies code and enables 2FA for user
 */
module.exports = async (req, res) => {
    const client = await db.getClient();

    try {
        const { input } = req.body;
        const { userId, code } = input || {};

        if (!userId || !code) {
            return res.status(400).json({ message: 'User ID and code are required' });
        }

        // Find user and get secret
        let userResult = await client.query(
            'SELECT id, two_factor_secret, two_factor_enabled FROM public.users WHERE id = $1',
            [userId]
        );

        let schema = 'public';
        let user = userResult.rows[0];

        if (!user) {
            const companiesResult = await client.query(
                `SELECT schema_name FROM companies WHERE schema_status = 'active' AND schema_name IS NOT NULL`
            );

            for (const row of companiesResult.rows) {
                const tenantSchema = row.schema_name;
                userResult = await client.query(
                    `SELECT id, two_factor_secret, two_factor_enabled FROM ${tenantSchema}.users WHERE id = $1`,
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

        if (!user.two_factor_secret) {
            return res.status(400).json({ message: '2FA setup not initiated' });
        }

        // Verify code
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 2 // Allow 1 step before/after for time drift
        });

        if (verified) {
            // Enable 2FA
            await client.query(
                `UPDATE ${schema}.users SET two_factor_enabled = true WHERE id = $1`,
                [userId]
            );

            res.json({ verified: true });
        } else {
            res.status(400).json({ message: 'Invalid code', verified: false });
        }

    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ message: 'Failed to verify 2FA' });
    } finally {
        client.release();
    }
};
