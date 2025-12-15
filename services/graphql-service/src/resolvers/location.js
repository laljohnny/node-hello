const { GraphQLScalarType } = require('graphql');
const { processFileUploads } = require('../utils/fileUploadHelper');
const {
    formatAssetResponse
} = require('../utils/db');


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
        // Handle JSON in GraphQL queries
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

const locationResolvers = {
    JSON: JSONScalar,
    Location: {
        parent: async (parent, args, context) => {
            if (!parent.parentId) return null;

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
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const result = await context.db.query(query, [parent.parentId]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            
            // Get location type name
            let typeName = null;
            if (row.locationTypeId) {
                const typeQuery = `
                    SELECT name 
                    FROM public.location_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const typeResult = await context.db.query(typeQuery, [row.locationTypeId]);
                if (typeResult.rows.length > 0) {
                    typeName = typeResult.rows[0].name;
                }
            }
            
            return {
                id: row.id,
                locationName: row.name,
                description: row.description,
                locationType: row.locationTypeId,
                locationTypeName: typeName,
                address: row.address,
                coordinates: row.coordinates ? `(${row.coordinates.x},${row.coordinates.y})` : null,
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
        },

        rootLocation: async (parent, args, context) => {
            if (!parent.id) return null;

            const schema = context.schema;
            const query = `
                WITH RECURSIVE location_hierarchy AS (
                    -- Base case: start with the current location
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
                        deleted_at as "deletedAt",
                        0 as level
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NULL
                    
                    UNION ALL
                    
                    -- Recursive case: traverse up to parent
                    SELECT 
                        parent.id,
                        parent.location_name as name,
                        parent.description,
                        parent.location_type as "locationTypeId",
                        parent.address,
                        parent.coordinates,
                        parent.zipcode,
                        parent.city,
                        parent.state,
                        parent.country,
                        parent.parent_id as "parentId",
                        parent.file_ids as "fileIds",
                        parent.created_at as "createdAt",
                        parent.updated_at as "updatedAt",
                        parent.deleted_at as "deletedAt",
                        lh.level + 1
                    FROM location_hierarchy lh
                    INNER JOIN ${schema}.locations parent ON lh."parentId" = parent.id AND parent.deleted_at IS NULL
                    WHERE lh."parentId" IS NOT NULL
                )
                SELECT 
                    id,
                    name,
                    description,
                    "locationTypeId",
                    address,
                    coordinates,
                    zipcode,
                    city,
                    state,
                    country,
                    "parentId",
                    "fileIds",
                    "createdAt",
                    "updatedAt",
                    "deletedAt"
                FROM location_hierarchy
                WHERE "parentId" IS NULL
                ORDER BY level DESC
                LIMIT 1
            `;

            const result = await context.db.query(query, [parent.id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            
            // Get location type name
            let typeName = null;
            if (row.locationTypeId) {
                const typeQuery = `
                    SELECT name 
                    FROM public.location_types
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const typeResult = await context.db.query(typeQuery, [row.locationTypeId]);
                if (typeResult.rows.length > 0) {
                    typeName = typeResult.rows[0].name;
                }
            }
            
            return {
                id: row.id,
                locationName: row.name,
                description: row.description,
                locationType: row.locationTypeId,
                locationTypeName: typeName,
                address: row.address,
                coordinates: row.coordinates ? `(${row.coordinates.x},${row.coordinates.y})` : null,
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
        },

        parentLocationTree: async (parent, args, context) => {
            if (!parent.id) return [];

            const schema = context.schema;
            const query = `
                WITH RECURSIVE location_hierarchy AS (
                    -- Base case: start with the current location
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
                        deleted_at as "deletedAt",
                        0 as level
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NULL
                    
                    UNION ALL
                    
                    -- Recursive case: traverse up to parent
                    SELECT 
                        parent.id,
                        parent.location_name as name,
                        parent.description,
                        parent.location_type as "locationTypeId",
                        parent.address,
                        parent.coordinates,
                        parent.zipcode,
                        parent.city,
                        parent.state,
                        parent.country,
                        parent.parent_id as "parentId",
                        parent.file_ids as "fileIds",
                        parent.created_at as "createdAt",
                        parent.updated_at as "updatedAt",
                        parent.deleted_at as "deletedAt",
                        lh.level + 1
                    FROM location_hierarchy lh
                    INNER JOIN ${schema}.locations parent ON lh."parentId" = parent.id AND parent.deleted_at IS NULL
                    WHERE lh."parentId" IS NOT NULL
                )
                SELECT 
                    id,
                    name,
                    description,
                    "locationTypeId",
                    address,
                    coordinates,
                    zipcode,
                    city,
                    state,
                    country,
                    "parentId",
                    "fileIds",
                    "createdAt",
                    "updatedAt",
                    "deletedAt",
                    level
                FROM location_hierarchy
                WHERE level > 0
                ORDER BY level DESC
            `;

            const result = await context.db.query(query, [parent.id]);

            if (result.rows.length === 0) return [];

            // Get location type names
            const typeIds = [...new Set(result.rows.map(r => r.locationTypeId).filter(Boolean))];
            const typeMap = {};
            if (typeIds.length > 0) {
                const typeQuery = `
                    SELECT id, name 
                    FROM public.location_types
                    WHERE id = ANY($1) AND deleted_at IS NULL
                `;
                const typeResult = await context.db.query(typeQuery, [typeIds]);
                typeResult.rows.forEach(row => {
                    typeMap[row.id] = row.name;
                });
            }

            // Format results - ordered from root (highest level) to direct parent (lowest level)
            return result.rows.map(row => {
                // Handle coordinates - convert point to string
                let coordinates = null;
                if (row.coordinates) {
                    coordinates = `(${row.coordinates.x},${row.coordinates.y})`;
                }

                return {
                    id: row.id,
                    locationName: row.name,
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
        }
    },
    Query: {
        locations: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                // Fetch all locations from the tenant schema
                const query = `
                    SELECT 
                        id, 
                        location_name as name,
                        description,
                        location_type,
                        address,
                        coordinates,
                        zipcode as zip,
                        city,
                        state,
                        country as countryAlpha2,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                    FROM ${schema}.locations
                    WHERE deleted_at IS NULL
                    ORDER BY created_at ASC
                `;

                const result = await client.query(query);
                const locations = result.rows;

                // Get location type names from location_types
                const typeQuery = `
                    SELECT id, name 
                    FROM public.location_types
                    WHERE deleted_at IS NULL
                `;
                const typeResult = await client.query(typeQuery);
                const typeMap = {};
                typeResult.rows.forEach(row => {
                    typeMap[row.id] = row.name;
                });

                // Get Root type ID - if parentId is null, locationType should be Root type ID
                const rootTypeQuery = `
                    SELECT id 
                    FROM public.location_types
                    WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
                    LIMIT 1
                `;
                const rootTypeResult = await client.query(rootTypeQuery);
                const rootTypeId = rootTypeResult.rows.length > 0 ? rootTypeResult.rows[0].id : null;

                // Map location_type UUID to type name and format data
                const formattedLocations = locations.map(loc => {
                    // Handle address - split into address1 and address2 if needed
                    const addressParts = loc.address ? loc.address.split('\n') : [];
                    const address1 = addressParts[0] || null;
                    const address2 = addressParts.length > 1 ? addressParts.slice(1).join('\n') : null;

                    // Handle coordinates - convert point to string
                    let coordinates = null;
                    if (loc.coordinates) {
                        coordinates = `(${loc.coordinates.x},${loc.coordinates.y})`;
                    }

                    // If parentId is null, always set locationType to Root type ID and locationTypeName to "Root"
                    let locationType = loc.location_type;
                    let locationTypeName = loc.location_type ? typeMap[loc.location_type] : null;

                    if (!loc.parentId && rootTypeId) {
                        locationType = rootTypeId;
                        locationTypeName = 'Root';
                    }

                    return {
                        id: loc.id,
                        locationName: loc.name,
                        description: loc.description,
                        locationType: locationType,
                        locationTypeName: locationTypeName,
                        address: loc.address,
                        city: loc.city,
                        state: loc.state,
                        zipcode: loc.zip,
                        country: loc.countryAlpha2,
                        coordinates: coordinates,
                        parentId: loc.parentId,
                        createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
                        updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
                        deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null,
                        fileIds: loc.fileIds || []
                    };
                });

                // Build hierarchical structure
                return buildLocationHierarchy(formattedLocations);
            } catch (error) {
                console.error('Error fetching locations:', error);
                throw new Error(`Failed to fetch locations: ${error.message}`);
            } finally {
                client.release();
            }
        },

        locationsTree: async (parent, args, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                // Fetch all locations from the tenant schema
                const query = `
                    SELECT 
                        id, 
                        location_name as name,
                        description,
                        location_type,
                        address,
                        coordinates,
                        zipcode as zip,
                        city,
                        state,
                        country,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                    FROM ${schema}.locations
                    WHERE deleted_at IS NULL
                    ORDER BY created_at ASC
                `;

                const result = await client.query(query);
                const locations = result.rows;

                // Get location type names from location_types
                const typeQuery = `
                    SELECT id, name 
                    FROM public.location_types
                    WHERE deleted_at IS NULL
                `;
                const typeResult = await client.query(typeQuery);
                const typeMap = {};
                typeResult.rows.forEach(row => {
                    typeMap[row.id] = row.name;
                });

                // Get Root type ID - if parentId is null, locationType should be Root type ID
                const rootTypeQuery = `
                    SELECT id 
                    FROM public.location_types
                    WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
                    LIMIT 1
                `;
                const rootTypeResult = await client.query(rootTypeQuery);
                const rootTypeId = rootTypeResult.rows.length > 0 ? rootTypeResult.rows[0].id : null;

                // Map location_type UUID to type name and format data
                const formattedLocations = locations.map(loc => {
                    // Handle address - split into address1 and address2 if needed
                    const addressParts = loc.address ? loc.address.split('\n') : [];
                    const address1 = addressParts[0] || null;
                    const address2 = addressParts.length > 1 ? addressParts.slice(1).join('\n') : null;

                    // Handle coordinates - convert point to string
                    let coordinates = null;
                    if (loc.coordinates) {
                        coordinates = `(${loc.coordinates.x},${loc.coordinates.y})`;
                    }

                    // If parentId is null, always set locationType to Root type ID and locationTypeName to "Root"
                    let locationType = loc.location_type;
                    let locationTypeName = loc.location_type ? typeMap[loc.location_type] : null;

                    if (!loc.parentId && rootTypeId) {
                        locationType = rootTypeId;
                        locationTypeName = 'Root';
                    }

                    return {
                        id: loc.id,
                        locationName: loc.name,
                        description: loc.description,
                        locationType: locationType,
                        locationTypeName: locationTypeName,
                        address: loc.address,
                        city: loc.city,
                        state: loc.state,
                        zipcode: loc.zip,
                        country: loc.country,
                        coordinates: coordinates,
                        parentId: loc.parentId,
                        createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
                        updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
                        deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null,
                        fileIds: loc.fileIds || []
                    };
                });

                // Build hierarchical structure and return as JSON
                return buildLocationHierarchy(formattedLocations);
            } catch (error) {
                console.error('Error fetching locations tree:', error);
                throw new Error(`Failed to fetch locations tree: ${error.message}`);
            } finally {
                client.release();
            }
        },

        location: async (parent, { id }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                const query = `
                    SELECT 
                        id, 
                        location_name as name,
                        description,
                        location_type,
                        address,
                        coordinates,
                        zipcode as zip,
                        city,
                        state,
                        country as countryAlpha2,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NULL
                `;

                const result = await client.query(query, [id]);

                if (result.rows.length === 0) {
                    throw new Error('Location not found');
                }

                const loc = result.rows[0];

                // Get location type name
                let typeName = null;
                let finalLocationType = loc.location_type;

                if (loc.location_type) {
                    const typeQuery = `
                        SELECT name 
                        FROM public.location_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const typeResult = await client.query(typeQuery, [loc.location_type]);
                    if (typeResult.rows.length > 0) {
                        typeName = typeResult.rows[0].name;
                    }
                }

                // If parentId is null, always set locationType to Root type ID and locationTypeName to "Root"
                if (!loc.parentId) {
                    const rootTypeQuery = `
                        SELECT id, name 
                        FROM public.location_types
                        WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
                        LIMIT 1
                    `;
                    const rootTypeResult = await client.query(rootTypeQuery);
                    if (rootTypeResult.rows.length > 0) {
                        finalLocationType = rootTypeResult.rows[0].id;
                        typeName = 'Root';
                    }
                }

                // Handle address
                const addressParts = loc.address ? loc.address.split('\n') : [];
                const address1 = addressParts[0] || null;
                const address2 = addressParts.length > 1 ? addressParts.slice(1).join('\n') : null;

                // Handle coordinates
                let coordinates = null;
                if (loc.coordinates) {
                    coordinates = `(${loc.coordinates.x},${loc.coordinates.y})`;
                }

                // fileIds is already an array from the database

                // Fetch sublocations
                const sublocationsQuery = `
                    SELECT 
                        id, 
                        location_name as name,
                        description,
                        location_type,
                        address,
                        coordinates,
                        zipcode as zip,
                        city,
                        state,
                        country as countryAlpha2,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                    FROM ${schema}.locations
                    WHERE parent_id = $1 AND deleted_at IS NULL
                    ORDER BY created_at ASC
                `;

                const sublocationsResult = await client.query(sublocationsQuery, [id]);
                const sublocations = await buildSublocationsRecursive(sublocationsResult.rows, schema, client);

                return {
                    id: loc.id,
                    locationName: loc.name,
                    description: loc.description,
                    locationType: finalLocationType,
                    locationTypeName: typeName,
                    address: loc.address,
                    city: loc.city,
                    state: loc.state,
                    zipcode: loc.zip,
                    country: loc.countryAlpha2,
                    coordinates: coordinates,
                    parentId: loc.parentId,
                    createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
                    updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
                    deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null,
                    fileIds: loc.fileIds || [],
                    sublocation: sublocations
                };
            } catch (error) {
                console.error('Error fetching location:', error);
                throw new Error(`Failed to fetch location: ${error.message}`);
            } finally {
                client.release();
            }
        },

        getAssetsByLocationId: async (parent, { locationId, includeSubLocations = true }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                // First, verify the location exists
                const locationCheck = `
                    SELECT id 
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const locationResult = await client.query(locationCheck, [locationId]);

                if (locationResult.rows.length === 0) {
                    throw new Error('Location not found');
                }

                // Get location IDs based on includeSubLocations flag
                let allLocationIds;
                if (includeSubLocations) {
                    // Get all sub-location IDs recursively
                    allLocationIds = await getAllSubLocationIds(locationId, schema, client);
                } else {
                    // Only use the provided location ID
                    allLocationIds = [locationId];
                }

                // Query assets that have any of these location IDs in their location_ids array
                const assetsQuery = `
                    SELECT *
                    FROM ${schema}.assets
                    WHERE location_ids && $1::uuid[]
                    AND deleted_at IS NULL
                    ORDER BY created_at DESC
                `;

                const assetsResult = await client.query(assetsQuery, [allLocationIds]);

                // Format the results
                // Format the results
                const assets = await Promise.all(assetsResult.rows.map(asset => formatAssetResponse(asset, schema)));
                return {
                    assets,
                    total: assets.length
                };
            } catch (error) {
                console.error('Error fetching assets by location:', error);
                throw new Error(`Failed to fetch assets: ${error.message}`);
            } finally {
                client.release();
            }
        }
    },

    Mutation: {
        createLocation: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                const companyId = context.user.companyId;

                // Check Location Subscription Limits ONLY for root locations (parentId is null)
                // Sublocations are not restricted by the limit
                if (!input.parentId) {
                    // Get current root location count from the schema (only locations with parent_id IS NULL)
                    const countQuery = `SELECT COUNT(*) as count FROM ${schema}.locations WHERE parent_id IS NULL AND deleted_at IS NULL`;
                    const countResult = await client.query(countQuery);
                    const currentLocationCount = parseInt(countResult.rows[0].count);

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
                    const planResult = await client.query(planQuery, [companyId]);

                    if (planResult.rows.length > 0) {
                        const limits = planResult.rows[0].limits;
                        const locationLimit = limits?.locations;

                        if (locationLimit !== null && locationLimit !== undefined && locationLimit !== -1) {
                            if (currentLocationCount >= locationLimit) {
                                throw new Error(`Location limit reached (${currentLocationCount}/${locationLimit}). Please upgrade your plan.`);
                            }
                        }
                    }
                }

                // Determine location type based on parentId
                let locationTypeId = input.locationType || null;

                // If parentId is null, automatically set location type to "Root"
                if (!input.parentId) {
                    const rootTypeQuery = `
                        SELECT id 
                        FROM public.location_types
                        WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
                        LIMIT 1
                    `;
                    const rootTypeResult = await client.query(rootTypeQuery);

                    if (rootTypeResult.rows.length > 0) {
                        locationTypeId = rootTypeResult.rows[0].id;
                    } else {
                        throw new Error('Root location type not found in location_types');
                    }
                }

                // Validate hierarchy if parentId is provided
                if (input.parentId) {
                    await validateLocationHierarchy(locationTypeId, input.parentId, schema, client);
                }

                // Use address directly from input
                const address = input.address || null;

                // Parse coordinates if provided (format: "(x,y)" or "x,y")
                let coordinates = null;
                if (input.coordinates) {
                    const match = input.coordinates.match(/\(?([^,]+),([^)]+)\)?/);
                    if (match) {
                        const x = parseFloat(match[1].trim());
                        const y = parseFloat(match[2].trim());
                        if (!isNaN(x) && !isNaN(y)) {
                            coordinates = `${x},${y}`;
                        }
                    }
                }

                // Handle fileIds array
                const fileIds = input.fileIds || [];

                const insertQuery = `
                    INSERT INTO ${schema}.locations (
                        location_name,
                        description,
                        location_type,
                        address,
                        coordinates,
                        zipcode,
                        city,
                        state,
                        country,
                        parent_id,
                        file_ids
                    ) VALUES ($1, $2, $3, $4, $5::point, $6, $7, $8, $9, $10, $11)
                    RETURNING 
                        id,
                        location_name as "locationName",
                        description,
                        location_type as "locationType",
                        address,
                        coordinates,
                        zipcode,
                        city,
                        state,
                        country,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                `;

                const result = await client.query(insertQuery, [
                    input.locationName,
                    input.description || null,
                    locationTypeId,
                    address,
                    coordinates,
                    input.zipcode || null,
                    input.city || null,
                    input.state || null,
                    input.country || null,
                    input.parentId || null,
                    fileIds
                ]);

                const loc = result.rows[0];

                // Process file uploads if provided
                let uploadedFileIds = [];
                if (input.fileUploads && input.fileUploads.length > 0) {
                    uploadedFileIds = await processFileUploads(
                        input.fileUploads,
                        'location',
                        loc.id,
                        context
                    );
                }

                // Combine pre-uploaded file IDs with newly uploaded files
                const allFileIds = [
                    ...fileIds,
                    ...uploadedFileIds
                ];

                // Update location with combined file IDs if we have new uploads
                if (uploadedFileIds.length > 0) {
                    const updateFileIdsQuery = `
                        UPDATE ${schema}.locations
                        SET file_ids = $1
                        WHERE id = $2
                    `;
                    await client.query(updateFileIdsQuery, [allFileIds, loc.id]);
                    loc.fileIds = allFileIds;
                }

                // Increment location_count in companies table ONLY for root locations (parentId is null)
                // Sublocations do not count towards the limit
                if (!input.parentId) {
                    await client.query(
                        'UPDATE companies SET location_count = COALESCE(location_count, 0) + 1 WHERE id = $1',
                        [companyId]
                    );

                    // Refresh materialized view only when root location is created
                    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details');
                }

                await client.query('COMMIT');


                // Get location type name if locationType exists
                let locationTypeName = null;
                let finalLocationType = loc.locationType;

                if (loc.locationType) {
                    const typeQuery = `
                        SELECT name 
                        FROM public.location_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const typeResult = await client.query(typeQuery, [loc.locationType]);
                    if (typeResult.rows.length > 0) {
                        locationTypeName = typeResult.rows[0].name;
                    } else {
                        // Diagnostic: Log if location_type UUID doesn't exist in location_types
                        // This happens when location_type points to a deleted/orphaned type
                        console.error(`[createLocation] Location type UUID ${loc.locationType} not found in location_types. This location may have an orphaned type reference.`);
                    }
                }

                // If parentId is null, always set locationType to Root type ID and locationTypeName to "Root"
                if (!loc.parentId) {
                    const rootTypeQuery = `
                        SELECT id, name 
                        FROM public.location_types
                        WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
                        LIMIT 1
                    `;
                    const rootTypeResult = await client.query(rootTypeQuery);
                    if (rootTypeResult.rows.length > 0) {
                        finalLocationType = rootTypeResult.rows[0].id;
                        locationTypeName = 'Root';
                    }
                }

                // Format coordinates
                let coords = null;
                if (loc.coordinates) {
                    coords = `(${loc.coordinates.x},${loc.coordinates.y})`;
                }

                return {
                    id: loc.id,
                    locationName: loc.locationName,
                    description: loc.description,
                    locationType: finalLocationType,
                    locationTypeName: locationTypeName,
                    address: loc.address,
                    city: loc.city,
                    state: loc.state,
                    zipcode: loc.zipcode,
                    country: loc.country,
                    coordinates: coords,
                    parentId: loc.parentId,
                    fileIds: loc.fileIds || [],
                    createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
                    updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
                    deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating location:', error);
                throw new Error(`Failed to create location: ${error.message}`);
            } finally {
                client.release();
            }
        },

        updateLocation: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                await client.query('BEGIN');

                // Validate hierarchy if parentId is being updated
                if (input.parentId !== undefined) {
                    // Get current location type
                    const currentQuery = `
                        SELECT location_type 
                        FROM ${schema}.locations
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const currentResult = await client.query(currentQuery, [input.id]);

                    if (currentResult.rows.length === 0) {
                        throw new Error('Location not found');
                    }

                    const currentLocationTypeId = currentResult.rows[0].location_type;

                    if (input.parentId) {
                        await validateLocationHierarchy(currentLocationTypeId, input.parentId, schema, client);
                    }
                }

                // Build update query dynamically
                const updates = [];
                const values = [];
                let paramCount = 1;

                if (input.locationName !== undefined) {
                    updates.push(`location_name = $${paramCount++}`);
                    values.push(input.locationName);
                }

                if (input.description !== undefined) {
                    updates.push(`description = $${paramCount++}`);
                    values.push(input.description);
                }

                if (input.locationType !== undefined) {
                    // locationType is already a UUID, use it directly
                    updates.push(`location_type = $${paramCount++}`);
                    values.push(input.locationType);
                }

                if (input.address !== undefined) {
                    updates.push(`address = $${paramCount++}`);
                    values.push(input.address || null);
                }

                if (input.coordinates !== undefined) {
                    const match = input.coordinates.match(/\(?([^,]+),([^)]+)\)?/);
                    if (match) {
                        const x = parseFloat(match[1].trim());
                        const y = parseFloat(match[2].trim());
                        if (!isNaN(x) && !isNaN(y)) {
                            updates.push(`coordinates = $${paramCount++}::point`);
                            values.push(`${x},${y}`);
                        }
                    }
                }

                if (input.zipcode !== undefined) {
                    updates.push(`zipcode = $${paramCount++}`);
                    values.push(input.zipcode);
                }

                if (input.city !== undefined) {
                    updates.push(`city = $${paramCount++}`);
                    values.push(input.city);
                }

                if (input.state !== undefined) {
                    updates.push(`state = $${paramCount++}`);
                    values.push(input.state);
                }

                if (input.country !== undefined) {
                    updates.push(`country = $${paramCount++}`);
                    values.push(input.country);
                }

                if (input.parentId !== undefined) {
                    updates.push(`parent_id = $${paramCount++}`);
                    values.push(input.parentId);
                }

                // Process file uploads if provided
                let uploadedFileIds = [];
                if (input.fileUploads && input.fileUploads.length > 0) {
                    uploadedFileIds = await processFileUploads(
                        input.fileUploads,
                        'location',
                        input.id,
                        context
                    );
                }

                // Handle file IDs - combine pre-uploaded with newly uploaded
                if (input.fileIds !== undefined || uploadedFileIds.length > 0) {
                    const allFileIds = [
                        ...(input.fileIds || []),
                        ...uploadedFileIds
                    ];
                    updates.push(`file_ids = $${paramCount++}`);
                    values.push(allFileIds);
                }

                if (updates.length === 0) {
                    throw new Error('No fields to update');
                }

                updates.push(`updated_at = NOW()`);
                values.push(input.id);

                const updateQuery = `
                    UPDATE ${schema}.locations
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCount} AND deleted_at IS NULL
                    RETURNING 
                        id,
                        location_name as "locationName",
                        description,
                        location_type as "locationType",
                        address,
                        coordinates,
                        zipcode,
                        city,
                        state,
                        country,
                        parent_id as "parentId",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        file_ids as "fileIds"
                `;

                const result = await client.query(updateQuery, values);

                if (result.rows.length === 0) {
                    throw new Error('Location not found');
                }

                await client.query('COMMIT');

                const loc = result.rows[0];

                // Get location type name
                let locationTypeName = null;
                if (loc.locationType) {
                    const typeQuery = `
                        SELECT name 
                        FROM public.location_types
                        WHERE id = $1 AND deleted_at IS NULL
                    `;
                    const typeResult = await client.query(typeQuery, [loc.locationType]);
                    if (typeResult.rows.length > 0) {
                        locationTypeName = typeResult.rows[0].name;
                    }
                }

                // Format coordinates
                let coords = null;
                if (loc.coordinates) {
                    coords = `(${loc.coordinates.x},${loc.coordinates.y})`;
                }

                return {
                    id: loc.id,
                    locationName: loc.locationName,
                    description: loc.description,
                    locationType: loc.locationType,
                    locationTypeName: locationTypeName,
                    address: loc.address,
                    city: loc.city,
                    state: loc.state,
                    zipcode: loc.zipcode,
                    country: loc.country,
                    coordinates: coords,
                    parentId: loc.parentId,
                    fileIds: loc.fileIds || [],
                    createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
                    updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
                    deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error updating location:', error);
                throw new Error(`Failed to update location: ${error.message}`);
            } finally {
                client.release();
            }
        },

        deleteLocation: async (parent, { input }, context) => {
            if (!context.user) {
                throw new Error('Not authenticated');
            }

            const schema = context.schema;
            const client = await context.db.connect();

            try {
                await client.query('BEGIN');
                await client.query(`SET search_path TO ${schema}, public`);

                // Verify location exists
                const locationCheck = `
                    SELECT id 
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NULL
                `;
                const locationResult = await client.query(locationCheck, [input.id]);

                if (locationResult.rows.length === 0) {
                    throw new Error('Location not found');
                }

                // Get all child location IDs recursively (including nested children)
                const allLocationIds = await getAllSubLocationIds(input.id, schema, client);
                // Include the parent location ID
                allLocationIds.push(input.id);

                // 1. Soft delete assets that have only one location ID which is being deleted
                const deleteAssetsQuery = `
                    UPDATE ${schema}.assets
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE location_ids && $1::uuid[]
                    AND array_length(location_ids, 1) = 1
                    AND location_ids[1] = ANY($1::uuid[])
                    AND deleted_at IS NULL
                `;
                const deleteAssetsResult = await client.query(deleteAssetsQuery, [allLocationIds]);
                console.log(`Soft deleted ${deleteAssetsResult.rowCount} asset(s) with single location`);

                // 2. Update assets that have multiple locations - remove deleted location IDs
                const updateAssetsQuery = `
                    WITH assets_to_update AS (
                        SELECT 
                            id,
                            array(
                                SELECT elem
                                FROM unnest(location_ids) AS elem
                                WHERE elem <> ALL($1::uuid[])
                            ) as remaining_location_ids
                        FROM ${schema}.assets
                        WHERE location_ids && $1::uuid[]
                        AND array_length(location_ids, 1) > 1
                        AND deleted_at IS NULL
                    )
                    UPDATE ${schema}.assets a
                    SET 
                        location_ids = atu.remaining_location_ids,
                        updated_at = NOW()
                    FROM assets_to_update atu
                    WHERE a.id = atu.id
                    AND a.deleted_at IS NULL
                    AND array_length(atu.remaining_location_ids, 1) > 0
                `;
                await client.query(updateAssetsQuery, [allLocationIds]);

                // 3. Soft delete work orders linked to these locations
                const deleteWorkOrdersByLocationQuery = `
                    UPDATE ${schema}.work_orders
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE location_id = ANY($1::uuid[])
                    AND deleted_at IS NULL
                `;
                await client.query(deleteWorkOrdersByLocationQuery, [allLocationIds]);

                // 4. Soft delete work orders linked to assets that are being deleted
                const deleteWorkOrdersByAssetQuery = `
                    UPDATE ${schema}.work_orders
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id IN (
                        SELECT DISTINCT work_order_id 
                        FROM ${schema}.work_order_assets
                        WHERE asset_id IN (
                            SELECT id
                            FROM ${schema}.assets
                            WHERE location_ids && $1::uuid[]
                            AND array_length(location_ids, 1) = 1
                            AND location_ids[1] = ANY($1::uuid[])
                            AND deleted_at IS NOT NULL
                        )
                    )
                    AND deleted_at IS NULL
                `;
                await client.query(deleteWorkOrdersByAssetQuery, [allLocationIds]);

                // 5. Recursively soft delete all child locations and the parent location
                const deleteChildLocationsQuery = `
                    WITH RECURSIVE location_tree AS (
                        -- Start with the location to delete
                        SELECT id, parent_id
                        FROM ${schema}.locations
                        WHERE id = $1 AND deleted_at IS NULL
                        
                        UNION ALL
                        
                        -- Recursively get all children
                        SELECT l.id, l.parent_id
                        FROM ${schema}.locations l
                        INNER JOIN location_tree lt ON l.parent_id = lt.id
                        WHERE l.deleted_at IS NULL
                    )
                    UPDATE ${schema}.locations
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id IN (
                        SELECT id FROM location_tree
                    )
                    AND deleted_at IS NULL
                `;
                await client.query(deleteChildLocationsQuery, [input.id]);

                // Verify the parent location was deleted
                const verifyDeleteQuery = `
                    SELECT id 
                    FROM ${schema}.locations
                    WHERE id = $1 AND deleted_at IS NOT NULL
                `;
                const verifyResult = await client.query(verifyDeleteQuery, [input.id]);

                if (verifyResult.rows.length === 0) {
                    throw new Error('Failed to delete location');
                }

                await client.query('COMMIT');
                return true;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error deleting location:', error);
                throw new Error(`Failed to delete location: ${error.message}`);
            } finally {
                client.release();
            }
        },

    }
};

// Helper function to build location hierarchy
function buildLocationHierarchy(locations) {
    // Create a map of all locations by ID
    const locationMap = new Map();
    locations.forEach(loc => {
        locationMap.set(loc.id, {
            ...loc,
            sublocation: []
        });
    });

    // Build tree structure
    const rootLocations = [];
    locations.forEach(loc => {
        const location = locationMap.get(loc.id);
        if (!loc.parentId) {
            // Root location
            rootLocations.push(location);
        } else {
            // Child location
            const parent = locationMap.get(loc.parentId);
            if (parent) {
                parent.sublocation.push(location);
            } else {
                // Parent not found, treat as root
                rootLocations.push(location);
            }
        }
    });

    return rootLocations;
}

// Helper function to recursively build sublocations
async function buildSublocationsRecursive(locations, schema, client) {
    if (locations.length === 0) {
        return [];
    }

    // Get location type names
    const typeIds = [...new Set(locations.map(l => l.location_type).filter(Boolean))];
    const typeMap = {};
    if (typeIds.length > 0) {
        const typeQuery = `
            SELECT id, name 
            FROM public.location_types
            WHERE id = ANY($1) AND deleted_at IS NULL
        `;
        const typeResult = await client.query(typeQuery, [typeIds]);
        typeResult.rows.forEach(row => {
            typeMap[row.id] = row.name;
        });
    }

    const result = [];

    for (const loc of locations) {
        // Format location
        const addressParts = loc.address ? loc.address.split('\n') : [];
        const address1 = addressParts[0] || null;
        const address2 = addressParts.length > 1 ? addressParts.slice(1).join('\n') : null;

        let coordinates = null;
        if (loc.coordinates) {
            coordinates = `(${loc.coordinates.x},${loc.coordinates.y})`;
        }

        // Fetch children
        const childrenQuery = `
            SELECT 
                id, 
                location_name as name,
                description,
                location_type,
                address,
                coordinates,
                zipcode as zip,
                city,
                state,
                country as countryAlpha2,
                parent_id as "parentId",
                created_at as "createdAt",
                updated_at as "updatedAt",
                deleted_at as "deletedAt",
                file_ids as "fileIds"
            FROM ${schema}.locations
            WHERE parent_id = $1 AND deleted_at IS NULL
            ORDER BY created_at ASC
        `;

        const childrenResult = await client.query(childrenQuery, [loc.id]);
        const children = await buildSublocationsRecursive(childrenResult.rows, schema, client);

        result.push({
            id: loc.id,
            name: loc.name,
            description: loc.description,
            type: loc.location_type ? typeMap[loc.location_type] : null,
            address1: address1,
            address2: address2,
            city: loc.city,
            state: loc.state,
            zip: loc.zip,
            countryAlpha2: loc.countryAlpha2,
            coordinates: coordinates,
            parentId: loc.parentId,
            createdAt: loc.createdAt ? loc.createdAt.toISOString() : null,
            updatedAt: loc.updatedAt ? loc.updatedAt.toISOString() : null,
            deletedAt: loc.deletedAt ? loc.deletedAt.toISOString() : null,
            fileIds: loc.fileIds || [],
            sublocation: children
        });
    }

    return result;
}

// Helper function to validate location hierarchy
async function validateLocationHierarchy(locationTypeId, parentId, schema, client) {
    // Get parent location type
    const parentQuery = `
        SELECT location_type 
        FROM ${schema}.locations
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const parentResult = await client.query(parentQuery, [parentId]);

    if (parentResult.rows.length === 0) {
        throw new Error('Parent location not found');
    }

    const parentLocationTypeId = parentResult.rows[0].location_type;

    // Get location type name and allowed parents (UUID array)
    const typeQuery = `
        SELECT name, allowed_parents 
        FROM public.location_types
        WHERE id = $1 AND deleted_at IS NULL
    `;
    const typeResult = await client.query(typeQuery, [locationTypeId]);

    if (typeResult.rows.length === 0) {
        throw new Error(`Invalid location type: ${locationTypeId}`);
    }

    const locationType = typeResult.rows[0].name;
    const allowedParents = typeResult.rows[0].allowed_parents || [];

    // Check if parent type is allowed
    const isRoot = !parentLocationTypeId;

    if (isRoot) {
        // Get Root location type UUID
        const rootTypeQuery = `
            SELECT id 
            FROM public.location_types
            WHERE LOWER(TRIM(name)) = 'root' AND deleted_at IS NULL
            LIMIT 1
        `;
        const rootTypeResult = await client.query(rootTypeQuery);
        
        if (rootTypeResult.rows.length === 0) {
            throw new Error('Root location type not found');
        }
        
        const rootTypeId = rootTypeResult.rows[0].id;
        
        // Check if Root's UUID is in the allowed parents UUID array
        if (!allowedParents.includes(rootTypeId)) {
            // Get allowed parent type names for error message
            const allowedParentNames = [];
            if (allowedParents.length > 0) {
                const allowedParentQuery = `
                    SELECT name 
                    FROM public.location_types
                    WHERE id = ANY($1) AND deleted_at IS NULL
                `;
                const allowedParentResult = await client.query(allowedParentQuery, [allowedParents]);
                allowedParentNames.push(...allowedParentResult.rows.map(r => r.name));
            }
            throw new Error(`${locationType} cannot be created under Root. Allowed parent types: ${allowedParentNames.length > 0 ? allowedParentNames.join(', ') : 'none'}`);
        }
        return;
    }

    // Check if parent location type ID is in allowed parents UUID array
    if (!allowedParents.includes(parentLocationTypeId)) {
        // Get allowed parent type names for error message
        const allowedParentNames = [];
        if (allowedParents.length > 0) {
            const allowedParentQuery = `
                SELECT name 
                FROM public.location_types
                WHERE id = ANY($1) AND deleted_at IS NULL
            `;
            const allowedParentResult = await client.query(allowedParentQuery, [allowedParents]);
            allowedParentNames.push(...allowedParentResult.rows.map(r => r.name));
        }
        
        // Get parent type name for error message
        const parentTypeQuery = `
            SELECT name 
            FROM public.location_types
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const parentTypeResult = await client.query(parentTypeQuery, [parentLocationTypeId]);
        const parentTypeName = parentTypeResult.rows.length > 0 ? parentTypeResult.rows[0].name : 'Unknown';
        
        throw new Error(`${locationType} cannot be created under ${parentTypeName}. Allowed parent types: ${allowedParentNames.length > 0 ? allowedParentNames.join(', ') : 'none'}`);
    }
}

// Helper function to get all sub-location IDs recursively
async function getAllSubLocationIds(locationId, schema, client) {
    const locationIds = [locationId];

    // Recursive function to get children
    async function getChildren(parentId) {
        const query = `
            SELECT id 
            FROM ${schema}.locations
            WHERE parent_id = $1 AND deleted_at IS NULL
        `;
        const result = await client.query(query, [parentId]);

        for (const row of result.rows) {
            locationIds.push(row.id);
            await getChildren(row.id); // Recursively get children
        }
    }

    await getChildren(locationId);
    return locationIds;
}

// Helper function to build WHERE clause for location filters
module.exports = locationResolvers;

