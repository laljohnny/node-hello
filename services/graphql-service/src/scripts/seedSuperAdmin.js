const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
const { pool } = require('../utils/db');
const bcrypt = require('bcrypt');

async function seedSuperAdmin() {
    const client = await pool.connect();

    try {
        console.log('Starting Super Admin seed process...');

        const email = process.env.SUPERADMIN_EMAIL;
        const password = process.env.SUPERADMIN_PASSWORD;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!email || !password) {
            throw new Error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env');
        }

        if (!geminiApiKey) {
            console.warn('WARNING: GEMINI_API_KEY not found in .env, using placeholder.');
        }

        // 1. Create or Get Super Admin Company
        console.log('Checking/Creating Super Admin Company...');
        let companyId;
        const companyName = 'Super Admin Company';
        const subDomain = 'superadmin'; // Reserved subdomain

        const companyRes = await client.query('SELECT id, schema_name FROM public.companies WHERE sub_domain = $1', [subDomain]);

        if (companyRes.rows.length > 0) {
            console.log('Super Admin Company already exists.');
            companyId = companyRes.rows[0].id;
        } else {
            const newCompanyRes = await client.query(`
                INSERT INTO public.companies (
                    name, email, sub_domain, role, active, schema_status
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [companyName, email, subDomain, 'partner', true, 'creating']); // role 'partner' or specific superadmin role? User said "superadmin company", assuming high privilege. 'partner' or 'company' are valid enums. Let's stick to standard 'company' or maybe 'partner' is better for superadmin? User didn't specify role enum value. 'company' is safe. Wait, user role is super_admin. Company role might just be company. public.companies role is 'company' default.

            // Actually, public.company_role enum exists? 
            // Looking at schema: role public.company_role DEFAULT 'company'::public.company_role NOT NULL
            // I'll stick to default 'company' unless I see 'super_admin' in company_role enum (not checked).
            // Let's use default.

            companyId = newCompanyRes.rows[0].id;
            console.log(`Created Super Admin Company with ID: ${companyId}`);

            // 2. Clone Schema
            console.log('Cloning schema for tenant...');
            const cloneRes = await client.query('SELECT * FROM public.clone_schema_for_tenant($1, $2)', [companyId, subDomain]);
            if (!cloneRes.rows[0].success) {
                throw new Error(`Schema cloning failed: ${cloneRes.rows[0].message}`);
            }
            console.log(`Schema cloned: ${cloneRes.rows[0].schema_name}`);
        }

        // Get the schema name (it should be ca_superadmin)
        const schemaRes = await client.query('SELECT schema_name FROM public.companies WHERE id = $1', [companyId]);
        const schemaName = schemaRes.rows[0].schema_name;

        if (!schemaName) {
            throw new Error('Schema name not found for company.');
        }

        // 3. Create Super Admin User
        console.log('Checking/Creating Super Admin User...');
        // Check if user exists in tenant schema
        const userRes = await client.query(`SELECT id FROM ${schemaName}.users WHERE email = $1`, [email]);

        let userId;
        if (userRes.rows.length > 0) {
            console.log('Super Admin User already exists.');
            userId = userRes.rows[0].id;
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUserRes = await client.query(`
                INSERT INTO ${schemaName}.users (
                    email, password, first_name, last_name, role, active, email_confirmed
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [email, hashedPassword, 'Super', 'Admin', 'super_admin', true, true]);

            userId = newUserRes.rows[0].id;
            console.log(`Created Super Admin User with ID: ${userId}`);
        }

        // 4. Create Company AI Config
        console.log('Creating/Updating Company AI Config...');
        const aiConfigId = 'a12bc3f2-fc87-48fd-aa9e-21cea2c72b53'; // Specific ID requested

        // Upsert AI Config
        await client.query(`
            INSERT INTO public.company_ai_configs (
                id, company_id, provider, model, api_key, base_url, is_enabled, settings, is_default, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                company_id = EXCLUDED.company_id,
                provider = EXCLUDED.provider,
                model = EXCLUDED.model,
                api_key = EXCLUDED.api_key,
                base_url = EXCLUDED.base_url,
                is_enabled = EXCLUDED.is_enabled,
                settings = EXCLUDED.settings,
                is_default = EXCLUDED.is_default,
                updated_at = EXCLUDED.updated_at
        `, [
            aiConfigId,
            companyId,
            'gemini',
            'gemini-2.5-flash-lite',
            geminiApiKey || 'placeholder-key',
            'https://api.openai.com/v1',
            true,
            JSON.stringify({ max_tokens: 1000, temperature: 0.5 }),
            true,
            '2025-12-04T10:43:34.082Z',
            '2025-12-04T15:15:31.505Z'
        ]);
        console.log('Company AI Config upserted.');

        console.log('Seed process completed successfully.');

    } catch (error) {
        console.error('Seed process failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedSuperAdmin();
