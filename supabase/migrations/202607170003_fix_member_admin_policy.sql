-- Corrige a autorização administrativa dos membros em instalações existentes.
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members as member
    where member.organization_id = org_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'admin')
      and member.active
  );
$$;

drop policy if exists "members-manage" on public.organization_members;

create policy "members-manage"
on public.organization_members
for all
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));
