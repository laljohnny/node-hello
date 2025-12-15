-- Re-create foreign key constraints present in old schema dump but missing in the new dump.
-- Source reference: old_db_dump.sql

-- Tenant template schema constraints (ca_template_tenant)
ALTER TABLE ONLY ca_template_tenant.asset_relations
    ADD CONSTRAINT asset_relations_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES ca_template_tenant.assets(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.asset_relations
    ADD CONSTRAINT asset_relations_fed_from_id_fkey FOREIGN KEY (fed_from_id) REFERENCES ca_template_tenant.assets(id);

ALTER TABLE ONLY ca_template_tenant.asset_sops_incident_plans
    ADD CONSTRAINT asset_sops_incident_plans_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES ca_template_tenant.assets(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.asset_sops_incident_plans
    ADD CONSTRAINT asset_sops_incident_plans_file_id_fkey FOREIGN KEY (file_id) REFERENCES ca_template_tenant.files(id);

ALTER TABLE ONLY ca_template_tenant.files
    ADD CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES ca_template_tenant.folders(id);

ALTER TABLE ONLY ca_template_tenant.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES ca_template_tenant.folders(id);

ALTER TABLE ONLY ca_template_tenant.locations
    ADD CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES ca_template_tenant.locations(id);

ALTER TABLE ONLY ca_template_tenant.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES ca_template_tenant.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES ca_template_tenant.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES ca_template_tenant.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.work_order_assets
    ADD CONSTRAINT work_order_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES ca_template_tenant.assets(id);

ALTER TABLE ONLY ca_template_tenant.work_order_assets
    ADD CONSTRAINT work_order_assets_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES ca_template_tenant.work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.work_order_assignments
    ADD CONSTRAINT work_order_assignments_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES ca_template_tenant.work_orders(id) ON DELETE CASCADE;

ALTER TABLE ONLY ca_template_tenant.work_orders
    ADD CONSTRAINT work_orders_location_id_fkey FOREIGN KEY (location_id) REFERENCES ca_template_tenant.locations(id);

ALTER TABLE ONLY ca_template_tenant.work_orders
    ADD CONSTRAINT work_orders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES ca_template_tenant.work_orders(id);

ALTER TABLE ONLY ca_template_tenant.work_orders
    ADD CONSTRAINT work_orders_stage_id_fkey FOREIGN KEY (work_order_stage_id) REFERENCES ca_template_tenant.work_order_stages(id);

-- Public schema constraints
ALTER TABLE ONLY public.ai_addon_credit_usage
    ADD CONSTRAINT ai_addon_credit_usage_ai_addon_id_fkey FOREIGN KEY (ai_addon_id) REFERENCES public.ai_addons(id);

ALTER TABLE ONLY public.ai_addon_credit_usage
    ADD CONSTRAINT ai_addon_credit_usage_company_ai_addon_id_fkey FOREIGN KEY (company_ai_addon_id) REFERENCES public.company_ai_addons(id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_parent_company_fkey FOREIGN KEY (parent_company) REFERENCES public.companies(id);

ALTER TABLE ONLY public.company_ai_addons
    ADD CONSTRAINT company_ai_addons_ai_addon_id_fkey FOREIGN KEY (ai_addon_id) REFERENCES public.ai_addons(id);

ALTER TABLE ONLY public.company_ai_configs
    ADD CONSTRAINT company_ai_configs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.company_plans
    ADD CONSTRAINT company_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT fk_ticket_comments_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_parent_ticket_fkey FOREIGN KEY (parent_ticket) REFERENCES public.tickets(id);

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE ONLY public.user_invitations
    ADD CONSTRAINT user_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);
