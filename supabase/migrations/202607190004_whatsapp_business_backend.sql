-- Estrutura segura para dois canais oficiais do WhatsApp Business por organização.
create table if not exists public.whatsapp_business_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_key text not null check (channel_key in ('channel-1', 'channel-2')),
  name text not null,
  phone_number text not null default '',
  business_account_id text not null default '',
  phone_number_id text not null default '',
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, channel_key),
  unique (organization_id, phone_number_id)
);

create table if not exists public.contact_communication_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_key text not null,
  source text not null,
  granted_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, contact_key)
);

create table if not exists public.whatsapp_message_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null references public.whatsapp_business_channels(id),
  contact_key text not null,
  recipient text not null,
  message_preview text not null,
  provider_message_id text,
  status text not null check (status in ('queued', 'accepted', 'failed', 'sent', 'delivered', 'read')),
  error_code text,
  error_message text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_channels_org on public.whatsapp_business_channels(organization_id);
create index if not exists idx_contact_consents_org_contact on public.contact_communication_consents(organization_id, contact_key);
create index if not exists idx_whatsapp_deliveries_org_created on public.whatsapp_message_deliveries(organization_id, created_at desc);
create index if not exists idx_whatsapp_deliveries_provider on public.whatsapp_message_deliveries(provider_message_id);

alter table public.whatsapp_business_channels enable row level security;
alter table public.contact_communication_consents enable row level security;
alter table public.whatsapp_message_deliveries enable row level security;

create policy "members read whatsapp channels"
on public.whatsapp_business_channels for select
using (public.is_org_member(organization_id));

create policy "admins manage whatsapp channels"
on public.whatsapp_business_channels for all
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create policy "members manage contact consent"
on public.contact_communication_consents for all
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

create policy "members read whatsapp deliveries"
on public.whatsapp_message_deliveries for select
using (public.is_org_member(organization_id));

comment on table public.whatsapp_message_deliveries is
  'Log sem texto integral. Tokens da Meta nunca são armazenados no banco ou enviados ao frontend.';
