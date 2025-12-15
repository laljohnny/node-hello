const Joi = require('joi');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const switchCompanyContextSchema = Joi.object({
    input: Joi.object({
        companyId: Joi.string().uuid().required()
    }).required()
});

/**
 * Switch Company Context Handler
 * Allows partners/superadmins to switch between companies they have access to
 */
async function switchCompanyContext(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = switchCompanyContextSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;
        const userId = req.user?.userId;
        const currentRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Only partners and superadmins can switch company context
        if (!['partner_admin', 'partner_user', 'super_admin'].includes(currentRole)) {
            return res.status(403).json({
                message: 'Only partners and superadmins can switch company context'
            });
        }

        // Get the target company details
        const companyResult = await client.query(
            `SELECT id, name, schema_name, role, sub_domain 
             FROM companies 
             WHERE id = $1 AND deleted_at IS NULL`,
            [input.companyId]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const company = companyResult.rows[0];

        // Get user details from public.users (for partners/superadmins)
        const userResult = await client.query(
            `SELECT id, email, first_name, last_name, role 
             FROM public.users 
             WHERE id = $1 AND deleted_at IS NULL`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Verify user has permission to switch to this company
        // Superadmins can switch to any company
        // Partners can only switch to companies where their company is the parent
        if (currentRole !== 'super_admin') {
            const currentCompanyId = req.user?.companyId;

            if (!currentCompanyId) {
                return res.status(403).json({
                    message: 'No current company context'
                });
            }

            // Check if the target company has the current company as parent
            const parentCheckResult = await client.query(
                `SELECT id FROM companies 
                 WHERE id = $1 AND parent_company_id = $2 AND deleted_at IS NULL`,
                [input.companyId, currentCompanyId]
            );

            if (parentCheckResult.rows.length === 0) {
                return res.status(403).json({
                    message: 'You can only switch to companies where your company is the parent'
                });
            }
        }

        // Generate new tokens with the new company context
        const accessToken = generateAccessToken(user, company);
        const refreshToken = generateRefreshToken(user.id);

        // Store new refresh token in public.user_sessions
        // Delete old sessions and insert new one
        await client.query(
            `DELETE FROM public.user_sessions WHERE user_id = $1`,
            [user.id]
        );

        await client.query(
            `INSERT INTO public.user_sessions (user_id, refresh_token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
            [user.id, refreshToken]
        );

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
                schema: company.schema_name || 'public'
            }
        });

    } catch (error) {
        console.error('Switch company context error:', error);
        res.status(500).json({ message: 'Failed to switch company context' });
    } finally {
        client.release();
    }
}

module.exports = switchCompanyContext;
