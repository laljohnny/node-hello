const Joi = require('joi');
const db = require('../utils/db');

const updateCompanySchema = Joi.object({
    input: Joi.object({
        id: Joi.string().uuid().required(),
        name: Joi.string().allow(null).optional(),
        email: Joi.string().email().allow(null).optional(),
        address: Joi.string().allow(null).optional(),
        city: Joi.string().allow(null).optional(),
        state: Joi.string().allow(null).optional(),
        country: Joi.string().allow(null).optional(),
        zip: Joi.string().allow(null).optional(),
        phoneNumber: Joi.string().allow(null).optional(),
        countryCode: Joi.string().allow(null).optional(),
        industry: Joi.string().allow(null).optional(),
        website: Joi.string().uri().allow(null).optional(),
        businessType: Joi.string().allow(null).optional()
    }).required()
});

/**
 * Update Company Handler
 * Updates company details
 * Permissions: Superadmin can update any company, others can only update companies where they are parent
 */
async function updateCompany(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = updateCompanySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;
        const userId = req.user?.userId;
        const userCompanyId = req.user?.companyId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        await client.query('BEGIN');

        // Get the company to update
        const companyResult = await client.query(
            `SELECT id, parent_company FROM companies WHERE id = $1 AND deleted_at IS NULL`,
            [input.id]
        );

        if (companyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Company not found' });
        }

        const company = companyResult.rows[0];

        // Check permissions
        const isSuperadmin = await client.query(
            `SELECT id FROM companies WHERE id = $1 AND parent_company IS NULL`,
            [userCompanyId]
        );

        if (isSuperadmin.rows.length === 0) {
            // Not superadmin, check if user's company is parent
            if (company.parent_company !== userCompanyId) {
                await client.query('ROLLBACK');
                return res.status(403).json({
                    message: 'You can only update companies where your company is the parent'
                });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [input.id];
        let paramCount = 2;

        if (input.name) {
            updates.push(`name = $${paramCount++}`);
            params.push(input.name);
        }
        if (input.email) {
            updates.push(`email = $${paramCount++}`);
            params.push(input.email);
        }
        if (input.address !== undefined) {
            updates.push(`address = $${paramCount++}`);
            params.push(input.address);
        }
        if (input.city !== undefined) {
            updates.push(`city = $${paramCount++}`);
            params.push(input.city);
        }
        if (input.state !== undefined) {
            updates.push(`state = $${paramCount++}`);
            params.push(input.state);
        }
        if (input.country !== undefined) {
            updates.push(`country = $${paramCount++}`);
            params.push(input.country);
        }
        if (input.zip !== undefined) {
            updates.push(`zip = $${paramCount++}`);
            params.push(input.zip);
        }
        if (input.phoneNumber !== undefined) {
            updates.push(`phone_number = $${paramCount++}`);
            params.push(input.phoneNumber);
        }
        if (input.countryCode !== undefined) {
            updates.push(`country_code = $${paramCount++}`);
            params.push(input.countryCode);
        }
        if (input.industry !== undefined) {
            updates.push(`industry = $${paramCount++}`);
            params.push(input.industry);
        }
        if (input.website !== undefined) {
            updates.push(`website = $${paramCount++}`);
            params.push(input.website);
        }
        if (input.businessType !== undefined) {
            updates.push(`business_type = $${paramCount++}`);
            params.push(input.businessType);
        }

        if (updates.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No fields to update' });
        }

        updates.push(`updated_at = NOW()`);

        const updateQuery = `
            UPDATE companies 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING id, name, email, sub_domain as subdomain, role, parent_company as "parentCompanyId",
                      schema_name as "schemaName", schema_status as "schemaStatus",
                      address, city, state, country, zip, phone_number as "phoneNumber",
                      country_code as "countryCode", industry, website, business_type as "businessType",
                      created_at as "createdAt", updated_at as "updatedAt",
                      deleted_at as "deletedAt"
        `;

        const result = await client.query(updateQuery, params);

        await client.query('COMMIT');

        res.json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update company error:', error);
        res.status(500).json({ message: 'Failed to update company' });
    } finally {
        client.release();
    }
}

module.exports = updateCompany;
