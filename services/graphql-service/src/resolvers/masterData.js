const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

// Helper function to build dynamic update query
const buildUpdateQuery = (tableName, id, updates, additionalFields = {}) => {
    const updateFields = [];
    const params = [id];
    let paramIndex = 2;

    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
            updateFields.push(`${key} = $${paramIndex}`);
            // Pass arrays directly - PostgreSQL driver will handle them
            // Only stringify non-array objects (like JSON/JSONB fields)
            if (Array.isArray(value)) {
                params.push(value);
            } else if (typeof value === 'object' && value !== null) {
                params.push(JSON.stringify(value));
            } else {
                params.push(value);
            }
            paramIndex++;
        }
    });

    Object.entries(additionalFields).forEach(([key, value]) => {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
    });

    if (updateFields.length === 0) {
        throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = $${paramIndex}`);
    params.push(new Date().toISOString());

    const query = `
        UPDATE ${tableName} 
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
    `;

    return { query, params };
};

// Helper function for soft delete
const softDelete = async (tableName, id, companyFilter = null) => {
    try {
        let checkQuery = `SELECT * FROM ${tableName} WHERE id = $1 AND deleted_at IS NULL`;
        const checkParams = [id];

        if (companyFilter) {
            checkQuery += ` AND company_id = $2`;
            checkParams.push(companyFilter);
        }

        const checkResult = await db.query(checkQuery, checkParams);

        if (checkResult.rows.length === 0) {
            return { success: false, message: 'Record not found' };
        }

        const deleteQuery = `
            UPDATE ${tableName} 
            SET deleted_at = $1, updated_at = $1
            WHERE id = $2
            RETURNING id
        `;

        const result = await db.query(deleteQuery, [new Date().toISOString(), id]);

        return {
            success: result.rows.length > 0,
            message: result.rows.length > 0 ? 'Deleted successfully' : 'Failed to delete'
        };
    } catch (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        return { success: false, message: 'Failed to delete: ' + error.message };
    }
};

const masterDataResolvers = {
    Query: {
        // ==================== Master Asset Categories ====================
        masterAssetCategories: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_categories WHERE deleted_at IS NULL ORDER BY name');
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset categories: ' + error.message);
            }
        },

        masterAssetCategory: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_categories WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset category: ' + error.message);
            }
        },

        // ==================== Master Asset Part Fields ====================
        masterAssetPartFields: async (parent, { asset_part_id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                let query = 'SELECT * FROM master_asset_part_fields WHERE deleted_at IS NULL';
                const params = [];

                if (asset_part_id) {
                    query += ' AND asset_part_id = $1';
                    params.push(asset_part_id);
                }

                query += ' ORDER BY display_order, field_name';
                const result = await db.query(query, params);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset part fields: ' + error.message);
            }
        },

        masterAssetPartField: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_part_fields WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset part field: ' + error.message);
            }
        },

        // ==================== Master Asset Parts ====================
        masterAssetParts: async (parent, { asset_type_id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                let query = 'SELECT * FROM master_asset_parts WHERE deleted_at IS NULL';
                const params = [];

                if (asset_type_id) {
                    query += ' AND asset_type_id = $1';
                    params.push(asset_type_id);
                }

                query += ' ORDER BY name';
                const result = await db.query(query, params);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset parts: ' + error.message);
            }
        },

        masterAssetPart: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_parts WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset part: ' + error.message);
            }
        },

        // ==================== Master Asset Service Types ====================
        masterAssetServiceTypes: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_service_types WHERE deleted_at IS NULL ORDER BY name');
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset service types: ' + error.message);
            }
        },

        masterAssetServiceType: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_service_types WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset service type: ' + error.message);
            }
        },

        // ==================== Master Asset Type Fields ====================
        masterAssetTypeFields: async (parent, { asset_type_id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                let query = 'SELECT * FROM master_asset_type_fields WHERE deleted_at IS NULL';
                const params = [];

                if (asset_type_id) {
                    query += ' AND asset_type_id = $1';
                    params.push(asset_type_id);
                }

                query += ' ORDER BY display_order, field_name';
                const result = await db.query(query, params);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset type fields: ' + error.message);
            }
        },

        masterAssetTypeField: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_type_fields WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset type field: ' + error.message);
            }
        },

        // ==================== Master Asset Types ====================
        masterAssetTypes: async (parent, { asset_category_id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                let query = 'SELECT * FROM master_asset_types WHERE deleted_at IS NULL';
                const params = [];

                if (asset_category_id) {
                    query += ' AND asset_category_id = $1';
                    params.push(asset_category_id);
                }

                query += ' ORDER BY name';
                const result = await db.query(query, params);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master asset types: ' + error.message);
            }
        },

        masterAssetType: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM master_asset_types WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master asset type: ' + error.message);
            }
        },

        // ==================== Master Manufacturers ====================
        masterManufacturers: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM manufacturers WHERE deleted_at IS NULL ORDER BY name');
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master manufacturers: ' + error.message);
            }
        },

        masterManufacturer: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            try {
                const result = await db.query('SELECT * FROM manufacturers WHERE id = $1 AND deleted_at IS NULL', [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master manufacturer: ' + error.message);
            }
        },

        // ==================== Master Vendors (Tenant Schema) ====================
        masterVendors: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM vendors WHERE deleted_at IS NULL ORDER BY company_name';
                const result = await client.query(query);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master vendors: ' + error.message);
            } finally {
                client.release();
            }
        },

        masterVendor: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM vendors WHERE id = $1 AND deleted_at IS NULL';
                const result = await client.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master vendor: ' + error.message);
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Assignment Types ====================
        masterWorkOrderAssignmentTypes: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_assignment_types WHERE deleted_at IS NULL ORDER BY name';
                const result = await client.query(query);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master work order assignment types: ' + error.message);
            } finally {
                client.release();
            }
        },

        masterWorkOrderAssignmentType: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_assignment_types WHERE id = $1 AND deleted_at IS NULL';
                const result = await client.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master work order assignment type: ' + error.message);
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Service Categories ====================
        masterWorkOrderServiceCategories: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_service_categories WHERE deleted_at IS NULL ORDER BY name';
                const result = await client.query(query);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master work order service categories: ' + error.message);
            } finally {
                client.release();
            }
        },

        masterWorkOrderServiceCategory: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_service_categories WHERE id = $1 AND deleted_at IS NULL';
                const result = await client.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master work order service category: ' + error.message);
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Stages ====================
        masterWorkOrderStages: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM work_order_stages WHERE deleted_at IS NULL ORDER BY display_order, name';
                const result = await client.query(query);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master work order stages: ' + error.message);
            } finally {
                client.release();
            }
        },

        masterWorkOrderStage: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM work_order_stages WHERE id = $1 AND deleted_at IS NULL';
                const result = await client.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master work order stage: ' + error.message);
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Types ====================
        masterWorkOrderTypes: async (parent, args, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_types WHERE deleted_at IS NULL ORDER BY name';
                const result = await client.query(query);
                return result.rows;
            } catch (error) {
                throw new Error('Failed to fetch master work order types: ' + error.message);
            } finally {
                client.release();
            }
        },

        masterWorkOrderType: async (parent, { id }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const query = 'SELECT * FROM master_work_order_types WHERE id = $1 AND deleted_at IS NULL';
                const result = await client.query(query, [id]);
                return result.rows[0] || null;
            } catch (error) {
                throw new Error('Failed to fetch master work order type: ' + error.message);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        // ==================== Master Asset Categories ====================
        createMasterAssetCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { name, description, icon_name, icon_color, icon_type, is_default = false } = input;
                const query = `
                    INSERT INTO master_asset_categories (name, description, icon_name, icon_color, icon_type, is_default)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                const result = await db.query(query, [name, description, icon_name, icon_color, icon_type, is_default]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset category: ' + error.message);
            }
        },

        updateMasterAssetCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_categories', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset category: ' + error.message);
            }
        },

        deleteMasterAssetCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_categories', input.id);
        },

        // ==================== Master Asset Part Fields ====================
        createMasterAssetPartField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { parent_id, asset_part_id, field_name, description, field_type, allowed_values, unit, is_required = false, display_order = 0, show_in_panel = true } = input;
                const query = `
                    INSERT INTO master_asset_part_fields (parent_id, asset_part_id, field_name, description, field_type, allowed_values, unit, is_required, display_order, show_in_panel)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;
                // Stringify allowed_values if it's an object
                const allowedValuesParam = (typeof allowed_values === 'object' && allowed_values !== null)
                    ? JSON.stringify(allowed_values)
                    : allowed_values;
                const result = await db.query(query, [parent_id, asset_part_id, field_name, description, field_type, allowedValuesParam, unit, is_required, display_order, show_in_panel]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset part field: ' + error.message);
            }
        },

        updateMasterAssetPartField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_part_fields', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset part field: ' + error.message);
            }
        },

        deleteMasterAssetPartField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_part_fields', input.id);
        },

        // ==================== Master Asset Parts ====================
        createMasterAssetPart: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { name, description, asset_type_id } = input;
                const query = `
                    INSERT INTO master_asset_parts (name, description, asset_type_id)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                const result = await db.query(query, [name, description, asset_type_id]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset part: ' + error.message);
            }
        },

        updateMasterAssetPart: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_parts', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset part: ' + error.message);
            }
        },

        deleteMasterAssetPart: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_parts', input.id);
        },

        // ==================== Master Asset Service Types ====================
        createMasterAssetServiceType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { name, asset_category_ids, description } = input;
                const query = `
                    INSERT INTO master_asset_service_types (name, asset_category_ids, description)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                // Pass array directly - PostgreSQL will handle it
                const result = await db.query(query, [name, asset_category_ids || null, description]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset service type: ' + error.message);
            }
        },

        updateMasterAssetServiceType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_service_types', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset service type: ' + error.message);
            }
        },

        deleteMasterAssetServiceType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_service_types', input.id);
        },

        // ==================== Master Asset Type Fields ====================
        createMasterAssetTypeField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { asset_type_id, field_type, field_name, allowed_values, unit, is_required = false, display_order = 0, parent_field_id, show_in_panel = true } = input;
                const query = `
                    INSERT INTO master_asset_type_fields (asset_type_id, field_type, field_name, allowed_values, unit, is_required, display_order, parent_field_id, show_in_panel)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `;
                // Stringify allowed_values if it's an object
                const allowedValuesParam = (typeof allowed_values === 'object' && allowed_values !== null)
                    ? JSON.stringify(allowed_values)
                    : allowed_values;
                const result = await db.query(query, [asset_type_id, field_type, field_name, allowedValuesParam, unit, is_required, display_order, parent_field_id, show_in_panel]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset type field: ' + error.message);
            }
        },

        updateMasterAssetTypeField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_type_fields', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset type field: ' + error.message);
            }
        },

        deleteMasterAssetTypeField: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_type_fields', input.id);
        },

        // ==================== Master Asset Types ====================
        createMasterAssetType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { asset_category_id, name, description, icon_name, icon_color, icon_type, is_default = false } = input;
                const query = `
                    INSERT INTO master_asset_types (asset_category_id, name, description, icon_name, icon_color, icon_type, is_default)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;
                const result = await db.query(query, [asset_category_id, name, description, icon_name, icon_color, icon_type, is_default]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master asset type: ' + error.message);
            }
        },

        updateMasterAssetType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('master_asset_types', id, updates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master asset type: ' + error.message);
            }
        },

        deleteMasterAssetType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('master_asset_types', input.id);
        },

        // ==================== Master Manufacturers ====================
        createMasterManufacturer: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { name, country_code, country, website, contact_email, phone_number, description, is_active = true, contact_person, address } = input;
                const query = `
                    INSERT INTO manufacturers (name, country_code, country, website, contact_email, phone_number, description, is_active, contact_person, address)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;
                const result = await db.query(query, [name, country_code, country, website, contact_email, phone_number, description, is_active, contact_person, address]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master manufacturer: ' + error.message);
            }
        },

        updateMasterManufacturer: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            try {
                const { id, ...updates } = input;
                // Map GraphQL field names to database column names
                const mappedUpdates = {};
                Object.keys(updates).forEach(key => {
                    if (key === 'contact_email') {
                        mappedUpdates['contact_email'] = updates[key];
                    } else {
                        mappedUpdates[key] = updates[key];
                    }
                });
                const { query, params } = buildUpdateQuery('manufacturers', id, mappedUpdates);
                const result = await db.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master manufacturer: ' + error.message);
            }
        },

        deleteMasterManufacturer: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (context.user.role !== 'super_admin') throw new Error('Unauthorized: Super admin access required');
            return await softDelete('manufacturers', input.id);
        },

        // ==================== Master Vendors (Tenant Schema) ====================
        createMasterVendor: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${context.schema}, public`);
                
                const { company_name, website, email, name, phone_number, country_code, vendor_type = 'maintenance_provider', can_login = false, password } = input;
                
                // Insert into tenant schema vendors table
                const query = `
                    INSERT INTO vendors (company_name, website, email, name, phone_number, country_code, vendor_type, can_login, password, invited_by_user)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `;
                const result = await client.query(query, [
                    company_name, 
                    website, 
                    email, 
                    name, 
                    phone_number, 
                    country_code, 
                    vendor_type, 
                    can_login, 
                    password || null,
                    context.user.userId
                ]);
                
                const vendor = result.rows[0];
                          
                // Also insert into public.master_vendors if user is a tenant/company user
                if (context.user.companyId) {
                    const publicVendorQuery = `
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
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (id) DO UPDATE SET
                            vendor_company_name = EXCLUDED.vendor_company_name,
                            website = EXCLUDED.website,
                            email = EXCLUDED.email,
                            name = EXCLUDED.name,
                            phone_number = EXCLUDED.phone_number,
                            country_code = EXCLUDED.country_code,
                            vendor_type = EXCLUDED.vendor_type,
                            can_login = EXCLUDED.can_login,
                            updated_at = CURRENT_TIMESTAMP
                    `;
                    await client.query(publicVendorQuery, [
                        vendor.id,
                        context.user.companyId,
                        company_name,
                        website,
                        email,
                        name,
                        phone_number,
                        country_code,
                        vendor_type,
                        can_login,
                        context.user.userId
                    ]);
                }
                
                await client.query('COMMIT');
                return vendor;
            } catch (error) {
                await client.query('ROLLBACK');
                throw new Error('Failed to create master vendor: ' + error.message);
            } finally {
                client.release();
            }
        },

        updateMasterVendor: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${context.schema}, public`);
                
                const { id, ...updates } = input;
                const { query, params } = buildUpdateQuery('vendors', id, updates);
                const result = await client.query(query, params);
                
                if (result.rows.length === 0) {
                    throw new Error('Vendor not found');
                }
                
                const vendor = result.rows[0];
                
                // Also update public.master_vendors if it exists and user is a tenant/company user
                if (context.user.companyId) {
                    const publicUpdates = {};
                    if (updates.company_name !== undefined) publicUpdates.vendor_company_name = updates.company_name;
                    if (updates.website !== undefined) publicUpdates.website = updates.website;
                    if (updates.email !== undefined) publicUpdates.email = updates.email;
                    if (updates.name !== undefined) publicUpdates.name = updates.name;
                    if (updates.phone_number !== undefined) publicUpdates.phone_number = updates.phone_number;
                    if (updates.country_code !== undefined) publicUpdates.country_code = updates.country_code;
                    if (updates.vendor_type !== undefined) publicUpdates.vendor_type = updates.vendor_type;
                    if (updates.can_login !== undefined) publicUpdates.can_login = updates.can_login;
                    
                    if (Object.keys(publicUpdates).length > 0) {
                        const { query: publicQuery, params: publicParams } = buildUpdateQuery('public.master_vendors', id, publicUpdates);
                        await client.query(publicQuery, publicParams);
                    }
                }
                
                await client.query('COMMIT');
                return vendor;
            } catch (error) {
                await client.query('ROLLBACK');
                throw new Error('Failed to update master vendor: ' + error.message);
            } finally {
                client.release();
            }
        },

        deleteMasterVendor: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${context.schema}, public`);
                
                // Soft delete in tenant schema
                const deleteQuery = `
                    UPDATE vendors 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING id
                `;
                const result = await client.query(deleteQuery, [new Date().toISOString(), input.id]);
                
                if (result.rows.length > 0 && context.user.companyId) {
                    // Also soft delete in public.master_vendors if it exists
                    const publicDeleteQuery = `
                        UPDATE public.master_vendors 
                        SET deleted_at = $1, updated_at = $1
                        WHERE id = $2 AND deleted_at IS NULL
                    `;
                    await client.query(publicDeleteQuery, [new Date().toISOString(), input.id]);
                }
                
                await client.query('COMMIT');
                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0 ? 'Deleted successfully' : 'Vendor not found'
                };
            } catch (error) {
                await client.query('ROLLBACK');
                return { success: false, message: 'Failed to delete: ' + error.message };
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Assignment Types ====================
        createMasterWorkOrderAssignmentType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { name } = input;
                const query = `
                    INSERT INTO master_work_order_assignment_types (name)
                    VALUES ($1)
                    RETURNING *
                `;
                const result = await client.query(query, [name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master work order assignment type: ' + error.message);
            } finally {
                client.release();
            }
        },

        updateMasterWorkOrderAssignmentType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { id, name } = input;
                const query = `
                    UPDATE master_work_order_assignment_types
                    SET name = $2, updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                `;
                const result = await client.query(query, [id, name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master work order assignment type: ' + error.message);
            } finally {
                client.release();
            }
        },

        deleteMasterWorkOrderAssignmentType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const deleteQuery = `
                    UPDATE master_work_order_assignment_types 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING id
                `;
                const result = await client.query(deleteQuery, [new Date().toISOString(), input.id]);
                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0 ? 'Deleted successfully' : 'Assignment type not found'
                };
            } catch (error) {
                return { success: false, message: 'Failed to delete: ' + error.message };
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Service Categories ====================
        createMasterWorkOrderServiceCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { name } = input;
                const query = `
                    INSERT INTO master_work_order_service_categories (name)
                    VALUES ($1)
                    RETURNING *
                `;
                const result = await client.query(query, [name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master work order service category: ' + error.message);
            } finally {
                client.release();
            }
        },

        updateMasterWorkOrderServiceCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { id, name } = input;
                const query = `
                    UPDATE master_work_order_service_categories
                    SET name = $2, updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                `;
                const result = await client.query(query, [id, name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master work order service category: ' + error.message);
            } finally {
                client.release();
            }
        },

        deleteMasterWorkOrderServiceCategory: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const deleteQuery = `
                    UPDATE master_work_order_service_categories 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING id
                `;
                const result = await client.query(deleteQuery, [new Date().toISOString(), input.id]);
                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0 ? 'Deleted successfully' : 'Service category not found'
                };
            } catch (error) {
                return { success: false, message: 'Failed to delete: ' + error.message };
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Stages ====================
        createMasterWorkOrderStage: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { name, color_code, is_default = false, display_order = 0 } = input;
                
                // Check if there are any existing work order stages (excluding deleted ones)
                const countResult = await client.query(`
                    SELECT COUNT(*) as count 
                    FROM work_order_stages 
                    WHERE deleted_at IS NULL
                `);
                const existingCount = parseInt(countResult.rows[0].count, 10);
                
                // If no stages exist, the first one should be default
                const shouldBeDefault = existingCount === 0 ? true : is_default;
                
                // If this stage is being set as default, unset all other defaults
                if (shouldBeDefault) {
                    await client.query(`
                        UPDATE work_order_stages 
                        SET is_default = false, updated_at = NOW()
                        WHERE deleted_at IS NULL AND is_default = true
                    `);
                }
                
                const query = `
                    INSERT INTO work_order_stages (name, color_code, is_default, display_order)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                const result = await client.query(query, [name, color_code, shouldBeDefault, display_order]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master work order stage: ' + error.message);
            } finally {
                client.release();
            }
        },

        updateMasterWorkOrderStage: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { id, name, color_code, is_default, display_order } = input;

                // If is_default is being set to true, unset all other defaults first
                if (is_default === true) {
                    await client.query(`
                        UPDATE work_order_stages 
                        SET is_default = false, updated_at = NOW()
                        WHERE deleted_at IS NULL AND is_default = true AND id != $1
                    `, [id]);
                }

                // Build dynamic UPDATE query
                const updates = [];
                const params = [id];
                let paramIndex = 2;

                if (name !== undefined) {
                    updates.push(`name = $${paramIndex}`);
                    params.push(name);
                    paramIndex++;
                }
                if (color_code !== undefined) {
                    updates.push(`color_code = $${paramIndex}`);
                    params.push(color_code);
                    paramIndex++;
                }
                if (is_default !== undefined) {
                    updates.push(`is_default = $${paramIndex}`);
                    params.push(is_default);
                    paramIndex++;
                }
                if (display_order !== undefined) {
                    updates.push(`display_order = $${paramIndex}`);
                    params.push(display_order);
                    paramIndex++;
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                updates.push(`updated_at = NOW()`);

                const query = `
                    UPDATE work_order_stages
                    SET ${updates.join(', ')}
                    WHERE id = $1
                    RETURNING *
                `;

                const result = await client.query(query, params);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master work order stage: ' + error.message);
            } finally {
                client.release();
            }
        },

        deleteMasterWorkOrderStage: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                
                // Check if the stage being deleted is the default one
                const checkQuery = `
                    SELECT is_default 
                    FROM work_order_stages 
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const checkResult = await client.query(checkQuery, [input.id]);
                
                if (checkResult.rows.length === 0) {
                    return { success: false, message: 'Stage not found' };
                }
                
                if (checkResult.rows[0].is_default === true) {
                    return { success: false, message: 'Cannot delete the default work order stage. Please set another stage as default first.' };
                }
                
                const deleteQuery = `
                    UPDATE work_order_stages 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING id
                `;
                const result = await client.query(deleteQuery, [new Date().toISOString(), input.id]);
                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0 ? 'Deleted successfully' : 'Stage not found'
                };
            } catch (error) {
                return { success: false, message: 'Failed to delete: ' + error.message };
            } finally {
                client.release();
            }
        },

        // ==================== Master Work Order Types ====================
        createMasterWorkOrderType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { name } = input;
                const query = `
                    INSERT INTO master_work_order_types (name)
                    VALUES ($1)
                    RETURNING *
                `;
                const result = await client.query(query, [name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to create master work order type: ' + error.message);
            } finally {
                client.release();
            }
        },

        updateMasterWorkOrderType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const { id, name } = input;
                const query = `
                    UPDATE master_work_order_types
                    SET name = $2, updated_at = NOW()
                    WHERE id = $1
                    RETURNING *
                `;
                const result = await client.query(query, [id, name]);
                return result.rows[0];
            } catch (error) {
                throw new Error('Failed to update master work order type: ' + error.message);
            } finally {
                client.release();
            }
        },

        deleteMasterWorkOrderType: async (parent, { input }, context) => {
            if (!context.user) throw new Error('Not authenticated');
            if (!context.schema) throw new Error('User schema not found');

            const client = await context.db.connect();
            try {
                await client.query(`SET search_path TO ${context.schema}, public`);
                const deleteQuery = `
                    UPDATE master_work_order_types 
                    SET deleted_at = $1, updated_at = $1
                    WHERE id = $2 AND deleted_at IS NULL
                    RETURNING id
                `;
                const result = await client.query(deleteQuery, [new Date().toISOString(), input.id]);
                return {
                    success: result.rows.length > 0,
                    message: result.rows.length > 0 ? 'Deleted successfully' : 'Work order type not found'
                };
            } catch (error) {
                return { success: false, message: 'Failed to delete: ' + error.message };
            } finally {
                client.release();
            }
        }
    }
};

module.exports = masterDataResolvers;
