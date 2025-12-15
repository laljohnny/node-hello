const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../utils/email');

const signupSchema = Joi.object({
    input: Joi.object({
        companyName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        subdomain: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).required(),
        phoneNumber: Joi.string().optional(),
        countryCode: Joi.string().optional(),
        address: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        country: Joi.string().optional(),
        zip: Joi.string().optional(),
        industry: Joi.string().optional(),
        jobTitle: Joi.string().optional()
    }).required()
});

/**
 * Company Signup Handler
 * Creates company, clones schema, and creates admin user
 */
async function signup(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;

        await client.query('BEGIN');

        // Check if subdomain already exists
        const subdomainCheck = await client.query(
            'SELECT id FROM companies WHERE sub_domain = $1',
            [input.subdomain]
        );

        if (subdomainCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Subdomain already taken' });
        }

        // Note: We don't check for email globally because same email can exist in different tenant schemas
        // The composite unique index on (email, schema_name) in the materialized view prevents duplicates within a schema

        // Determine parent company ID
        // If JWT token exists, use authenticated user's company as parent
        // If no JWT token (null), this company becomes a superadmin company
        const parentCompanyId = req.user?.companyId || null;

        // Create company
        const companyResult = await client.query(
            `INSERT INTO companies (
        name, email, sub_domain, role, address, city, state, country, zip,
        phone_number, country_code, schema_status, parent_company, industry
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, name, sub_domain, schema_name`,
            [
                input.companyName,
                input.email,
                input.subdomain,
                'company',
                input.address,
                input.city,
                input.state,
                input.country,
                input.zip,
                input.phoneNumber,
                input.countryCode,
                'creating',
                parentCompanyId,
                input.industry
            ]
        );

        const company = companyResult.rows[0];

        // Clone schema for tenant
        const schemaResult = await client.query(
            'SELECT * FROM clone_schema_for_tenant($1, $2)',
            [company.id, input.subdomain]
        );

        const schemaClone = schemaResult.rows[0];

        if (!schemaClone.success) {
            console.error('Schema cloning failed:', schemaClone.message);
            await client.query('ROLLBACK');
            return res.status(500).json({
                message: 'Failed to create company schema',
                error: schemaClone.message
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create owner user in tenant schema (default role is 'owner' for company signup)
        const schemaName = schemaClone.schema_name;
        const userResult = await client.query(
            `INSERT INTO ${schemaName}.users (
        email, first_name, last_name, password, role, email_confirmed, active, job_title
      ) VALUES ($1, $2, $3, $4, $5::public.user_role, $6, $7, $8)
      RETURNING id, email, first_name, last_name, role`,
            [
                input.email,
                input.firstName,
                input.lastName,
                hashedPassword,
                'owner', // Default role is 'owner' for company signup
                true, // Auto-confirm email for owner during signup
                true,
                input.jobTitle
            ]
        );

        const user = userResult.rows[0];

        // Update company object with schema name for token generation
        company.schema_name = schemaName;

        // Generate tokens
        const accessToken = generateAccessToken(user, company);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in tenant schema
        await client.query(
            `INSERT INTO ${schemaName}.user_sessions (
        user_id, refresh_token, access_token_jti, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
            [user.id, refreshToken, uuidv4()]
        );

        // Add trigger to refresh materialized view when users are added/updated in this tenant
        console.log(`Adding user trigger to schema ${schemaName}...`);
        await client.query(
            'SELECT add_user_trigger_to_tenant_schema($1)',
            [schemaName]
        );
        console.log(`✅ User trigger added to schema ${schemaName}`);

        // Refresh materialized view to include the new user
        console.log('Refreshing user email lookup view...');
        await client.query('SELECT refresh_user_email_lookup()');
        console.log('✅ User email lookup view refreshed');

        // Assign default plan
        const defaultPlanResult = await client.query(
            'SELECT * FROM plans WHERE is_default = true AND active = true LIMIT 1'
        );

        if (defaultPlanResult.rows.length > 0) {
            const defaultPlan = defaultPlanResult.rows[0];

            await client.query(
                `INSERT INTO company_plans (
                    company_id, plan_id, status, start_date
                ) VALUES ($1, $2, $3, NOW())`,
                [company.id, defaultPlan.id, 'active']
            );

            // Add plan details to company object for response
            company.plan = {
                id: defaultPlan.id,
                name: defaultPlan.name,
                limits: defaultPlan.limits
            };
        }

        await client.query('COMMIT');

        // Send welcome email (async, don't wait)
        sendWelcomeEmail(user.email, user.first_name, company.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

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
                schema: schemaName
            },
            company: {
                id: company.id,
                name: company.name,
                subdomain: company.sub_domain,
                schema: schemaName,
                plan: company.plan || null
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Signup failed', error: error.message });
    } finally {
        client.release();
    }
}

module.exports = signup;
