const Joi = require('joi');
const db = require('../utils/db');

const deleteCompanyUserSchema = Joi.object({
    userId: Joi.string().uuid().required()
});

/**
 * Delete Company User Handler
 * Soft deletes a user (sets deleted_at and active = false)
 * Permissions: Only company_admin, partner_admin, or super_admin can delete users
 * Cannot delete yourself
 */
async function deleteCompanyUser(req, res) {
    const client = await db.getClient();

    try {
        // Validate input
        const { error, value } = deleteCompanyUserSchema.validate(req.params);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { userId: targetUserId } = value;
        const userId = req.user?.userId;
        const userCompanyId = req.user?.companyId;
        const userRole = req.user?.role;
        const userSchema = req.user?.schema || 'public';

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Prevent users from deleting themselves
        if (targetUserId === userId) {
            return res.status(400).json({
                message: 'You cannot delete yourself'
            });
        }

        // Check permissions - only admins can delete users
        const allowedRoles = ['owner', 'company_admin', 'partner_admin', 'super_admin'];
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: 'Only administrators can delete users'
            });
        }

        await client.query('BEGIN');

        // Determine which schema the target user/invitation is in
        // The ID could be either a user ID or an invitation ID (from companyUsers query)
        // Optimize: Check user's current schema first (most likely location)
        let targetUser = null;
        let targetInvitation = null;
        let targetSchema = 'public';
        let targetCompanyId = null;
        let isInvitation = false;

        // Strategy: Check user's current schema first, then public, then all tenant schemas
        // This matches the companyUsers query logic which shows users/invitations for the current company
        
        // 1. Check user's current schema first (most likely location)
        if (userSchema && userSchema !== 'public') {
            try {
                // Check for user in current schema
                const currentSchemaUserResult = await client.query(
                    `SELECT id, email, first_name, last_name, role, active 
                     FROM ${userSchema}.users WHERE id = $1 AND deleted_at IS NULL`,
                    [targetUserId]
                );

                if (currentSchemaUserResult.rows.length > 0) {
                    targetUser = currentSchemaUserResult.rows[0];
                    targetSchema = userSchema;
                    targetCompanyId = userCompanyId;
                } else {
                    // Check for invitation in current schema (check all statuses)
                    const currentSchemaInvitationResult = await client.query(
                        `SELECT id, email, role, status, expires_at
                         FROM ${userSchema}.user_invitations 
                         WHERE id = $1`,
                        [targetUserId]
                    );

                    if (currentSchemaInvitationResult.rows.length > 0) {
                        targetInvitation = currentSchemaInvitationResult.rows[0];
                        targetSchema = userSchema;
                        targetCompanyId = userCompanyId;
                        isInvitation = true;
                    }
                }
            } catch (err) {
                // Schema might not exist, continue to other checks
                console.error(`Error checking user schema ${userSchema}:`, err.message);
            }
        }

        // 2. If not found in user's schema, check public schema
        if (!targetUser && !targetInvitation) {
            // Check public users
            const publicUserResult = await client.query(
                `SELECT id, email, first_name, last_name, role, active, company_id 
                 FROM public.users WHERE id = $1 AND deleted_at IS NULL`,
                [targetUserId]
            );

            if (publicUserResult.rows.length > 0) {
                targetUser = publicUserResult.rows[0];
                targetSchema = 'public';
                targetCompanyId = targetUser.company_id;
            } else {
                // Check public invitations (check all statuses)
                const publicInvitationResult = await client.query(
                    `SELECT id, email, role, status, company_id, expires_at
                     FROM public.user_invitations 
                     WHERE id = $1`,
                    [targetUserId]
                );

                if (publicInvitationResult.rows.length > 0) {
                    targetInvitation = publicInvitationResult.rows[0];
                    targetSchema = 'public';
                    targetCompanyId = targetInvitation.company_id;
                    isInvitation = true;
                }
            }
        }

        // 3. If still not found, check all tenant schemas (fallback)
        if (!targetUser && !targetInvitation) {
            const schemasResult = await client.query(
                `SELECT schema_name, id FROM public.companies 
                 WHERE schema_status = 'active' AND schema_name IS NOT NULL AND deleted_at IS NULL
                 AND schema_name != $1`,
                [userSchema || '']
            );

            for (const row of schemasResult.rows) {
                try {
                    // Check for user
                    const tenantUserResult = await client.query(
                        `SELECT id, email, first_name, last_name, role, active 
                         FROM ${row.schema_name}.users WHERE id = $1 AND deleted_at IS NULL`,
                        [targetUserId]
                    );

                    if (tenantUserResult.rows.length > 0) {
                        targetUser = tenantUserResult.rows[0];
                        targetSchema = row.schema_name;
                        targetCompanyId = row.id;
                        break;
                    }

                    // Check for invitation (check all statuses)
                    const tenantInvitationResult = await client.query(
                        `SELECT id, email, role, status, expires_at
                         FROM ${row.schema_name}.user_invitations 
                         WHERE id = $1`,
                        [targetUserId]
                    );

                    if (tenantInvitationResult.rows.length > 0) {
                        targetInvitation = tenantInvitationResult.rows[0];
                        targetSchema = row.schema_name;
                        targetCompanyId = row.id;
                        isInvitation = true;
                        break;
                    }
                } catch (err) {
                    // Schema might not exist, continue
                    continue;
                }
            }
        }

        if (!targetUser && !targetInvitation) {
            await client.query('ROLLBACK');
            console.error('User/Invitation not found for deletion:', {
                userId: targetUserId,
                userSchema: userSchema,
                userCompanyId: userCompanyId,
                userRole: userRole
            });
            return res.status(404).json({ 
                message: 'User or invitation not found',
                details: 'The provided ID does not exist as a user or invitation in any accessible schema'
            });
        }

        // Permission checks:
        // - Super admin can delete anyone
        // - Partner admin can only delete users in their company (public schema)
        // - Company admin can only delete users in their tenant schema
        if (userRole !== 'super_admin') {
            if (userRole === 'partner_admin') {
                // Partner admin can only delete users in public schema with same company
                if (targetSchema !== 'public' || targetCompanyId !== userCompanyId) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({
                        message: 'You can only delete users in your company'
                    });
                }
            } else if (userRole === 'owner' || userRole === 'company_admin') {
                // Owner and company admin can only delete users in their tenant schema
                if (targetSchema !== userSchema) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({
                        message: 'You can only delete users in your company'
                    });
                }
            }
        }

        if (isInvitation) {
            // Delete/cancel invitation
            // Cancel the invitation (set status to cancelled)
            await client.query(
                `UPDATE ${targetSchema}.user_invitations 
                 SET status = 'cancelled', updated_at = NOW()
                 WHERE id = $1`,
                [targetUserId]
            );

            await client.query('COMMIT');
            return res.json({ success: true, message: 'Invitation cancelled successfully' });
        } else {
            // Prevent deleting the only owner in a company
            if (targetUser.role === 'owner') {
                // Check if this is the only owner
                const ownerCountQuery = targetSchema === 'public'
                    ? `SELECT COUNT(*) as count FROM users 
                       WHERE role = 'owner' 
                       AND company_id = $1 
                       AND deleted_at IS NULL 
                       AND active = true`
                    : `SELECT COUNT(*) as count FROM ${targetSchema}.users 
                       WHERE role = 'owner' 
                       AND deleted_at IS NULL 
                       AND active = true`;
                
                const ownerCountParams = targetSchema === 'public' 
                    ? [targetCompanyId]
                    : [];
                
                const ownerCountResult = await client.query(ownerCountQuery, ownerCountParams);
                const ownerCount = parseInt(ownerCountResult.rows[0].count);
                
                if (ownerCount <= 1) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        message: 'Cannot delete the only owner in a company. A company must have at least one owner.',
                    });
                }
            }

            // Soft delete the user
            await client.query(
                `UPDATE ${targetSchema}.users 
                 SET deleted_at = NOW(), active = false, updated_at = NOW()
                 WHERE id = $1`,
                [targetUserId]
            );

            // Cancel any pending invitations for this user's email
            // This ensures consistency with companyUsers query which shows pending invitations
            if (targetUser.email) {
                // Cancel pending invitations in tenant schema (if user is in tenant schema)
                if (targetSchema !== "public") {
                    await client.query(
                        `UPDATE ${targetSchema}.user_invitations 
                         SET status = 'cancelled', updated_at = NOW()
                         WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
                        [targetUser.email]
                    );
                }

                // Cancel pending invitations in public schema
                // For public schema users, cancel invitations for their company
                // For tenant schema users, also cancel any public invitations for their company
                if (targetCompanyId) {
                    await client.query(
                        `UPDATE public.user_invitations 
                         SET status = 'cancelled', updated_at = NOW()
                         WHERE email = $1 AND company_id = $2 AND status = 'pending' AND expires_at > NOW()`,
                        [targetUser.email, targetCompanyId]
                    );
                }
            }
        }

        await client.query('COMMIT');

        res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete company user error:', error);
        res.status(500).json({ message: 'Failed to delete company user' });
    } finally {
        client.release();
    }
}

module.exports = deleteCompanyUser;

