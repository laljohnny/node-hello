-- =====================================================
-- Migration: Add timestamp columns to work_order_assets
-- Created: 2025-12-12
-- Description: Add updated_at and deleted_at columns to work_order_assets table
--              with automatic update trigger for updated_at
-- =====================================================

-- Add updated_at column with default current timestamp
ALTER TABLE ca_template_tenant.work_order_assets
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add deleted_at column for soft deletes
ALTER TABLE ca_template_tenant.work_order_assets
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION ca_template_tenant.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_update_work_order_assets_updated_at ON ca_template_tenant.work_order_assets;
CREATE TRIGGER trigger_update_work_order_assets_updated_at
    BEFORE UPDATE ON ca_template_tenant.work_order_assets
    FOR EACH ROW
    EXECUTE FUNCTION ca_template_tenant.update_updated_at_column();

-- Add comments to document the new columns
COMMENT ON COLUMN ca_template_tenant.work_order_assets.updated_at IS 'Timestamp of last update, automatically updated on row modification';
COMMENT ON COLUMN ca_template_tenant.work_order_assets.deleted_at IS 'Timestamp for soft delete, NULL if not deleted';

