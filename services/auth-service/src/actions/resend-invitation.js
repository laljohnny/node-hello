const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../utils/db');
const { sendInvitationEmail } = require('../utils/email');

const resendInvitationSchema = Joi.object({
    input: Joi.object({
        email: Joi.string().email().required(),
        role: Joi.string().valid('owner', 'company_admin', 'team_member', 'partner_admin', 'vendor_user', 'vendor_owner', 'super_admin').required()
    }).required()
});

/**
 * Resend Invitation Handler
 * Updates existing invitation with new token and resends email
 */
async function resendInvitation(req, res) {
    try {
        // Validate input
        const { error, value } = resendInvitationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { input } = value;

        // Extract user from JWT
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const jwtToken = authHeader.split(' ')[1];
        const { verifyToken } = require('../utils/jwt');

        let decoded;
        try {
            decoded = verifyToken(jwtToken);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const inviterId = decoded.userId;
        const inviterCompanyId = decoded.companyId;
        const schema = decoded.schema || 'public';

        // Check if invitation exists
        let invitation = null;
        let invitationSchema = null;

        // Check public schema first
        const publicCheck = await db.query(
            'SELECT id, email, role, company_id, invited_by, token FROM user_invitations WHERE email = $1',
            [input.email]
        );

        if (publicCheck.rows.length > 0) {
            invitation = publicCheck.rows[0];
            invitationSchema = 'public';
        }

        // Check tenant schema if not found in public
        if (!invitation && schema !== 'public') {
            try {
                const tenantCheck = await db.query(
                    `SELECT id, email, role, invited_by, token FROM ${schema}.user_invitations WHERE email = $1`,
                    [input.email]
                );
                if (tenantCheck.rows.length > 0) {
                    invitation = tenantCheck.rows[0];
                    invitationSchema = schema;
                }
            } catch (err) {
                console.error('Error checking tenant schema:', err);
            }
        }

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found for this email' });
        }

        // Get inviter details
        const inviterQuery = schema === 'public'
            ? 'SELECT first_name, last_name FROM users WHERE id = $1'
            : `SELECT first_name, last_name FROM ${schema}.users WHERE id = $1`;

        const inviterResult = await db.query(inviterQuery, [inviterId]);
        const inviter = inviterResult.rows[0];
        const inviterName = `${inviter.first_name} ${inviter.last_name}`;

        // Get company details
        const targetCompanyId = invitation.company_id || inviterCompanyId;
        const companyResult = await db.query(
            'SELECT id, name FROM companies WHERE id = $1',
            [targetCompanyId]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const company = companyResult.rows[0];

        // Generate new token
        const newToken = uuidv4();

        // Delete the old invitation record
        const deleteQuery = invitationSchema === 'public'
            ? `DELETE FROM user_invitations WHERE email = $1`
            : `DELETE FROM ${invitationSchema}.user_invitations WHERE email = $1`;

        await db.query(deleteQuery, [input.email]);

        // Insert new invitation with new token
        const insertQuery = invitationSchema === 'public'
            ? `INSERT INTO user_invitations (email, invited_by, company_id, role, token, status, expires_at, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '7 days', NOW(), NOW())
               RETURNING id, email, role, status, expires_at, token`
            : `INSERT INTO ${invitationSchema}.user_invitations (email, invited_by, role, token, status, expires_at, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 'pending', NOW() + INTERVAL '7 days', NOW(), NOW())
               RETURNING id, email, role, status, expires_at, token`;

        const insertParams = invitationSchema === 'public'
            ? [input.email, inviterId, targetCompanyId, input.role, newToken]
            : [input.email, inviterId, input.role, newToken];

        const insertResult = await db.query(insertQuery, insertParams);
        const updatedInvitation = insertResult.rows[0];

        // Send invitation email
        await sendInvitationEmail(
            input.email,
            inviterName,
            company.name,
            updatedInvitation.token,
            updatedInvitation.role
        );

        res.json({
            id: updatedInvitation.id,
            email: updatedInvitation.email,
            role: updatedInvitation.role,
            status: updatedInvitation.status,
            expiresAt: updatedInvitation.expires_at
        });

    } catch (error) {
        console.error('Resend invitation error:', error);
        res.status(500).json({ message: 'Failed to resend invitation', error: error.message });
    }
}

module.exports = resendInvitation;
