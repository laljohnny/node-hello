-- Update ca_template_tenant.asset_maintenance_schedules to match new structure
BEGIN;

-- Add new columns if they don't exist
ALTER TABLE ca_template_tenant.asset_maintenance_schedules
    ADD COLUMN IF NOT EXISTS schedule_type public.schedule_type,
    ADD COLUMN IF NOT EXISTS interval_unit public.interval_type,
    ADD COLUMN IF NOT EXISTS interval_value INTEGER NOT NULL DEFAULT 1;

-- Remove old columns if they exist
ALTER TABLE ca_template_tenant.asset_maintenance_schedules
    DROP COLUMN IF EXISTS frequency,
    DROP COLUMN IF EXISTS frequency_value,
    DROP COLUMN IF EXISTS asset_part_ids; -- Remove if strictly following the new structure which omits it

COMMIT;
