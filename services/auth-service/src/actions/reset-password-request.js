const crypto = require('crypto');
const db = require('../utils/db');
const { sendPasswordResetEmail } = require('../utils/email');

/**
 * Request Password Reset Handler
 * Generates reset token and sends email
 */
async function requestPasswordReset(req, res) {
    const client = await db.getClient();

    try {
        const { input } = req.body;
        const email = input?.email;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        await client.query('BEGIN');

        // Check if user exists - first in public schema
        console.log(`[PasswordReset] Looking up email: ${email}`);
        let userResult = await client.query(
            'SELECT id, email FROM public.users WHERE email = $1 AND deleted_at IS NULL',
            [email]
        );

        let user = userResult.rows[0];
        let schema = 'public';

        // If not in public, search tenant schemas
        if (!user) {
            console.log(`[PasswordReset] Not found in public, searching tenant schemas...`);
            const companiesResult = await client.query(
                `SELECT schema_name FROM companies 
                 WHERE schema_status = 'active' AND schema_name IS NOT NULL AND role = 'company'`
            );

            for (const row of companiesResult.rows) {
                const tenantSchema = row.schema_name;
                try {
                    userResult = await client.query(
                        `SELECT id, email FROM ${tenantSchema}.users WHERE email = $1 AND deleted_at IS NULL`,
                        [email]
                    );

                    if (userResult.rows.length > 0) {
                        user = userResult.rows[0];
                        schema = tenantSchema;
                        console.log(`[PasswordReset] Found user in schema: ${schema}`);
                        break;
                    }
                } catch (err) {
                    console.error(`Error querying schema ${tenantSchema}:`, err.message);
                }
            }
        }

        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            console.log(`[PasswordReset] User not found for email: ${email}`);
            await client.query('COMMIT');
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        console.log(`[PasswordReset] Generating token for user ${user.id} in schema: ${schema}`);

        // Generate reset token (cryptographically secure)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        console.log(`[PasswordReset] Storing token in ${schema}.password_reset_tokens for user ${user.id}`);
        console.log(`[PasswordReset] Token hash: ${resetTokenHash.substring(0, 10)}...`);

        // Store reset token in the same schema as the user
        try {
            const insertResult = await client.query(
                `INSERT INTO ${schema}.password_reset_tokens (user_id, token_hash, expires_at)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) 
                 DO UPDATE SET token_hash = $2, expires_at = $3, created_at = NOW()
                 RETURNING id`,
                [user.id, resetTokenHash, expiresAt]
            );
            console.log(`[PasswordReset] Token stored successfully. ID: ${insertResult.rows[0]?.id}`);
        } catch (insertError) {
            console.error(`[PasswordReset] Failed to insert token:`, insertError);
            throw insertError;
        }

        await client.query('COMMIT');
        console.log(`[PasswordReset] Transaction committed successfully`);

        // Send reset email (don't await to avoid blocking)
        sendPasswordResetEmail(user.email, resetToken).catch(err => {
            console.error('Failed to send password reset email:', err);
        });

        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Failed to process password reset request' });
    } finally {
        client.release();
    }
}

module.exports = requestPasswordReset;
