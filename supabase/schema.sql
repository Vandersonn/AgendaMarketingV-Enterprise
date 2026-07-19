create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text not null default '',
  company_name text not null default '',
  email text not null default '',
  phone text not null default '',
  cnpj text not null default '',
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

create policy "users read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "owners read organizations"
on public.organizations for select
to authenticated
using (owner_id = auth.uid());

create policy "owners update organizations"
on public.organizations for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
begin
  insert into public.organizations(name, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Minha empresa'),
    new.id
  )
  returning id into org_id;

  insert into public.profiles(
    id, organization_id, full_name, company_name, email, role
  )
  values (
    new.id,
    org_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce(new.email, ''),
    'owner'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  state text not null default '',
  document text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  source text not null default '',
  stage text not null default 'new'
    check (stage in ('new','contacted','proposal','negotiation','won','lost')),
  value numeric(12,2) not null default 0,
  owner_name text not null default '',
  next_action text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  type text not null default 'note',
  title text not null,
  description text not null default '',
  activity_date timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  value numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','approved','rejected')),
  valid_until date,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.proposals enable row level security;

create policy "organization members manage clients"
on public.clients for all
to authenticated
using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
)
with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "organization members manage leads"
on public.leads for all
to authenticated
using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
)
with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "organization members manage activities"
on public.activities for all
to authenticated
using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
)
with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create policy "organization members manage proposals"
on public.proposals for all
to authenticated
using (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
)
with check (
  organization_id in (select organization_id from public.profiles where id = auth.uid())
);


alter table public.clients add column if not exists state text not null default '';

create table if not exists public.content_items (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_id uuid references public.clients(id) on delete set null, title text not null, network text not null, format text not null, status text not null default 'idea', scheduled_at timestamptz, caption text not null default '', asset_url text not null default '', created_at timestamptz not null default now());
alter table public.content_items enable row level security;
create policy "organization members manage content" on public.content_items for all to authenticated using (organization_id in (select organization_id from public.profiles where id = auth.uid())) with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));


create table if not exists public.ai_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('image','copy')),
  title text not null,
  prompt text not null default '',
  output_url text not null default '',
  output_text text not null default '',
  format text not null default '',
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.marketing_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default '',
  campaign text not null,
  period text not null default '',
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  leads bigint not null default 0,
  conversions bigint not null default 0,
  spend numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_key text not null,
  configuration jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, integration_key)
);

alter table public.ai_assets enable row level security;
alter table public.marketing_metrics enable row level security;
alter table public.integration_settings enable row level security;

create policy "organization members manage ai assets"
on public.ai_assets for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "organization members manage metrics"
on public.marketing_metrics for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "organization members manage integrations"
on public.integration_settings for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));


create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text not null default 'meeting'
    check (type in ('meeting','delivery','content','task')),
  status text not null default 'scheduled'
    check (status in ('scheduled','confirmed','completed','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

create policy "organization members manage calendar"
on public.calendar_events for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));


create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  type text not null check (type in ('income','expense')),
  description text not null,
  category text not null default '',
  value numeric(14,2) not null default 0,
  due_date date not null,
  paid_date date,
  status text not null default 'pending'
    check (status in ('pending','paid','overdue','cancelled')),
  payment_method text not null default '',
  recurring boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.finance_entries enable row level security;

create policy "organization members manage finance"
on public.finance_entries for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));


-- Dados oficiais de produção
comment on schema public is 'AgendaMarketingV Enterprise - DEVVANDERSONAPPS - Vanderson de Castro - CNPJ 39.551.372/0001-41';

create table if not exists public.team_members (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, email text not null, role text not null, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.contracts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 client_id uuid references public.clients(id) on delete set null, title text not null, value numeric(14,2) not null default 0,
 start_date date, end_date date, status text not null default 'draft', auto_renew boolean not null default false,
 notice_days integer not null default 30, notes text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.automations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, trigger_name text not null, actions jsonb not null default '[]'::jsonb, enabled boolean not null default false,
 webhook_url text not null default '', runs integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.audit_entries (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 action text not null, module text not null, description text not null, user_name text not null, created_at timestamptz not null default now()
);

create table if not exists public.client_documents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 client_id uuid references public.clients(id) on delete set null, name text not null, category text not null default 'other',
 storage_path text not null default '', mime_type text not null default '', size_bytes bigint not null default 0,
 notes text not null default '', created_at timestamptz not null default now()
);
alter table public.client_documents enable row level security;
create policy "organization members manage documents" on public.client_documents for all to authenticated
using (organization_id in (select organization_id from public.profiles where id=auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id=auth.uid()));

create table if not exists public.client_portal_access (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade, access_code text not null, active boolean not null default true,
 created_at timestamptz not null default now(), unique(client_id)
);
create table if not exists public.client_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 client_id uuid not null references public.clients(id) on delete cascade, title text not null, description text not null default '',
 priority text not null default 'medium', status text not null default 'open', created_at timestamptz not null default now()
);

create table if not exists public.work_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text not null default '',
  assignee_email text not null default '',
  due_date date,
  priority text not null default 'medium',
  status text not null default 'backlog',
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.work_tasks enable row level security;

create policy "organization members manage tasks"
on public.work_tasks for all to authenticated
using (organization_id in (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'system',
  path text not null default '/',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users manage own notifications"
on public.notifications for all to authenticated
using (
  user_id = auth.uid()
  or organization_id in (select organization_id from public.profiles where id = auth.uid())
)
with check (
  user_id = auth.uid()
  or organization_id in (select organization_id from public.profiles where id = auth.uid())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  owner_email text not null default '',
  start_date date,
  end_date date,
  budget numeric(14,2) not null default 0,
  status text not null default 'planning',
  progress integer not null default 0,
  health text not null default 'healthy',
  description text not null default '',
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  owner_email text not null default '',
  period text not null default '',
  status text not null default 'active',
  key_results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.objectives enable row level security;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  code text not null,
  subject text not null,
  description text not null default '',
  category text not null default '',
  priority text not null default 'medium',
  status text not null default 'open',
  assignee_email text not null default '',
  sla_hours integer not null default 24,
  due_at timestamptz,
  messages jsonb not null default '[]'::jsonb,
  rating integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text not null default '',
  summary text not null default '',
  content text not null default '',
  published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default '',
  description text not null default '',
  price numeric(14,2) not null default 0,
  billing text not null default 'monthly',
  active boolean not null default true,
  estimated_days integer not null default 30,
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.service_catalog enable row level security;

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  level text not null default 'info',
  source text not null,
  message text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.backup_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  type text not null default 'manual',
  storage_path text not null default '',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.system_logs enable row level security;
alter table public.backup_snapshots enable row level security;

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  name text not null,
  endpoint text not null default '',
  auth_type text not null default 'none',
  secret_reference text not null default '',
  enabled boolean not null default true,
  status text not null default 'disconnected',
  last_test_at timestamptz,
  last_error text not null default '',
  timeout_seconds integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid references public.integration_connections(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_connections enable row level security;
alter table public.sync_jobs enable row level security;

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_type text not null,
  name text not null,
  enabled boolean not null default true,
  interval_hours integer not null default 12,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_type text not null,
  title text not null,
  description text not null default '',
  severity text not null default 'info',
  path text not null default '/',
  fingerprint text not null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_agents enable row level security;
alter table public.ai_insights enable row level security;
alter table public.organization_memory enable row level security;

create table if not exists public.license_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  license_key text not null unique,
  plan text not null default 'free',
  status text not null default 'active',
  device_id text not null default '',
  activated_at timestamptz,
  expires_at timestamptz,
  last_validation_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.license_keys enable row level security;

create table if not exists public.user_dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  widget_id text not null,
  title text not null,
  visible boolean not null default true,
  display_order integer not null default 0,
  size text not null default 'small',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.update_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  notes jsonb not null default '[]'::jsonb,
  mandatory boolean not null default false,
  package_url text not null default '',
  checksum text not null default '',
  published_at timestamptz not null default now()
);

alter table public.user_dashboard_widgets enable row level security;

create table if not exists public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction text not null,
  records integer not null default 0,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sync_queue enable row level security;

create table if not exists public.app_plugins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plugin_id text not null,
  name text not null,
  version text not null,
  category text not null,
  route text not null,
  status text not null default 'active',
  required_plan text not null default 'free',
  manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, plugin_id)
);
alter table public.app_plugins enable row level security;

create table if not exists public.business_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text not null default '',
  source text not null,
  entity_id text not null default '',
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.business_missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  objective text not null default '',
  area text not null,
  status text not null default 'active',
  priority text not null default 'medium',
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  unit text not null default '%',
  due_date date,
  owner text not null default '',
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_events enable row level security;
alter table public.business_missions enable row level security;

create table if not exists public.release_acceptance_tests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  release_name text not null,
  build_number text not null,
  test_id text not null,
  category text not null,
  critical boolean not null default false,
  status text not null default 'pending',
  result text not null default '',
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.release_notes (
  id uuid primary key default gen_random_uuid(),
  release_name text not null,
  build_number text not null,
  note_type text not null,
  note_text text not null,
  created_at timestamptz not null default now()
);

alter table public.release_acceptance_tests enable row level security;

create table if not exists public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  score integer not null,
  memory_mb numeric not null default 0,
  storage_mb numeric not null default 0,
  navigation_ms numeric not null default 0,
  dom_nodes integer not null default 0,
  resource_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.error_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  level text not null,
  source text not null,
  message text not null,
  details text not null default '',
  resolution text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.performance_snapshots enable row level security;
alter table public.error_incidents enable row level security;

create table if not exists public.executive_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  source text not null,
  status text not null default 'planned',
  priority text not null default 'high',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.executive_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  health_score integer not null default 0,
  headline text not null,
  summary text not null,
  priorities jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.executive_actions enable row level security;
alter table public.executive_reports enable row level security;

create table if not exists public.cloud_provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  enabled boolean not null default false,
  connected boolean not null default false,
  automatic_backup boolean not null default false,
  interval_minutes integer not null default 60,
  last_sync_at timestamptz,
  last_error text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists public.cloud_backup_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  external_id text not null default '',
  filename text not null,
  size_bytes bigint not null default 0,
  checksum text not null default '',
  synced_at timestamptz not null default now()
);

alter table public.cloud_provider_connections enable row level security;
alter table public.cloud_backup_records enable row level security;

create table if not exists public.license_authority_keys (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  plan text not null,
  status text not null default 'available',
  customer_name text not null,
  customer_email text not null,
  company_name text not null default '',
  cnpj text not null default '',
  max_devices integer not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  activated_at timestamptz,
  notes text not null default '',
  certificate text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.license_authority_keys enable row level security;

create table if not exists public.license_device_activations (
  id uuid primary key default gen_random_uuid(),
  license_key text not null,
  device_id text not null,
  device_name text not null,
  platform text not null default '',
  organization_id uuid,
  status text not null default 'active',
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  released_at timestamptz,
  notes text not null default '',
  unique (license_key, device_id)
);

create table if not exists public.license_history_events (
  id uuid primary key default gen_random_uuid(),
  license_key text not null,
  event_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.license_device_activations enable row level security;
alter table public.license_history_events enable row level security;

create table if not exists public.license_server_settings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id),
  endpoint text not null,
  connected boolean not null default false,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.license_server_settings enable row level security;
