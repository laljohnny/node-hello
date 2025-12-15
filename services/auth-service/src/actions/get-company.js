const Joi = require('joi');
const db = require('../utils/db');
const { getCompanyOwner } = require('../utils/company');

const getCompanySchema = Joi.object({
    id: Joi.string().uuid().required()
});

/**
 * Get Company Handler
 * Retrieves company details by ID
 * Permissions: Superadmin can get any company, others can only get companies where they are parent
 */
async function getCompany(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = getCompanySchema.validate(req.params);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { id } = value;
        const userId = req.user?.userId;
        const userCompanyId = req.user?.companyId;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Get the requested company
        const companyResult = await client.query(
            `SELECT id, name, email, sub_domain as subdomain, role, parent_company as "parentCompanyId",
                    schema_name as "schemaName", schema_status as "schemaStatus",
                    address, city, state, country, zip, phone_number as "phoneNumber",
                    country_code as "countryCode", industry, website, business_type as "businessType",
                    created_at as "createdAt", updated_at as "updatedAt",
                    deleted_at as "deletedAt"
             FROM companies 
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const company = companyResult.rows[0];

        // Check permissions
        // Superadmin (parent_company = null) can access any company
        const isSuperadmin = await client.query(
            `SELECT id FROM companies WHERE id = $1 AND parent_company IS NULL`,
            [userCompanyId]
        );

        if (isSuperadmin.rows.length === 0) {
            // Not superadmin, check if user's company is parent of requested company
            if (company.parentCompanyId !== userCompanyId) {
                return res.status(403).json({
                    message: 'You can only access companies where your company is the parent'
                });
            }
        }

        // Fetch owner details for the company
        const owner = await getCompanyOwner(company, client);

        res.json({
            ...company,
            owner: owner
        });

    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ message: 'Failed to get company' });
    } finally {
        client.release();
    }
}

module.exports = getCompany;
