const Joi = require('joi');
const db = require('../utils/db');
const { getCompanyOwner } = require('../utils/company');

const getCompaniesSchema = Joi.object({
    parentCompanyId: Joi.string().uuid().allow(null, '').optional()
});

/**
 * Get Companies Handler
 * Lists companies filtered by parent
 * 
 * Logic:
 * - If parentCompanyId is provided: returns companies with that parent
 * - If parentCompanyId is null/empty and user is superadmin: returns ALL companies
 * - If parentCompanyId is not provided and user is superadmin: returns companies where parent is null (other superadmins)
 * - If user is not superadmin: returns companies where user's company is parent
 * 
 * Permissions: Superadmin can query any parent, others limited to their company
 */
async function getCompanies(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = getCompaniesSchema.validate(req.query);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const userId = req.user?.userId;
        const userCompanyId = req.user?.companyId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Check if user is superadmin
        const isSuperadmin = await client.query(
            `SELECT id FROM companies WHERE id = $1 AND parent_company IS NULL`,
            [userCompanyId]
        );

        const isSuperadminUser = isSuperadmin.rows.length > 0;
        let parentId = value.parentCompanyId;

        // Handle empty string as null
        if (parentId === '') {
            parentId = null;
        }

        // If not superadmin and trying to query a different parent, deny
        if (!isSuperadminUser && parentId && parentId !== userCompanyId) {
            return res.status(403).json({
                message: 'You can only query companies where your company is the parent'
            });
        }

        // If no parentId specified and not superadmin, use user's company
        if (parentId === undefined && !isSuperadminUser) {
            parentId = userCompanyId;
        }

        // Build query
        let query = `
            SELECT id, name, email, sub_domain as subdomain, role, parent_company as "parentCompanyId",
                   schema_name as "schemaName", schema_status as "schemaStatus",
                   address, city, state, country, zip, phone_number as "phoneNumber",
                   country_code as "countryCode", industry, website, business_type as "businessType",
                   created_at as "createdAt", updated_at as "updatedAt",
                   deleted_at as "deletedAt"
            FROM companies 
            WHERE deleted_at IS NULL
        `;
        const params = [];

        // If parentId is explicitly provided (including null for "get all"), filter by it
        // If parentId is undefined and user is superadmin, get companies with null parent
        if (parentId !== undefined) {
            if (parentId === null) {
                // Superadmin requesting all companies - no parent filter
                // Query returns all companies
            } else {
                query += ` AND parent_company = $1`;
                params.push(parentId);
            }
        } else if (isSuperadminUser) {
            // Superadmin with no parentId specified - get companies with null parent (other superadmins)
            query += ` AND parent_company IS NULL`;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await client.query(query, params);
        const companies = result.rows;

        // Fetch owner details for each company
        // Use separate client connections for each query to avoid search_path conflicts in parallel execution
        const companiesWithOwners = await Promise.all(
            companies.map(async (company) => {
                const ownerClient = await db.getClient();
                try {
                    // Use the utility function with a dedicated client for each company
                    const owner = await getCompanyOwner(company, ownerClient);
                    return {
                        ...company,
                        owner: owner
                    };
                } catch (error) {
                    // If schema doesn't exist or query fails, owner remains null
                    console.error(`[get-companies] Error fetching owner for company ${company.id}:`, error.message);
                    return {
                        ...company,
                        owner: null
                    };
                } finally {
                    // Always release the owner client connection
                    ownerClient.release();
                }
            })
        );

        res.json(companiesWithOwners);

    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Failed to get companies' });
    } finally {
        client.release();
    }
}

module.exports = getCompanies;
