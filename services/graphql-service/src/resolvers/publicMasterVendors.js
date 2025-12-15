const db = require('../utils/db');

// Helper function to validate vendor type
const validateVendorType = (vendorType) => {
    const validTypes = ['maintenance_provider', 'procurement_partner', 'both'];
    if (vendorType && !validTypes.includes(vendorType)) {
        throw new Error(`Invalid vendor type. Must be one of: ${validTypes.join(', ')}`);
    }
};

const publicMasterVendorResolvers = {
    Query: {
        publicMasterVendors: async (parent, { addedByCompanyId, vendorType }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                let query = `
                    SELECT 
                        id,
                        aaded_by_company_id as "addedByCompanyId",
                        vendor_company_name as "vendorCompanyName",
                        website,
                        email,
                        name,
                        phone_number as "phoneNumber",
                        country_code as "countryCode",
                        vendor_type as "vendorType",
                        can_login as "canLogin",
                        invited_by_user as "invitedByUser",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_vendors
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramCount = 1;

                if (addedByCompanyId) {
                    query += ` AND aaded_by_company_id = $${paramCount}`;
                    params.push(addedByCompanyId);
                    paramCount++;
                }

                if (vendorType) {
                    query += ` AND vendor_type = $${paramCount}`;
                    params.push(vendorType);
                    paramCount++;
                }

                query += ` ORDER BY created_at DESC`;

                const result = await db.query(query, params);
                return result.rows.map(row => formatVendorRow(row));
            } catch (error) {
                console.error('Error fetching public master vendors:', error);
                throw new Error(`Failed to fetch public master vendors: ${error.message}`);
            }
        },

        publicMasterVendor: async (parent, { id }, context) => {
            // All authenticated users can access
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const query = `
                    SELECT 
                        id,
                        aaded_by_company_id as "addedByCompanyId",
                        vendor_company_name as "vendorCompanyName",
                        website,
                        email,
                        name,
                        phone_number as "phoneNumber",
                        country_code as "countryCode",
                        vendor_type as "vendorType",
                        can_login as "canLogin",
                        invited_by_user as "invitedByUser",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.master_vendors
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await db.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Public master vendor not found');
                }

                return formatVendorRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching public master vendor:', error);
                throw new Error(`Failed to fetch public master vendor: ${error.message}`);
            }
        }
    },

    Mutation: {
        createPublicMasterVendor: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            try {
                // Validate vendor type
                if (input.vendorType) {
                    validateVendorType(input.vendorType);
                }

                // ID is required for public.master_vendors
                if (!input.id) {
                    throw new Error('ID is required for public master vendor');
                }

                const insertQuery = `
                    INSERT INTO public.master_vendors (
                        id,
                        aaded_by_company_id,
                        vendor_company_name,
                        website,
                        email,
                        name,
                        phone_number,
                        country_code,
                        vendor_type,
                        can_login,
                        invited_by_user
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING 
                        id,
                        aaded_by_company_id as "addedByCompanyId",
                        vendor_company_name as "vendorCompanyName",
                        website,
                        email,
                        name,
                        phone_number as "phoneNumber",
                        country_code as "countryCode",
                        vendor_type as "vendorType",
                        can_login as "canLogin",
                        invited_by_user as "invitedByUser",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await db.query(insertQuery, [
                    input.id,
                    input.addedByCompanyId || null,
                    input.vendorCompanyName || null,
                    input.website || null,
                    input.email || null,
                    input.name || null,
                    input.phoneNumber || null,
                    input.countryCode || null,
                    input.vendorType || null,
                    input.canLogin || false,
                    input.invitedByUser || null
                ]);

                return formatVendorRow(result.rows[0]);
            } catch (error) {
                console.error('Error creating public master vendor:', error);
                throw new Error(`Failed to create public master vendor: ${error.message}`);
            }
        },

        updatePublicMasterVendor: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            try {
                // Check if vendor exists
                const checkQuery = `
                    SELECT id
                    FROM public.master_vendors
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await db.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Public master vendor not found');
                }

                // Validate vendor type if being updated
                if (input.vendorType !== undefined) {
                    validateVendorType(input.vendorType);
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.addedByCompanyId !== undefined) {
                    updates.push(`aaded_by_company_id = $${paramCount}`);
                    values.push(input.addedByCompanyId || null);
                    paramCount++;
                }

                if (input.vendorCompanyName !== undefined) {
                    updates.push(`vendor_company_name = $${paramCount}`);
                    values.push(input.vendorCompanyName || null);
                    paramCount++;
                }

                if (input.website !== undefined) {
                    updates.push(`website = $${paramCount}`);
                    values.push(input.website || null);
                    paramCount++;
                }

                if (input.email !== undefined) {
                    updates.push(`email = $${paramCount}`);
                    values.push(input.email || null);
                    paramCount++;
                }

                if (input.name !== undefined) {
                    updates.push(`name = $${paramCount}`);
                    values.push(input.name || null);
                    paramCount++;
                }

                if (input.phoneNumber !== undefined) {
                    updates.push(`phone_number = $${paramCount}`);
                    values.push(input.phoneNumber || null);
                    paramCount++;
                }

                if (input.countryCode !== undefined) {
                    updates.push(`country_code = $${paramCount}`);
                    values.push(input.countryCode || null);
                    paramCount++;
                }

                if (input.vendorType !== undefined) {
                    updates.push(`vendor_type = $${paramCount}`);
                    values.push(input.vendorType || null);
                    paramCount++;
                }

                if (input.canLogin !== undefined) {
                    updates.push(`can_login = $${paramCount}`);
                    values.push(input.canLogin);
                    paramCount++;
                }

                if (input.invitedByUser !== undefined) {
                    updates.push(`invited_by_user = $${paramCount}`);
                    values.push(input.invitedByUser || null);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.master_vendors
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        aaded_by_company_id as "addedByCompanyId",
                        vendor_company_name as "vendorCompanyName",
                        website,
                        email,
                        name,
                        phone_number as "phoneNumber",
                        country_code as "countryCode",
                        vendor_type as "vendorType",
                        can_login as "canLogin",
                        invited_by_user as "invitedByUser",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                `;

                const result = await db.query(updateQuery, values);
                return formatVendorRow(result.rows[0]);
            } catch (error) {
                console.error('Error updating public master vendor:', error);
                throw new Error(`Failed to update public master vendor: ${error.message}`);
            }
        },

        deletePublicMasterVendor: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            try {
                // Check if vendor exists
                const checkQuery = `
                    SELECT id
                    FROM public.master_vendors
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await db.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Public master vendor not found');
                }

                // Soft delete
                const deleteQuery = `
                    UPDATE public.master_vendors
                    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `;
                await db.query(deleteQuery, [input.id]);

                return true;
            } catch (error) {
                console.error('Error deleting public master vendor:', error);
                throw new Error(`Failed to delete public master vendor: ${error.message}`);
            }
        }
    }
};

// Helper function to format vendor row
function formatVendorRow(row) {
    return {
        id: row.id,
        addedByCompanyId: row.addedByCompanyId,
        vendorCompanyName: row.vendorCompanyName,
        website: row.website,
        email: row.email,
        name: row.name,
        phoneNumber: row.phoneNumber,
        countryCode: row.countryCode,
        vendorType: row.vendorType,
        canLogin: row.canLogin,
        invitedByUser: row.invitedByUser,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
        deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
    };
}

module.exports = publicMasterVendorResolvers;

