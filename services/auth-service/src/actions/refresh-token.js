const Joi = require('joi');
const { verifyToken, generateAccessToken } = require('../utils/jwt');
const db = require('../utils/db');

const refreshTokenSchema = Joi.object({
    input: Joi.object({
        refreshToken: Joi.string().required()
    }).required()
});

/**
 * Refresh Token Handler
 * Generates new access token from refresh token
 */
async function refreshToken(req, res) {
    try {
        // Validate input
        const { error, value } = refreshTokenSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyToken(input.refreshToken);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const userId = decoded.sub;

        // Check if refresh token exists and is not revoked (check both public and tenant schemas)
        let session = null;
        let schema = 'public';
        let user = null;
        let company = null;

        // Check public schema first
        const publicSessionResult = await db.query(
            `SELECT us.*, u.id, u.email, u.first_name, u.last_name, u.role,
              c.id as company_id, c.name as company_name, c.schema_name
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE us.refresh_token = $1 AND us.revoked = false AND us.expires_at > NOW()`,
            [input.refreshToken]
        );

        if (publicSessionResult.rows.length > 0) {
            session = publicSessionResult.rows[0];
            user = {
                id: session.id,
                email: session.email,
                first_name: session.first_name,
                last_name: session.last_name,
                role: session.role
            };
            company = {
                id: session.company_id,
                name: session.company_name,
                schema_name: session.schema_name || 'public'
            };
            schema = 'public';
        } else {
            // Search tenant schemas
            const companiesResult = await db.query(
                `SELECT id, name, schema_name FROM companies WHERE schema_status = 'active'`
            );

            for (const comp of companiesResult.rows) {
                if (!comp.schema_name) continue;

                try {
                    const tenantSessionResult = await db.query(
                        `SELECT us.*, u.*
             FROM ${comp.schema_name}.user_sessions us
             JOIN ${comp.schema_name}.users u ON us.user_id = u.id
             WHERE us.refresh_token = $1 AND us.revoked = false AND us.expires_at > NOW()`,
                        [input.refreshToken]
                    );

                    if (tenantSessionResult.rows.length > 0) {
                        session = tenantSessionResult.rows[0];
                        user = {
                            id: session.id,
                            email: session.email,
                            first_name: session.first_name,
                            last_name: session.last_name,
                            role: session.role
                        };
                        company = comp;
                        schema = comp.schema_name;
                        break;
                    }
                } catch (err) {
                    console.error(`Error querying schema ${comp.schema_name}:`, err.message);
                }
            }
        }

        if (!session) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const accessToken = generateAccessToken(user, company);

        res.json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Failed to refresh token', error: error.message });
    }
}

module.exports = refreshToken;
