-- AgendaMarketingV Enterprise RC8 — infraestrutura multiempresa
create extension if not exists pgcrypto;

create type public.app_role as enum ('owner','admin','sales','marketing','finance','viewer');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  email text,
  phone text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table if not exists public.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  contact text,
  company text,
  email text,
  phone text,
  value numeric(14,2) not null default 0,
  probability integer not null default 0 check (probability between 0 and 100),
  status text not null,
  priority text not null,
  source text,
  owner_name text,
  owner_id uuid references auth.users(id),
  expected_close date,
  next_step text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.sales_opportunities(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  priority text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  module text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=org_id and m.user_id=auth.uid() and m.active);
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.sales_opportunities enable row level security;
alter table public.sales_tasks enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles-own" on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());
create policy "organizations-members" on public.organizations for select using (public.is_org_member(id) or created_by=auth.uid());
create policy "organizations-create" on public.organizations for insert with check (created_by=auth.uid());
create policy "members-view" on public.organization_members for select using (public.is_org_member(organization_id) or user_id=auth.uid());
create policy "members-manage" on public.organization_members for all using (exists(select 1 from public.organization_members m where m.organization_id=organization_id and m.user_id=auth.uid() and m.role in ('owner','admin') and m.active));
create policy "sales-opportunities-org" on public.sales_opportunities for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "sales-tasks-org" on public.sales_tasks for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "audit-org" on public.audit_logs for select using (public.is_org_member(organization_id));
create policy "audit-insert" on public.audit_logs for insert with check (public.is_org_member(organization_id));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email) on conflict(id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
