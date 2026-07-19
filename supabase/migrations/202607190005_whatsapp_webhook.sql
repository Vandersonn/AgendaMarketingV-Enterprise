-- Recebimento idempotente de eventos oficiais do WhatsApp Business.
create unique index if not exists idx_whatsapp_channels_global_phone_number_id
on public.whatsapp_business_channels(phone_number_id)
where phone_number_id <> '';

create table if not exists public.whatsapp_inbound_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id uuid not null references public.whatsapp_business_channels(id),
  provider_message_id text not null unique,
  sender text not null,
  message_type text not null,
  body text,
  received_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_inbound_org_received
on public.whatsapp_inbound_messages(organization_id, received_at desc);

alter table public.whatsapp_inbound_messages enable row level security;

create policy "members read whatsapp inbound messages"
on public.whatsapp_inbound_messages for select
using (public.is_org_member(organization_id));

comment on table public.whatsapp_inbound_messages is
  'Mensagens recebidas pelo webhook oficial após validação HMAC da assinatura da Meta.';
