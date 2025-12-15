-- =====================================================
-- Migration: Modify work_order_assets table structure
-- Created: 2025-12-11
-- Description: Remove asset_part_ids, sop_ids, incident_plan_ids columns
--              and add asset_sop_incident_plan_ids column
-- =====================================================

-- Remove the deprecated columns
ALTER TABLE ca_template_tenant.work_order_assets
DROP COLUMN IF EXISTS asset_part_ids,
DROP COLUMN IF EXISTS sop_ids,
DROP COLUMN IF EXISTS attached_asset_file_ids,
DROP COLUMN IF EXISTS incident_plan_ids;

-- Add new column for unified SOP/Incident Plan IDs
ALTER TABLE ca_template_tenant.work_order_assets
ADD COLUMN asset_sop_incident_plan_ids UUID[];

-- Create index on the new column for faster lookups
CREATE INDEX IF NOT EXISTS idx_work_order_assets_sop_incident_plan_ids
    ON ca_template_tenant.work_order_assets USING GIN (asset_sop_incident_plan_ids);

-- Add comment to document the new column
COMMENT ON COLUMN ca_template_tenant.work_order_assets.asset_sop_incident_plan_ids IS 'References to asset_sops_incident_plans records for the work order asset';

