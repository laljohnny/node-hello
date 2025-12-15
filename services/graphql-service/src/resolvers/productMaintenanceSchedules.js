const { GraphQLScalarType } = require('graphql');

// JSON Scalar Type
const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        return value;
    },
    parseLiteral(ast) {
        if (ast.kind === 'StringValue') {
            try {
                return JSON.parse(ast.value);
            } catch {
                return ast.value;
            }
        }
        return null;
    }
});

// Helper function to validate schedule type
const validateScheduleType = (scheduleType) => {
    const validTypes = ['service_reminder', 'inspection', 'tune_up', 'calibration'];
    if (scheduleType && !validTypes.includes(scheduleType)) {
        throw new Error(`Invalid schedule type. Must be one of: ${validTypes.join(', ')}`);
    }
};

// Helper function to validate interval unit
const validateIntervalUnit = (intervalUnit) => {
    const validUnits = ['days', 'weeks', 'months', 'years'];
    if (intervalUnit && !validUnits.includes(intervalUnit)) {
        throw new Error(`Invalid interval unit. Must be one of: ${validUnits.join(', ')}`);
    }
};

const productMaintenanceScheduleResolvers = {
    JSON: JSONScalar,
    
    ProductMaintenanceSchedule: {
        product: async (parent, args, context) => {
            if (!parent.productId) return null;

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        parent_id as "parentId",
                        category_id as "categoryId",
                        type_id as "typeId",
                        manufacturer_id as "manufacturerId",
                        successor_id as "successorId",
                        predecessor_id as "predecessorId",
                        name,
                        make,
                        model,
                        serial_number as "serialNumber",
                        data_sheet as "dataSheet",
                        lifespan,
                        rating,
                        specifications,
                        images,
                        description,
                        lifecycle_status as "lifecycleStatus",
                        manufacturer_status as "manufacturerStatus",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt"
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [parent.productId]);
                if (result.rows.length === 0) return null;

                const row = result.rows[0];
                return {
                    id: row.id,
                    parentId: row.parentId,
                    categoryId: row.categoryId,
                    typeId: row.typeId,
                    manufacturerId: row.manufacturerId,
                    successorId: row.successorId,
                    predecessorId: row.predecessorId,
                    name: row.name,
                    make: row.make,
                    model: row.model,
                    serialNumber: row.serialNumber,
                    dataSheet: row.dataSheet,
                    lifespan: row.lifespan ? parseFloat(row.lifespan) : null,
                    rating: row.rating ? parseFloat(row.rating) : null,
                    specifications: row.specifications,
                    images: row.images,
                    description: row.description,
                    lifecycleStatus: row.lifecycleStatus,
                    manufacturerStatus: row.manufacturerStatus,
                    isActive: row.isActive,
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            } finally {
                client.release();
            }
        }
    },

    Query: {
        productMaintenanceSchedules: async (parent, { productId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                let query = `
                    SELECT 
                        id,
                        product_id as "productId",
                        schedule_type as "scheduleType",
                        interval_value as "intervalValue",
                        interval_unit as "intervalUnit",
                        maintenance_tasks as "maintenanceTasks",
                        required_parts as "requiredParts",
                        is_mandatory as "isMandatory",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                    FROM public.product_maintenance_schedules
                    WHERE 1=1
                `;
                const params = [];
                let paramCount = 1;

                if (productId) {
                    query += ` AND product_id = $${paramCount}`;
                    params.push(productId);
                    paramCount++;
                }

                query += ` ORDER BY created_at DESC`;

                const result = await client.query(query, params);
                return result.rows.map(row => formatScheduleRow(row));
            } catch (error) {
                console.error('Error fetching product maintenance schedules:', error);
                throw new Error(`Failed to fetch product maintenance schedules: ${error.message}`);
            } finally {
                client.release();
            }
        },

        productMaintenanceSchedule: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const client = await context.db.connect();
            try {
                const query = `
                    SELECT 
                        id,
                        product_id as "productId",
                        schedule_type as "scheduleType",
                        interval_value as "intervalValue",
                        interval_unit as "intervalUnit",
                        maintenance_tasks as "maintenanceTasks",
                        required_parts as "requiredParts",
                        is_mandatory as "isMandatory",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                    FROM public.product_maintenance_schedules
                    WHERE id = $1
                `;

                const result = await client.query(query, [id]);
                if (result.rows.length === 0) {
                    throw new Error('Product maintenance schedule not found');
                }

                return formatScheduleRow(result.rows[0]);
            } catch (error) {
                console.error('Error fetching product maintenance schedule:', error);
                throw new Error(`Failed to fetch product maintenance schedule: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createProductMaintenanceSchedule: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Validate product exists
                const productCheck = `
                    SELECT id
                    FROM public.products
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const productResult = await client.query(productCheck, [input.productId]);
                if (productResult.rows.length === 0) {
                    throw new Error('Product not found');
                }

                // Validate schedule type if provided
                if (input.scheduleType !== undefined && input.scheduleType !== null) {
                    validateScheduleType(input.scheduleType);
                }

                // Validate interval unit if provided
                if (input.intervalUnit) {
                    validateIntervalUnit(input.intervalUnit);
                }

                // Handle JSON fields
                let maintenanceTasks = input.maintenanceTasks || [];
                if (typeof maintenanceTasks === 'string') {
                    try {
                        maintenanceTasks = JSON.parse(maintenanceTasks);
                    } catch (e) {
                        throw new Error('Invalid JSON format for maintenanceTasks');
                    }
                }

                let requiredParts = input.requiredParts || [];
                if (typeof requiredParts === 'string') {
                    try {
                        requiredParts = JSON.parse(requiredParts);
                    } catch (e) {
                        throw new Error('Invalid JSON format for requiredParts');
                    }
                }

                const insertQuery = `
                    INSERT INTO public.product_maintenance_schedules (
                        product_id,
                        schedule_type,
                        interval_value,
                        interval_unit,
                        maintenance_tasks,
                        required_parts,
                        is_mandatory,
                        is_active
                    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
                    RETURNING 
                        id,
                        product_id as "productId",
                        schedule_type as "scheduleType",
                        interval_value as "intervalValue",
                        interval_unit as "intervalUnit",
                        maintenance_tasks as "maintenanceTasks",
                        required_parts as "requiredParts",
                        is_mandatory as "isMandatory",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                `;

                const result = await client.query(insertQuery, [
                    input.productId,
                    input.scheduleType,
                    input.intervalValue || null,
                    input.intervalUnit || null,
                    JSON.stringify(maintenanceTasks),
                    JSON.stringify(requiredParts),
                    input.isMandatory !== undefined ? input.isMandatory : false,
                    input.isActive !== undefined ? input.isActive : true
                ]);

                await client.query('COMMIT');

                return formatScheduleRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating product maintenance schedule:', error);
                throw new Error(`Failed to create product maintenance schedule: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateProductMaintenanceSchedule: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if schedule exists
                const checkQuery = `
                    SELECT id
                    FROM public.product_maintenance_schedules
                    WHERE id = $1
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product maintenance schedule not found');
                }

                // Validate product if being updated
                if (input.productId !== undefined) {
                    const productCheck = `
                        SELECT id
                        FROM public.products
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const productResult = await client.query(productCheck, [input.productId]);
                    if (productResult.rows.length === 0) {
                        throw new Error('Product not found');
                    }
                }

                // Validate schedule type if being updated
                if (input.scheduleType !== undefined) {
                    validateScheduleType(input.scheduleType);
                }

                // Validate interval unit if being updated
                if (input.intervalUnit !== undefined && input.intervalUnit !== null) {
                    validateIntervalUnit(input.intervalUnit);
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.productId !== undefined) {
                    updates.push(`product_id = $${paramCount}`);
                    values.push(input.productId);
                    paramCount++;
                }

                if (input.scheduleType !== undefined) {
                    updates.push(`schedule_type = $${paramCount}`);
                    values.push(input.scheduleType);
                    paramCount++;
                }

                if (input.intervalValue !== undefined) {
                    updates.push(`interval_value = $${paramCount}`);
                    values.push(input.intervalValue);
                    paramCount++;
                }

                if (input.intervalUnit !== undefined) {
                    updates.push(`interval_unit = $${paramCount}`);
                    values.push(input.intervalUnit || null);
                    paramCount++;
                }

                if (input.maintenanceTasks !== undefined) {
                    let maintenanceTasks = input.maintenanceTasks;
                    if (typeof maintenanceTasks === 'string') {
                        try {
                            maintenanceTasks = JSON.parse(maintenanceTasks);
                        } catch (e) {
                            throw new Error('Invalid JSON format for maintenanceTasks');
                        }
                    }
                    updates.push(`maintenance_tasks = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(maintenanceTasks));
                    paramCount++;
                }

                if (input.requiredParts !== undefined) {
                    let requiredParts = input.requiredParts;
                    if (typeof requiredParts === 'string') {
                        try {
                            requiredParts = JSON.parse(requiredParts);
                        } catch (e) {
                            throw new Error('Invalid JSON format for requiredParts');
                        }
                    }
                    updates.push(`required_parts = $${paramCount}::jsonb`);
                    values.push(JSON.stringify(requiredParts));
                    paramCount++;
                }

                if (input.isMandatory !== undefined) {
                    updates.push(`is_mandatory = $${paramCount}`);
                    values.push(input.isMandatory);
                    paramCount++;
                }

                if (input.isActive !== undefined) {
                    updates.push(`is_active = $${paramCount}`);
                    values.push(input.isActive);
                    paramCount++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                values.push(input.id);

                const updateQuery = `
                    UPDATE public.product_maintenance_schedules
                    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                    RETURNING 
                        id,
                        product_id as "productId",
                        schedule_type as "scheduleType",
                        interval_value as "intervalValue",
                        interval_unit as "intervalUnit",
                        maintenance_tasks as "maintenanceTasks",
                        required_parts as "requiredParts",
                        is_mandatory as "isMandatory",
                        is_active as "isActive",
                        created_at as "createdAt",
                        updated_at as "updatedAt"
                `;

                const result = await client.query(updateQuery, values);
                await client.query('COMMIT');

                return formatScheduleRow(result.rows[0]);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating product maintenance schedule:', error);
                throw new Error(`Failed to update product maintenance schedule: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteProductMaintenanceSchedule: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }
            if (context.user.role !== 'super_admin') {
                throw new Error('Unauthorized: Super admin access required');
            }

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');

                // Check if schedule exists
                const checkQuery = `
                    SELECT id
                    FROM public.product_maintenance_schedules
                    WHERE id = $1
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                if (checkResult.rows.length === 0) {
                    throw new Error('Product maintenance schedule not found');
                }

                // Hard delete (no soft delete for this table)
                const deleteQuery = `
                    DELETE FROM public.product_maintenance_schedules
                    WHERE id = $1
                `;
                await client.query(deleteQuery, [input.id]);

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting product maintenance schedule:', error);
                throw new Error(`Failed to delete product maintenance schedule: ${error.message}`);
            } finally {
                client.release();
            }
        }
    }
};

// Helper function to format schedule row
function formatScheduleRow(row) {
    return {
        id: row.id,
        productId: row.productId,
        scheduleType: row.scheduleType,
        intervalValue: row.intervalValue,
        intervalUnit: row.intervalUnit,
        maintenanceTasks: row.maintenanceTasks,
        requiredParts: row.requiredParts,
        isMandatory: row.isMandatory,
        isActive: row.isActive,
        createdAt: row.createdAt ? row.createdAt.toISOString() : null,
        updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null
    };
}

module.exports = productMaintenanceScheduleResolvers;

