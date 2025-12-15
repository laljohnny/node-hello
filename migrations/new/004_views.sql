-- ============================================================================
-- DATABASE VIEWS - Consolidated from migrations
-- ============================================================================
-- This file contains all views and materialized views identified from migrations
-- Includes creation, indexing, and refresh trigger setup
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER EMAIL LOOKUP MATERIALIZED VIEW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Materialized View: user_email_schema_lookup
-- Purpose: Fast lookup table for email-to-schema mapping during login
-- Schema: public
-- Source: 03_consolidated_updates.sql
-- Dependencies: Requires create_user_email_lookup_view() function
-- ----------------------------------------------------------------------------

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.user_email_schema_lookup CASCADE;

-- Create the materialized view using the dynamic function
SELECT public.create_user_email_lookup_view();

COMMENT ON MATERIALIZED VIEW public.user_email_schema_lookup IS 
'Fast lookup table for email-to-schema mapping during login. 
Consolidates user emails from all tenant schemas for authentication.
Refresh using: SELECT refresh_user_email_lookup();
Note: This view is automatically refreshed via triggers when companies/users are added/updated.';


-- ----------------------------------------------------------------------------
-- Triggers for user_email_schema_lookup auto-refresh
-- ----------------------------------------------------------------------------

-- Trigger on companies table
DROP TRIGGER IF EXISTS refresh_email_lookup_on_company_change ON public.companies;
CREATE TRIGGER refresh_email_lookup_on_company_change
AFTER INSERT OR UPDATE OF schema_status, schema_name ON public.companies
FOR EACH ROW
WHEN (NEW.schema_status = 'active' AND NEW.schema_name IS NOT NULL)
EXECUTE FUNCTION public.trigger_refresh_user_email_lookup();

-- Trigger on public.users table
DROP TRIGGER IF EXISTS refresh_email_lookup_on_public_user_change ON public.users;
CREATE TRIGGER refresh_email_lookup_on_public_user_change
AFTER INSERT OR UPDATE OF email, deleted_at OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_refresh_user_email_lookup();

-- Add triggers to existing tenant schemas
DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN 
    SELECT schema_name 
    FROM companies 
    WHERE schema_status = 'active' 
      AND schema_name IS NOT NULL 
      AND role = 'company'
  LOOP
    PERFORM public.add_user_trigger_to_tenant_schema(tenant_schema.schema_name);
  END LOOP;
  
  RAISE NOTICE 'Successfully added triggers to all existing tenant schemas';
END $$;


-- ============================================================================
-- SECTION 2: COMPANY SUBSCRIPTION DETAILS MATERIALIZED VIEW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Materialized View: company_subscription_details
-- Purpose: Aggregates subscription details for companies including plan info,
--          user counts, location counts, and asset counts
-- Schema: public
-- Source: create_subscription_details_view.sql
-- ----------------------------------------------------------------------------

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.company_subscription_details CASCADE;

-- Create the materialized view
CREATE MATERIALIZED VIEW public.company_subscription_details AS
WITH company_usage AS (
    SELECT 
        c.id as company_id,
        c.name as company_name,
        c.asset_count,
        c.file_size_total as storage_used_bytes,
        c.location_count,
        c.schema_name,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.deleted_at IS NULL AND u.active = true) as user_count
    FROM companies c
    WHERE c.deleted_at IS NULL
),
plan_limits AS (
    SELECT DISTINCT ON (cp.company_id)
        cp.company_id,
        p.name as plan_name,
        cp.status as subscription_status,
        (p.limits->>'assets')::int as asset_limit_raw,
        (p.limits->>'users')::int as user_limit_raw,
        (p.limits->>'storage')::float as storage_limit_gb_raw,
        (p.limits->>'locations')::int as location_limit_raw
    FROM company_plans cp
    JOIN plans p ON cp.plan_id = p.id
    WHERE cp.status IN ('active', 'trialing', 'past_due')
    ORDER BY cp.company_id, cp.created_at DESC
),
ai_credits AS (
    SELECT 
        caa.company_id,
        SUM(caa.credits_remaining) as ai_credits_balance
    FROM company_ai_addons caa
    WHERE caa.status = 'active'
    GROUP BY caa.company_id
)
SELECT 
    cu.company_id,
    cu.company_name,
    COALESCE(pl.plan_name, 'No Plan') as plan_name,
    COALESCE(pl.subscription_status::text, 'inactive') as subscription_status,
    
    -- Assets
    pl.asset_limit_raw as asset_limit,
    cu.asset_count,
    CASE 
        WHEN pl.asset_limit_raw IS NULL OR pl.asset_limit_raw = -1 THEN 0 
        WHEN pl.asset_limit_raw = 0 THEN 100
        ELSE ROUND((cu.asset_count::numeric / pl.asset_limit_raw::numeric) * 100, 2)
    END as asset_usage_pct,

    -- Users
    pl.user_limit_raw as user_limit,
    cu.user_count,
    CASE 
        WHEN pl.user_limit_raw IS NULL OR pl.user_limit_raw = -1 THEN 0
        WHEN pl.user_limit_raw = 0 THEN 100
        ELSE ROUND((cu.user_count::numeric / pl.user_limit_raw::numeric) * 100, 2)
    END as user_usage_pct,

    -- Storage
    pl.storage_limit_gb_raw as storage_limit_gb,
    cu.storage_used_bytes,
    CASE 
        WHEN pl.storage_limit_gb_raw IS NULL OR pl.storage_limit_gb_raw = -1 THEN 0
        WHEN pl.storage_limit_gb_raw = 0 THEN 100
        ELSE ROUND(((cu.storage_used_bytes::numeric / 1024 / 1024 / 1024) / pl.storage_limit_gb_raw::numeric) * 100, 2)
    END as storage_usage_pct,

    -- Locations
    pl.location_limit_raw as location_limit,
    cu.location_count,
    CASE 
        WHEN pl.location_limit_raw IS NULL OR pl.location_limit_raw = -1 THEN 0
        WHEN pl.location_limit_raw = 0 THEN 100
        ELSE ROUND((cu.location_count::numeric / pl.location_limit_raw::numeric) * 100, 2)
    END as location_usage_pct,

    -- AI Credits
    COALESCE(ac.ai_credits_balance, 0) as ai_credits_balance

FROM company_usage cu
LEFT JOIN plan_limits pl ON cu.company_id = pl.company_id
LEFT JOIN ai_credits ac ON cu.company_id = ac.company_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_company_subscription_details_company_id 
ON public.company_subscription_details(company_id);

COMMENT ON MATERIALIZED VIEW public.company_subscription_details IS 
'Aggregates subscription details for companies including plan information, usage metrics, and limits.
Automatically refreshed via triggers when relevant data changes.
Manual refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details;';


-- ----------------------------------------------------------------------------
-- Triggers for company_subscription_details auto-refresh
-- ----------------------------------------------------------------------------

-- Trigger on companies table
DROP TRIGGER IF EXISTS refresh_sub_details_companies ON public.companies;
CREATE TRIGGER refresh_sub_details_companies
AFTER UPDATE OF asset_count, file_size_total, location_count ON public.companies
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_company_subscription_details();

-- Trigger on users table
DROP TRIGGER IF EXISTS refresh_sub_details_users ON public.users;
CREATE TRIGGER refresh_sub_details_users
AFTER INSERT OR UPDATE OF active, deleted_at ON public.users
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_company_subscription_details();

-- Trigger on company_plans table
DROP TRIGGER IF EXISTS refresh_sub_details_plans ON public.company_plans;
CREATE TRIGGER refresh_sub_details_plans
AFTER INSERT OR UPDATE OF status, plan_id ON public.company_plans
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_company_subscription_details();

-- Trigger on company_ai_addons table
DROP TRIGGER IF EXISTS refresh_sub_details_ai ON public.company_ai_addons;
CREATE TRIGGER refresh_sub_details_ai
AFTER INSERT OR UPDATE OF credits_remaining, credits_used, status ON public.company_ai_addons
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_company_subscription_details();


-- ============================================================================
-- SECTION 3: USAGE NOTES
-- ============================================================================

/*
MATERIALIZED VIEW REFRESH STRATEGIES:

1. user_email_schema_lookup
   - Auto-refreshed via triggers on user and company changes
   - Manual refresh: SELECT refresh_user_email_lookup();
   - Used for: Fast email-to-schema lookup during authentication

2. company_subscription_details
   - Auto-refreshed via triggers on company, user, plan, and AI addon changes
   - Manual refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY company_subscription_details;
   - Used for: Subscription dashboard, usage monitoring, limit enforcement

PERFORMANCE CONSIDERATIONS:
- Both views use CONCURRENTLY refresh where possible to avoid locking
- Indexes are created for optimal query performance
- Triggers ensure data consistency without manual intervention

MAINTENANCE:
- Monitor view size and refresh times as tenant count grows
- Consider scheduled refreshes during off-peak hours for very large datasets
- Review and optimize queries if refresh times become problematic
*/

-- ============================================================================
-- END OF VIEWS
-- ============================================================================
