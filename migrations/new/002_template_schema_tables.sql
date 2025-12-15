-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RESET search_path;
-- =====================================================
-- ca_template_tenant schema migration
-- =====================================================

CREATE SCHEMA IF NOT EXISTS ca_template_tenant;

-- =====================================================
-- ENUMS (tenant-level; only include if not created elsewhere)
-- =====================================================

CREATE TYPE ca_template_tenant.content_source AS ENUM ('manual','ai','upload', 'external_url');
CREATE TYPE ca_template_tenant.content_type   AS ENUM ('text','file', 'url');

-- Existing tenant enums (names taken from main enum dump; create here if this DB is standalone)
-- Adjust names to match your actual enum names if they differ.
CREATE TYPE ca_template_tenant.file_belongs_to_type AS ENUM
    ('asset','location','work_order','ticket','sop','incident_plan');

CREATE TYPE ca_template_tenant.upload_status AS ENUM
    ('pending','uploading','completed','failed');

CREATE TYPE ca_template_tenant.vendor_type AS ENUM
    ('maintenance_provider','procurement_partner','both');

CREATE TYPE ca_template_tenant.asset_status AS ENUM
    ('active','inactive','decommissioned','maintenance');

CREATE TYPE ca_template_tenant.asset_reminder_type AS ENUM
    ('schedule_due','overdue','custom');

-- =====================================================
-- 1. asset_sops_incident_plans (master table)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.asset_sops_incident_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL,
    doc_type VARCHAR(20) NOT NULL CHECK (doc_type IN ('sop','incident_plan')),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type ca_template_tenant.content_type,
    file_id UUID,
    source ca_template_tenant.content_source,
    ai_metadata JSONB,
    version INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asset_sops_incident_plans_asset_id
    ON ca_template_tenant.asset_sops_incident_plans (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_sops_incident_plans_doc_type
    ON ca_template_tenant.asset_sops_incident_plans (doc_type);
CREATE INDEX IF NOT EXISTS idx_asset_sops_incident_plans_is_active
    ON ca_template_tenant.asset_sops_incident_plans (is_active);

-- =====================================================
-- 2. asset_maintenance_schedules (master table structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.asset_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL,
    title TEXT,
    description TEXT,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    frequency_value INTEGER DEFAULT 1 NOT NULL,
    time_zone VARCHAR,
    assigned_to_user_ids UUID[]
);

CREATE INDEX IF NOT EXISTS idx_asset_maintenance_schedules_asset_id
    ON ca_template_tenant.asset_maintenance_schedules (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_schedules_next_due_date
    ON ca_template_tenant.asset_maintenance_schedules (next_due_date);

-- =====================================================
-- 3. asset_relations (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.asset_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL,
    fed_from_id UUID NOT NULL,
    fed_from_part_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_relations_asset_id
    ON ca_template_tenant.asset_relations (asset_id);

-- =====================================================
-- 4. asset_reminders (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.asset_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    notification_type ca_template_tenant.asset_reminder_type NOT NULL,
    maintenance_schedule_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_asset_reminders_schedule_id
    ON ca_template_tenant.asset_reminders (maintenance_schedule_id);

-- =====================================================
-- 5. assets (updated structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    serial_number VARCHAR,
    installation_date DATE,
    status ca_template_tenant.asset_status DEFAULT 'active' NOT NULL,
    location_ids UUID[],
    user_ids UUID[],
    -- keep legacy fields for compatibility if needed
    name VARCHAR,
    description TEXT,
    file_ids UUID[],
    position POINT,
    created_by uuid REFERENCES ca_template_tenant.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assets_product_id ON ca_template_tenant.assets (product_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON ca_template_tenant.assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_location_ids ON ca_template_tenant.assets USING GIN (location_ids);
CREATE INDEX IF NOT EXISTS idx_assets_user_ids ON ca_template_tenant.assets USING GIN (user_ids);

-- =====================================================
-- 6. audit_logs (existing structure)
-- =====================================================

CREATE TYPE ca_template_tenant.audit_log_action AS ENUM (
    'status_change','create','update','delete','assignee_change','comment'
);

CREATE TYPE ca_template_tenant.audit_log_resource_type AS ENUM (
    'work_orders','tickets','assets'
);

CREATE TABLE IF NOT EXISTS ca_template_tenant.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action audit_log_action NOT NULL,
    resource_type audit_log_resource_type NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON ca_template_tenant.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON ca_template_tenant.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON ca_template_tenant.audit_logs (created_at);

-- =====================================================
-- 7. files (existing structure with enums)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR NOT NULL,
    mime_type VARCHAR,
    file_path TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    upload_status ca_template_tenant.upload_status DEFAULT 'pending',
    checksum VARCHAR,
    folder_id UUID,
    belongs_to_type ca_template_tenant.file_belongs_to_type,
    belongs_to_id UUID,
    file_size BIGINT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_files_folder_id ON ca_template_tenant.files (folder_id);
CREATE INDEX IF NOT EXISTS idx_files_belongs_to ON ca_template_tenant.files (belongs_to_type, belongs_to_id);

-- =====================================================
-- 8. folders (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    parent_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON ca_template_tenant.folders (parent_id);

-- =====================================================
-- 9. locations (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID,
    file_ids UUID[],
    location_type UUID,
    location_name VARCHAR NOT NULL,
    description TEXT,
    address TEXT,
    coordinates POINT,
    zipcode VARCHAR,
    city VARCHAR,
    state VARCHAR,
    country VARCHAR,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON ca_template_tenant.locations (parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_location_type ON ca_template_tenant.locations (location_type);

-- =====================================================
-- 10. vendors (existing structure; from master_vendors)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR,
    website VARCHAR,
    email VARCHAR,
    name VARCHAR NOT NULL,
    phone_number VARCHAR,
    country_code VARCHAR,
    vendor_type ca_template_tenant.vendor_type NOT NULL,
    can_login BOOLEAN,
    password VARCHAR,
    invited_by_user UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vendors_email ON ca_template_tenant.vendors (email);

-- =====================================================
-- 11. password_reset_tokens (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
    ON ca_template_tenant.password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON ca_template_tenant.password_reset_tokens (user_id);

-- =====================================================
-- 12. user_invitations (existing structure with enums)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL,
    invited_by UUID NOT NULL,
    role user_role NOT NULL,
    token VARCHAR NOT NULL,
    belongs_to uuid,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    belongs_to UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON ca_template_tenant.user_invitations (email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON ca_template_tenant.user_invitations (status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_belongs_to ON ca_template_tenant.user_invitations (belongs_to);

-- =====================================================
-- 13. user_notification_preferences (existing structure with enums)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_type notification_type NOT NULL,
    category notification_category NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id
    ON ca_template_tenant.user_notification_preferences (user_id);

-- =====================================================
-- 14. user_sessions (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    refresh_token VARCHAR NOT NULL,
    access_token_jti VARCHAR,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON ca_template_tenant.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON ca_template_tenant.user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON ca_template_tenant.user_sessions (revoked);

-- =====================================================
-- 15. users (belongsTo tenant; no company_id)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    email_confirmed BOOLEAN,
    phone_confirmed BOOLEAN,
    job_title VARCHAR,
    invited_by UUID,
    password VARCHAR NOT NULL,
    two_factor_enabled BOOLEAN,
    two_factor_secret VARCHAR,
    request_ip INET,
    request_location VARCHAR,
    last_login_ip INET,
    last_login_at TIMESTAMPTZ,
    belongs_to uuid,
    role user_role DEFAULT 'team_member',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON ca_template_tenant.users (email);

-- =====================================================
-- 16. work_order_assets (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.work_order_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    asset_service_type_id UUID,
    attached_asset_file_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sop_ids UUID[],
    incident_plan_ids UUID[],
    asset_file_ids UUID[],
    location_file_ids UUID[]
);

CREATE INDEX IF NOT EXISTS idx_work_order_assets_work_order_id
    ON ca_template_tenant.work_order_assets (work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_assets_asset_id
    ON ca_template_tenant.work_order_assets (asset_id);

-- =====================================================
-- 17. work_order_assignments (existing structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.work_order_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL,
    user_ids UUID[],
    assignment_type public.work_order_assignment_type,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_work_order_assignments_work_order_id
    ON ca_template_tenant.work_order_assignments (work_order_id);

-- =====================================================
-- 18. work_orders (existing structure with enums)
-- =====================================================

CREATE TABLE IF NOT EXISTS ca_template_tenant.work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT ,
    severity work_order_severity DEFAULT 'medium',
    location_id UUID,
    parent_id UUID,
    work_order_type work_order_type,
    work_order_service_category work_order_service_category,
    work_order_stage_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    time_zone VARCHAR,
    attachments UUID[],
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    execution_priority work_order_priority DEFAULT 'medium'
);

CREATE INDEX IF NOT EXISTS idx_work_orders_location_id ON ca_template_tenant.work_orders (location_id);

CREATE TABLE ca_template_tenant.work_order_stages (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	color_code varchar(20) NULL,
	is_default bool DEFAULT false NULL,
	display_order int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	deleted_at timestamptz NULL,
	CONSTRAINT master_work_order_stages_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX master_work_order_stages_name_idx ON ca_template_tenant.work_order_stages USING btree (name) WHERE (deleted_at IS NULL);
