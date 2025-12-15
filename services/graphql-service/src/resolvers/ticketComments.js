const db = require('../utils/db');

const ticketCommentResolvers = {
    Query: {
        ticketComments: async (parent, { ticket_id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                // First check if the ticket exists and user has access to it
                let ticketQuery = `
                    SELECT * FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const ticketParams = [ticket_id];

                // Add company_id filter if user is not super_admin
                if (context.user.role !== 'super_admin') {
                    ticketQuery += ` AND company_id = $2`;
                    ticketParams.push(context.user.companyId);
                }

                const ticketResult = await db.query(ticketQuery, ticketParams);
                if (ticketResult.rows.length === 0) {
                    throw new Error('Ticket not found or access denied');
                }

                // Fetch all comments for this ticket
                const query = `
                    SELECT * FROM ticket_comments 
                    WHERE ticket_id = $1 AND deleted_at IS NULL
                    ORDER BY created_at ASC
                `;

                const result = await db.query(query, [ticket_id]);
                return result.rows;
            } catch (error) {
                console.error('Error fetching ticket comments:', error);
                throw new Error('Failed to fetch ticket comments: ' + error.message);
            }
        },

        ticketComment: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                // Fetch the comment
                const commentQuery = `
                    SELECT * FROM ticket_comments 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const commentResult = await db.query(commentQuery, [id]);

                if (commentResult.rows.length === 0) {
                    return null;
                }

                const comment = commentResult.rows[0];

                // Check if user has access to the parent ticket
                let ticketQuery = `
                    SELECT * FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const ticketParams = [comment.ticket_id];

                if (context.user.role !== 'super_admin') {
                    ticketQuery += ` AND company_id = $2`;
                    ticketParams.push(context.user.companyId);
                }

                const ticketResult = await db.query(ticketQuery, ticketParams);
                if (ticketResult.rows.length === 0) {
                    throw new Error('Access denied');
                }

                return comment;
            } catch (error) {
                console.error('Error fetching ticket comment:', error);
                throw new Error('Failed to fetch ticket comment: ' + error.message);
            }
        }
    },

    Mutation: {
        createTicketComment: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { ticket_id, comment } = input;

                // Validate required fields
                if (!comment || comment.trim().length === 0) {
                    throw new Error('Comment text is required');
                }

                // Check if ticket exists and user has access
                let ticketQuery = `
                    SELECT * FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const ticketParams = [ticket_id];

                if (context.user.role !== 'super_admin') {
                    ticketQuery += ` AND company_id = $2`;
                    ticketParams.push(context.user.companyId);
                }

                const ticketResult = await db.query(ticketQuery, ticketParams);
                if (ticketResult.rows.length === 0) {
                    throw new Error('Ticket not found or access denied');
                }

                // Fetch user details from the appropriate schema
                const userSchema = context.user.schema || 'public';
                const schemaPrefix = userSchema === 'public' ? 'public' : userSchema;

                const userQuery = `
                    SELECT id, email, first_name, last_name
                    FROM ${schemaPrefix}.users 
                    WHERE id = $1
                `;
                const userResult = await db.query(userQuery, [context.user.userId]);

                if (userResult.rows.length === 0) {
                    throw new Error('User not found');
                }

                const user = userResult.rows[0];
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

                // Determine user_schema value (null for public, schema name for tenant)
                const userSchemaValue = (context.user.role === 'super_admin' || context.user.role === 'partner_admin')
                    ? null
                    : context.schema;

                // Insert the comment
                const insertQuery = `
                    INSERT INTO ticket_comments (
                        ticket_id,
                        user_id,
                        user_schema,
                        user_name,
                        user_email,
                        comment
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;

                const params = [
                    ticket_id,
                    context.user.userId,
                    userSchemaValue,
                    userName,
                    user.email,
                    comment.trim()
                ];

                const result = await db.query(insertQuery, params);
                return result.rows[0];
            } catch (error) {
                console.error('Error creating ticket comment:', error);
                throw new Error('Failed to create ticket comment: ' + error.message);
            }
        },

        updateTicketComment: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id, comment } = input;

                // Validate required fields
                if (!comment || comment.trim().length === 0) {
                    throw new Error('Comment text is required');
                }

                // Check if comment exists and belongs to current user
                const checkQuery = `
                    SELECT * FROM ticket_comments 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    throw new Error('Comment not found');
                }

                const existingComment = checkResult.rows[0];

                // Only allow user to update their own comment
                if (existingComment.user_id !== context.user.userId) {
                    throw new Error('Not authorized to update this comment');
                }

                // Update the comment
                const updateQuery = `
                    UPDATE ticket_comments 
                    SET comment = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING *
                `;

                const result = await db.query(updateQuery, [comment.trim(), id]);
                return result.rows[0];
            } catch (error) {
                console.error('Error updating ticket comment:', error);
                throw new Error('Failed to update ticket comment: ' + error.message);
            }
        },

        deleteTicketComment: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id } = input;

                // Check if comment exists
                const checkQuery = `
                    SELECT * FROM ticket_comments 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await db.query(checkQuery, [id]);

                if (checkResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'Comment not found'
                    };
                }

                const existingComment = checkResult.rows[0];

                // Only allow user to delete their own comment OR super_admin can delete any comment
                if (existingComment.user_id !== context.user.userId && context.user.role !== 'super_admin') {
                    return {
                        success: false,
                        message: 'Not authorized to delete this comment'
                    };
                }

                // Soft delete the comment
                const deleteQuery = `
                    UPDATE ticket_comments 
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = $1
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [id]);

                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0
                        ? 'Comment deleted successfully'
                        : 'Failed to delete comment'
                };
            } catch (error) {
                console.error('Error deleting ticket comment:', error);
                return {
                    success: false,
                    message: 'Failed to delete ticket comment: ' + error.message
                };
            }
        }
    }
};

module.exports = ticketCommentResolvers;
