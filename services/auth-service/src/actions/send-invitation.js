const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const db = require('../utils/db');
const { sendInvitationEmail } = require('../utils/email');

const sendInvitationSchema = Joi.object({
    input: Joi.object({
        email: Joi.string().email().required(),
        role: Joi.string().valid('owner', 'company_admin', 'team_member', 'partner_admin', 'vendor_user', 'vendor_owner', 'super_admin').optional(),
        companyId: Joi.string().uuid().optional(),
        belongsTo: Joi.string().uuid().optional() // Vendor ID for vendor-related users
    }).required()
});

/**
 * Send Invitation Handler
 * Sends email invitation to join company/partner
 */
async function sendInvitation(req, res) {
    try {
        // Validate input
        const { error, value } = sendInvitationSchema.validate(req.body);
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
        const inviterRole = decoded.role;
        const schema = decoded.schema;

        // Determine target company
        const targetCompanyId = input.companyId || inviterCompanyId;

        // Handle belongsTo (vendor ID) - validate vendor and auto-assign role
        let belongsTo = input.belongsTo || null;
        let finalRole = input.role;

        // Validate: belongsTo is MANDATORY when role is vendor_user or vendor_owner
        if (finalRole === 'vendor_user' || finalRole === 'vendor_owner') {
            if (!belongsTo) {
                return res.status(400).json({
                    message: 'belongsTo (vendor ID) is required when inviting vendor_user or vendor_owner role'
                });
            }

            // Vendor users can only be created in tenant schemas, not public schema
            if (schema === 'public') {
                return res.status(400).json({
                    message: 'Vendor users can only be created in tenant schemas, not public schema'
                });
            }

            // Validate vendor exists
            const vendorCheck = await db.query(
                `SELECT id, name FROM ${schema}.vendors WHERE id = $1 AND deleted_at IS NULL`,
                [belongsTo]
            );

            if (vendorCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Vendor not found' });
            }
        }

        // If belongsTo is provided but role wasn't vendor_user/vendor_owner, validate and assign role
        if (belongsTo && finalRole !== 'vendor_user' && finalRole !== 'vendor_owner') {
            // Validate vendor exists in the tenant schema
            if (schema === 'public') {
                return res.status(400).json({
                    message: 'Vendor users can only be created in tenant schemas, not public schema'
                });
            }

            const vendorCheck = await db.query(
                `SELECT id, name FROM ${schema}.vendors WHERE id = $1 AND deleted_at IS NULL`,
                [belongsTo]
            );

            if (vendorCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Vendor not found' });
            }

            // Auto-assign vendor_user role if role is not explicitly set
            if (!finalRole) {
                finalRole = 'vendor_user';
            } else if (finalRole !== 'vendor_owner' && finalRole !== 'vendor_user') {
                // If role is set but not vendor-related, override to vendor_user when belongsTo is provided
                finalRole = 'vendor_user';
            }
        } else if (!belongsTo) {
            // belongsTo not provided - ensure role is set and not vendor-related
            if (!finalRole) {
                return res.status(400).json({ message: 'Role is required' });
            }
            // Note: vendor_user and vendor_owner already checked above and would have returned error
        }

        // Validate final role is valid
        const validRoles = ['owner', 'company_admin', 'team_member', 'partner_admin', 'vendor_user', 'vendor_owner', 'super_admin'];
        if (!validRoles.includes(finalRole)) {
            return res.status(400).json({ message: `Invalid role: ${finalRole}` });
        }

        // Check if this is a super admin invitation
        const isSuperAdminInvitation = inviterRole === 'super_admin' || finalRole === 'super_admin';

        // Check User Subscription Limits (skip for super admin invitations)
        if (!isSuperAdminInvitation) {
            // Get current user count from tenant schema users table
            const userCountQuery = `SELECT COUNT(*) as count FROM ${schema}.users WHERE deleted_at IS NULL AND active = true`;
            const userCountResult = await db.query(userCountQuery);
            const currentUserCount = parseInt(userCountResult.rows[0].count);

            // Get the company's active plan and limits
            const planQuery = `
                SELECT p.limits
                FROM company_plans cp
                JOIN plans p ON cp.plan_id = p.id
                WHERE cp.company_id = $1 
                AND cp.status IN ('active', 'trialing', 'past_due')
                ORDER BY cp.created_at DESC
                LIMIT 1
            `;
            const planResult = await db.query(planQuery, [targetCompanyId]);

            if (planResult.rows.length > 0) {
                const limits = planResult.rows[0].limits;
                const userLimit = limits?.users;

                if (userLimit !== null && userLimit !== undefined && userLimit !== -1) {
                    if (currentUserCount >= userLimit) {
                        return res.status(403).json({
                            message: `User limit reached (${currentUserCount}/${userLimit}). Please upgrade your plan to invite more users.`
                        });
                    }
                }
            }
        }

        // Check if email already exists
        let emailExists = false;

        // Check public schema (always check for all invitations)
        const publicCheck = await db.query(
            'SELECT id FROM public.users WHERE email = $1',
            [input.email]
        );

        if (publicCheck.rows.length > 0) {
            emailExists = true;
        }

        // Check tenant schema if applicable (skip for super admin invitations)
        if (!emailExists && !isSuperAdminInvitation && schema !== 'public') {
            try {
                const tenantCheck = await db.query(
                    `SELECT id FROM ${schema}.users WHERE email = $1`,
                    [input.email]
                );
                if (tenantCheck.rows.length > 0) {
                    emailExists = true;
                }
            } catch (err) {
            }
        }

        if (emailExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if trying to invite as 'owner' - only one owner allowed per company
        // Skip this check for super admin invitations without a company
        if (finalRole === 'owner' && !isSuperAdminInvitation && targetCompanyId) {
            // Check if there's already an owner in this company
            const existingOwnerQuery = schema === 'public'
                ? `SELECT id FROM public.users 
                   WHERE role = 'owner' 
                   AND company_id = $1 
                   AND deleted_at IS NULL 
                   AND active = true`
                : `SELECT id FROM ${schema}.users 
                   WHERE role = 'owner' 
                   AND deleted_at IS NULL 
                   AND active = true`;

            const existingOwnerParams = schema === 'public'
                ? [targetCompanyId]
                : [];

            const existingOwnerResult = await db.query(existingOwnerQuery, existingOwnerParams);

            if (existingOwnerResult.rows.length > 0) {
                return res.status(400).json({
                    message: 'A company can only have one owner. There is already an owner in this company.',
                });
            }

            // Also check if there's a pending invitation with 'owner' role
            const existingOwnerInvitationQuery = schema === 'public'
                ? `SELECT id FROM public.user_invitations 
                   WHERE company_id = $1 
                   AND role = 'owner' 
                   AND status = 'pending' 
                   AND expires_at > NOW()`
                : `SELECT id FROM ${schema}.user_invitations 
                   WHERE role = 'owner' 
                   AND status = 'pending' 
                   AND expires_at > NOW()`;

            const existingOwnerInvitationParams = schema === 'public'
                ? [targetCompanyId]
                : [];

            const existingOwnerInvitationResult = await db.query(existingOwnerInvitationQuery, existingOwnerInvitationParams);

            if (existingOwnerInvitationResult.rows.length > 0) {
                return res.status(400).json({
                    message: 'A company can only have one owner. There is already a pending invitation for an owner role.',
                });
            }
        }

        // Check if pending invitation already exists for this email
        // For super admin invitations, always check public.user_invitations
        // For company invitations, check both public and tenant schema

        if (isSuperAdminInvitation) {
            // Super admin invitations: only check public.user_invitations
            console.log('[sendInvitation] Checking for existing super admin invitation in public.user_invitations');
            const existingPublicInvitation = await db.query(
                `SELECT id FROM public.user_invitations 
                 WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
                [input.email]
            );
            console.log('[sendInvitation] Existing super admin invitation check result:', existingPublicInvitation.rows.length, 'pending invitations');

            if (existingPublicInvitation.rows.length > 0) {
                console.log('[sendInvitation] Pending super admin invitation found, returning error');
                return res.status(400).json({
                    message: 'A pending invitation already exists for this email'
                });
            }
        } else {
            // Company invitations: check public schema invitations
            const existingPublicInvitation = await db.query(
                `SELECT id FROM public.user_invitations 
                 WHERE email = $1 AND company_id = $2 AND status = 'pending' AND expires_at > NOW()`,
                [input.email, targetCompanyId]
            );

            if (existingPublicInvitation.rows.length > 0) {
                return res.status(400).json({
                    message: 'A pending invitation already exists for this email'
                });
            }

            // Check tenant schema invitations (if applicable)
            if (schema !== 'public') {
                try {
                    const existingTenantInvitation = await db.query(
                        `SELECT id FROM ${schema}.user_invitations 
                         WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
                        [input.email]
                    );

                    if (existingTenantInvitation.rows.length > 0) {
                        return res.status(400).json({
                            message: 'A pending invitation already exists for this email'
                        });
                    }
                } catch (err) {
                }
            }
        }

        // Get inviter details
        // For super admin invitations, always query from public.users
        const inviterQuery = (isSuperAdminInvitation || schema === 'public')
            ? 'SELECT first_name, last_name FROM public.users WHERE id = $1'
            : `SELECT first_name, last_name FROM ${schema}.users WHERE id = $1`;

        const inviterResult = await db.query(inviterQuery, [inviterId]);

        if (inviterResult.rows.length === 0) {
            return res.status(404).json({ message: 'Inviter not found' });
        }

        const inviter = inviterResult.rows[0];
        const inviterName = `${inviter.first_name} ${inviter.last_name}`;

        // Get company details (optional for super admin invitations)
        let company = null;
        let companyName = 'Critical Asset Management';

        if (targetCompanyId) {
            const companyResult = await db.query(
                'SELECT id, name FROM companies WHERE id = $1',
                [targetCompanyId]
            );

            if (companyResult.rows.length === 0) {
                return res.status(404).json({ message: 'Company not found' });
            }

            company = companyResult.rows[0];
            companyName = company.name;
        } else if (!isSuperAdminInvitation) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        // Generate invitation token
        const token = uuidv4();

        // Store invitation
        // For super admin invitations, always use public.user_invitations
        // For company invitations, use schema-based logic
        // Note: public.user_invitations does not have belongs_to column, only tenant schemas do
        const usePublicSchema = isSuperAdminInvitation || schema === 'public';

        const invitationQuery = usePublicSchema
            ? `INSERT INTO public.user_invitations (email, invited_by, company_id, role, token, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
         RETURNING id, email, role, status, expires_at`
            : `INSERT INTO ${schema}.user_invitations (email, invited_by, role, token, expires_at, belongs_to)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', $5)
         RETURNING id, email, role, status, expires_at, belongs_to`;

        // For super admin invitations, company_id can be null
        // belongs_to is only for tenant schemas (vendor users)
        const invitationParams = usePublicSchema
            ? [input.email, inviterId, targetCompanyId || null, finalRole, token]
            : [input.email, inviterId, finalRole, token, belongsTo];

        const invitationResult = await db.query(invitationQuery, invitationParams);

        if (invitationResult.rows.length === 0) {
            return res.status(500).json({ message: 'Failed to create invitation' });
        }

        const invitation = invitationResult.rows[0];

        // Send invitation email
        try {
            await sendInvitationEmail(
                input.email,
                inviterName,
                companyName,
                token,
                finalRole
            );
        } catch (emailError) {
            console.error('[sendInvitation] Error sending invitation email:', emailError);
            // Don't fail the request if email fails, invitation is already created
        }

        res.json({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expires_at,
            belongsTo: invitation.belongs_to || null // Only present for tenant schema invitations
        });


    } catch (error) {
        res.status(500).json({ message: 'Failed to send invitation', error: error.message });
    }
}

module.exports = sendInvitation;
