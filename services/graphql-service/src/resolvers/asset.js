const axios = require('axios');
const moment = require('moment-timezone');
const { processFileUploads } = require('../utils/fileUploadHelper');
const {
    executeTransaction,
    executeQuery,
    buildWhereClause,
    formatAssetResponse,
    fetchAssetParts,
    fetchAssetFieldValues,
    fetchAssetPartFieldValues,
    fetchAssetRelations,
    fetchMaintenanceSchedules,
    getAllSubLocationIds
} = require('../utils/db');

const AI_ADDON_SERVICE_URL = process.env.AI_ADDON_SERVICE_URL || 'http://localhost:3004';

// Helper to calculate next due date
// Supports both old frequency parameter and new schedule_type parameter for backward compatibility
const calculateNextDueDate = (startDate, scheduleTypeOrFrequency, intervalValue) => {
    const start = moment(startDate);
    const nextDate = start.clone();
    const val = intervalValue || 1;
    const scheduleType = (scheduleTypeOrFrequency || '').toLowerCase();

    switch (scheduleType) {
        case 'daily': nextDate.add(val, 'days'); break;
        case 'weekly': nextDate.add(val, 'weeks'); break;
        case 'monthly': nextDate.add(val, 'months'); break;
        case 'quarterly': nextDate.add(val * 3, 'months'); break;
        case 'annually': nextDate.add(val, 'years'); break;
        default: nextDate.add(val, 'months');
    }
    return nextDate.format('YYYY-MM-DD');
};

const assetResolvers = {
    Query: {
        // ==================== Get Single Asset ====================
        asset: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.assets
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [id]);
            if (result.rows.length === 0) {
                return null;
            }

            return formatAssetResponse(result.rows[0], schema);
        },

        // ==================== List Assets ====================
        assets: async (parent, { id, filter, limit = 50, offset = 0 }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Handle ID argument (Single asset return)
            if (id) {
                const query = `
                    SELECT * FROM ${schema}.assets
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const result = await executeQuery(schema, query, [id]);

                if (result.rows.length === 0) {
                    return { assets: [], total: 0 };
                }

                return {
                    assets: [await formatAssetResponse(result.rows[0], schema)],
                    total: 1
                };
            }

            // Build filters
            const conditions = ['deleted_at IS NULL'];
            const params = [];
            let paramIndex = 1;

            // Apply only the three specified filters
            if (filter) {
                // 1. locationIds filter (with recursive sub-locations)
                if (filter.locationIds && filter.locationIds.length > 0) {
                    const allLocationIds = [];
                    for (const locationId of filter.locationIds) {
                        const subLocationIds = await getAllSubLocationIds(locationId, schema);
                        allLocationIds.push(...subLocationIds);
                    }
                    conditions.push(`location_ids && $${paramIndex}::uuid[]`);
                    params.push(allLocationIds);
                    paramIndex++;
                }

                // 2. userIds filter (assigned users)
                if (filter.userIds && filter.userIds.length > 0) {
                    conditions.push(`user_ids && $${paramIndex}::uuid[]`);
                    params.push(filter.userIds);
                    paramIndex++;
                }

                // 3. createdByUserIds filter
                if (filter.createdByUserIds && filter.createdByUserIds.length > 0) {
                    conditions.push(`created_by = ANY($${paramIndex}::uuid[])`);
                    params.push(filter.createdByUserIds);
                    paramIndex++;
                }
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Count Query
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ${schema}.assets
                ${whereClause}
            `;

            const countResult = await executeQuery(schema, countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Data Query
            let query = `
                SELECT * FROM ${schema}.assets
                ${whereClause}
                ORDER BY created_at DESC
            `;

            // Add Limit and Offset if provided
            if (limit !== undefined && limit !== null) {
                query += ` LIMIT $${paramIndex}`;
                params.push(limit);
                paramIndex++;
            }

            if (offset !== undefined && offset !== null) {
                query += ` OFFSET $${paramIndex}`;
                params.push(offset);
            }

            const result = await executeQuery(schema, query, params);
            const formattedAssets = await Promise.all(result.rows.map(row => formatAssetResponse(row, schema)));

            return {
                assets: formattedAssets,
                total: total
            };
        },

        // ==================== Get Company Products ====================
        getCompanyProducts: async (parent, { filter = {}, limit = 50, offset = 0 }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Step 1: Build product filters
            const productConditions = ['deleted_at IS NULL'];
            const productParams = [];
            let productParamIndex = 1;

            if (filter.productTypeIds && filter.productTypeIds.length > 0) {
                productConditions.push(`type_id = ANY($${productParamIndex}::uuid[])`);
                productParams.push(filter.productTypeIds);
                productParamIndex++;
            }

            if (filter.productCategoryIds && filter.productCategoryIds.length > 0) {
                productConditions.push(`category_id = ANY($${productParamIndex}::uuid[])`);
                productParams.push(filter.productCategoryIds);
                productParamIndex++;
            }

            if (filter.manufacturerIds && filter.manufacturerIds.length > 0) {
                productConditions.push(`manufacturer_id = ANY($${productParamIndex}::uuid[])`);
                productParams.push(filter.manufacturerIds);
                productParamIndex++;
            }

            if (filter.make && filter.make.length > 0) {
                productConditions.push(`make = ANY($${productParamIndex}::varchar[])`);
                productParams.push(filter.make);
                productParamIndex++;
            }

            if (filter.model && filter.model.length > 0) {
                productConditions.push(`model = ANY($${productParamIndex}::varchar[])`);
                productParams.push(filter.model);
                productParamIndex++;
            }

            // Step 2: Fetch products
            const productQuery = `
                SELECT 
                    id,
                    parent_id,
                    category_id,
                    type_id,
                    manufacturer_id,
                    successor_id,
                    predecessor_id,
                    name,
                    make,
                    model,
                    serial_number,
                    data_sheet,
                    lifespan,
                    rating,
                    specifications,
                    images,
                    description,
                    lifecycle_status,
                    manufacturer_status,
                    is_active,
                    created_at,
                    updated_at,
                    deleted_at
                FROM public.products
                WHERE ${productConditions.join(' AND ')}
                ORDER BY name ASC
            `;

            const productsResult = await executeQuery('public', productQuery, productParams);
            const products = productsResult.rows;

            if (products.length === 0) {
                return { products: [], total: 0 };
            }

            // Step 3: Build asset filters
            const assetConditions = ['deleted_at IS NULL'];
            const assetBaseParams = [];
            let assetParamIndex = 1;

            // Location filter (with recursive sub-locations)
            if (filter.locationIds && filter.locationIds.length > 0) {
                const allLocationIds = [];
                for (const locationId of filter.locationIds) {
                    const subLocationIds = await getAllSubLocationIds(locationId, schema);
                    allLocationIds.push(...subLocationIds);
                }
                assetConditions.push(`location_ids && $${assetParamIndex}::uuid[]`);
                assetBaseParams.push(allLocationIds);
                assetParamIndex++;
            }

            // Asset ID filter
            if (filter.assetId) {
                assetConditions.push(`id = $${assetParamIndex}`);
                assetBaseParams.push(filter.assetId);
                assetParamIndex++;
            }

            // Installation date range filter
            if (filter.installationDateFrom) {
                assetConditions.push(`installation_date >= $${assetParamIndex}`);
                assetBaseParams.push(filter.installationDateFrom);
                assetParamIndex++;
            }

            if (filter.installationDateTo) {
                assetConditions.push(`installation_date <= $${assetParamIndex}`);
                assetBaseParams.push(filter.installationDateTo);
                assetParamIndex++;
            }

            // Installation year filter
            if (filter.installationYear) {
                assetConditions.push(`EXTRACT(YEAR FROM installation_date) = $${assetParamIndex}`);
                assetBaseParams.push(filter.installationYear);
                assetParamIndex++;
            }

            // Created by filter
            if (filter.createdByUserIds && filter.createdByUserIds.length > 0) {
                assetConditions.push(`created_by = ANY($${assetParamIndex}::uuid[])`);
                assetBaseParams.push(filter.createdByUserIds);
                assetParamIndex++;
            }

            // Assigned to filter
            if (filter.assignedToUserIds && filter.assignedToUserIds.length > 0) {
                assetConditions.push(`user_ids && $${assetParamIndex}::uuid[]`);
                assetBaseParams.push(filter.assignedToUserIds);
                assetParamIndex++;
            }

            // Step 4: Fetch all assets for the products
            const productIds = products.map(p => p.id);
            const assetQuery = `
                SELECT 
                    id,
                    name,
                    description,
                    location_ids,
                    product_id,
                    serial_number,
                    installation_date,
                    created_by,
                    created_at
                FROM ${schema}.assets
                WHERE product_id = ANY($${assetParamIndex}::uuid[])
                    AND ${assetConditions.join(' AND ')}
                ORDER BY created_at DESC
            `;

            const assetParams = [...assetBaseParams, productIds];
            const assetsResult = await executeQuery(schema, assetQuery, assetParams);

            // Step 5: Group assets by product_id
            const assetsByProduct = {};
            for (const asset of assetsResult.rows) {
                if (!assetsByProduct[asset.product_id]) {
                    assetsByProduct[asset.product_id] = [];
                }
                assetsByProduct[asset.product_id].push(asset);
            }

            // Step 6: Fetch all unique location IDs from assets
            const allLocationIds = new Set();
            assetsResult.rows.forEach(asset => {
                if (asset.location_ids && asset.location_ids.length > 0) {
                    asset.location_ids.forEach(locId => allLocationIds.add(locId));
                }
            });

            // Step 7: Fetch all locations at once
            const locationsMap = {};
            if (allLocationIds.size > 0) {
                const locationQuery = `
                    WITH RECURSIVE hierarchy AS (
                        SELECT id, parent_id, location_name, id as start_id, 1 as level 
                        FROM ${schema}.locations 
                        WHERE id = ANY($1) AND deleted_at IS NULL
                        
                        UNION ALL
                        
                        SELECT p.id, p.parent_id, p.location_name, h.start_id, h.level + 1
                        FROM ${schema}.locations p
                        JOIN hierarchy h ON h.parent_id = p.id
                    ),
                    path_strings AS (
                        SELECT start_id, string_agg(location_name, ' - ' ORDER BY level DESC) as location_address
                        FROM hierarchy
                        GROUP BY start_id
                    )
                    SELECT
                        l.id,
                        l.location_name as name,
                        l.description,
                        l.location_type as location_type_id,
                        l.address,
                        l.coordinates,
                        l.zipcode,
                        l.city,
                        l.state,
                        l.country,
                        l.parent_id,
                        l.file_ids,
                        l.created_at,
                        l.updated_at,
                        l.deleted_at,
                        ps.location_address
                    FROM ${schema}.locations l
                    LEFT JOIN path_strings ps ON l.id = ps.start_id
                    WHERE l.id = ANY($1) AND l.deleted_at IS NULL
                `;
                const locationsResult = await executeQuery(schema, locationQuery, [Array.from(allLocationIds)]);

                // Get location type names
                const typeIds = [...new Set(locationsResult.rows.map(r => r.location_type_id).filter(Boolean))];
                const typeMap = {};
                if (typeIds.length > 0) {
                    const typeQuery = `
                        SELECT id, name 
                        FROM public.location_types
                        WHERE id = ANY($1) AND deleted_at IS NULL
                    `;
                    const typeResult = await executeQuery('public', typeQuery, [typeIds]);
                    typeResult.rows.forEach(row => {
                        typeMap[row.id] = row.name;
                    });
                }

                locationsResult.rows.forEach(loc => {
                    let coordinates = null;
                    if (loc.coordinates) {
                        coordinates = `(${loc.coordinates.x}, ${loc.coordinates.y})`;
                    }

                    locationsMap[loc.id] = {
                        id: loc.id,
                        locationName: loc.name,
                        description: loc.description,
                        locationAddress: loc.location_address, // Added location hierarchy address
                        locationType: loc.location_type_id,
                        locationTypeName: loc.location_type_id ? typeMap[loc.location_type_id] : null,
                        address: loc.address,
                        coordinates: coordinates,
                        zipcode: loc.zipcode,
                        city: loc.city,
                        state: loc.state,
                        country: loc.country,
                        parentId: loc.parent_id,
                        fileIds: loc.file_ids || [],
                        createdAt: loc.created_at ? loc.created_at.toISOString() : null,
                        updatedAt: loc.updated_at ? loc.updated_at.toISOString() : null,
                        deletedAt: loc.deleted_at ? loc.deleted_at.toISOString() : null
                    };
                });
            }

            // Step 8: Fetch all maintenance schedules for the assets
            const assetIds = assetsResult.rows.map(a => a.id);
            const maintenanceSchedulesMap = {};
            if (assetIds.length > 0) {
                const scheduleQuery = `
                    SELECT 
                        id,
                        asset_id,
                        title,
                        description,
                        schedule_type,
                        interval_unit,
                        interval_value,
                        start_date,
                        next_due_date,
                        assigned_to_user_ids,
                        time_zone,
                        created_at,
                        updated_at,
                        deleted_at
                    FROM ${schema}.asset_maintenance_schedules
                    WHERE asset_id = ANY($1) AND deleted_at IS NULL
                    ORDER BY next_due_date ASC
                `;
                const schedulesResult = await executeQuery(schema, scheduleQuery, [assetIds]);

                // Group schedules by asset_id
                schedulesResult.rows.forEach(schedule => {
                    if (!maintenanceSchedulesMap[schedule.asset_id]) {
                        maintenanceSchedulesMap[schedule.asset_id] = [];
                    }
                    maintenanceSchedulesMap[schedule.asset_id].push({
                        id: schedule.id,
                        assetId: schedule.asset_id,
                        title: schedule.title,
                        description: schedule.description,
                        scheduleType: schedule.schedule_type,
                        intervalUnit: schedule.interval_unit,
                        intervalValue: schedule.interval_value,
                        startDate: schedule.start_date,
                        nextDueDate: schedule.next_due_date,
                        assignedToUserIds: schedule.assigned_to_user_ids || [],
                        timeZone: schedule.time_zone,
                        createdAt: schedule.created_at ? schedule.created_at.toISOString() : null,
                        updatedAt: schedule.updated_at ? schedule.updated_at.toISOString() : null,
                        deletedAt: schedule.deleted_at ? schedule.deleted_at.toISOString() : null
                    });
                });
            }

            // Step 9: Format products with asset information
            const formattedProducts = products.map(product => {
                const productAssets = assetsByProduct[product.id] || [];

                return {
                    id: product.id,
                    parentId: product.parent_id,
                    categoryId: product.category_id,
                    typeId: product.type_id,
                    manufacturerId: product.manufacturer_id,
                    successorId: product.successor_id,
                    predecessorId: product.predecessor_id,
                    name: product.name,
                    make: product.make,
                    model: product.model,
                    serialNumber: product.serial_number,
                    dataSheet: product.data_sheet,
                    lifespan: product.lifespan ? parseFloat(product.lifespan) : null,
                    rating: product.rating ? parseFloat(product.rating) : null,
                    specifications: product.specifications,
                    images: product.images,
                    description: product.description,
                    lifecycleStatus: product.lifecycle_status,
                    manufacturerStatus: product.manufacturer_status,
                    isActive: product.is_active,
                    createdAt: product.created_at ? product.created_at.toISOString() : null,
                    updatedAt: product.updated_at ? product.updated_at.toISOString() : null,
                    deletedAt: product.deleted_at ? product.deleted_at.toISOString() : null,
                    isAddedAsset: productAssets.length > 0,
                    assets: productAssets.map(asset => {
                        const installationYear = asset.installation_date
                            ? new Date(asset.installation_date).getFullYear()
                            : null;

                        const assetLocations = (asset.location_ids || [])
                            .map(locId => locationsMap[locId])
                            .filter(Boolean);

                        const locationAddress = assetLocations.map(l => l.locationAddress).join(', ');

                        return {
                            id: asset.id,
                            name: asset.name,
                            description: asset.description,
                            locationIds: asset.location_ids || [],
                            locations: assetLocations,
                            locationAddress: locationAddress, // Added formatted location address
                            status: 'active', // Default status, can be enhanced based on business logic
                            installationYear: installationYear,
                            serialNumber: asset.serial_number,
                            createdBy: asset.created_by,
                            createdAt: asset.created_at ? asset.created_at.toISOString() : null,
                            maintenanceSchedules: maintenanceSchedulesMap[asset.id] || []
                        };
                    })
                };
            });

            // Step 10: Filter products based on whether asset filters were applied
            // If asset filters are provided, only return products that have matching assets
            const hasAssetFilters = filter.locationIds || filter.assetId ||
                filter.installationDateFrom || filter.installationDateTo ||
                filter.installationYear || filter.createdByUserIds ||
                filter.assignedToUserIds || filter.isAssetAdded;

            const filteredProducts = hasAssetFilters
                ? formattedProducts.filter(p => p.isAddedAsset)
                : formattedProducts;

            // Step 11: Apply pagination
            const total = filteredProducts.length;
            const paginatedProducts = filteredProducts.slice(offset, offset + limit);

            return {
                products: paginatedProducts,
                total: total
            };
        },

        // ==================== Get Asset SOPs ====================
        assetSOPs: async (parent, { assetId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_sops
                WHERE asset_id = $1 AND deleted_at IS NULL
                ORDER BY version DESC, created_at DESC
            `;

            const result = await executeQuery(schema, query, [assetId]);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            }));
        },

        // ==================== Get Asset Incident Plans ====================
        assetIncidentPlans: async (parent, { assetId }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_incident_plans
                WHERE asset_id = $1 AND deleted_at IS NULL
                ORDER BY version DESC, created_at DESC
            `;

            const result = await executeQuery(schema, query, [assetId]);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            }));
        },

        // ==================== Get Single SOP ====================
        assetSOP: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_sops
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [id]);
            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        // ==================== Get Single Incident Plan ====================
        assetIncidentPlan: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.asset_incident_plans
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await executeQuery(schema, query, [id]);
            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        // ==================== Master Data Queries ====================
        // Master data queries are now handled in masterData.js to ensure consistency
        // and proper schema routing.


    },

    Mutation: {
        // ==================== Create Asset ====================
        createAsset: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const userId = context.userId;
            const companyId = context.user.companyId;

            // Check Asset Subscription Limits
            // Get current asset count from the schema
            const countQuery = `SELECT COUNT(*) as count FROM ${schema}.assets WHERE deleted_at IS NULL`;
            const countResult = await executeQuery(schema, countQuery);
            const currentAssetCount = parseInt(countResult.rows[0].count);

            // Get the company's active plan and limits
            const planQuery = `
                SELECT p.limits
                FROM company_plans cp
                JOIN plans p ON cp.plan_id = p.id
                WHERE cp.company_id = $1 
                AND cp.status IN('active', 'trialing', 'past_due')
                ORDER BY cp.created_at DESC
                LIMIT 1
            `;
            const planResult = await executeQuery(schema, planQuery, [companyId]);

            if (planResult.rows.length > 0) {
                const limits = planResult.rows[0].limits;
                const assetLimit = limits?.assets;

                // Only enforce limit if:
                // 1. It's not unlimited (-1)
                // 2. It's a valid number
                // 3. Current count equals or exceeds limit
                if (assetLimit !== null && assetLimit !== undefined && assetLimit !== -1) {
                    if (currentAssetCount >= assetLimit) {
                        throw new Error(`Asset limit reached (${currentAssetCount}/${assetLimit}). Please upgrade your plan.`);
                    }
                }
            }

            // Validate Product ID and Fetch Product
            const productCheck = await executeQuery('public', 'SELECT * FROM products WHERE id = $1', [input.productId]);
            if (productCheck.rows.length === 0) {
                throw new Error(`Invalid Product ID: ${input.productId}`);
            }
            const product = productCheck.rows[0];

            // Determine field values (defaults from product if not provided)
            const name = input.name || product.name;

            // Check if asset name already exists
            const nameCheck = await executeQuery(schema, `SELECT id FROM ${schema}.assets WHERE name ILIKE $1 AND deleted_at IS NULL`, [name]);
            if (nameCheck.rows.length > 0) {
                throw new Error(`Asset with name "${name}" already exists.`);
            }

            const description = input.description || product.description;
            const serialNumber = input.serialNumber || product.serial_number || null;
            const installationDate = input.installationDate || null;

            const queries = [];

            // 1. Insert main asset
            const assetQuery = `
                INSERT INTO ${schema}.assets(
                    name, description, location_ids,
                    file_ids, user_ids, position,
                    product_id, serial_number, installation_date,
                    created_by
                )
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            queries.push({
                query: assetQuery,
                params: [
                    name,
                    description,
                    input.locationIds || [],
                    input.fileIds || [],
                    input.responsibleUserIds || [],
                    input.position || null,
                    input.productId,
                    serialNumber,
                    installationDate,
                    userId
                ]
            });

            const results = await executeTransaction(schema, queries);
            const assetId = results[0].rows[0].id;

            // 4. Insert asset relations (if provided)
            if (input.assetRelations && input.assetRelations.length > 0) {
                const relationQueries = input.assetRelations.map(relation => ({
                    query: `
                        INSERT INTO ${schema}.asset_relations(
        asset_id, fed_from_id, fed_from_part_id
    )
VALUES($1, $2, $3)
    `,
                    params: [
                        assetId,
                        relation.fedFromAssetId,
                        relation.fedFromAssetPartId || null
                    ]
                }));

                await executeTransaction(schema, relationQueries);
            }

            // 5. Copy Master SOPs & Incident Plans
            const masterSOPsResult = await executeQuery(
                'public',
                `SELECT * FROM public.master_sops_incident_plans 
                 WHERE reference_id = $1 
                   AND document_type IN ('SOP', 'Incident_Plan') 
                   AND deleted_at IS NULL 
                   AND is_active = true`,
                [input.productId]
            );

            if (masterSOPsResult.rows.length > 0) {
                const sopQueries = masterSOPsResult.rows.map(master => {
                    // MUST convert to lowercase because tenant table constraint only accepts 'sop' or 'incident_plan'
                    let docType = (master.document_type || '').toLowerCase();
                    // master.document_type is 'SOP' or 'Incident_Plan'
                    // 'SOP'.toLowerCase() -> 'sop'
                    // 'Incident_Plan'.toLowerCase() -> 'incident_plan'

                    return {
                        query: `
                             INSERT INTO ${schema}.asset_sops_incident_plans (
                                 asset_id,
                                 doc_type,
                                 title,
                                 content,
                                 content_type,
                                 file_id,
                                 source,
                                 ai_metadata,
                                 version,
                                 is_active,
                                 created_by,
                                 action_type,
                                 master_sop_incident_plan_id
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                         `,
                        params: [
                            assetId,
                            docType,
                            master.title,
                            master.content || master.document_url || null,
                            master.content_type || 'text',
                            null,
                            master.source || 'manual',
                            null, // ai_metadata
                            1, // version
                            true, // is_active
                            userId,
                            'new', // action_type
                            master.id
                        ]
                    };
                });
                await executeTransaction(schema, sopQueries);
            }

            // 6. Insert maintenance schedules (if provided or defaults)
            if (input.maintenanceSchedules && input.maintenanceSchedules.length > 0) {
                const scheduleQueries = input.maintenanceSchedules.map(schedule => {
                    let nextDueDate = schedule.nextDueDate;
                    // If nextDueDate is not provided, we need schedule_type to calculate it
                    // Since MaintenanceScheduleInput doesn't include schedule_type, default to 'monthly'
                    const scheduleType = 'monthly';
                    const intervalUnit = 'month';
                    const intervalValue = 1;
                    if (!nextDueDate && schedule.startDate) {
                        nextDueDate = calculateNextDueDate(schedule.startDate, scheduleType, intervalValue);
                    }

                    return {
                        query: `
                        INSERT INTO ${schema}.asset_maintenance_schedules(
                            asset_id, title, description,
                            schedule_type, interval_unit, interval_value, start_date, next_due_date, assigned_to_user_ids, time_zone
                        )
                        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `,
                        params: [
                            assetId,
                            schedule.title,
                            schedule.description || null,
                            scheduleType,
                            intervalUnit,
                            intervalValue,
                            schedule.startDate,
                            nextDueDate,
                            schedule.assignedToUserIds || input.responsibleUserIds || [],
                            schedule.timezone || 'PST'
                        ]
                    };
                });

                await executeTransaction(schema, scheduleQueries);
            } else {
                // Fetch default schedules from product
                const productSchedules = await executeQuery('public', 'SELECT * FROM product_maintenance_schedules WHERE product_id = $1 AND is_active = true AND schedule_type IS NOT NULL', [input.productId]);

                if (productSchedules.rows.length > 0) {
                    let installDate = moment();
                    if (installationDate) {
                        installDate = moment(installationDate);
                    }

                    const autoScheduleQueries = productSchedules.rows.map(sched => {
                        const startDate = installDate.clone();
                        const nextDueDate = calculateNextDueDate(startDate, sched.schedule_type, sched.interval_value);

                        return {
                            query: `
                                INSERT INTO ${schema}.asset_maintenance_schedules(
                                    asset_id, title, description,
                                    schedule_type, interval_unit, interval_value, start_date, next_due_date, assigned_to_user_ids, time_zone
                                )
                                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            `,
                            params: [
                                assetId,
                                `Preventive Maintenance - ${sched.schedule_type}`,
                                null,
                                sched.schedule_type,
                                sched.interval_unit || 'month', // Default to 'month' if not provided
                                sched.interval_value || 1,
                                startDate.format('YYYY-MM-DD'),
                                nextDueDate,
                                input.responsibleUserIds || [],
                                'PST'
                            ]
                        };
                    });

                    await executeTransaction(schema, autoScheduleQueries);
                }
            } return formatAssetResponse(results[0].rows[0], schema);
        },

        // ==================== Update Asset ====================
        updateAsset: async (parent, { id, input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Build dynamic update query
            const updates = [];
            const params = [];
            let paramIndex = 1;

            let product = null;
            let currentAsset = null;

            // Fetch current asset if needed for fallback logic
            if (input.productId !== undefined) {
                const assetResult = await executeQuery(schema, `SELECT * FROM ${schema}.assets WHERE id = $1`, [id]);
                if (assetResult.rows.length > 0) currentAsset = assetResult.rows[0];
            }


            if (input.name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                params.push(input.name);
                paramIndex++;
            } else if (input.productId !== undefined && product) {
                // User changed product but didn't provide name -> use product name?
                // Usually updates only change what is provided.
                // But user asked to apply same creation logic: "Create using default... override with user values"
                // For Update, if Product changes, we might want to adopt new product name IF user didn't specify one?
                // Let's stick to explicit updates for now unless confirmed otherwise, OR strictly follow "apply same behavior".
                // "Apply the same behavior to the updateAsset mutation as well."
                // This implies: new state = product defaults + user overrides.
                // So if I update ProductID, effective Name = Product.Name (unless I provided input.name).
                // IF input.name is undefined, I should use Product.Name.
                if (product && product.name) {
                    updates.push(`name = $${paramIndex}`);
                    params.push(product.name);
                    paramIndex++;
                }
            }

            if (input.description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                params.push(input.description);
                paramIndex++;
            } else if (input.productId !== undefined && product) {
                if (product && product.description) {
                    updates.push(`description = $${paramIndex}`);
                    params.push(product.description);
                    paramIndex++;
                }
            }

            if (input.locationIds !== undefined) {
                updates.push(`location_ids = $${paramIndex}`);
                params.push(input.locationIds);
                paramIndex++;
            }

            if (input.fileIds !== undefined) {
                updates.push(`file_ids = $${paramIndex}`);
                params.push(input.fileIds);
                paramIndex++;
            }

            if (input.responsibleUserIds !== undefined) {
                updates.push(`user_ids = $${paramIndex}`);
                params.push(input.responsibleUserIds);
                paramIndex++;
            }

            if (input.position !== undefined) {
                updates.push(`position = $${paramIndex}`);
                params.push(input.position);
                paramIndex++;
            }

            if (input.productId !== undefined) {
                // Validate Product ID if changing
                const productCheck = await executeQuery('public', 'SELECT * FROM products WHERE id = $1', [input.productId]);
                if (productCheck.rows.length === 0) {
                    throw new Error(`Invalid Product ID: ${input.productId}`);
                }
                product = productCheck.rows[0];
                updates.push(`product_id = $${paramIndex}`);
                params.push(input.productId);
                paramIndex++;
            }

            if (input.serialNumber !== undefined) {
                updates.push(`serial_number = $${paramIndex}`);
                params.push(input.serialNumber);
                paramIndex++;
            } else if (input.productId !== undefined && product) {
                // If product changed, and no serial number provided, use product default?
                if (product && product.serial_number) {
                    updates.push(`serial_number = $${paramIndex}`);
                    params.push(product.serial_number);
                    paramIndex++;
                }
            }

            if (input.installationDate !== undefined) {
                updates.push(`installation_date = $${paramIndex}`);
                params.push(input.installationDate);
                paramIndex++;
            }

            updates.push(`updated_at = NOW()`);

            if (updates.length > 0) {
                const updateQuery = `
                    UPDATE ${schema}.assets
                    SET ${updates.join(', ')}
                    WHERE id = $${paramIndex} AND deleted_at IS NULL
                    RETURNING *
                `;

                params.push(id);
                // Execute update first
                await executeQuery(schema, updateQuery, params);
            }



            // Update asset relations
            if (input.assetRelations !== undefined) {
                // Delete existing relations
                await executeQuery(schema, `
                    DELETE FROM ${schema}.asset_relations
                    WHERE asset_id = $1
    `, [id]);

                // Insert new relations
                if (input.assetRelations && input.assetRelations.length > 0) {
                    const relationQueries = input.assetRelations.map(relation => ({
                        query: `
                            INSERT INTO ${schema}.asset_relations(
        asset_id, fed_from_id, fed_from_part_id
    )
VALUES($1, $2, $3)
    `,
                        params: [id, relation.fedFromAssetId, relation.fedFromAssetPartId || null]
                    }));

                    await executeTransaction(schema, relationQueries);
                }
            }

            // Update maintenance schedules
            let shouldUpdateSchedules = false;

            // Should update schedules if:
            // 1. User explicitly provided schedules (even empty array)
            // 2. Product ID changed (need to fetch new defaults IF no user schedules provided)

            if (input.maintenanceSchedules !== undefined) {
                shouldUpdateSchedules = true;
            } else if (input.productId !== undefined) {
                shouldUpdateSchedules = true;
            }

            if (shouldUpdateSchedules) {
                // Soft delete existing schedules
                await executeQuery(schema, `
                    UPDATE ${schema}.asset_maintenance_schedules
                    SET deleted_at = NOW()
                    WHERE asset_id = $1 AND deleted_at IS NULL
                `, [id]);

                // 1. User provided schedules override everything
                if (input.maintenanceSchedules && input.maintenanceSchedules.length > 0) {
                    const scheduleQueries = input.maintenanceSchedules.map(schedule => {
                        // Since MaintenanceScheduleInput doesn't include schedule_type, default to 'monthly'
                        const scheduleType = 'monthly';
                        const intervalUnit = 'month';
                        const intervalValue = 1;
                        let nextDueDate = schedule.nextDueDate;
                        if (!nextDueDate && schedule.startDate) {
                            nextDueDate = calculateNextDueDate(schedule.startDate, scheduleType, intervalValue);
                        }

                        return {
                            query: `
                            INSERT INTO ${schema}.asset_maintenance_schedules(
                                asset_id, title, description,
                                schedule_type, interval_unit, interval_value, start_date, next_due_date, assigned_to_user_ids, time_zone
                            )
                            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `,
                            params: [
                                id,
                                schedule.title,
                                schedule.description || null,
                                scheduleType,
                                intervalUnit,
                                intervalValue,
                                schedule.startDate,
                                nextDueDate,
                                schedule.assignedToUserIds || [],
                                schedule.timezone || 'PST'
                            ]
                        };
                    });

                    await executeTransaction(schema, scheduleQueries);
                }
                // 2. If user didn't provide schedules, but we have a valid product (either existing or new), fetch defaults
                else if (input.maintenanceSchedules === undefined || input.maintenanceSchedules === null) {
                    // Start fetching defaults logic
                    // If productId changed, we have 'product' object from earlier. 
                    // If not changed, we need to fetch current product if we want to reset schedules?
                    // "Apply same behavior" -> if user provides NO schedules, use product defaults.
                    // For update, if I don't touch schedules, they stay.
                    // BUT if I change Product, presumably old schedules are invalid?

                    if (input.productId !== undefined) {
                        // Product changed, and NO user schedules provided -> Re-generate from NEW product
                        const productSchedules = await executeQuery('public', 'SELECT * FROM product_maintenance_schedules WHERE product_id = $1 AND is_active = true', [input.productId]);

                        if (productSchedules.rows.length > 0) {
                            // Need installation date for calculating due dates
                            // Either from input, or existing asset
                            let installDate = moment(); // Default to now
                            if (input.installationDate) {
                                installDate = moment(input.installationDate);
                            } else if (currentAsset && currentAsset.installation_date) {
                                installDate = moment(currentAsset.installation_date);
                            }

                            const autoScheduleQueries = productSchedules.rows.map(sched => {
                                const startDate = installDate.clone();
                                const nextDueDate = calculateNextDueDate(startDate, sched.schedule_type, sched.interval_value);

                                return {
                                    query: `
                                    INSERT INTO ${schema}.asset_maintenance_schedules(
                        asset_id, title, description,
                        schedule_type, interval_unit, interval_value, start_date, next_due_date, assigned_to_user_ids, time_zone
                    )
                                    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `,
                                    params: [
                                        id,
                                        `Preventive Maintenance - ${sched.schedule_type}`,
                                        null,
                                        sched.schedule_type,
                                        sched.interval_unit || 'month', // Default to 'month' if not provided
                                        sched.interval_value || 1,
                                        startDate.format('YYYY-MM-DD'),
                                        nextDueDate,
                                        input.responsibleUserIds || [], // Use new user IDs if provided, else... empty? Or keep old? 
                                        // Ideally we might want to keep old assigned users if input.responsibleUserIds is undefined.
                                        // But here we are creating NEW schedules from product. Those don't have assigned users by default usually. 
                                        'PST'
                                    ]
                                };
                            });

                            await executeTransaction(schema, autoScheduleQueries);
                        }
                    }
                }
            }

            // Fetch and return the updated asset
            const assetQuery = `
                SELECT * FROM ${schema}.assets
                WHERE id = $1
                    `;

            const assetResult = await executeQuery(schema, assetQuery, [id]);
            return formatAssetResponse(assetResult.rows[0], schema);
        },

        // ==================== Delete Asset ====================
        deleteAsset: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const companyId = context.user.companyId;

            // 1. Delete all asset_maintenance_schedules for the given assetId
            await executeQuery(schema, `
                UPDATE ${schema}.asset_maintenance_schedules
                SET deleted_at = NOW()
                WHERE asset_id = $1 AND deleted_at IS NULL
            `, [id]);

            // 2. Remove all asset_relations associated with that asset
            await executeQuery(schema, `
                DELETE FROM ${schema}.asset_relations
                WHERE asset_id = $1
            `, [id]);

            // 3. Delete all asset_sops_incident_plans for that asset
            await executeQuery(schema, `
                UPDATE ${schema}.asset_sops_incident_plans
                SET deleted_at = NOW()
                WHERE asset_id = $1 AND deleted_at IS NULL
            `, [id]);

            // 4. Delete all files related to the asset
            // First fetch the asset to get file_ids
            const assetResult = await executeQuery(schema, `
                SELECT file_ids FROM ${schema}.assets
                WHERE id = $1 AND deleted_at IS NULL
            `, [id]);

            if (assetResult.rows.length > 0 && assetResult.rows[0].file_ids && assetResult.rows[0].file_ids.length > 0) {
                await executeQuery(schema, `
                    UPDATE ${schema}.files
                    SET deleted_at = NOW()
                    WHERE id = ANY($1) AND deleted_at IS NULL
                `, [assetResult.rows[0].file_ids]);
            }

            // 5. Get work_order_ids from work_order_assets for this asset
            const workOrderAssetsResult = await executeQuery(schema, `
                SELECT work_order_id FROM ${schema}.work_order_assets
                WHERE asset_id = $1 AND deleted_at IS NULL
            `, [id]);

            const workOrderIds = workOrderAssetsResult.rows.map(row => row.work_order_id);

            // 6. Soft-delete work orders linked to this asset
            if (workOrderIds.length > 0) {
                await executeQuery(schema, `
                    UPDATE ${schema}.work_orders
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = ANY($1) AND deleted_at IS NULL
                `, [workOrderIds]);
            }

            // 7. Soft-delete work_order_assets records for this asset
            await executeQuery(schema, `
                UPDATE ${schema}.work_order_assets
                SET deleted_at = NOW()
                WHERE asset_id = $1 AND deleted_at IS NULL
            `, [id]);

            // 8. Soft-delete the asset record in the asset table
            const query = `
                UPDATE ${schema}.assets
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
                    `;

            await executeQuery(schema, query, [id]);

            // Decrement asset_count in companies table
            await executeQuery(
                'public',
                'UPDATE companies SET asset_count = asset_count - 1 WHERE id = $1 AND asset_count > 0',
                [companyId]
            );

            // Refresh materialized view
            await executeQuery(
                'public',
                'REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details'
            );

            return true;
        },

        // ==================== Create Asset SOP ====================
        createAssetSOP: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const userId = context.userId;
            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Validate input
                if (input.contentType === 'file' && !input.fileId && !input.fileUpload) {
                    throw new Error('File ID or file upload is required when content type is file');
                }

                if (input.contentType === 'text' && !input.content) {
                    throw new Error('Content is required when content type is text');
                }

                const query = `
                    INSERT INTO ${schema}.asset_sops(
                        asset_id, title, content, content_type,
                        file_id, source, created_by
                    )
VALUES($1, $2, $3, $4, $5, $6, $7)
RETURNING *
                    `;

                const result = await client.query(query, [
                    input.assetId,
                    input.title,
                    input.content || null,
                    input.contentType,
                    input.fileId || null,
                    input.source,
                    userId
                ]);

                const row = result.rows[0];
                let finalFileId = row.file_id;

                // Process file upload if provided
                if (input.fileUpload) {
                    const fileUploadArray = Array.isArray(input.fileUpload) ? [input.fileUpload[0]] : [input.fileUpload];
                    const uploadedFileIds = await processFileUploads(
                        fileUploadArray,
                        'sop',
                        row.id,
                        context
                    );

                    if (uploadedFileIds.length > 0) {
                        finalFileId = uploadedFileIds[0];
                        const updateQuery = `UPDATE ${schema}.asset_sops SET file_id = $1 WHERE id = $2`;
                        await client.query(updateQuery, [finalFileId, row.id]);
                    }
                }

                await client.query('COMMIT');

                return {
                    id: row.id,
                    assetId: row.asset_id,
                    title: row.title,
                    content: row.content,
                    contentType: row.content_type,
                    fileId: finalFileId,
                    source: row.source,
                    aiMetadata: row.ai_metadata,
                    version: row.version,
                    isActive: row.is_active,
                    createdBy: row.created_by,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating asset SOP:', error);
                throw new Error(`Failed to create SOP: ${error.message} `);
            } finally {
                client.release();
            }
        },

        // ==================== Generate Asset SOP (AI) ====================
        generateAssetSOP: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const userId = context.userId;
            const companyId = context.companyId;

            try {
                // Ensure we have authorization header
                const authHeader = context.req?.headers?.authorization;
                if (!authHeader) {
                    throw new Error('No authorization token provided');
                }

                // Call AI addon service
                const response = await axios.post(
                    `${AI_ADDON_SERVICE_URL} /ai-addon/generate - document`,
                    {
                        assetId: input.assetId,
                        documentType: 'sop',
                        instructions: input.instructions || null
                    },
                    {
                        headers: {
                            'Authorization': authHeader
                        }
                    }
                );

                const { content, provider, model, tokensUsed } = response.data;

                // Save generated SOP
                const query = `
                    INSERT INTO ${schema}.asset_sops(
                        asset_id, title, content, content_type,
                        source, ai_metadata, created_by
                    )
VALUES($1, $2, $3, $4, $5, $6, $7)
RETURNING *
                    `;

                const result = await executeQuery(schema, query, [
                    input.assetId,
                    'AI Generated SOP',
                    content,
                    'text',
                    'ai',
                    JSON.stringify({ provider, model, tokensUsed }),
                    userId
                ]);

                const row = result.rows[0];
                return {
                    id: row.id,
                    assetId: row.asset_id,
                    title: row.title,
                    content: row.content,
                    contentType: row.content_type,
                    fileId: row.file_id,
                    source: row.source,
                    aiMetadata: row.ai_metadata,
                    version: row.version,
                    isActive: row.is_active,
                    createdBy: row.created_by,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            } catch (error) {
                console.error('Generate SOP error:', error.message);
                console.error('Error details:', {
                    response: error.response?.data,
                    status: error.response?.status,
                    url: `${AI_ADDON_SERVICE_URL} /ai-addon/generate - document`,
                    hasAuth: !!context.req?.headers?.authorization
                });
                const message = error.response?.data?.message || error.message || 'Failed to generate SOP';
                throw new Error(message);
            }
        },

        // ==================== Update Asset SOP ====================
        updateAssetSOP: async (parent, { id, input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Process file upload if provided
                let uploadedFileId = null;
                if (input.fileUpload) {
                    const fileUploadArray = Array.isArray(input.fileUpload) ? [input.fileUpload[0]] : [input.fileUpload];
                    const uploadedFileIds = await processFileUploads(
                        fileUploadArray,
                        'sop',
                        id,
                        context
                    );
                    if (uploadedFileIds.length > 0) {
                        uploadedFileId = uploadedFileIds[0];
                    }
                }

                // Build dynamic update query
                const updates = [];
                const params = [];
                let paramIndex = 1;

                if (input.title !== undefined) {
                    updates.push(`title = $${paramIndex} `);
                    params.push(input.title);
                    paramIndex++;
                }

                if (input.content !== undefined) {
                    updates.push(`content = $${paramIndex} `);
                    params.push(input.content);
                    paramIndex++;
                }

                if (input.contentType !== undefined) {
                    updates.push(`content_type = $${paramIndex} `);
                    params.push(input.contentType);
                    paramIndex++;
                }

                // Handle file ID - prefer newly uploaded over pre-uploaded
                if (uploadedFileId || input.fileId !== undefined) {
                    updates.push(`file_id = $${paramIndex} `);
                    params.push(uploadedFileId || input.fileId);
                    paramIndex++;
                }

                if (input.source !== undefined) {
                    updates.push(`source = $${paramIndex} `);
                    params.push(input.source);
                    paramIndex++;
                }

                if (input.isActive !== undefined) {
                    updates.push(`is_active = $${paramIndex} `);
                    params.push(input.isActive);
                    paramIndex++;
                }

                // Increment version
                updates.push(`version = version + 1`);
                updates.push(`updated_at = NOW()`);

                const updateQuery = `
                    UPDATE ${schema}.asset_sops
                    SET ${updates.join(', ')}
                    WHERE id = $${paramIndex} AND deleted_at IS NULL
RETURNING *
                    `;

                params.push(id);
                const result = await client.query(updateQuery, params);

                if (result.rows.length === 0) {
                    throw new Error('SOP not found');
                }

                await client.query('COMMIT');

                const row = result.rows[0];
                return {
                    id: row.id,
                    assetId: row.asset_id,
                    title: row.title,
                    content: row.content,
                    contentType: row.content_type,
                    fileId: row.file_id,
                    source: row.source,
                    aiMetadata: row.ai_metadata,
                    version: row.version,
                    isActive: row.is_active,
                    createdBy: row.created_by,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating asset SOP:', error);
                throw new Error(`Failed to update SOP: ${error.message} `);
            } finally {
                client.release();
            }
        },

        // ==================== Delete Asset SOP ====================
        deleteAssetSOP: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            const query = `
                UPDATE ${schema}.asset_sops
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
                    `;

            await executeQuery(schema, query, [id]);
            return true;
        },

        // ==================== Create Asset Incident Plan ====================
        createAssetIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const userId = context.userId;

            // Validate input
            if (input.contentType === 'file' && !input.fileId) {
                throw new Error('File ID is required when content type is file');
            }

            if (input.contentType === 'text' && !input.content) {
                throw new Error('Content is required when content type is text');
            }

            const query = `
                INSERT INTO ${schema}.asset_incident_plans(
                        asset_id, title, content, content_type,
                        file_id, source, created_by
                    )
VALUES($1, $2, $3, $4, $5, $6, $7)
RETURNING *
                    `;

            const result = await executeQuery(schema, query, [
                input.assetId,
                input.title,
                input.content || null,
                input.contentType,
                input.fileId || null,
                input.source,
                userId
            ]);

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        // ==================== Generate Asset Incident Plan (AI) ====================
        generateAssetIncidentPlan: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const userId = context.userId;
            const companyId = context.companyId;

            try {
                // Ensure we have authorization header
                const authHeader = context.req?.headers?.authorization;
                if (!authHeader) {
                    throw new Error('No authorization token provided');
                }

                // Call AI addon service
                const response = await axios.post(
                    `${AI_ADDON_SERVICE_URL} /ai-addon/generate - document`,
                    {
                        assetId: input.assetId,
                        documentType: 'incident_plan',
                        instructions: input.instructions || null
                    },
                    {
                        headers: {
                            'Authorization': authHeader
                        }
                    }
                );

                const { content, provider, model, tokensUsed } = response.data;

                // Save generated incident plan
                const query = `
                    INSERT INTO ${schema}.asset_incident_plans(
                        asset_id, title, content, content_type,
                        source, ai_metadata, created_by
                    )
VALUES($1, $2, $3, $4, $5, $6, $7)
RETURNING *
                    `;

                const result = await executeQuery(schema, query, [
                    input.assetId,
                    'AI Generated Incident Plan',
                    content,
                    'text',
                    'ai',
                    JSON.stringify({ provider, model, tokensUsed }),
                    userId
                ]);

                const row = result.rows[0];
                return {
                    id: row.id,
                    assetId: row.asset_id,
                    title: row.title,
                    content: row.content,
                    contentType: row.content_type,
                    fileId: row.file_id,
                    source: row.source,
                    aiMetadata: row.ai_metadata,
                    version: row.version,
                    isActive: row.is_active,
                    createdBy: row.created_by,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                };
            } catch (error) {
                console.error('Generate incident plan error:', error.message);
                console.error('Error details:', {
                    response: error.response?.data,
                    status: error.response?.status,
                    url: `${AI_ADDON_SERVICE_URL} /ai-addon/generate - document`,
                    hasAuth: !!context.req?.headers?.authorization
                });
                const message = error.response?.data?.message || error.message || 'Failed to generate incident plan';
                throw new Error(message);
            }
        },

        // ==================== Update Asset Incident Plan ====================
        updateAssetIncidentPlan: async (parent, { id, input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            // Build dynamic update query
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (input.title !== undefined) {
                updates.push(`title = $${paramIndex} `);
                params.push(input.title);
                paramIndex++;
            }

            if (input.content !== undefined) {
                updates.push(`content = $${paramIndex} `);
                params.push(input.content);
                paramIndex++;
            }

            if (input.contentType !== undefined) {
                updates.push(`content_type = $${paramIndex} `);
                params.push(input.contentType);
                paramIndex++;
            }

            if (input.fileId !== undefined) {
                updates.push(`file_id = $${paramIndex} `);
                params.push(input.fileId);
                paramIndex++;
            }

            if (input.source !== undefined) {
                updates.push(`source = $${paramIndex} `);
                params.push(input.source);
                paramIndex++;
            }

            if (input.isActive !== undefined) {
                updates.push(`is_active = $${paramIndex} `);
                params.push(input.isActive);
                paramIndex++;
            }

            // Increment version
            updates.push(`version = version + 1`);
            updates.push(`updated_at = NOW()`);

            const updateQuery = `
                UPDATE ${schema}.asset_incident_plans
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex} AND deleted_at IS NULL
RETURNING *
                    `;

            params.push(id);
            const result = await executeQuery(schema, updateQuery, params);

            if (result.rows.length === 0) {
                throw new Error('Incident plan not found');
            }

            const row = result.rows[0];
            return {
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                deletedAt: row.deleted_at
            };
        },

        // ==================== Delete Asset Incident Plan ====================
        deleteAssetIncidentPlan: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;

            const query = `
                UPDATE ${schema}.asset_incident_plans
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
                    `;

            await executeQuery(schema, query, [id]);
            return true;
        }
    },

    // ==================== Field Resolvers ====================
    Asset: {
        product: async (parent, args, context) => {
            if (!parent.productId) return null;

            const query = `
                SELECT 
                    p.*,
                    c.name as category_name,
                    t.name as type_name,
                    m.name as manufacturer_name
                FROM public.products p
                LEFT JOIN public.product_categories c ON p.category_id = c.id
                LEFT JOIN public.product_types t ON p.type_id = t.id
                LEFT JOIN public.manufacturers m ON p.manufacturer_id = m.id
                WHERE p.id = $1 AND p.deleted_at IS NULL
            `;

            const result = await executeQuery('public', query, [parent.productId]);
            if (result.rows.length === 0) return null;
            const row = result.rows[0];
            return {
                id: row.id,
                parentId: row.parent_id,
                categoryId: row.category_id,
                categoryName: row.category_name,
                typeId: row.type_id,
                typeName: row.type_name,
                manufacturerId: row.manufacturer_id,
                manufacturerName: row.manufacturer_name,
                successorId: row.successor_id,
                predecessorId: row.predecessor_id,
                name: row.name,
                make: row.make,
                model: row.model,
                serialNumber: row.serial_number,
                dataSheet: row.data_sheet,
                lifespan: row.lifespan ? parseFloat(row.lifespan) : null,
                rating: row.rating ? parseFloat(row.rating) : null,
                specifications: row.specifications,
                images: row.images,
                description: row.description,
                lifecycleStatus: row.lifecycle_status,
                manufacturerStatus: row.manufacturer_status,
                isActive: row.is_active,
                createdAt: row.created_at ? row.created_at.toISOString() : null,
                updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
                deletedAt: row.deleted_at ? row.deleted_at.toISOString() : null,
                isAddedAsset: true,
                assets: []
            };
        },

        assetParts: async (parent, args, context) => {
            return fetchAssetParts(parent.id, context.schema);
        },

        assetFieldValues: async (parent, args, context) => {
            return fetchAssetFieldValues(parent.id, context.schema);
        },

        assetRelations: async (parent, args, context) => {
            return fetchAssetRelations(parent.id, context.schema);
        },

        maintenanceSchedules: async (parent, args, context) => {
            return fetchMaintenanceSchedules(parent.id, context.schema);
        },

        assetMaintenanceSchedules: async (parent, args, context) => {
            return fetchMaintenanceSchedules(parent.id, context.schema);
        },

        files: async (parent, args, context) => {
            if (!parent.fileIds || parent.fileIds.length === 0) return [];
            const schema = context.schema;
            const query = `
                SELECT * FROM ${schema}.files
                WHERE id = ANY($1) AND deleted_at IS NULL
            `;
            const result = await executeQuery(schema, query, [parent.fileIds]);
            return result.rows;
        },

        responsibleUsers: async (parent, args, context) => {
            if (!parent.userIds || parent.userIds.length === 0) return [];
            const schema = context.schema;
            const query = `
                SELECT id, first_name, last_name, email, phone, role, active, created_at, updated_at
                FROM ${schema}.users
                WHERE id = ANY($1) AND deleted_at IS NULL
            `;
            const result = await executeQuery(schema, query, [parent.userIds]);
            return result.rows.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, phoneNumber: u.phone, isActive: u.active, createdAt: u.created_at, updatedAt: u.updated_at }));
        },

        assetSOPIncidentPlans: async (parent, args, context) => {
            try {
                const schema = context.schema;
                console.log(`[assetSOPIncidentPlans] Fetching for asset ${parent.id} in schema ${schema}`);
                const query = `
                    SELECT * FROM ${schema}.asset_sops_incident_plans
                    WHERE asset_id = $1 AND deleted_at IS NULL
                    ORDER BY created_at DESC
                `;
                const result = await executeQuery(schema, query, [parent.id]);
                return result.rows.map(row => ({
                    id: row.id,
                    assetId: row.asset_id,
                    docType: row.doc_type,
                    title: row.title,
                    content: row.content,
                    contentType: row.content_type,
                    fileId: row.file_id,
                    source: row.source,
                    aiMetadata: row.ai_metadata,
                    version: row.version,
                    isActive: row.is_active,
                    actionType: row.action_type,
                    masterSOPIncidentPlanId: row.master_sop_incident_plan_id,
                    createdBy: row.created_by,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    deletedAt: row.deleted_at
                }));
            } catch (error) {
                console.error('Error fetching assetSOPIncidentPlans:', error.message);
                return [];
            }
        },

        sops: async (parent, args, context) => {
            const schema = context.schema;
            const query = `
SELECT * FROM ${schema}.asset_sops
                WHERE asset_id = $1 AND deleted_at IS NULL
                ORDER BY version DESC
                    `;

            const result = await executeQuery(schema, query, [parent.id]);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        },

        incidentPlans: async (parent, args, context) => {
            const schema = context.schema;
            const query = `
SELECT * FROM ${schema}.asset_incident_plans
                WHERE asset_id = $1 AND deleted_at IS NULL
                ORDER BY version DESC
                    `;

            const result = await executeQuery(schema, query, [parent.id]);
            return result.rows.map(row => ({
                id: row.id,
                assetId: row.asset_id,
                title: row.title,
                content: row.content,
                contentType: row.content_type,
                fileId: row.file_id,
                source: row.source,
                aiMetadata: row.ai_metadata,
                version: row.version,
                isActive: row.is_active,
                createdBy: row.created_by,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        },

        locations: async (parent, args, context) => {
            if (!parent.locationIds || parent.locationIds.length === 0) {
                return [];
            }

            const schema = context.schema;
            const query = `
SELECT
id,
                    location_name as name,
                    description,
                    location_type as "locationTypeId",
                    address,
                    coordinates,
                    zipcode,
                    city,
                    state,
                    country,
                    parent_id as "parentId",
                    file_ids as "fileIds",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt"
                FROM ${schema}.locations
                WHERE id = ANY($1) AND deleted_at IS NULL
                ORDER BY created_at ASC
                    `;

            const result = await executeQuery(schema, query, [parent.locationIds]);

            // Get location type names
            const typeIds = [...new Set(result.rows.map(r => r.locationTypeId).filter(Boolean))];
            const typeMap = {};
            if (typeIds.length > 0) {
                const typeQuery = `
                    SELECT id, name 
                    FROM public.location_types
                    WHERE id = ANY($1) AND deleted_at IS NULL
    `;
                const typeResult = await executeQuery('public', typeQuery, [typeIds]);
                typeResult.rows.forEach(row => {
                    typeMap[row.id] = row.name;
                });
            }

            return result.rows.map(row => {
                // Handle coordinates - convert point to string
                let coordinates = null;
                if (row.coordinates) {
                    coordinates = `(${row.coordinates.x}, ${row.coordinates.y})`;
                }

                return {
                    id: row.id,
                    locationName: row.name, // Location type expects locationName, not name
                    description: row.description,
                    locationType: row.locationTypeId,
                    locationTypeName: row.locationTypeId ? typeMap[row.locationTypeId] : null,
                    address: row.address,
                    coordinates: coordinates,
                    zipcode: row.zipcode,
                    city: row.city,
                    state: row.state,
                    country: row.country,
                    parentId: row.parentId,
                    fileIds: row.fileIds || [],
                    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
                    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
                    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null
                };
            });
        },

        workOrderDetails: async (parent, args, context) => {
            const schema = context.schema;

            // Step 1: Get work_order_ids from work_order_assets table for this asset
            const workOrderAssetsQuery = `
                SELECT work_order_id FROM ${schema}.work_order_assets
                WHERE asset_id = $1
            `;
            const workOrderAssetsResult = await executeQuery(schema, workOrderAssetsQuery, [parent.id]);

            if (workOrderAssetsResult.rows.length === 0) {
                return [];
            }

            const workOrderIds = workOrderAssetsResult.rows.map(row => row.work_order_id);

            // Step 2: Get work orders from work_orders table
            const workOrdersQuery = `
                SELECT 
                    id, title, description, severity, location_id, parent_id,
                    work_order_type, work_order_service_category, work_order_stage_id,
                    start_date, end_date, time_zone, attachments, created_by,
                    created_at, updated_at, deleted_at, execution_priority
                FROM ${schema}.work_orders
                WHERE id = ANY($1) AND deleted_at IS NULL
                ORDER BY created_at DESC
            `;
            const workOrdersResult = await executeQuery(schema, workOrdersQuery, [workOrderIds]);

            if (workOrdersResult.rows.length === 0) {
                return [];
            }

            // Step 3: Get assignments for all work orders
            const assignmentsQuery = `
                SELECT 
                    id, work_order_id, user_ids, assignment_type,
                    created_at, updated_at, deleted_at
                FROM ${schema}.work_order_assignments
                WHERE work_order_id = ANY($1) AND deleted_at IS NULL
            `;
            const assignmentsResult = await executeQuery(schema, assignmentsQuery, [workOrderIds]);

            // Collect all user IDs from assignments
            const allUserIds = [];
            assignmentsResult.rows.forEach(assignment => {
                if (assignment.user_ids && assignment.user_ids.length > 0) {
                    allUserIds.push(...assignment.user_ids);
                }
            });

            // Step 4: Fetch all users at once
            let usersMap = {};
            if (allUserIds.length > 0) {
                const uniqueUserIds = [...new Set(allUserIds)];
                const usersQuery = `
                    SELECT id, first_name, last_name, email, phone, role, active, created_at, updated_at
                    FROM ${schema}.users
                    WHERE id = ANY($1) AND deleted_at IS NULL
                `;
                const usersResult = await executeQuery(schema, usersQuery, [uniqueUserIds]);
                usersResult.rows.forEach(user => {
                    usersMap[user.id] = {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        phoneNumber: user.phone,
                        role: user.role,
                        isActive: user.active,
                        createdAt: user.created_at,
                        updatedAt: user.updated_at
                    };
                });
            }

            // Step 5: Group assignments by work_order_id
            const assignmentsByWorkOrder = {};
            assignmentsResult.rows.forEach(assignment => {
                if (!assignmentsByWorkOrder[assignment.work_order_id]) {
                    assignmentsByWorkOrder[assignment.work_order_id] = [];
                }

                // Map user_ids to user objects
                const users = (assignment.user_ids || [])
                    .map(userId => usersMap[userId])
                    .filter(Boolean);

                assignmentsByWorkOrder[assignment.work_order_id].push({
                    id: assignment.id,
                    workOrderId: assignment.work_order_id,
                    userIds: assignment.user_ids || [],
                    assignmentType: assignment.assignment_type,
                    createdAt: assignment.created_at,
                    updatedAt: assignment.updated_at,
                    deletedAt: assignment.deleted_at,
                    users: users
                });
            });

            // Step 6: Format and return work orders with assignments
            return workOrdersResult.rows.map(wo => ({
                id: wo.id,
                title: wo.title,
                description: wo.description,
                severity: wo.severity,
                locationId: wo.location_id,
                parentId: wo.parent_id,
                workOrderType: wo.work_order_type,
                workOrderServiceCategory: wo.work_order_service_category,
                workOrderStageId: wo.work_order_stage_id,
                startDate: wo.start_date,
                endDate: wo.end_date,
                timeZone: wo.time_zone,
                attachments: wo.attachments || [],
                createdBy: wo.created_by,
                createdAt: wo.created_at,
                updatedAt: wo.updated_at,
                deletedAt: wo.deleted_at,
                executionPriority: wo.execution_priority,
                assignments: assignmentsByWorkOrder[wo.id] || []
            }));
        }
    },

    AssetPart: {
        fieldValues: async (parent, args, context) => {
            return fetchAssetPartFieldValues(parent.id, context.schema);
        }
    }
};

module.exports = assetResolvers;
