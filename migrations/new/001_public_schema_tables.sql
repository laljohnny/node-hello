-- =====================================================================
-- Migration: Core + Product Catalogue + AI/Billing/Auth/Tickets
-- Version: 2.x
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. ENUM TYPE DEFINITIONS
-- =====================================================================

CREATE TYPE public.ai_provider AS ENUM ('openai','anthropic','gemini','local','azure');
CREATE TYPE public.audit_log_action AS ENUM ('status_change', 'create', 'update', 'delete', 'assignee_change', 'comment');
CREATE TYPE public.audit_log_resource_type AS ENUM ('work_orders', 'tickets');
CREATE TYPE public.company_role AS ENUM ('company','partner','super_admin');
CREATE TYPE public.interval_type AS ENUM ('days','weeks','months','years');
CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','expired','cancelled');
CREATE TYPE public.notification_category AS ENUM ('maintenance','work_order','billing','system','security');
CREATE TYPE public.notification_type AS ENUM ('push','email','sms');
CREATE TYPE public.plan_interval AS ENUM ('month','year');
CREATE TYPE public.pricing_type AS ENUM ('subscription','pay_as_you_go');
CREATE TYPE public.schema_status AS ENUM ('creating','active','migrating','suspended','archived');
CREATE TYPE public.subscription_status AS ENUM ('active','cancelled','expired','past_due','trialing');
CREATE TYPE public.ticket_activity_type AS ENUM ('status_change','comment','assignment_change','priority_change');
CREATE TYPE public.ticket_category AS ENUM ('technical','billing','feature_request','bug_report','general_inquiry');
CREATE TYPE public.ticket_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','waiting_on_customer','waiting_on_team','resolved','closed');
CREATE TYPE public.user_role AS ENUM ('super_admin','partner_admin','owner','company_admin','team_member','vendor_user', 'vendor_owner');
CREATE TYPE public.vendor_type AS ENUM ('maintenance_provider','procurement_partner','both');
CREATE TYPE public.widget_type AS ENUM ('table','graph','card');
CREATE TYPE public.work_order_type AS ENUM ('preventive_maintenance','corrective_maintenance','installation', 'emergency');
CREATE TYPE public.work_order_assignment_type AS ENUM ('maintenance','installation','inspection');
CREATE TYPE public.work_order_service_category AS ENUM ('hvac','electrical','plumbing');
CREATE TYPE public.work_order_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.work_order_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.request_status AS ENUM ('draft', 'in_review', 'published');
CREATE TYPE public.manufacturer_status AS ENUM ('operational', 'discontinued', 'eol');
CREATE TYPE public.lifecycle_status AS ENUM ('active', 'limited_support', 'end_of_sale', 'end_of_support', 'obsolete', 'decommissioned');
CREATE TYPE public.schedule_type AS ENUM ('service_reminder', 'inspection', 'tune_up', 'calibration');

-- =====================================================================
-- 2. CORE TABLES (companies, users)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    email character varying NOT NULL,
    address text,
    country character varying,
    state character varying,
    city character varying,
    zip character varying,
    coordinates point,
    business_type character varying,
    website character varying,
    industry character varying,
    asset_count integer DEFAULT 0,
    file_size_total bigint DEFAULT 0,
    phone_number character varying,
    country_code character varying,
    active boolean DEFAULT true,
    sub_domain character varying,
    schema_name character varying,
    schema_version character varying DEFAULT '1.0.0',
    schema_status schema_status DEFAULT 'creating',
    schema_created_at timestamp with time zone,
    schema_updated_at timestamp with time zone,
    role company_role DEFAULT 'company'::company_role NOT NULL,
    parent_company uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    stripe_customer_id character varying,
    location_count integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies (active);
CREATE INDEX IF NOT EXISTS idx_companies_role ON public.companies (role);
CREATE INDEX IF NOT EXISTS idx_companies_parent_company ON public.companies (parent_company);
CREATE INDEX IF NOT EXISTS idx_companies_schema_name ON public.companies (schema_name);
CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id ON public.companies (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_companies_sub_domain ON public.companies (sub_domain);

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email character varying NOT NULL,
    phone_number character varying,
    first_name character varying,
    last_name character varying,
    display_name character varying,
    password character varying,
    role user_role DEFAULT 'team_member'::user_role,
    email_confirmed boolean DEFAULT false,
    phone_confirmed boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying,
    company_id uuid,
    invited_by uuid,
    active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    last_login_ip inet,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    job_title character varying
);

CREATE INDEX IF NOT EXISTS idx_users_active ON public.users (active);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- =====================================================================
-- 3. AI ADDONS & USAGE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.ai_addons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name character varying NOT NULL,
    description text,
    pricing_type pricing_type NOT NULL,
    amount numeric NOT NULL,
    currency character varying DEFAULT 'USD',
    interval plan_interval,
    interval_count integer DEFAULT 1,
    credit_pool_size integer,
    stripe_price_id character varying,
    stripe_product_id character varying,
    eligible_plan_ids uuid[],
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    type character varying,
    credits_usage integer DEFAULT 0,
    is_default boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ai_addons_active ON public.ai_addons (active);

CREATE TABLE IF NOT EXISTS public.company_ai_addons (
    id uuid PRIMARY KEY,
    company_id uuid,
    ai_addon_id uuid,
    stripe_subscription_id character varying,
    stripe_customer_id character varying,
    credits_remaining integer,
    credits_used integer,
    status subscription_status,
    start_date timestamp with time zone,
    next_billing_date timestamp with time zone,
    ends_on timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_company_ai_addons_company_id ON public.company_ai_addons (company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_addons_ai_addon_id ON public.company_ai_addons (ai_addon_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_addons_status ON public.company_ai_addons (status);

CREATE TABLE IF NOT EXISTS public.ai_addon_credit_usage (
    id uuid PRIMARY KEY,
    company_id uuid,
    ai_addon_id uuid,
    company_ai_addon_id uuid,
    credits_used integer,
    action_type character varying,
    metadata jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    feature_used character varying,
    performed_by uuid
);

CREATE INDEX IF NOT EXISTS idx_ai_addon_credit_usage_company_id ON public.ai_addon_credit_usage (company_id);
CREATE INDEX IF NOT EXISTS idx_ai_addon_credit_usage_created_at ON public.ai_addon_credit_usage (created_at);

CREATE TABLE IF NOT EXISTS public.company_ai_configs (
    id uuid PRIMARY KEY,
    company_id uuid,
    provider ai_provider,
    model character varying,
    api_key character varying,
    base_url character varying,
    is_enabled boolean,
    settings jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_default boolean
);

CREATE INDEX IF NOT EXISTS idx_company_ai_configs_company_id ON public.company_ai_configs (company_id);
CREATE INDEX IF NOT EXISTS idx_company_ai_configs_is_default ON public.company_ai_configs (company_id, is_default);

-- =====================================================================
-- 4. BILLING & PLANS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_price_id character varying,
    stripe_product_id character varying,
    name character varying NOT NULL,
    description text,
    amount numeric NOT NULL,
    currency character varying DEFAULT 'USD',
    interval plan_interval,
    interval_count integer DEFAULT 1,
    limits jsonb,
    prorata_amount numeric,
    active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    features jsonb
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans (active);
CREATE INDEX IF NOT EXISTS idx_plans_is_default ON public.plans (is_default);

CREATE TABLE IF NOT EXISTS public.company_plans (
    id uuid PRIMARY KEY,
    company_id uuid,
    plan_id uuid,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    stripe_transaction_id character varying,
    stripe_transaction_status character varying,
    status subscription_status,
    start_date timestamp with time zone,
    next_due_date timestamp with time zone,
    ends_on timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_company_plans_company_id ON public.company_plans (company_id);
CREATE INDEX IF NOT EXISTS idx_company_plans_plan_id ON public.company_plans (plan_id);
CREATE INDEX IF NOT EXISTS idx_company_plans_status ON public.company_plans (status);

-- =====================================================================
-- 5. PRODUCT CATALOGUE
-- =====================================================================

-- 5.1 PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name varchar(100) NULL,
	icon_color varchar(50) NULL,
	icon_type varchar(50) NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON public.product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_active ON public.product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON public.product_categories(lower(name));

COMMENT ON TABLE public.product_categories IS 'Hierarchical structure for product categories and subcategories';

-- 5.2 PRODUCT TYPES
CREATE TABLE IF NOT EXISTS public.product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name varchar(100) NULL,
	icon_color varchar(50) NULL,
	icon_type varchar(50) NULL,
    field_definitions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_product_types_category_id ON public.product_types(category_id);
CREATE INDEX IF NOT EXISTS idx_product_types_parent_id ON public.product_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_types_is_active ON public.product_types(is_active);
CREATE INDEX IF NOT EXISTS idx_product_types_name ON public.product_types(lower(name));
CREATE INDEX IF NOT EXISTS idx_product_types_field_definitions
    ON public.product_types USING GIN(field_definitions jsonb_path_ops);

COMMENT ON TABLE public.product_types IS 'Product types with field definitions stored as JSONB';
COMMENT ON COLUMN public.product_types.field_definitions IS 'Array of field definitions: [{name, type, label, required, options}, ...]';

-- 5.3 MANUFACTURERS
CREATE TABLE IF NOT EXISTS public.manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    country VARCHAR(100),
    country_code character varying(10),
    phone_number character varying(20),
    contact_email VARCHAR(255),
    contact_person character varying(255),
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS manufacturers_name_unique ON public.manufacturers (name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manufacturers_name_raw ON public.manufacturers (name);
CREATE INDEX IF NOT EXISTS idx_manufacturers_is_active ON public.manufacturers(is_active);

COMMENT ON TABLE public.manufacturers IS 'Registry of product manufacturers';

-- 5.4 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
    type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE RESTRICT,
    manufacturer_id UUID NOT NULL REFERENCES public.manufacturers(id) ON DELETE RESTRICT,
    successor_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    predecessor_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    make VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    data_sheet VARCHAR(500),
    lifespan DECIMAL(10, 2),
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
    specifications JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    lifecycle_status public.lifecycle_status DEFAULT 'active',
    manufacturer_status public.manufacturer_status DEFAULT 'operational',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type_id ON public.products(type_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON public.products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_successor_id ON public.products(successor_id);
CREATE INDEX IF NOT EXISTS idx_products_predecessor_id ON public.products(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_products_serial_number ON public.products(serial_number);
CREATE INDEX IF NOT EXISTS idx_products_lifecycle_status ON public.products(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_status ON public.products(manufacturer_status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(lower(name));
CREATE INDEX IF NOT EXISTS idx_products_make_model ON public.products(lower(make), lower(model));
CREATE INDEX IF NOT EXISTS idx_products_specifications ON public.products USING GIN(specifications);

COMMENT ON TABLE public.products IS 'Main products table with hierarchical structure via parent_id';
COMMENT ON COLUMN public.products.parent_id IS 'Reference to parent product for components/parts';
COMMENT ON COLUMN public.products.successor_id IS 'Reference to replacement/successor product';
COMMENT ON COLUMN public.products.predecessor_id IS 'Reference to product this replaced';
COMMENT ON COLUMN public.products.data_sheet IS 'URL to product datasheet';
COMMENT ON COLUMN public.products.lifespan IS 'Expected lifespan in years';
COMMENT ON COLUMN public.products.specifications IS 'Product specifications as key-value pairs, validated against type field_definitions';
COMMENT ON COLUMN public.products.images IS 'Array of image objects: [{url, alt, is_primary, display_order, type}, ...]';
COMMENT ON COLUMN public.products.lifecycle_status IS 'Product status in catalogue: active, discontinued, eol';
COMMENT ON COLUMN public.products.manufacturer_status IS 'Manufacturing status: operational, discontinued, eol';

-- 5.5 PRODUCT MAINTENANCE SCHEDULES
CREATE TABLE IF NOT EXISTS public.product_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    schedule_type public.schedule_type,
    interval_value INTEGER,
    interval_unit public.interval_type,
    maintenance_tasks JSONB DEFAULT '[]'::jsonb,
    required_parts JSONB DEFAULT '[]'::jsonb,
    is_mandatory BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_product_id ON public.product_maintenance_schedules(product_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_schedule_type ON public.product_maintenance_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_is_mandatory ON public.product_maintenance_schedules(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_is_active ON public.product_maintenance_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_tasks
    ON public.product_maintenance_schedules USING GIN(maintenance_tasks jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_parts
    ON public.product_maintenance_schedules USING GIN(required_parts jsonb_path_ops);

COMMENT ON TABLE public.product_maintenance_schedules IS 'Maintenance schedules per product instance';
COMMENT ON COLUMN public.product_maintenance_schedules.schedule_type IS 'Type of maintenance schedule: service_reminder, inspection, tune_up, calibration';
COMMENT ON COLUMN public.product_maintenance_schedules.interval_value IS 'For custom schedules: numeric interval value';
COMMENT ON COLUMN public.product_maintenance_schedules.interval_unit IS 'For custom schedules: days, weeks, months, hours';
COMMENT ON COLUMN public.product_maintenance_schedules.maintenance_tasks IS 'Array of tasks: [{task, description, estimated_time}, ...]';
COMMENT ON COLUMN public.product_maintenance_schedules.required_parts IS 'Array of required parts: [{product_id, quantity, description}, ...]';

-- 5.6 MASTER SOPS & INCIDENT PLANS
CREATE TABLE IF NOT EXISTS public.master_sops_incident_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('SOP', 'Incident_Plan', 'Maintenance_Guide', 'Safety_Protocol', 'User_Manual')
    ),
    applies_to VARCHAR(20) NOT NULL CHECK (applies_to IN ('product_type', 'product')),
    reference_id UUID NOT NULL,
    content TEXT,
    document_url VARCHAR(1000),
    source ca_template_tenant.content_source,
    content_type ca_template_tenant.content_type,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_content_or_url CHECK (content IS NOT NULL OR document_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_sops_document_type ON public.master_sops_incident_plans(document_type);
CREATE INDEX IF NOT EXISTS idx_sops_applies_to ON public.master_sops_incident_plans(applies_to);
CREATE INDEX IF NOT EXISTS idx_sops_reference_id ON public.master_sops_incident_plans(reference_id);
CREATE INDEX IF NOT EXISTS idx_sops_composite ON public.master_sops_incident_plans(applies_to, reference_id);
CREATE INDEX IF NOT EXISTS idx_sops_is_active ON public.master_sops_incident_plans(is_active);

COMMENT ON TABLE public.master_sops_incident_plans IS 'Documentation repository for SOPs, incident plans, and guides';
COMMENT ON COLUMN public.master_sops_incident_plans.applies_to IS 'Whether this applies to product_type or specific product';
COMMENT ON COLUMN public.master_sops_incident_plans.reference_id IS 'ID of product_type or product';

-- 5.7 MASTER FAQS
CREATE TABLE IF NOT EXISTS public.master_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applies_to VARCHAR(20) NOT NULL CHECK (applies_to IN ('product_type', 'product')),
    reference_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_faqs_applies_to ON public.master_faqs(applies_to);
CREATE INDEX IF NOT EXISTS idx_faqs_reference_id ON public.master_faqs(reference_id);
CREATE INDEX IF NOT EXISTS idx_faqs_composite ON public.master_faqs(applies_to, reference_id);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON public.master_faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_tags ON public.master_faqs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON public.master_faqs(is_active);

COMMENT ON TABLE public.master_faqs IS 'Frequently asked questions for products and product types';
COMMENT ON COLUMN public.master_faqs.applies_to IS 'Whether this FAQ applies to product_type or specific product';
COMMENT ON COLUMN public.master_faqs.reference_id IS 'ID of product_type or product';
COMMENT ON COLUMN public.master_faqs.tags IS 'Array of tags for categorization: ["installation", "troubleshooting", ...]';
COMMENT ON COLUMN public.master_faqs.display_order IS 'Order in which FAQs should be displayed';

-- =====================================================================
-- 6. LOCATION, VENDORS, WIDGETS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.location_types (
    id uuid PRIMARY KEY,
    name character varying,
    allowed_parents uuid[],
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.master_vendors (
    id uuid PRIMARY KEY,
    company_id uuid,
    company_name character varying,
    website character varying,
    email character varying,
    name character varying,
    phone_number character varying,
    country_code character varying,
    vendor_type vendor_type,
    can_login boolean,
    invited_by_user uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_master_vendors_company_id ON public.master_vendors (company_id);
CREATE INDEX IF NOT EXISTS idx_master_vendors_email ON public.master_vendors (email);

CREATE TABLE IF NOT EXISTS public.master_widgets (
    id bigint PRIMARY KEY,
    name character varying,
    description text,
    type widget_type,
    code text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- =====================================================================
-- 7. AUTH & SECURITY
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id uuid PRIMARY KEY,
    user_id uuid,
    token_hash character varying,
    expires_at timestamp without time zone,
    used_at timestamp without time zone,
    created_at timestamp without time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON public.password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens (user_id);

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token character varying(500) NOT NULL,
    access_token_jti character varying(255),
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON public.user_sessions (revoked);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON public.user_sessions (refresh_token);

-- =====================================================================
-- 8. AUDIT LOGS & TICKETS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid,
    user_id uuid,
    action audit_log_action NOT NULL,
    resource_type audit_log_resource_type NOT NULL,
    resource_id uuid,
    old_value jsonb,
    new_value jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);

CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid PRIMARY KEY,
    short_code character varying,
    parent_ticket uuid,
    company_id uuid,
    created_by uuid,
    title character varying,
    description text,
    priority ticket_priority,
    category ticket_category,
    sub_category character varying,
    status ticket_status,
    estimated_time integer,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    assigned_to uuid,
    assigned_by uuid,
    assigned_at timestamp with time zone,
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_by_schema character varying,
    assigned_to_schema character varying,
    assigned_by_schema character varying
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_short_code ON public.tickets (short_code);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON public.tickets (company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets (category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets (created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets (created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by_schema ON public.tickets (created_by_schema);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets (priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_schema ON public.tickets (assigned_to_schema);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id uuid PRIMARY KEY,
    ticket_id uuid,
    user_id uuid,
    user_schema character varying,
    user_name character varying,
    user_email character varying,
    comment text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON public.ticket_comments (created_At);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON public.ticket_comments (user_id);

-- =====================================================================
-- 9. INVITATIONS & NOTIFICATIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email character varying NOT NULL,
    invited_by uuid,
    company_id uuid,
    role user_role NOT NULL,
    token character varying NOT NULL,
    status invitation_status DEFAULT 'pending'::invitation_status,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    belongs_to uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations (email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_company_id ON public.user_invitations (company_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations (status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations (token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_belongs_to ON public.user_invitations (belongs_to);

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    notification_type notification_type NOT NULL,
    category notification_category NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type
    ON public.user_notification_preferences (user_id, notification_type, category);


-- =====================================================================
-- 10. TICKET ACTIVITIES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.tickets_activity (
    id uuid PRIMARY KEY,
    ticket_id uuid NOT NULL,
    activity_type ticket_activity_type NOT NULL,
    performed_by uuid,
    performed_at timestamp with time zone,
    prev_value text,
    curr_value text,
    comment text,
    performed_by_schema character varying
);

CREATE INDEX IF NOT EXISTS idx_tickets_activity_ticket_id
    ON public.tickets_activity (ticket_id);

CREATE INDEX IF NOT EXISTS idx_tickets_activity_performed_by
    ON public.tickets_activity (performed_by);

CREATE INDEX IF NOT EXISTS idx_tickets_activity_performed_at
    ON public.tickets_activity (performed_at);


CREATE TABLE IF NOT EXISTS public.product_service_types
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    product_category_ids uuid[],
    description text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT master_asset_service_types_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.product_service_types
    IS 'Service types for asset maintenance';

CREATE INDEX IF NOT EXISTS idx_product_service_types_categories
    ON public.product_service_types USING gin
    (product_category_ids)
    WITH (fastupdate=True, gin_pending_list_limit=4194304);

CREATE UNIQUE INDEX IF NOT EXISTS product_service_types_name_unique
    ON public.product_service_types USING btree
    (name COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default
    WHERE deleted_at IS NULL;

COMMENT ON INDEX public.product_service_types_name_unique
    IS 'Ensures name uniqueness only for non-deleted records (soft delete support)';

CREATE OR REPLACE TRIGGER update_product_service_types_updated_at
    BEFORE UPDATE
    ON public.product_service_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.master_data_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type character varying NOT NULL,
    request_json jsonb NOT NULL,
    request_by character varying,
    user_id uuid,
    company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
    status request_status NOT NULL DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


CREATE INDEX IF NOT EXISTS idx_master_data_requests_type 
    ON public.master_data_requests (lower(type));

CREATE INDEX IF NOT EXISTS idx_master_data_requests_user_id 
    ON public.master_data_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_master_data_requests_company_id 
    ON public.master_data_requests (company_id);

CREATE INDEX IF NOT EXISTS idx_master_data_requests_status 
    ON public.master_data_requests (status);

CREATE INDEX IF NOT EXISTS idx_master_data_requests_created_at 
    ON public.master_data_requests (created_at DESC);


COMMENT ON TABLE public.master_data_requests IS 
    'Master catalog of request templates with JSON payloads and approval workflow';

COMMENT ON COLUMN public.master_data_requests.type IS 
    'Unique identifier for request type (e.g. "asset_create", "location_update")';

COMMENT ON COLUMN public.master_data_requests.request_json IS 
    'JSON schema/payload template for the request';

COMMENT ON COLUMN public.master_data_requests.status IS 
    'Workflow status: draft -> in_review -> published';

-- =====================================================================
-- 11. TIMESTAMP TRIGGERS (catalogue tables)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at
    BEFORE UPDATE ON public.product_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at
    BEFORE UPDATE ON public.manufacturers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
    BEFORE UPDATE ON public.product_maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sops_updated_at
    BEFORE UPDATE ON public.master_sops_incident_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.master_faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_master_data_requests_updated_at
    BEFORE UPDATE ON public.master_data_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================================
-- 12. SPECIFICATIONS VALIDATION FUNCTION & TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION public.validate_product_specifications()
RETURNS TRIGGER AS $$
DECLARE
    field_defs JSONB;
    field_def JSONB;
    field_name TEXT;
    field_required BOOLEAN;
BEGIN
    SELECT field_definitions INTO field_defs
    FROM public.product_types
    WHERE id = NEW.type_id;

    IF field_defs IS NULL OR jsonb_array_length(field_defs) = 0 THEN
        RETURN NEW;
    END IF;

    FOR field_def IN SELECT * FROM jsonb_array_elements(field_defs)
    LOOP
        field_name := field_def->>'name';
        field_required := COALESCE((field_def->>'required')::boolean, false);

        IF field_required AND NOT (NEW.specifications ? field_name) THEN
            RAISE EXCEPTION 'Required field "%" is missing in specifications', field_name;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_products_specifications
    BEFORE  INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.validate_product_specifications();

COMMENT ON FUNCTION public.validate_product_specifications IS
    'Validates product specifications against type field_definitions';
