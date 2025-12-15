-- =====================================================
-- Migration: Add action_type and master_sop_incident_plan_id to asset_sops_incident_plans
-- Created: 2025-12-11
-- =====================================================

-- Create enum type for sop_action_type
CREATE TYPE ca_template_tenant.sop_action_type AS ENUM ('new', 'extend');

-- Add new columns to asset_sops_incident_plans table
ALTER TABLE ca_template_tenant.asset_sops_incident_plans
ADD COLUMN action_type ca_template_tenant.sop_action_type DEFAULT 'new',
ADD COLUMN master_sop_incident_plan_id UUID;

-- Create index on master_sop_incident_plan_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_asset_sops_incident_plans_master_id
    ON ca_template_tenant.asset_sops_incident_plans (master_sop_incident_plan_id);

-- Add comment to document the new columns
COMMENT ON COLUMN ca_template_tenant.asset_sops_incident_plans.action_type IS 'Indicates if this is a new SOP or extends a master SOP';
COMMENT ON COLUMN ca_template_tenant.asset_sops_incident_plans.master_sop_incident_plan_id IS 'Reference to master SOP in public.master_sops_incident_plans table';
