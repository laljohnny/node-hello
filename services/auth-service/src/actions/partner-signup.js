const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../utils/email');

const partnerSignupSchema = Joi.object({
    input: Joi.object({
        companyName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
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
 * Partner Signup Handler
 * Creates partner company (NO schema) and partner admin user in public.users
 */
async function partnerSignup(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = partnerSignupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;

        await client.query('BEGIN');

        // Check if email already exists in public.users
        const emailCheck = await client.query(
            'SELECT id FROM public.users WHERE email = $1',
            [input.email]
        );

        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if email already exists in companies table
        const companyEmailCheck = await client.query(
            'SELECT id FROM companies WHERE email = $1 AND deleted_at IS NULL',
            [input.email]
        );

        if (companyEmailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Email already registered as a company' });
        }

        // Generate a unique subdomain for partner (partners don't use tenant schemas, but sub_domain is required)
        // Create a slug from company name and ensure uniqueness
        const generateSubdomain = (companyName) => {
            return companyName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50) || 'partner';
        };

        let subdomain = generateSubdomain(input.companyName);
        let subdomainSuffix = 1;
        let isSubdomainUnique = false;

        // Ensure subdomain is unique
        while (!isSubdomainUnique) {
            const subdomainCheck = await client.query(
                'SELECT id FROM companies WHERE sub_domain = $1 AND deleted_at IS NULL',
                [subdomain]
            );

            if (subdomainCheck.rows.length === 0) {
                isSubdomainUnique = true;
            } else {
                // If subdomain exists, append a suffix
                const baseSubdomain = generateSubdomain(input.companyName);
                subdomain = `${baseSubdomain}-${subdomainSuffix}`;
                subdomainSuffix++;
            }
        }

        // Determine parent company ID
        // If JWT token exists, use authenticated user's company as parent
        // If no JWT token (null), this company becomes a superadmin company
        const parentCompanyId = req.user?.companyId || null;

        // Create partner company (NO schema_name, role = 'partner')
        // sub_domain is required by database constraint, but partners don't use tenant schemas
        const companyResult = await client.query(
            `INSERT INTO companies (
                name, email, sub_domain, role, address, city, state, country, zip,
                phone_number, country_code, parent_company, industry
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, name, email, role`,
            [
                input.companyName,
                input.email,
                subdomain,  // Generated unique subdomain
                'partner',  // Partner company
                input.address,
                input.city,
                input.state,
                input.country,
                input.zip,
                input.phoneNumber,
                input.countryCode,
                parentCompanyId,
                input.industry
            ]
        );

        const company = companyResult.rows[0];

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create partner admin user in public.users
        const userResult = await client.query(
            `INSERT INTO public.users (
                email, password, first_name, last_name, role, company_id, job_title
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, first_name, last_name, role, company_id`,
            [
                input.email,
                passwordHash,
                input.firstName,
                input.lastName,
                'partner_admin',  // Partner admin role
                company.id,
                input.jobTitle
            ]
        );

        const user = userResult.rows[0];

        // Generate tokens
        const accessToken = generateAccessToken(user, company);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in public.user_sessions
        await client.query(
            `INSERT INTO public.user_sessions (user_id, refresh_token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [user.id, refreshToken]
        );

        await client.query('COMMIT');

        // Send welcome email (don't await)
        sendWelcomeEmail(user.email, user.first_name, company.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        res.status(201).json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                companyId: company.id,
                schema: 'public'  // Partners don't have tenant schemas
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Partner signup error:', error);
        
        // Provide more specific error messages for constraint violations
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ 
                message: 'Email or company name already exists. Please use a different email or company name.' 
            });
        } else if (error.code === '23503') { // Foreign key constraint violation
            return res.status(400).json({ 
                message: 'Invalid parent company reference.' 
            });
        } else if (error.code === '23514') { // Check constraint violation
            return res.status(400).json({ 
                message: 'Invalid data provided. Please check your input.' 
            });
        } else if (error.code === '23502') { // NOT NULL constraint violation
            return res.status(400).json({ 
                message: `Required field missing: ${error.column || 'unknown field'}` 
            });
        }
        
        res.status(500).json({ message: 'Signup failed. Please try again.' });
    } finally {
        client.release();
    }
}

module.exports = partnerSignup;
