const bcrypt = require('bcrypt');
const Joi = require('joi');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../utils/email');

const acceptInvitationSchema = Joi.object({
    input: Joi.object({
        token: Joi.string().uuid().required(),
        password: Joi.string().min(8).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required()
    }).required()
});

/**
 * Accept Invitation Handler
 * Creates user account from invitation
 */
async function acceptInvitation(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = acceptInvitationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;

        await client.query('BEGIN');

        // Find invitation in public schema first
        let invitation = null;
        let schema = 'public';
        let company = null;

        const publicInvitationResult = await client.query(
            `SELECT ui.*, c.id as company_id, c.name as company_name, c.schema_name
       FROM user_invitations ui
       JOIN companies c ON ui.company_id = c.id
       WHERE ui.token = $1 AND ui.status = 'pending' AND ui.expires_at > NOW()`,
            [input.token]
        );

        if (publicInvitationResult.rows.length > 0) {
            invitation = publicInvitationResult.rows[0];
            company = {
                id: invitation.company_id,
                name: invitation.company_name,
                schema_name: invitation.schema_name
            };
            schema = 'public';
        } else {
            // Search tenant schemas
            const companiesResult = await client.query(
                `SELECT id, name, schema_name FROM companies WHERE schema_status = 'active'`
            );

            for (const comp of companiesResult.rows) {
                if (!comp.schema_name) continue;

                try {
                    const tenantInvitationResult = await client.query(
                        `SELECT * FROM ${comp.schema_name}.user_invitations
             WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
                        [input.token]
                    );

                    if (tenantInvitationResult.rows.length > 0) {
                        invitation = tenantInvitationResult.rows[0];
                        company = comp;
                        schema = comp.schema_name;
                        break;
                    }
                } catch (err) {
                    console.error(`Error querying schema ${comp.schema_name}:`, err.message);
                }
            }
        }

        if (!invitation) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create user
        // Handle belongs_to (vendor ID) for vendor-related users
        const belongsTo = invitation.belongs_to || null;
        
        const userQuery = schema === 'public'
            ? `INSERT INTO users (email, first_name, last_name, password, role, company_id, email_confirmed, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, role`
            : `INSERT INTO ${schema}.users (email, first_name, last_name, password, role, email_confirmed, active, belongs_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, role, belongs_to`;

        const userParams = schema === 'public'
            ? [invitation.email, input.firstName, input.lastName, hashedPassword, invitation.role, company.id, true, true]
            : [invitation.email, input.firstName, input.lastName, hashedPassword, invitation.role, true, true, belongsTo];

        const userResult = await client.query(userQuery, userParams);
        const user = userResult.rows[0];

        // Update invitation status
        const updateInvitationQuery = schema === 'public'
            ? 'UPDATE user_invitations SET status = $1, accepted_at = NOW() WHERE id = $2'
            : `UPDATE ${schema}.user_invitations SET status = $1, accepted_at = NOW() WHERE id = $2`;

        await client.query(updateInvitationQuery, ['accepted', invitation.id]);

        // Generate tokens
        const accessToken = generateAccessToken(user, company);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        const sessionQuery = schema === 'public'
            ? 'INSERT INTO user_sessions (user_id, refresh_token, access_token_jti, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'7 days\')'
            : `INSERT INTO ${schema}.user_sessions (user_id, refresh_token, access_token_jti, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`;

        await client.query(sessionQuery, [user.id, refreshToken, require('uuid').v4()]);

        // Refresh materialized view to update user count
        await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details');

        await client.query('COMMIT');

        // Send welcome email (async)
        sendWelcomeEmail(user.email, user.first_name, company.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            },
            company: {
                id: company.id,
                name: company.name,
                schema: schema
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Accept invitation error:', error);
        res.status(500).json({ message: 'Failed to accept invitation', error: error.message });
    } finally {
        client.release();
    }
}

module.exports = acceptInvitation;
