const { pool } = require("../context");
const { processFileUploads } = require("../utils/fileUploadHelper");


// Helper function to filter out empty strings and invalid UUIDs from arrays
function filterValidUuids(array) {
  if (!array || !Array.isArray(array)) return [];
  return array.filter((id) => id && id !== "" && typeof id === "string");
}

const workOrderResolvers = {
  Query: {
    workOrder: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const query = `
                SELECT 
                    wo.id,
                    wo.title,
                    wo.description,
                    wo.severity,
                    wo.location_id as "locationId",
                    wo.parent_id as "parentId",
                    wo.work_order_type as "workOrderType",
                    wo.work_order_service_category as "workOrderServiceCategory",
                    wo.work_order_stage_id as "workOrderStageId",
                    wo.start_date as "startDate",
                    wo.end_date as "endDate",
                    wo.time_zone as "timeZone",
                    wo.attachments,
                    wo.created_by as "createdBy",
                    wo.created_at as "createdAt",
                    wo.updated_at as "updatedAt",
                    wo.deleted_at as "deletedAt",
                    wo.execution_priority as "executionPriority"
                FROM ${schema}.work_orders wo
                WHERE wo.id = $1 AND wo.deleted_at IS NULL
            `;

      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    },

    workOrders: async (
      parent,
      { filter = {}, limit = 50, offset = 0 },
      context
    ) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const conditions = ["wo.deleted_at IS NULL"];
      const params = [];
      let paramCount = 0;

      if (filter.locationId) {
        paramCount++;
        conditions.push(`wo.location_id = $${paramCount}`);
        params.push(filter.locationId);
      }

      if (filter.workOrderType) {
        paramCount++;
        conditions.push(`wo.work_order_type = $${paramCount}`);
        params.push(filter.workOrderType);
      }

      if (filter.workOrderServiceCategory) {
        paramCount++;
        conditions.push(`wo.work_order_service_category = $${paramCount}`);
        params.push(filter.workOrderServiceCategory);
      }

      if (filter.workOrderStageId) {
        paramCount++;
        conditions.push(`wo.work_order_stage_id = $${paramCount}`);
        params.push(filter.workOrderStageId);
      }

      if (filter.severity) {
        paramCount++;
        conditions.push(`wo.severity = $${paramCount}`);
        params.push(filter.severity);
      }

      if (filter.executionPriority) {
        paramCount++;
        conditions.push(`wo.execution_priority = $${paramCount}`);
        params.push(filter.executionPriority);
      }

      if (filter.createdBy) {
        paramCount++;
        conditions.push(`wo.created_by = $${paramCount}`);
        params.push(filter.createdBy);
      }

      if (filter.search) {
        paramCount++;
        conditions.push(
          `(wo.title ILIKE $${paramCount} OR wo.description ILIKE $${paramCount})`
        );
        params.push(`%${filter.search}%`);
      }

      const whereClause = conditions.join(" AND ");

      // Build FROM clause
      const fromClause = `${schema}.work_orders wo`;

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT wo.id) FROM ${fromClause} WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get work orders
      paramCount++;
      paramCount++;
      const query = `
                SELECT 
                    wo.id,
                    wo.title,
                    wo.description,
                    wo.severity,
                    wo.location_id as "locationId",
                    wo.parent_id as "parentId",
                    wo.work_order_type as "workOrderType",
                    wo.work_order_service_category as "workOrderServiceCategory",
                    wo.work_order_stage_id as "workOrderStageId",
                    wo.start_date as "startDate",
                    wo.end_date as "endDate",
                    wo.time_zone as "timeZone",
                    wo.attachments,
                    wo.created_by as "createdBy",
                    wo.created_at as "createdAt",
                    wo.updated_at as "updatedAt",
                    wo.deleted_at as "deletedAt",
                    wo.execution_priority as "executionPriority"
                FROM ${fromClause}
                WHERE ${whereClause}
                ORDER BY wo.created_at DESC
                LIMIT $${paramCount - 1} OFFSET $${paramCount}
            `;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return {
        nodes: result.rows,
        totalCount,
      };
    },
  },

  Mutation: {
    createWorkOrder: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Get default stage if stage is not provided
        let stageId = input.workOrderStageId;
        if (!stageId) {
          const stageQuery = `
                        SELECT id FROM ${schema}.work_order_stages
                        WHERE is_default = true AND deleted_at IS NULL
                        ORDER BY display_order ASC
                        LIMIT 1
                    `;
          const stageResult = await client.query(stageQuery);
          if (stageResult.rows.length === 0) {
            throw new Error(
              "No default work order stage found. Please create a default stage first."
            );
          }
          stageId = stageResult.rows[0].id;
        }

        // Create work order
        const workOrderQuery = `
                    INSERT INTO ${schema}.work_orders (
                        title,
                        description,
                        severity,
                        location_id,
                        work_order_type,
                        work_order_service_category,
                        work_order_stage_id,
                        execution_priority,
                        time_zone,
                        start_date,
                        end_date,
                        attachments,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING 
                        id,
                        title,
                        description,
                        severity,
                        location_id as "locationId",
                        parent_id as "parentId",
                        work_order_type as "workOrderType",
                        work_order_service_category as "workOrderServiceCategory",
                        work_order_stage_id as "workOrderStageId",
                        start_date as "startDate",
                        end_date as "endDate",
                        time_zone as "timeZone",
                        attachments,
                        created_by as "createdBy",
                        created_at as "createdAt",
                        updated_at as "updatedAt",
                        deleted_at as "deletedAt",
                        execution_priority as "executionPriority"
                `;

        const workOrderParams = [
          input.title,
          input.description || null,
          input.severity || "medium",
          input.locationId,
          input.workOrderType,
          input.workOrderServiceCategory,
          stageId,
          input.executionPriority || "medium",
          input.timeZone || "UTC",
          input.startDate ? new Date(input.startDate) : null,
          input.endDate ? new Date(input.endDate) : null,
          filterValidUuids(input.attachments),
          context.userId,
        ];

        const workOrderResult = await client.query(
          workOrderQuery,
          workOrderParams
        );
        const workOrder = workOrderResult.rows[0];

        // Process file uploads if provided
        let uploadedFileIds = [];
        if (input.fileUploads && input.fileUploads.length > 0) {
          uploadedFileIds = await processFileUploads(
            input.fileUploads,
            'work_order',
            workOrder.id,
            context
          );
        }

        // Combine pre-uploaded attachments with newly uploaded files
        const allAttachments = [
          ...filterValidUuids(input.attachments || []),
          ...uploadedFileIds
        ];

        // Update work order with combined attachments if we have new uploads
        if (uploadedFileIds.length > 0) {
          const updateAttachmentsQuery = `
            UPDATE ${schema}.work_orders
            SET attachments = $1
            WHERE id = $2
          `;
          await client.query(updateAttachmentsQuery, [allAttachments, workOrder.id]);
          workOrder.attachments = allAttachments;
        }

        // Create work order assets
        if (input.workOrderAssets && input.workOrderAssets.length > 0) {
          for (const assetInput of input.workOrderAssets) {
            const assetQuery = `
                            INSERT INTO ${schema}.work_order_assets (
                                work_order_id,
                                asset_id,
                                asset_service_type_id,
                                asset_part_ids,
                                sop_ids,
                                incident_plan_ids,
                                asset_file_ids,
                                location_file_ids
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            RETURNING id
                        `;

            await client.query(assetQuery, [
              workOrder.id,
              assetInput.assetId,
              assetInput.assetServiceTypeId || null,
              filterValidUuids(assetInput.assetPartIds),
              filterValidUuids(assetInput.sopIds),
              filterValidUuids(assetInput.incidentPlanIds),
              filterValidUuids(assetInput.assetFileIds),
              filterValidUuids(assetInput.locationFileIds),
            ]);
          }
        }

        // Create work order assignments
        if (
          input.workOrderAssignments &&
          input.workOrderAssignments.length > 0
        ) {
          for (const assignmentInput of input.workOrderAssignments) {
            const assignmentQuery = `
                            INSERT INTO ${schema}.work_order_assignments (
                                work_order_id,
                                user_ids,
                                assignment_type
                            ) VALUES ($1, $2, $3)
                            RETURNING id
                        `;

            await client.query(assignmentQuery, [
              workOrder.id,
              assignmentInput.userIds,
              assignmentInput.assignmentType,
            ]);
          }
        }

        await client.query("COMMIT");

        return workOrder;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating work order:", error);
        throw new Error(`Failed to create work order: ${error.message}`);
      } finally {
        client.release();
      }
    },

    updateWorkOrder: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Verify work order exists
        const checkQuery = `
          SELECT id FROM ${schema}.work_orders
          WHERE id = $1 AND deleted_at IS NULL
        `;
        const checkResult = await client.query(checkQuery, [input.id]);
        if (checkResult.rows.length === 0) {
          throw new Error("Work order not found");
        }

        const updates = [];
        const params = [];
        let paramCount = 0;

        if (input.title !== undefined) {
          paramCount++;
          updates.push(`title = $${paramCount}`);
          params.push(input.title);
        }

        if (input.description !== undefined) {
          paramCount++;
          updates.push(`description = $${paramCount}`);
          params.push(input.description);
        }

        if (input.severity !== undefined) {
          paramCount++;
          updates.push(`severity = $${paramCount}`);
          params.push(input.severity);
        }

        if (input.locationId !== undefined) {
          paramCount++;
          updates.push(`location_id = $${paramCount}`);
          params.push(input.locationId);
        }

        if (input.workOrderType !== undefined) {
          paramCount++;
          updates.push(`work_order_type = $${paramCount}`);
          params.push(input.workOrderType);
        }

        if (input.workOrderServiceCategory !== undefined) {
          paramCount++;
          updates.push(`work_order_service_category = $${paramCount}`);
          params.push(input.workOrderServiceCategory);
        }

        if (input.workOrderStageId !== undefined) {
          paramCount++;
          updates.push(`work_order_stage_id = $${paramCount}`);
          params.push(input.workOrderStageId);
        }

        if (input.executionPriority !== undefined) {
          paramCount++;
          updates.push(`execution_priority = $${paramCount}`);
          params.push(input.executionPriority);
        }

        if (input.timeZone !== undefined) {
          paramCount++;
          updates.push(`time_zone = $${paramCount}`);
          params.push(input.timeZone);
        }

        if (input.startDate !== undefined) {
          paramCount++;
          updates.push(`start_date = $${paramCount}`);
          params.push(input.startDate ? new Date(input.startDate) : null);
        }

        if (input.endDate !== undefined) {
          paramCount++;
          updates.push(`end_date = $${paramCount}`);
          params.push(input.endDate ? new Date(input.endDate) : null);
        }

        // Process file uploads if provided
        let uploadedFileIds = [];
        if (input.fileUploads && input.fileUploads.length > 0) {
          uploadedFileIds = await processFileUploads(
            input.fileUploads,
            'work_order',
            input.id,
            context
          );
        }

        // Handle attachments - combine pre-uploaded with newly uploaded
        if (input.attachments !== undefined || uploadedFileIds.length > 0) {
          const allAttachments = [
            ...filterValidUuids(input.attachments || []),
            ...uploadedFileIds
          ];
          paramCount++;
          updates.push(`attachments = $${paramCount}`);
          params.push(allAttachments);
        }

        // Update work order if there are any field updates
        if (updates.length > 0) {
          // Add updated_at without incrementing paramCount (it uses NOW(), not a parameter)
          updates.push(`updated_at = NOW()`);

          // Add the id parameter for the WHERE clause
          paramCount++;
          params.push(input.id);

          const updateQuery = `
            UPDATE ${schema}.work_orders
            SET ${updates.join(", ")}
            WHERE id = $${paramCount} AND deleted_at IS NULL
          `;

          await client.query(updateQuery, params);
        }

        // Handle work order assets
        if (input.workOrderAssets !== undefined) {
          // Get existing asset IDs to track what to keep/delete
          const existingAssetsResult = await client.query(
            `SELECT id FROM ${schema}.work_order_assets WHERE work_order_id = $1`,
            [input.id]
          );
          const existingAssetIds = existingAssetsResult.rows.map((r) => r.id);
          const inputAssetIds = input.workOrderAssets
            .map((a) => a.id)
            .filter((id) => id !== null && id !== undefined);

          // Delete assets that are not in the input (if id is provided, we update; if not, we replace all)
          if (inputAssetIds.length > 0) {
            // Delete assets not in the input list
            const assetIdsToDelete = existingAssetIds.filter(
              (id) => !inputAssetIds.includes(id)
            );
            if (assetIdsToDelete.length > 0) {
              await client.query(
                `DELETE FROM ${schema}.work_order_assets WHERE id = ANY($1)`,
                [assetIdsToDelete]
              );
            }

            // Update existing assets
            for (const assetInput of input.workOrderAssets) {
              if (assetInput.id) {
                const updateAssetQuery = `
                  UPDATE ${schema}.work_order_assets
                  SET 
                    asset_id = $1,
                    asset_service_type_id = $2,
                    asset_part_ids = $3,
                    sop_ids = $4,
                    incident_plan_ids = $5,
                    asset_file_ids = $6,
                    location_file_ids = $7
                  WHERE id = $8 AND work_order_id = $9
                `;
                await client.query(updateAssetQuery, [
                  assetInput.assetId,
                  assetInput.assetServiceTypeId || null,
                  filterValidUuids(assetInput.assetPartIds),
                  filterValidUuids(assetInput.sopIds),
                  filterValidUuids(assetInput.incidentPlanIds),
                  filterValidUuids(assetInput.assetFileIds),
                  filterValidUuids(assetInput.locationFileIds),
                  assetInput.id,
                  input.id,
                ]);
              }
            }
          } else {
            // No IDs provided, replace all assets
            await client.query(
              `DELETE FROM ${schema}.work_order_assets WHERE work_order_id = $1`,
              [input.id]
            );
          }

          // Create new assets (those without IDs)
          for (const assetInput of input.workOrderAssets) {
            if (!assetInput.id) {
              const assetQuery = `
                INSERT INTO ${schema}.work_order_assets (
                  work_order_id,
                  asset_id,
                  asset_service_type_id,
                  asset_part_ids,
                  sop_ids,
                  incident_plan_ids,
                  asset_file_ids,
                  location_file_ids
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
              `;

              await client.query(assetQuery, [
                input.id,
                assetInput.assetId,
                assetInput.assetServiceTypeId || null,
                filterValidUuids(assetInput.assetPartIds),
                filterValidUuids(assetInput.sopIds),
                filterValidUuids(assetInput.incidentPlanIds),
                filterValidUuids(assetInput.assetFileIds),
                filterValidUuids(assetInput.locationFileIds),
              ]);
            }
          }
        }

        // Handle work order assignments
        if (input.workOrderAssignments !== undefined) {
          // Get existing assignment IDs to track what to keep/delete
          const existingAssignmentsResult = await client.query(
            `SELECT id FROM ${schema}.work_order_assignments WHERE work_order_id = $1 AND deleted_at IS NULL`,
            [input.id]
          );
          const existingIds = existingAssignmentsResult.rows.map((r) => r.id);
          const inputIds = input.workOrderAssignments
            .map((a) => a.id)
            .filter((id) => id !== null && id !== undefined);

          // Delete assignments that are not in the input (if id is provided, we update; if not, we replace all)
          if (inputIds.length > 0) {
            // Delete assignments not in the input list
            const idsToDelete = existingIds.filter(
              (id) => !inputIds.includes(id)
            );
            if (idsToDelete.length > 0) {
              await client.query(
                `UPDATE ${schema}.work_order_assignments SET deleted_at = NOW() WHERE id = ANY($1)`,
                [idsToDelete]
              );
            }

            // Update existing assignments
            for (const assignmentInput of input.workOrderAssignments) {
              if (assignmentInput.id) {
                const updateAssignmentQuery = `
                  UPDATE ${schema}.work_order_assignments
                  SET user_ids = $1, assignment_type = $2, updated_at = NOW()
                  WHERE id = $3 AND work_order_id = $4 AND deleted_at IS NULL
                `;
                await client.query(updateAssignmentQuery, [
                  assignmentInput.userIds,
                  assignmentInput.assignmentType,
                  assignmentInput.id,
                  input.id,
                ]);
              }
            }
          } else {
            // No IDs provided, replace all assignments
            await client.query(
              `UPDATE ${schema}.work_order_assignments SET deleted_at = NOW() WHERE work_order_id = $1 AND deleted_at IS NULL`,
              [input.id]
            );
          }

          // Create new assignments (those without IDs)
          for (const assignmentInput of input.workOrderAssignments) {
            if (!assignmentInput.id) {
              const assignmentQuery = `
                INSERT INTO ${schema}.work_order_assignments (
                  work_order_id,
                  user_ids,
                  assignment_type
                ) VALUES ($1, $2, $3)
                RETURNING id
              `;

              await client.query(assignmentQuery, [
                input.id,
                assignmentInput.userIds,
                assignmentInput.assignmentType,
              ]);
            }
          }
        }

        await client.query("COMMIT");

        // Fetch and return updated work order
        const fetchQuery = `
          SELECT 
            id,
            title,
            description,
            severity,
            location_id as "locationId",
            parent_id as "parentId",
            work_order_type as "workOrderType",
            work_order_service_category as "workOrderServiceCategory",
            work_order_stage_id as "workOrderStageId",
            start_date as "startDate",
            end_date as "endDate",
            time_zone as "timeZone",
            attachments,
            created_by as "createdBy",
            created_at as "createdAt",
            updated_at as "updatedAt",
            deleted_at as "deletedAt",
            execution_priority as "executionPriority"
          FROM ${schema}.work_orders
          WHERE id = $1 AND deleted_at IS NULL
        `;

        const result = await client.query(fetchQuery, [input.id]);
        return result.rows[0];
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating work order:", error);
        throw new Error(`Failed to update work order: ${error.message}`);
      } finally {
        client.release();
      }
    },

    deleteWorkOrder: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const query = `
                UPDATE ${schema}.work_orders
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING id
            `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error("Work order not found");
      }

      return true;
    },

    updateWorkOrderStage: async (parent, { workOrderId, stageId }, context) => {
      if (!context.user) {
        throw new Error("Not authenticated");
      }

      const schema = context.schema;
      const query = `
                UPDATE ${schema}.work_orders
                SET work_order_stage_id = $1, updated_at = NOW()
                WHERE id = $2 AND deleted_at IS NULL
                RETURNING 
                    id,
                    title,
                    description,
                    severity,
                    location_id as "locationId",
                    parent_id as "parentId",
                    work_order_type as "workOrderType",
                    work_order_service_category as "workOrderServiceCategory",
                    work_order_stage_id as "workOrderStageId",
                    start_date as "startDate",
                    end_date as "endDate",
                    time_zone as "timeZone",
                    attachments,
                    created_by as "createdBy",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt",
                    execution_priority as "executionPriority"
            `;

      const result = await pool.query(query, [stageId, workOrderId]);

      if (result.rows.length === 0) {
        throw new Error("Work order not found");
      }

      return result.rows[0];
    },
  },

  WorkOrder: {
    location: async (parent, args, context) => {
      if (!parent.locationId) return null;

      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    location_name as "locationName",
                    description,
                    location_type as "locationTypeId",
                    address,
                    city,
                    state,
                    zipcode,
                    country,
                    coordinates,
                    parent_id as "parentId",
                    file_ids as "fileIds",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt"
                FROM ${schema}.locations
                WHERE id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.locationId]);
      return result.rows[0] || null;
    },

    workOrderStage: async (parent, args, context) => {
      if (!parent.workOrderStageId) return null;

      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    name,
                    color_code,
                    is_default,
                    display_order,
                    created_at,
                    updated_at
                FROM ${schema}.work_order_stages
                WHERE id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.workOrderStageId]);
      return result.rows[0] || null;
    },

    workOrderAssets: async (parent, args, context) => {
      const schema = context.schema;
      const query = `
                SELECT 
                    woa.id,
                    woa.work_order_id as "workOrderId",
                    woa.asset_id as "assetId",
                    woa.asset_service_type_id as "assetServiceTypeId",
                    woa.asset_part_ids as "assetPartIds",
                    woa.sop_ids as "sopIds",
                    woa.incident_plan_ids as "incidentPlanIds",
                    woa.asset_file_ids as "assetFileIds",
                    woa.location_file_ids as "locationFileIds",
                    woa.created_at as "createdAt",
                    (a.location_ids[1])::uuid as "locationId",
                    loc.location_type as "locationType",
                    mlt.name as "locationTypeName"
                FROM ${schema}.work_order_assets woa
                LEFT JOIN ${schema}.assets a ON woa.asset_id = a.id AND a.deleted_at IS NULL
                LEFT JOIN ${schema}.locations loc ON (a.location_ids[1])::uuid = loc.id AND loc.deleted_at IS NULL
                LEFT JOIN public.location_types mlt ON loc.location_type = mlt.id AND mlt.deleted_at IS NULL
                WHERE woa.work_order_id = $1
            `;

      const result = await pool.query(query, [parent.id]);
      return result.rows;
    },

    workOrderAssignments: async (parent, args, context) => {
      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    work_order_id as "workOrderId",
                    user_ids as "userIds",
                    assignment_type as "assignmentType",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt"
                FROM ${schema}.work_order_assignments
                WHERE work_order_id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.id]);
      return result.rows;
    },

    parent: async (parent, args, context) => {
      if (!parent.parentId) return null;

      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    title,
                    description,
                    severity,
                    location_id as "locationId",
                    parent_id as "parentId",
                    work_order_type as "workOrderType",
                    work_order_service_category as "workOrderServiceCategory",
                    work_order_stage_id as "workOrderStageId",
                    start_date as "startDate",
                    end_date as "endDate",
                    time_zone as "timeZone",
                    attachments,
                    created_by as "createdBy",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt",
                    execution_priority as "executionPriority"
                FROM ${schema}.work_orders
                WHERE id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.parentId]);
      return result.rows[0] || null;
    },
  },

  WorkOrderAsset: {
    asset: async (parent, args, context) => {
      if (!parent.assetId) return null;

      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    name,
                    description,
                    location_ids as "locationIds",
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt"
                FROM ${schema}.assets
                WHERE id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.assetId]);
      return result.rows[0] || null;
    },

    assetServiceType: async (parent, args, context) => {
      if (!parent.assetServiceTypeId) return null;

      const query = `
                SELECT 
                    id,
                    name,
                    asset_category_ids,
                    description,
                    created_at,
                    updated_at
                FROM public.master_asset_service_types
                WHERE id = $1 AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.assetServiceTypeId]);
      return result.rows[0] || null;
    },
  },

  WorkOrderAssignment: {
    users: async (parent, args, context) => {
      if (!parent.userIds || parent.userIds.length === 0) return [];

      const schema = context.schema;
      const query = `
                SELECT 
                    id,
                    email,
                    first_name as "firstName",
                    last_name as "lastName",
                    phone,
                    role,
                    active,
                    created_at as "createdAt",
                    updated_at as "updatedAt",
                    deleted_at as "deletedAt"
                FROM ${schema}.users
                WHERE id = ANY($1) AND deleted_at IS NULL
            `;

      const result = await pool.query(query, [parent.userIds]);
      return result.rows;
    },
  },

  Asset: {
    workOrders: async (parent, args, context) => {
      if (!parent.id) return [];

      const schema = context.schema;
      const query = `
        SELECT 
          wo.id,
          wo.title,
          wo.description,
          wo.severity,
          wo.location_id as "locationId",
          wo.parent_id as "parentId",
          wo.work_order_type_id as "workOrderTypeId",
          wo.work_order_service_category_id as "workOrderServiceCategoryId",
          wo.work_order_stage_id as "workOrderStageId",
          wo.start_date as "startDate",
          wo.end_date as "endDate",
          wo.time_zone as "timeZone",
          wo.attachments,
          wo.created_by as "createdBy",
          wo.created_at as "createdAt",
          wo.updated_at as "updatedAt",
          wo.deleted_at as "deletedAt",
          wo.execution_priority as "executionPriority"
        FROM ${schema}.work_orders wo
        INNER JOIN ${schema}.work_order_assets woa ON wo.id = woa.work_order_id
        WHERE woa.asset_id = $1 AND wo.deleted_at IS NULL
        ORDER BY wo.created_at DESC
      `;

      const result = await pool.query(query, [parent.id]);
      return result.rows;
    },
  },

  Location: {
    workOrders: async (parent, args, context) => {
      if (!parent.id) return [];

      const schema = context.schema;
      const query = `
        SELECT 
          id,
          title,
          description,
          severity,
          location_id as "locationId",
          parent_id as "parentId",
          work_order_type_id as "workOrderTypeId",
          work_order_service_category_id as "workOrderServiceCategoryId",
          work_order_stage_id as "workOrderStageId",
          start_date as "startDate",
          end_date as "endDate",
          time_zone as "timeZone",
          attachments,
          created_by as "createdBy",
          created_at as "createdAt",
          updated_at as "updatedAt",
          deleted_at as "deletedAt",
          execution_priority as "executionPriority"
        FROM ${schema}.work_orders
        WHERE location_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [parent.id]);
      return result.rows;
    },
  },
};

module.exports = workOrderResolvers;
