-- ============================================================================
-- DATABASE FUNCTIONS - Consolidated from migrations
-- ============================================================================
-- This file contains all functions identified from the migrations folder
-- Organized by category for better maintainability
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE UTILITY FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Generic trigger function to automatically update updated_at timestamp
-- Schema: public
-- Source: public_schema.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Generic trigger function to automatically update updated_at timestamp on row updates';


-- ----------------------------------------------------------------------------
-- Function: generate_ticket_short_code
-- Purpose: Auto-generate short codes for tickets (e.g., TKT-2025-0001)
-- Schema: public
-- Source: public_schema.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_ticket_short_code() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    new_short_code VARCHAR(20);
    counter INTEGER := 1;
BEGIN
    -- Generate short code like TKT-2025-0001
    LOOP
        new_short_code := 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM tickets WHERE short_code = new_short_code);
        counter := counter + 1;
    END LOOP;
    
    NEW.short_code := new_short_code;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_ticket_short_code() IS 
'Trigger function to auto-generate unique short codes for tickets';


-- ============================================================================
-- SECTION 2: TENANT SCHEMA MANAGEMENT FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: clone_schema_for_tenant
-- Purpose: Clones template schema for a new tenant company
-- Schema: public
-- Source: public_schema.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clone_schema_for_tenant(
    p_company_id uuid, 
    p_subdomain character varying
) 
RETURNS TABLE(success boolean, schema_name character varying, message text)
LANGUAGE plpgsql
AS $$
DECLARE
    v_schema_name VARCHAR(100);
    v_table_name TEXT;
    v_company_exists BOOLEAN;
BEGIN
    -- Validate company exists
    SELECT EXISTS(SELECT 1 FROM companies WHERE id = p_company_id) INTO v_company_exists;
    
    IF NOT v_company_exists THEN
        RETURN QUERY SELECT false, NULL::VARCHAR(100), 'Company not found';
        RETURN;
    END IF;
    
    -- Generate schema name
    v_schema_name := 'ca_' || LOWER(REGEXP_REPLACE(p_subdomain, '[^a-zA-Z0-9]', '_', 'g'));
    
    -- Check if schema already exists
    IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
        RETURN QUERY SELECT false, v_schema_name, 'Schema already exists';
        RETURN;
    END IF;
    
    -- Create new schema
    EXECUTE format('CREATE SCHEMA %I', v_schema_name);
    
    -- Clone all tables from template with ALL constraints and indexes
    FOR v_table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'ca_template_tenant'
        ORDER BY tablename
    LOOP
        -- Create table with ALL structure (including constraints, indexes, defaults)
        EXECUTE format(
            'CREATE TABLE %I.%I (LIKE ca_template_tenant.%I INCLUDING ALL)',
            v_schema_name, v_table_name, v_table_name
        );
    END LOOP;
    
    -- Recreate foreign key constraints (they are not included in LIKE ... INCLUDING ALL)
    -- Users table foreign keys
    EXECUTE format('ALTER TABLE %I.user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE', v_schema_name, v_schema_name);
    EXECUTE format('ALTER TABLE %I.user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE', v_schema_name, v_schema_name);
    
    -- Folder foreign keys
    EXECUTE format('ALTER TABLE %I.folders ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES %I.folders(id)', v_schema_name, v_schema_name);
    EXECUTE format('ALTER TABLE %I.files ADD CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES %I.folders(id)', v_schema_name, v_schema_name);
    
    -- Location foreign keys
    EXECUTE format('ALTER TABLE %I.locations ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES %I.locations(id)', v_schema_name, v_schema_name);
    
    -- Asset foreign keys
    EXECUTE format('ALTER TABLE %I.work_orders ADD CONSTRAINT work_orders_stage_id_fkey FOREIGN KEY (work_order_stage_id) REFERENCES %I.work_order_stages(id)', v_schema_name, v_schema_name);
    EXECUTE format('ALTER TABLE %I.work_order_assets ADD CONSTRAINT work_order_assets_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES %I.work_orders(id) ON DELETE CASCADE', v_schema_name, v_schema_name);
    EXECUTE format('ALTER TABLE %I.work_order_assets ADD CONSTRAINT work_order_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES %I.assets(id)', v_schema_name, v_schema_name);

    -- Update company record
    UPDATE companies
    SET 
        schema_name = v_schema_name,
        schema_status = 'active',
        schema_created_at = NOW(),
        schema_updated_at = NOW()
    WHERE id = p_company_id;
    
    -- Return success
    RETURN QUERY SELECT true, v_schema_name, 'Schema created successfully';
    
EXCEPTION WHEN OTHERS THEN
    -- Rollback: drop schema if it was created
    IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
        EXECUTE format('DROP SCHEMA %I CASCADE', v_schema_name);
    END IF;
    
    -- Update company status to failed
    UPDATE companies
    SET schema_status = 'creating'
    WHERE id = p_company_id;
    
    -- Return error
    RETURN QUERY SELECT false, v_schema_name, 'Error: ' || SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.clone_schema_for_tenant(p_company_id uuid, p_subdomain character varying) IS 
'Clones template schema for a new tenant company (FIXED: proper foreign key handling)';


-- ============================================================================
-- SECTION 3: DASHBOARD & WIDGET MANAGEMENT FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: create_dashboard_material_view
-- Purpose: Creates a materialized view for dashboard widgets in a tenant schema
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_dashboard_material_view(schema_name TEXT)
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    full_table_name TEXT := quote_ident(schema_name) || '.dashboard_material_view';
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    EXECUTE format($sql$
        CREATE TABLE IF NOT EXISTS %s (
            id BIGSERIAL PRIMARY KEY,
            master_widget_id BIGINT NOT NULL,
            attributes JSONB,
            view_name TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    $sql$, full_table_name);

    -- update trigger for tenant tables
    EXECUTE format($sql$
        CREATE OR REPLACE FUNCTION %1$s.update_dashboard_material_view_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS update_dashboard_material_view_updated_at ON %1$s.dashboard_material_view;
        CREATE TRIGGER update_dashboard_material_view_updated_at
        BEFORE UPDATE ON %1$s.dashboard_material_view
        FOR EACH ROW
        EXECUTE PROCEDURE %1$s.update_dashboard_material_view_updated_at();
    $sql$, quote_ident(schema_name));
END;
$$;

COMMENT ON FUNCTION public.create_dashboard_material_view(TEXT) IS 
'Creates dashboard materialized view table and triggers for a tenant schema';


-- ----------------------------------------------------------------------------
-- Function: handle_new_company
-- Purpose: Trigger function to create dashboard view when company becomes active
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.schema_status = 'active'
       AND (OLD.schema_status IS DISTINCT FROM 'active') THEN
        PERFORM create_dashboard_material_view(NEW.schema_name);
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_company() IS 
'Trigger function that creates dashboard view when a company schema becomes active';


-- ============================================================================
-- SECTION 4: USER EMAIL LOOKUP FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: create_user_email_lookup_view
-- Purpose: Dynamically builds user_email_schema_lookup materialized view
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_email_lookup_view()
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_schema RECORD;
  sql_query TEXT;
BEGIN
  -- Start building the SQL query
  sql_query := 'CREATE MATERIALIZED VIEW IF NOT EXISTS user_email_schema_lookup AS ';
  
  -- Add public schema users
  sql_query := sql_query || '
    SELECT 
      u.email,
      c.schema_name,
      ''public'' as user_schema,
      u.id as user_id,
      u.company_id as company_id,
      u.role
    FROM public.users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.deleted_at IS NULL';
  
  -- Add UNION ALL for each tenant schema
  FOR tenant_schema IN 
    SELECT schema_name 
    FROM companies 
    WHERE schema_status = 'active' 
      AND schema_name IS NOT NULL 
      AND role = 'company'
  LOOP
    sql_query := sql_query || format('
      UNION ALL
      SELECT 
        u.email,
        %L as schema_name,
        %L as user_schema,
        u.id as user_id,
        %L as company_id,
        u.role
      FROM %I.users u
      WHERE u.deleted_at IS NULL',
      tenant_schema.schema_name,
      tenant_schema.schema_name,
      (SELECT id FROM companies WHERE schema_name = tenant_schema.schema_name),
      tenant_schema.schema_name
    );
  END LOOP;
  
  -- Execute the dynamic SQL
  EXECUTE sql_query;
  
  -- Create indexes
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_email_lookup ON user_email_schema_lookup(email)';
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_schema_unique ON user_email_schema_lookup(email, schema_name)';
  
  RAISE NOTICE 'User email lookup view created successfully';
END;
$$;

COMMENT ON FUNCTION public.create_user_email_lookup_view() IS 
'Dynamically builds the user_email_schema_lookup materialized view by UNIONing all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: refresh_user_email_lookup
-- Purpose: Refreshes the user_email_schema_lookup materialized view
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_user_email_lookup()
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  DROP MATERIALIZED VIEW IF EXISTS user_email_schema_lookup CASCADE;
  PERFORM create_user_email_lookup_view();
  RAISE NOTICE 'User email lookup view refreshed successfully';
END;
$$;

COMMENT ON FUNCTION public.refresh_user_email_lookup() IS 
'Drops and recreates the user_email_schema_lookup materialized view';


-- ----------------------------------------------------------------------------
-- Function: trigger_refresh_user_email_lookup
-- Purpose: Trigger function to refresh user email lookup on data changes
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_refresh_user_email_lookup()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_user_email_lookup();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_refresh_user_email_lookup() IS
'Trigger function that refreshes the user_email_schema_lookup materialized view.
Called automatically when companies or users are added/updated in any schema.';


-- ----------------------------------------------------------------------------
-- Function: add_user_trigger_to_tenant_schema
-- Purpose: Adds user change triggers to a tenant schema
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_user_trigger_to_tenant_schema(schema_name TEXT)
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS refresh_email_lookup_on_user_change ON %I.users;
    CREATE TRIGGER refresh_email_lookup_on_user_change
    AFTER INSERT OR UPDATE OF email, deleted_at OR DELETE ON %I.users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_user_email_lookup();
  ', schema_name, schema_name);
  
  RAISE NOTICE 'Added user trigger to schema: %', schema_name;
END;
$$;

COMMENT ON FUNCTION public.add_user_trigger_to_tenant_schema(TEXT) IS
'Adds user change trigger to a specific tenant schema.
Call this function when provisioning new tenant schemas.
Example: SELECT add_user_trigger_to_tenant_schema(''ca_newcompany'');';


-- ============================================================================
-- SECTION 5: SUBSCRIPTION MANAGEMENT FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: refresh_company_subscription_details
-- Purpose: Refreshes the company_subscription_details materialized view
-- Schema: public
-- Source: create_subscription_details_view.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_company_subscription_details()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.refresh_company_subscription_details() IS 
'Trigger function to refresh company_subscription_details materialized view';


-- ============================================================================
-- SECTION 6: MIGRATION FUNCTIONS FOR EXISTING TENANT SCHEMAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: migrate_04_maintenance_schedules_all_tenants
-- Purpose: Migrates maintenance schedule schema changes to all tenant schemas
-- Schema: public
-- Source: 04_ai_config_and_maintenance_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.migrate_04_maintenance_schedules_all_tenants()
RETURNS TABLE(schema_name text, status text) 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema text;
BEGIN
    FOR tenant_schema IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname LIKE 'ca_%'
        AND nspname != 'ca_template_tenant'
        ORDER BY nspname
    LOOP
        BEGIN
            -- Add new column
            EXECUTE format('
                ALTER TABLE %I.asset_maintenance_schedules
                ADD COLUMN IF NOT EXISTS assigned_to_user_ids UUID[] DEFAULT ARRAY[]::UUID[]
            ', tenant_schema);

            -- Migrate data
            EXECUTE format('
                UPDATE %I.asset_maintenance_schedules
                SET assigned_to_user_ids = ARRAY[assigned_to_user_id]
                WHERE assigned_to_user_id IS NOT NULL 
                  AND (assigned_to_user_ids IS NULL OR assigned_to_user_ids = ARRAY[]::UUID[])
            ', tenant_schema);

            -- Drop old column
            EXECUTE format('
                ALTER TABLE %I.asset_maintenance_schedules
                DROP COLUMN IF EXISTS assigned_to_user_id
            ', tenant_schema);
            
            -- Add comment
            EXECUTE format('
                COMMENT ON COLUMN %I.asset_maintenance_schedules.assigned_to_user_ids IS ''List of users assigned to this maintenance schedule''
            ', tenant_schema);

            schema_name := tenant_schema;
            status := 'SUCCESS';
            RETURN NEXT;

        EXCEPTION WHEN OTHERS THEN
            schema_name := tenant_schema;
            status := 'FAILED: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.migrate_04_maintenance_schedules_all_tenants() IS 
'Migrates maintenance schedule changes (assigned_to_user_id -> assigned_to_user_ids) to all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: migrate_add_frequency_value_to_all_tenants
-- Purpose: Adds frequency_value column to maintenance schedules in all tenants
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.migrate_add_frequency_value_to_all_tenants()
RETURNS TABLE(schema_name text, status text) 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema text;
    constraint_exists boolean;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'ca_%' 
        AND nspname != 'ca_template_tenant'
        ORDER BY nspname
    LOOP
        BEGIN
            EXECUTE format('
                ALTER TABLE %I.asset_maintenance_schedules 
                ADD COLUMN IF NOT EXISTS frequency_value integer DEFAULT 1 NOT NULL
            ', tenant_schema);
            
            EXECUTE format('
                SELECT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = ''asset_maintenance_schedules_frequency_value_check''
                    AND connamespace = %L::regnamespace
                )
            ', tenant_schema) INTO constraint_exists;
            
            IF NOT constraint_exists THEN
                EXECUTE format('
                    ALTER TABLE %I.asset_maintenance_schedules 
                    ADD CONSTRAINT asset_maintenance_schedules_frequency_value_check 
                    CHECK (frequency_value > 0)
                ', tenant_schema);
            END IF;
            
            schema_name := tenant_schema;
            status := 'SUCCESS';
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            schema_name := tenant_schema;
            status := 'FAILED: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.migrate_add_frequency_value_to_all_tenants() IS 
'Adds frequency_value column to asset_maintenance_schedules in all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: migrate_add_timezone_to_all_tenants
-- Purpose: Adds timezone support to all tenant schemas
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.migrate_add_timezone_to_all_tenants()
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema TEXT;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname
        FROM pg_namespace 
        WHERE nspname LIKE 'ca_%' 
        AND nspname != 'ca_template_tenant'
    LOOP
        EXECUTE format('
            ALTER TABLE %I.asset_maintenance_schedules 
            ADD COLUMN IF NOT EXISTS time_zone VARCHAR(100) DEFAULT ''UTC''
        ', tenant_schema);
        
        EXECUTE format('
            COMMENT ON COLUMN %I.asset_maintenance_schedules.time_zone IS ''Time zone for the maintenance schedule (e.g., UTC, America/New_York)''
        ', tenant_schema);
        
        RAISE NOTICE 'Added time_zone column to %.asset_maintenance_schedules', tenant_schema;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.migrate_add_timezone_to_all_tenants() IS 
'Adds time_zone column to asset_maintenance_schedules in all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: fix_asset_parts_unique_constraint_all_tenants
-- Purpose: Fixes unique constraints on asset_parts table across all tenants
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fix_asset_parts_unique_constraint_all_tenants()
RETURNS TABLE(schema_name text, status text) 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema text;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'ca_%' 
        AND nspname != 'ca_template_tenant'
        ORDER BY nspname
    LOOP
        BEGIN
            EXECUTE format('
                ALTER TABLE %I.asset_parts 
                DROP CONSTRAINT IF EXISTS asset_parts_asset_id_master_part_id_key
            ', tenant_schema);
            
            EXECUTE format('
                DROP INDEX IF EXISTS %I.asset_parts_asset_id_master_part_id_active_key;
                CREATE UNIQUE INDEX asset_parts_asset_id_master_part_id_active_key 
                ON %I.asset_parts (asset_id, master_asset_part_id) 
                WHERE deleted_at IS NULL
            ', tenant_schema, tenant_schema);
            
            schema_name := tenant_schema;
            status := 'SUCCESS';
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            schema_name := tenant_schema;
            status := 'FAILED: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fix_asset_parts_unique_constraint_all_tenants() IS 
'Fixes asset_parts unique constraint to support soft deletes in all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: fix_enum_types_in_tenant_schemas
-- Purpose: Fixes enum type definitions in all tenant schemas
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fix_enum_types_in_tenant_schemas()
RETURNS TABLE(schema_name text, status text) 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema text;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'ca_%' 
        AND nspname != 'ca_template_tenant'
        ORDER BY nspname
    LOOP
        BEGIN
            -- Create content_type enum in tenant schema
            EXECUTE format('
                DO $inner$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''content_type'' AND typnamespace = %L::regnamespace) THEN
                        CREATE TYPE %I.content_type AS ENUM (''text'', ''file'');
                    END IF;
                END $inner$;
            ', tenant_schema, tenant_schema);
            
            -- Create content_source enum in tenant schema
            EXECUTE format('
                DO $inner$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''content_source'' AND typnamespace = %L::regnamespace) THEN
                        CREATE TYPE %I.content_source AS ENUM (''manual'', ''ai'', ''upload'');
                    END IF;
                END $inner$;
            ', tenant_schema, tenant_schema);
            
            schema_name := tenant_schema;
            status := 'SUCCESS';
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            schema_name := tenant_schema;
            status := 'FAILED: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fix_enum_types_in_tenant_schemas() IS 
'Creates content_type and content_source enums in all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: fix_work_order_constraints_in_all_tenants
-- Purpose: Fixes work order table constraints across all tenant schemas
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fix_work_order_constraints_in_all_tenants()
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    schema_rec RECORD;
BEGIN
    FOR schema_rec IN 
        SELECT schema_name 
        FROM public.companies 
        WHERE schema_status = 'active' AND schema_name IS NOT NULL
    LOOP
        EXECUTE format('ALTER TABLE %I.master_work_order_assignment_types DROP CONSTRAINT IF EXISTS master_work_order_assignment_types_name_key', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.master_work_order_service_categories DROP CONSTRAINT IF EXISTS master_work_order_service_categories_name_key', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.master_work_order_stages DROP CONSTRAINT IF EXISTS master_work_order_stages_name_key', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.master_work_order_types DROP CONSTRAINT IF EXISTS master_work_order_types_name_key', schema_rec.schema_name);

        EXECUTE format('DROP INDEX IF EXISTS %I.master_work_order_assignment_types_name_unique', schema_rec.schema_name);
        EXECUTE format('CREATE UNIQUE INDEX master_work_order_assignment_types_name_unique ON %I.master_work_order_assignment_types (name) WHERE deleted_at IS NULL', schema_rec.schema_name);
        
        EXECUTE format('DROP INDEX IF EXISTS %I.master_work_order_service_categories_name_unique', schema_rec.schema_name);
        EXECUTE format('CREATE UNIQUE INDEX master_work_order_service_categories_name_unique ON %I.master_work_order_service_categories (name) WHERE deleted_at IS NULL', schema_rec.schema_name);
        
        EXECUTE format('DROP INDEX IF EXISTS %I.master_work_order_stages_name_unique', schema_rec.schema_name);
        EXECUTE format('CREATE UNIQUE INDEX master_work_order_stages_name_unique ON %I.master_work_order_stages (name) WHERE deleted_at IS NULL', schema_rec.schema_name);
        
        EXECUTE format('DROP INDEX IF EXISTS %I.master_work_order_types_name_unique', schema_rec.schema_name);
        EXECUTE format('CREATE UNIQUE INDEX master_work_order_types_name_unique ON %I.master_work_order_types (name) WHERE deleted_at IS NULL', schema_rec.schema_name);

        RAISE NOTICE 'Fixed unique constraints for schema: %', schema_rec.schema_name;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.fix_work_order_constraints_in_all_tenants() IS 
'Fixes work order master data unique constraints to support soft deletes in all tenant schemas';


-- ----------------------------------------------------------------------------
-- Function: add_password_reset_tokens_to_all_tenants
-- Purpose: Adds password reset token support to all tenant schemas
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_password_reset_tokens_to_all_tenants()
RETURNS void 
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_schema TEXT;
BEGIN
    FOR tenant_schema IN 
        SELECT nspname
        FROM pg_namespace 
        WHERE nspname LIKE 'ca_%' 
        AND nspname != 'ca_template_tenant'
    LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I.password_reset_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES %I.users(id) ON DELETE CASCADE,
                token_hash VARCHAR(64) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            );
        ', tenant_schema, tenant_schema);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON %I.password_reset_tokens(token_hash)', tenant_schema);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON %I.password_reset_tokens(expires_at)', tenant_schema);
        
        RAISE NOTICE 'Added password_reset_tokens table to schema: %', tenant_schema;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.add_password_reset_tokens_to_all_tenants() IS 
'Creates password_reset_tokens table in all tenant schemas';


-- ============================================================================
-- END OF FUNCTIONS
-- ============================================================================
