const db = require('./db');

/**
 * Fetch owner details for a company
 * @param {Object} company - Company object with schemaName and role
 * @param {Object} client - Database client to use (optional, will create new if not provided)
 * @returns {Promise<Object|null>} Owner object or null if not found
 */
async function getCompanyOwner(company, client = null) {
    const shouldReleaseClient = !client;
    let searchPathModified = false;
    
    try {
        // Use provided client or create new one
        if (!client) {
            client = await db.getClient();
        }

        const schemaName = company.schemaName;
        const companyRole = company.role;
        let owner = null;

        if (schemaName && schemaName !== 'public' && companyRole === 'company') {
            // Regular company with tenant schema - query tenant schema for owner
            await client.query(`SET search_path TO ${schemaName}, public`);
            searchPathModified = true;
            const ownerQuery = `
                SELECT id, email, first_name as "firstName", last_name as "lastName", 
                       phone as "phoneNumber", role, active, 
                       created_at as "createdAt", updated_at as "updatedAt"
                FROM users 
                WHERE role = 'owner'::public.user_role
                AND deleted_at IS NULL 
                AND active = true
                LIMIT 1
            `;
            const ownerResult = await client.query(ownerQuery);
            if (ownerResult.rows.length > 0) {
                owner = ownerResult.rows[0];
            }
            // Reset search_path
            await client.query('SET search_path TO public');
            searchPathModified = false;
        } else if (companyRole === 'partner' && !schemaName) {
            // Partner company - query public.users for partner_admin (equivalent to owner)
            const ownerQuery = `
                SELECT id, email, first_name as "firstName", last_name as "lastName", 
                       phone_number as "phoneNumber", role, active, 
                       created_at as "createdAt", updated_at as "updatedAt"
                FROM users 
                WHERE role = 'partner_admin'::public.user_role
                AND company_id = $1
                AND deleted_at IS NULL 
                AND active = true
                LIMIT 1
            `;
            const ownerResult = await client.query(ownerQuery, [company.id]);
            if (ownerResult.rows.length > 0) {
                owner = ownerResult.rows[0];
            }
        }

        return owner;
    } catch (error) {
        // If schema doesn't exist or query fails, return null
        console.error(`[getCompanyOwner] Error fetching owner for company ${company.id}:`, error.message);
        return null;
    } finally {
        // Always reset search_path if we modified it (regardless of who created the client)
        if (searchPathModified && client) {
            try {
                await client.query('SET search_path TO public');
            } catch (resetError) {
                // Ignore reset errors
            }
        }
        // Only release if we created the client
        if (shouldReleaseClient && client) {
            client.release();
        }
    }
}

module.exports = {
    getCompanyOwner
};

