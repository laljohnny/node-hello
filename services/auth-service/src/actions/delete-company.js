const Joi = require('joi');
const db = require('../utils/db');

const deleteCompanySchema = Joi.object({
    id: Joi.string().uuid().required()
});

/**
 * Delete Company Handler
 * Soft deletes a company (sets deleted_at)
 * Permissions: Superadmin can delete any company, others can only delete companies where they are parent
 * Cannot delete if company has active child companies
 */
async function deleteCompany(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = deleteCompanySchema.validate(req.params);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { id } = value;
        const userId = req.user?.userId;
        const userCompanyId = req.user?.companyId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        await client.query('BEGIN');

        // Get the company to delete
        const companyResult = await client.query(
            `SELECT id, parent_company FROM companies WHERE id = $1 AND deleted_at IS NULL`,
            [id]
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
                    message: 'You can only delete companies where your company is the parent'
                });
            }
        }

        // Check if company has active child companies
        const childrenResult = await client.query(
            `SELECT COUNT(*) as count FROM companies 
             WHERE parent_company = $1 AND deleted_at IS NULL`,
            [id]
        );

        if (parseInt(childrenResult.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                message: 'Cannot delete company with active child companies'
            });
        }

        // Get company schema to soft delete users
        const companySchemaResult = await client.query(
            `SELECT schema_name FROM companies WHERE id = $1`,
            [id]
        );

        const companySchema = companySchemaResult.rows[0]?.schema_name;

        // Soft delete all users in the company's tenant schema (if it exists)
        if (companySchema && companySchema !== 'public') {
            await client.query(
                `UPDATE ${companySchema}.users 
                 SET deleted_at = NOW(), active = false 
                 WHERE deleted_at IS NULL`
            );
        }

        // Also soft delete users in public.users table for this company (partners/superadmins)
        await client.query(
            `UPDATE public.users 
             SET deleted_at = NOW(), active = false 
             WHERE company_id = $1 AND deleted_at IS NULL`,
            [id]
        );

        // Soft delete the company
        await client.query(
            `UPDATE companies SET deleted_at = NOW() WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');

        res.json({ success: true });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete company error:', error);
        res.status(500).json({ message: 'Failed to delete company' });
    } finally {
        client.release();
    }
}

module.exports = deleteCompany;
