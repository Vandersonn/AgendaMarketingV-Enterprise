-- AgendaMarketingV RC9.0 - operação comercial
create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, company text, email text, phone text, segment text, source text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sales_products (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, category text, price numeric(14,2) not null default 0, cost numeric(14,2) not null default 0,
  recurring boolean not null default false, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.sales_proposals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.sales_customers(id) on delete set null, opportunity_id uuid references public.sales_opportunities(id) on delete set null,
  number text not null, title text not null, status text not null default 'draft', valid_until date, notes text,
  created_at timestamptz not null default now(), unique(organization_id, number)
);
create table if not exists public.sales_proposal_items (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.sales_proposals(id) on delete cascade,
  product_id uuid references public.sales_products(id) on delete set null, description text not null,
  quantity numeric(12,2) not null default 1, unit_price numeric(14,2) not null default 0, discount numeric(5,2) not null default 0
);
alter table public.sales_customers enable row level security;
alter table public.sales_products enable row level security;
alter table public.sales_proposals enable row level security;
alter table public.sales_proposal_items enable row level security;
create policy "members manage sales customers" on public.sales_customers for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage sales products" on public.sales_products for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage sales proposals" on public.sales_proposals for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage proposal items" on public.sales_proposal_items for all using (exists(select 1 from public.sales_proposals p where p.id=proposal_id and public.is_org_member(p.organization_id))) with check (exists(select 1 from public.sales_proposals p where p.id=proposal_id and public.is_org_member(p.organization_id)));
create index if not exists idx_sales_customers_org on public.sales_customers(organization_id);
create index if not exists idx_sales_products_org on public.sales_products(organization_id);
create index if not exists idx_sales_proposals_org_status on public.sales_proposals(organization_id,status);
