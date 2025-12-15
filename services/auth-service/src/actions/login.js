const bcrypt = require('bcrypt');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const loginSchema = Joi.object({
    input: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        subdomain: Joi.string().optional(),
        twoFactorCode: Joi.string().optional()
    }).required()
});

/**
 * Login Handler
 * Authenticates user and returns JWT tokens
 */
async function login(req, res) {
    try {
        console.log('=== LOGIN REQUEST RECEIVED ===');
        console.log('Request body:', JSON.stringify(req.body));

        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details[0].message);
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;
        console.log('Validated input:', input.email);

        // Use materialized view for fast lookup
        console.log('Looking up user in materialized view...');
        const lookupResult = await db.query(
            'SELECT * FROM user_email_schema_lookup WHERE email = $1',
            [input.email]
        );

        let user = null;
        let company = null;
        let schema = 'public';

        if (lookupResult.rows.length > 0) {
            // Check if user exists in multiple schemas
            if (lookupResult.rows.length > 1) {
                // If subdomain is provided, filter by it
                if (input.subdomain) {
                    const companyResult = await db.query(
                        'SELECT schema_name FROM companies WHERE sub_domain = $1 AND deleted_at IS NULL',
                        [input.subdomain]
                    );

                    if (companyResult.rows.length === 0) {
                        return res.status(401).json({ message: 'Invalid email or password' });
                    }

                    const targetSchema = companyResult.rows[0].schema_name;
                    const lookup = lookupResult.rows.find(r => r.schema_name === targetSchema);

                    if (!lookup) {
                        return res.status(401).json({ message: 'Invalid email or password' });
                    }

                    schema = lookup.user_schema;
                } else {
                    // User exists in multiple companies but no subdomain provided
                    // For security, don't reveal which companies - just ask for subdomain
                    return res.status(400).json({
                        message: 'Multiple accounts found. Please specify subdomain.',
                        requiresSubdomain: true
                    });
                }
            } else {
                // User exists in only one schema
                const lookup = lookupResult.rows[0];
                schema = lookup.user_schema;
            }

            console.log(`User found in schema: ${schema}`);

            // Get the lookup record for the selected schema
            const lookup = lookupResult.rows.find(r => r.user_schema === schema) || lookupResult.rows[0];

            // Fetch full user details from the specific schema
            const userQuery = schema === 'public'
                ? `SELECT u.*, c.id as company_id, c.name as company_name, c.sub_domain, c.schema_name, c.role as company_role
                   FROM users u
                   LEFT JOIN companies c ON u.company_id = c.id
                   WHERE u.id = $1 AND u.deleted_at IS NULL AND u.active = true
                     AND c.deleted_at IS NULL`
                : `SELECT u.* FROM ${schema}.users u
                   WHERE u.id = $1 AND u.deleted_at IS NULL AND u.active = true`;

            const userResult = await db.query(userQuery, [lookup.user_id]);

            if (userResult.rows.length > 0) {
                user = userResult.rows[0];

                if (schema === 'public') {
                    company = {
                        id: user.company_id,
                        name: user.company_name,
                        sub_domain: user.sub_domain,
                        schema_name: user.schema_name || 'public',
                        role: user.company_role
                    };
                } else {
                    // Fetch company details for tenant user and check if company is deleted
                    const companyResult = await db.query(
                        'SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL',
                        [lookup.company_id]
                    );
                    if (companyResult.rows.length > 0) {
                        company = companyResult.rows[0];
                    } else {
                        // Company is deleted, deny login
                        user = null;
                    }
                }
            }
        } else {
            console.log('User not found in lookup view');
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(input.password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            if (!input.twoFactorCode) {
                return res.status(200).json({
                    requiresTwoFactor: true,
                    message: 'Two-factor authentication required'
                });
            }

            // Verify 2FA code (implement speakeasy verification)
            const speakeasy = require('speakeasy');
            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: input.twoFactorCode,
                window: 2
            });

            if (!verified) {
                return res.status(401).json({ message: 'Invalid two-factor code' });
            }
        }

        // Generate tokens
        const accessToken = generateAccessToken(user, company);
        const refreshToken = generateRefreshToken(user.id);
        const accessTokenJti = uuidv4();

        // Store session in the correct schema's user_sessions table
        // If login happens through public.users, save response to public.user_sessions
        // If login happens through schema.users, save response to schema.user_sessions
        const targetTable = schema === 'public' 
            ? 'public.user_sessions' 
            : `${schema}.user_sessions`;

        const sessionQuery = `INSERT INTO ${targetTable} 
            (user_id, refresh_token, access_token_jti, ip_address, user_agent, expires_at) 
            VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
            RETURNING id, user_id, refresh_token, access_token_jti, ip_address, user_agent, expires_at, created_at`;

        console.log(`Saving session to ${targetTable} for user ${user.id}`);

        const sessionResult = await db.query(sessionQuery, [
            user.id,
            refreshToken,
            accessTokenJti,
            req.ip || null,
            req.get('user-agent') || null
        ]);

        if (!sessionResult.rows || sessionResult.rows.length === 0) {
            console.error(`Failed to save session to ${targetTable}`);
            return res.status(500).json({ message: 'Failed to create session' });
        }

        // Update last login in the correct schema's users table
        // If login happens through public.users, update public.users
        // If login happens through schema.users, update schema.users
        const targetUsersTable = schema === 'public' 
            ? 'public.users' 
            : `${schema}.users`;

        const updateLoginQuery = `UPDATE ${targetUsersTable} 
            SET last_login_at = NOW(), last_login_ip = $1 
            WHERE id = $2`;

        await db.query(updateLoginQuery, [req.ip || null, user.id]);
        console.log(`✅ Last login updated in ${targetUsersTable} for user ${user.id}`);

        // Return success response
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyId: company.id,
                companyName: company.name,
                schema: company.schema_name
            },
            company: {
                id: company.id,
                name: company.name,
                subdomain: company.sub_domain,
                schema: company.schema_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
}

module.exports = login;
