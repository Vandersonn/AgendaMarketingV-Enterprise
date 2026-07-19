-- Segurança e consistência de produção.
alter table public.whatsapp_message_deliveries
  add column if not exists request_id uuid;

create unique index if not exists idx_whatsapp_delivery_request
  on public.whatsapp_message_deliveries(organization_id, request_id)
  where request_id is not null;

create table if not exists public.license_server_licenses (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  plan text not null default 'pro',
  status text not null default 'available' check (status in ('available', 'active', 'revoked', 'blocked')),
  customer_name text not null default '',
  customer_email text not null default '',
  company_name text not null default '',
  cnpj text not null default '',
  max_devices integer not null default 1 check (max_devices between 1 and 1000),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.license_server_activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.license_server_licenses(id) on delete cascade,
  device_id text not null,
  device_name text not null default 'Dispositivo',
  organization_id text not null default '',
  status text not null default 'active' check (status in ('active', 'blocked', 'released')),
  activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  released_at timestamptz,
  unique (license_id, device_id)
);

create table if not exists public.license_server_events (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.license_server_licenses(id) on delete cascade,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_license_activations_active
  on public.license_server_activations(license_id, status);
create index if not exists idx_license_events_created
  on public.license_server_events(created_at desc);

alter table public.license_server_licenses enable row level security;
alter table public.license_server_activations enable row level security;
alter table public.license_server_events enable row level security;
-- Sem políticas públicas: somente service_role e funções SECURITY DEFINER acessam estas tabelas.

create or replace function public.activate_license(
  p_key text,
  p_device_id text,
  p_device_name text default 'Dispositivo',
  p_organization_id text default ''
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_license public.license_server_licenses%rowtype;
  v_activation public.license_server_activations%rowtype;
  v_active_count integer;
begin
  if length(trim(coalesce(p_device_id, ''))) < 8 then
    raise exception 'DEVICE_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtext(upper(trim(p_key))));
  select * into v_license from public.license_server_licenses
    where key = upper(trim(p_key)) for update;

  if not found then raise exception 'LICENSE_NOT_FOUND'; end if;
  if v_license.status in ('revoked', 'blocked') then raise exception 'LICENSE_BLOCKED'; end if;
  if v_license.expires_at < now() then raise exception 'LICENSE_EXPIRED'; end if;

  select * into v_activation from public.license_server_activations
    where license_id = v_license.id and device_id = p_device_id for update;

  if found and v_activation.status <> 'released' then
    update public.license_server_activations
      set status = 'active', last_seen_at = now()
      where id = v_activation.id returning * into v_activation;
  else
    select count(*) into v_active_count from public.license_server_activations
      where license_id = v_license.id and status = 'active';
    if v_active_count >= v_license.max_devices then
      insert into public.license_server_events(license_id, type, description)
        values (v_license.id, 'blocked', 'Ativação bloqueada por limite de dispositivos.');
      raise exception 'DEVICE_LIMIT';
    end if;
    insert into public.license_server_activations(license_id, device_id, device_name, organization_id)
      values (v_license.id, p_device_id, coalesce(nullif(trim(p_device_name), ''), 'Dispositivo'), coalesce(p_organization_id, ''))
      on conflict (license_id, device_id) do update
        set status = 'active', device_name = excluded.device_name,
            organization_id = excluded.organization_id, last_seen_at = now(), released_at = null
      returning * into v_activation;
    insert into public.license_server_events(license_id, type, description)
      values (v_license.id, 'activated', 'Dispositivo ativado.');
  end if;

  update public.license_server_licenses set status = 'active', updated_at = now()
    where id = v_license.id returning * into v_license;
  return jsonb_build_object('license', to_jsonb(v_license), 'activation', to_jsonb(v_activation));
end;
$$;

create or replace function public.validate_license(p_key text, p_device_id text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_license public.license_server_licenses%rowtype;
  v_activation public.license_server_activations%rowtype;
begin
  select * into v_license from public.license_server_licenses
    where key = upper(trim(p_key)) for share;
  if not found then raise exception 'LICENSE_NOT_FOUND'; end if;
  if v_license.status not in ('active', 'available') then raise exception 'LICENSE_BLOCKED'; end if;
  if v_license.expires_at < now() then raise exception 'LICENSE_EXPIRED'; end if;

  update public.license_server_activations set last_seen_at = now()
    where license_id = v_license.id and device_id = p_device_id and status = 'active'
    returning * into v_activation;
  if not found then raise exception 'DEVICE_NOT_FOUND'; end if;
  return jsonb_build_object('license', to_jsonb(v_license), 'activation', to_jsonb(v_activation));
end;
$$;

revoke all on function public.activate_license(text, text, text, text) from public, anon, authenticated;
revoke all on function public.validate_license(text, text) from public, anon, authenticated;
grant execute on function public.activate_license(text, text, text, text) to service_role;
grant execute on function public.validate_license(text, text) to service_role;
