const Joi = require("joi");
const db = require("../utils/db");

const updateCompanyUserSchema = Joi.object({
  input: Joi.object({
    userId: Joi.string().uuid().required(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    role: Joi.string()
      .valid("owner", "company_admin", "team_member", "partner_admin", "vendor_user", "vendor_owner", "super_admin")
      .optional(),
    active: Joi.boolean().optional(),
  }).required(),
});

/**
 * Update Company User Handler
 * Updates user details (firstName, lastName, role, active status)
 * Permissions: Only company_admin, partner_admin, or super_admin can update users
 */
async function updateCompanyUser(req, res) {
  const client = await db.getClient();

  try {
    // Validate input
    const { error, value } = updateCompanyUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { input } = value;
    const userId = req.user?.userId;
    const userCompanyId = req.user?.companyId;
    const userRole = req.user?.role;
    const userSchema = req.user?.schema || "public";

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check permissions - only admins can update users
    const allowedRoles = ["owner", "company_admin", "partner_admin", "super_admin"];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Only administrators can update users",
      });
    }

    await client.query("BEGIN");

    // Determine which schema the target user/invitation is in
    // The ID could be either a user ID or an invitation ID (from companyUsers query)
    // Optimize: Check user's current schema first (most likely location)
    let targetUser = null;
    let targetInvitation = null;
    let targetSchema = "public";
    let targetCompanyId = null;
    let isInvitation = false;

    // Strategy: Check user's current schema first, then public, then all tenant schemas
    // This matches the companyUsers query logic which shows users/invitations for the current company
    
    // 1. Check user's current schema first (most likely location)
    if (userSchema && userSchema !== "public") {
      try {
        // Check for user in current schema
        const currentSchemaUserResult = await client.query(
          `SELECT id, email, first_name, last_name, role, active 
           FROM ${userSchema}.users WHERE id = $1 AND deleted_at IS NULL`,
          [input.userId]
        );

        if (currentSchemaUserResult.rows.length > 0) {
          targetUser = currentSchemaUserResult.rows[0];
          targetSchema = userSchema;
          targetCompanyId = userCompanyId;
        } else {
          // Check for invitation in current schema (check all statuses, not just pending)
          const currentSchemaInvitationResult = await client.query(
            `SELECT id, email, role, status, expires_at
             FROM ${userSchema}.user_invitations 
             WHERE id = $1`,
            [input.userId]
          );

          if (currentSchemaInvitationResult.rows.length > 0) {
            const invitation = currentSchemaInvitationResult.rows[0];
            // Only allow updates to pending invitations
            if (invitation.status === 'pending' && new Date(invitation.expires_at) > new Date()) {
              targetInvitation = invitation;
              targetSchema = userSchema;
              targetCompanyId = userCompanyId;
              isInvitation = true;
            }
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
        [input.userId]
      );

      if (publicUserResult.rows.length > 0) {
        targetUser = publicUserResult.rows[0];
        targetSchema = "public";
        targetCompanyId = targetUser.company_id;
      } else {
        // Check public invitations (check all statuses, not just pending)
        const publicInvitationResult = await client.query(
          `SELECT id, email, role, status, company_id, expires_at
           FROM public.user_invitations 
           WHERE id = $1`,
          [input.userId]
        );

        if (publicInvitationResult.rows.length > 0) {
          const invitation = publicInvitationResult.rows[0];
          // Only allow updates to pending invitations
          if (invitation.status === 'pending' && new Date(invitation.expires_at) > new Date()) {
            targetInvitation = invitation;
            targetSchema = "public";
            targetCompanyId = invitation.company_id;
            isInvitation = true;
          }
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
            [input.userId]
          );

          if (tenantUserResult.rows.length > 0) {
            targetUser = tenantUserResult.rows[0];
            targetSchema = row.schema_name;
            targetCompanyId = row.id;
            break;
          }

          // Check for invitation (check all statuses, not just pending)
          const tenantInvitationResult = await client.query(
            `SELECT id, email, role, status, expires_at
             FROM ${row.schema_name}.user_invitations 
             WHERE id = $1`,
            [input.userId]
          );

          if (tenantInvitationResult.rows.length > 0) {
            const invitation = tenantInvitationResult.rows[0];
            // Only allow updates to pending invitations
            if (invitation.status === 'pending' && new Date(invitation.expires_at) > new Date()) {
              targetInvitation = invitation;
              targetSchema = row.schema_name;
              targetCompanyId = row.id;
              isInvitation = true;
              break;
            }
          }
        } catch (err) {
          // Schema might not exist, continue
          continue;
        }
      }
    }

    if (!targetUser && !targetInvitation) {
      // Check if invitation exists but is expired or already accepted
      let invitationStatus = null;
      let invitationExpired = false;
      
      // Quick check in public schema
      const checkInvitation = await client.query(
        `SELECT status, expires_at FROM public.user_invitations WHERE id = $1`,
        [input.userId]
      );
      
      if (checkInvitation.rows.length > 0) {
        invitationStatus = checkInvitation.rows[0].status;
        invitationExpired = new Date(checkInvitation.rows[0].expires_at) <= new Date();
      }
      
      await client.query("ROLLBACK");
      
      let errorMessage = "User or invitation not found";
      if (invitationStatus) {
        if (invitationStatus === 'accepted') {
          errorMessage = "This invitation has already been accepted. Please use the user ID instead.";
        } else if (invitationExpired) {
          errorMessage = "This invitation has expired and can no longer be updated.";
        } else if (invitationStatus === 'cancelled') {
          errorMessage = "This invitation has been cancelled and can no longer be updated.";
        }
      }
      
      console.error("User/Invitation not found:", {
        userId: input.userId,
        userSchema: userSchema,
        userCompanyId: userCompanyId,
        userRole: userRole,
        invitationStatus: invitationStatus,
        invitationExpired: invitationExpired
      });
      
      return res.status(404).json({ 
        message: errorMessage,
        details: invitationStatus ? 
          `Invitation status: ${invitationStatus}${invitationExpired ? ' (expired)' : ''}` :
          "The provided ID does not exist as a user or invitation in any accessible schema"
      });
    }

    // Permission checks:
    // - Super admin can update anyone
    // - Partner admin can only update users in their company (public schema)
    // - Owner and company admin can only update users in their tenant schema
    if (userRole !== "super_admin") {
      if (userRole === "partner_admin") {
        // Partner admin can only update users in public schema with same company
        if (targetSchema !== "public" || targetCompanyId !== userCompanyId) {
          await client.query("ROLLBACK");
          return res.status(403).json({
            message: "You can only update users in your company",
          });
        }
      } else if (userRole === "owner" || userRole === "company_admin") {
        // Owner and company admin can only update users in their tenant schema
        if (targetSchema !== userSchema) {
          await client.query("ROLLBACK");
          return res.status(403).json({
            message: "You can only update users in your company",
          });
        }
      }
    }

    // Prevent users from updating themselves to inactive or changing their own role
    // (Only applies to actual users, not invitations)
    if (!isInvitation && input.userId === userId) {
      if (input.active === false) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "You cannot deactivate yourself",
        });
      }
      if (input.role && input.role !== userRole) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "You cannot change your own role",
        });
      }
    }

    // Check if trying to set role to 'owner' - only one owner allowed per company
    if (input.role === 'owner') {
      // Check if there's already an owner in this company (excluding the current user being updated)
      const existingOwnerQuery = targetSchema === 'public'
        ? `SELECT id FROM users 
           WHERE role = 'owner' 
           AND company_id = $1 
           AND deleted_at IS NULL 
           AND active = true
           AND id != $2`
        : `SELECT id FROM ${targetSchema}.users 
           WHERE role = 'owner' 
           AND deleted_at IS NULL 
           AND active = true
           AND id != $2`;
      
      const existingOwnerParams = targetSchema === 'public' 
        ? [targetCompanyId, input.userId]
        : [input.userId];
      
      const existingOwnerResult = await client.query(existingOwnerQuery, existingOwnerParams);
      
      if (existingOwnerResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "A company can only have one owner. There is already an owner in this company.",
        });
      }
    }

    let result;

    if (isInvitation) {
      // Update invitation
      const invitationUpdates = [];
      const invitationParams = [input.userId];
      let paramCount = 2;

      // For invitations, we can only update role (firstName/lastName/active don't apply)
      if (input.role !== undefined) {
        invitationUpdates.push(`role = $${paramCount++}`);
        invitationParams.push(input.role);
      }

      if (invitationUpdates.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "No fields to update. For invitations, only role can be updated." });
      }

      invitationUpdates.push(`updated_at = NOW()`);

      const updateInvitationQuery = `
        UPDATE ${targetSchema}.user_invitations 
        SET ${invitationUpdates.join(", ")}
        WHERE id = $1
        RETURNING id, email, role, status, expires_at as "expiresAt", 
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      const invitationResult = await client.query(updateInvitationQuery, invitationParams);
      const invitation = invitationResult.rows[0];

      await client.query("COMMIT");

      // Return invitation data in user-like format for consistency
      return res.json({
        id: invitation.id,
        email: invitation.email,
        firstName: null,
        lastName: null,
        role: invitation.role,
        active: true, // Invitations are always considered "active" in companyUsers
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
        deletedAt: null,
      });
    } else {
      // Update user
      const updates = [];
      const params = [input.userId];
      let paramCount = 2;

      if (input.firstName !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        params.push(input.firstName);
      }
      if (input.lastName !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        params.push(input.lastName);
      }
      if (input.role !== undefined) {
        updates.push(`role = $${paramCount++}`);
        params.push(input.role);
      }
      if (input.active !== undefined) {
        updates.push(`active = $${paramCount++}`);
        params.push(input.active);
      }

      if (updates.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "No fields to update" });
      }

      updates.push(`updated_at = NOW()`);

      const updateQuery = `
              UPDATE ${targetSchema}.users 
              SET ${updates.join(", ")}
              WHERE id = $1
              RETURNING id, email, first_name as "firstName", last_name as "lastName", 
                        role, active, created_at as "createdAt", updated_at as "updatedAt",
                        deleted_at as "deletedAt"
          `;

      result = await client.query(updateQuery, params);

      // Handle user_invitations: Cancel pending invitations if user is being deactivated
      // This ensures consistency with companyUsers query which shows pending invitations
      if (input.active === false && targetUser.email) {
        // Cancel pending invitations in tenant schema (if user is in tenant schema)
        if (targetSchema !== "public") {
          await client.query(
            `UPDATE ${targetSchema}.user_invitations 
             SET status = 'cancelled', updated_at = NOW()
             WHERE email = $1 AND status = 'pending' AND expires_at > NOW()`,
            [targetUser.email]
          );
        }

        // Cancel pending invitations in public schema for this user's email
        // Match by email and company_id to ensure we only cancel relevant invitations
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

    await client.query("COMMIT");

    res.json({
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].firstName,
      lastName: result.rows[0].lastName,
      role: result.rows[0].role,
      active: result.rows[0].active,
      createdAt: result.rows[0].createdAt,
      updatedAt: result.rows[0].updatedAt,
      deletedAt: result.rows[0].deletedAt,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update company user error:", error);
    res.status(500).json({ message: "Failed to update company user" });
  } finally {
    client.release();
  }
}

module.exports = updateCompanyUser;
