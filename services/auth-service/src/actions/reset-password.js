const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../utils/db');

/**
 * Reset Password Handler
 * Verifies token and updates password
 */
async function resetPassword(req, res) {
    const client = await db.getClient();

    try {
        const { input } = req.body;
        const { token, newPassword } = input || {};

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        await client.query('BEGIN');

        // Hash the token to compare with stored hash
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Try to find token in public schema first
        let tokenResult = await client.query(
            `SELECT prt.user_id, prt.expires_at, u.email
             FROM public.password_reset_tokens prt
             JOIN public.users u ON prt.user_id = u.id
             WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
            [tokenHash]
        );

        let schema = 'public';
        let resetToken = tokenResult.rows[0];

        // If not found in public, search tenant schemas
        if (!resetToken) {
            // Get all active tenant schemas
            const schemasResult = await client.query(
                `SELECT schema_name FROM companies 
                 WHERE schema_status = 'active' AND schema_name IS NOT NULL AND role = 'company'`
            );

            for (const row of schemasResult.rows) {
                const tenantSchema = row.schema_name;

                tokenResult = await client.query(
                    `SELECT prt.user_id, prt.expires_at, u.email
                     FROM ${tenantSchema}.password_reset_tokens prt
                     JOIN ${tenantSchema}.users u ON prt.user_id = u.id
                     WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
                    [tokenHash]
                );

                if (tokenResult.rows.length > 0) {
                    resetToken = tokenResult.rows[0];
                    schema = tenantSchema;
                    break;
                }
            }
        }

        if (!resetToken) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        await client.query(
            `UPDATE ${schema}.users SET password = $1, updated_at = NOW() WHERE id = $2`,
            [passwordHash, resetToken.user_id]
        );

        // Mark token as used
        await client.query(
            `UPDATE ${schema}.password_reset_tokens SET used_at = NOW() WHERE user_id = $1`,
            [resetToken.user_id]
        );

        await client.query('COMMIT');

        res.status(200).json({ message: 'Password reset successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    } finally {
        client.release();
    }
}

module.exports = resetPassword;
