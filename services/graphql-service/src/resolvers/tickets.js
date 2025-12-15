const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const getUserById = async (db, userId, schema) => {
    if (!userId) return null;

    try {
        let query;
        let params = [userId];

        if (!schema || schema === 'public') {
            query = `
                SELECT id, first_name, last_name 
                FROM users 
                WHERE id = $1 AND deleted_at IS NULL
            `;
        } else {
            query = `
                SELECT id, first_name, last_name 
                FROM "${schema}".users 
                WHERE id = $1 AND deleted_at IS NULL
            `;
        }

        const result = await db.query(query, params);
        const user = result.rows[0];

        if (!user) return null;

        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim()
        };
    } catch (error) {
        console.error(`Error fetching user ${userId} from schema ${schema}:`, error);
        return null;
    }
};

const enrichTicket = async (ticket, db) => {
    const [assignedToUser, assignedByUser] = await Promise.all([
        getUserById(db, ticket.assigned_to, ticket.assigned_to_schema),
        getUserById(db, ticket.assigned_by, ticket.assigned_by_schema)
    ]);

    return {
        ...ticket,
        // Ensure non-nullable fields from schema have values
        status: ticket.status || 'open',
        short_code: ticket.short_code || 'CA-UNKNOWN',
        assigned_to: assignedToUser,
        assigned_by: assignedByUser
    };
};

const generateShortCode = async (client) => {
    // Use an advisory lock to prevent race conditions across concurrent requests
    await client.query('SELECT pg_advisory_xact_lock($1)', [777001]);

    const result = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(short_code FROM 'CA-([0-9]+)') AS INTEGER)), 0) AS max_num
        FROM tickets
        WHERE short_code LIKE 'CA-%'
    `);

    const nextNumber = Number(result.rows[0]?.max_num || 0) + 1;
    return `CA-${nextNumber}`;
};

const ticketResolvers = {
    Query: {
        tickets: async (parent, { status, category }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                let query = `
                    SELECT 
                        *,
                        COALESCE(status, 'open') as status
                    FROM tickets 
                    WHERE deleted_at IS NULL
                `;
                const params = [];
                let paramIndex = 1;

                // Add company_id filter if user is not super_admin
                if (context.user.role !== 'super_admin') {
                    query += ` AND company_id = $${paramIndex}`;
                    params.push(context.user.companyId);
                    paramIndex++;
                }

                // Add status filter if provided
                if (status) {
                    query += ` AND status = $${paramIndex}`;
                    params.push(status);
                    paramIndex++;
                }

                // Add category filter if provided
                if (category) {
                    query += ` AND category = $${paramIndex}`;
                    params.push(category);
                    paramIndex++;
                }

                query += ` ORDER BY created_at DESC`;

                const result = await db.query(query, params);

                // Enrich tickets with user details
                const enrichedTickets = await Promise.all(
                    result.rows.map(ticket => enrichTicket(ticket, db))
                );

                return enrichedTickets;
            } catch (error) {
                console.error('Error fetching tickets:', error);
                throw new Error('Failed to fetch tickets: ' + error.message);
            }
        },

        ticket: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                let query = `
                    SELECT 
                        *,
                        COALESCE(status, 'open') as status
                    FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const params = [id];

                // Add company_id filter if user is not super_admin
                if (context.user.role !== 'super_admin') {
                    query += ` AND company_id = $2`;
                    params.push(context.user.companyId);
                }

                const result = await db.query(query, params);
                const ticket = result.rows[0];

                if (!ticket) return null;

                return await enrichTicket(ticket, db);
            } catch (error) {
                console.error('Error fetching ticket:', error);
                throw new Error('Failed to fetch ticket: ' + error.message);
            }
        }
    },

    Mutation: {
        createTicket: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const {
                    parent_ticket,
                    title,
                    description,
                    priority = 'medium',
                    category,
                    sub_category,
                    estimated_time,
                    start_date,
                    end_date,
                    assigned_to
                } = input;

                // Validate required fields
                if (!title || !category) {
                    throw new Error('Title and category are required');
                }

                // Determine the schema for created_by
                // If user is super_admin or partner, they're in public.users (schema = null)
                // If user is company user, they're in tenant schema
                const createdBySchema = (context.user.role === 'super_admin' || context.user.role === 'partner_admin')
                    ? null
                    : context.schema;

                // assigned_to is typically null or a super_admin user (in public.users)
                const assignedToSchema = assigned_to ? null : null;
                const assignedBySchema = assigned_to ? createdBySchema : null;

                const client = await db.getClient();
                try {
                    await client.query('BEGIN');

                    const shortCode = await generateShortCode(client);

                    const query = `
                        INSERT INTO tickets (
                            short_code,
                            parent_ticket,
                            company_id,
                            created_by,
                            created_by_schema,
                            title,
                            description,
                            priority,
                            category,
                            sub_category,
                            status,
                            estimated_time,
                            start_date,
                            end_date,
                            assigned_to,
                            assigned_to_schema,
                            assigned_by,
                            assigned_by_schema,
                            assigned_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                        RETURNING *
                    `;

                    const params = [
                        shortCode,
                        parent_ticket || null,
                        context.user.companyId,
                        context.user.userId,
                        createdBySchema,
                        title,
                        description || null,
                        priority,
                        category,
                        sub_category || null,
                        'open',  // Default status for new tickets
                        estimated_time || null,
                        start_date || null,
                        end_date || null,
                        assigned_to || null,
                        assignedToSchema,
                        assigned_to ? context.user.userId : null,
                        assignedBySchema,
                        assigned_to ? new Date().toISOString() : null,
                    ];

                    const result = await client.query(query, params);
                    await client.query('COMMIT');
                    return await enrichTicket(result.rows[0], db);
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    // Ensure client is always released
                    client.release();
                }
            } catch (error) {
                console.error('Error creating ticket:', error);
                throw new Error('Failed to create ticket: ' + error.message);
            }
        },

        updateTicket: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id, ...updates } = input;

                // Check if ticket exists and user has access
                const checkQuery = `
                    SELECT * FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                    ${context.user.role !== 'super_admin' ? 'AND company_id = $2' : ''}
                `;
                const checkParams = context.user.role !== 'super_admin'
                    ? [id, context.user.companyId]
                    : [id];

                const checkResult = await db.query(checkQuery, checkParams);
                if (checkResult.rows.length === 0) {
                    throw new Error('Ticket not found or access denied');
                }

                const existingTicket = checkResult.rows[0];

                // Build dynamic update query
                const updateFields = [];
                const params = [id];
                let paramIndex = 2;

                if (updates.title !== undefined) {
                    updateFields.push(`title = $${paramIndex}`);
                    params.push(updates.title);
                    paramIndex++;
                }

                if (updates.description !== undefined) {
                    updateFields.push(`description = $${paramIndex}`);
                    params.push(updates.description);
                    paramIndex++;
                }

                if (updates.priority !== undefined) {
                    updateFields.push(`priority = $${paramIndex}`);
                    params.push(updates.priority);
                    paramIndex++;
                }

                if (updates.category !== undefined) {
                    updateFields.push(`category = $${paramIndex}`);
                    params.push(updates.category);
                    paramIndex++;
                }

                if (updates.sub_category !== undefined) {
                    updateFields.push(`sub_category = $${paramIndex}`);
                    params.push(updates.sub_category);
                    paramIndex++;
                }

                if (updates.status !== undefined) {
                    updateFields.push(`status = $${paramIndex}`);
                    params.push(updates.status);
                    paramIndex++;

                    // Set resolved_at if status is 'resolved'
                    if (updates.status === 'resolved' && !existingTicket.resolved_at) {
                        updateFields.push(`resolved_at = $${paramIndex}`);
                        params.push(new Date().toISOString());
                        paramIndex++;
                    }

                    // Set closed_at if status is 'closed'
                    if (updates.status === 'closed' && !existingTicket.closed_at) {
                        updateFields.push(`closed_at = $${paramIndex}`);
                        params.push(new Date().toISOString());
                        paramIndex++;
                    }
                }

                if (updates.estimated_time !== undefined) {
                    updateFields.push(`estimated_time = $${paramIndex}`);
                    params.push(updates.estimated_time);
                    paramIndex++;
                }

                if (updates.start_date !== undefined) {
                    updateFields.push(`start_date = $${paramIndex}`);
                    params.push(updates.start_date);
                    paramIndex++;
                }

                if (updates.end_date !== undefined) {
                    updateFields.push(`end_date = $${paramIndex}`);
                    params.push(updates.end_date);
                    paramIndex++;
                }

                if (updates.assigned_to !== undefined) {
                    updateFields.push(`assigned_to = $${paramIndex}`);
                    params.push(updates.assigned_to);
                    paramIndex++;

                    // Update assignment metadata
                    updateFields.push(`assigned_by = $${paramIndex}`);
                    params.push(context.user.userId);
                    paramIndex++;

                    updateFields.push(`assigned_at = $${paramIndex}`);
                    params.push(new Date().toISOString());
                    paramIndex++;

                    // Track schema for assigned_to (typically null for super_admin users)
                    updateFields.push(`assigned_to_schema = $${paramIndex}`);
                    params.push(null); // Assuming only super_admin can be assigned
                    paramIndex++;

                    // Track schema for assigned_by
                    const assignedBySchema = (context.user.role === 'super_admin' || context.user.role === 'partner_admin')
                        ? null
                        : context.schema;
                    updateFields.push(`assigned_by_schema = $${paramIndex}`);
                    params.push(assignedBySchema);
                    paramIndex++;
                }

                if (updateFields.length === 0) {
                    throw new Error('No fields to update');
                }

                // Always update updated_at
                updateFields.push(`updated_at = $${paramIndex}`);
                params.push(new Date().toISOString());

                const updateQuery = `
                    UPDATE tickets 
                    SET ${updateFields.join(', ')}
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await db.query(updateQuery, params);
                return await enrichTicket(result.rows[0], db);
            } catch (error) {
                console.error('Error updating ticket:', error);
                throw new Error('Failed to update ticket: ' + error.message);
            }
        },

        deleteTicket: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            try {
                const { id } = input;

                // Check if ticket exists and user has access
                const checkQuery = `
                    SELECT * FROM tickets 
                    WHERE id = $1 AND deleted_at IS NULL
                    ${context.user.role !== 'super_admin' ? 'AND company_id = $2' : ''}
                `;
                const checkParams = context.user.role !== 'super_admin'
                    ? [id, context.user.companyId]
                    : [id];

                const checkResult = await db.query(checkQuery, checkParams);
                if (checkResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'Ticket not found or access denied'
                    };
                }

                // Soft delete the ticket
                const deleteQuery = `
                    UPDATE tickets 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2
                    RETURNING id
                `;

                const result = await db.query(deleteQuery, [new Date().toISOString(), id]);

                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0
                        ? 'Ticket deleted successfully'
                        : 'Failed to delete ticket'
                };
            } catch (error) {
                console.error('Error deleting ticket:', error);
                return {
                    success: false,
                    message: 'Failed to delete ticket: ' + error.message
                };
            }
        }
    }
};

module.exports = ticketResolvers;
