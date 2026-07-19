import type { TeamRole } from './teamStore'

export type Permission =
  | 'dashboard.view'
  | 'crm.view'
  | 'crm.edit'
  | 'clients.view'
  | 'clients.edit'
  | 'marketing.view'
  | 'marketing.edit'
  | 'finance.view'
  | 'finance.edit'
  | 'reports.view'
  | 'settings.manage'
  | 'team.manage'
  | 'integrations.manage'
  | 'audit.view'
  | 'tasks.view'
  | 'tasks.edit'

const all: Permission[] = [
  'dashboard.view','crm.view','crm.edit','clients.view','clients.edit',
  'marketing.view','marketing.edit','finance.view','finance.edit',
  'reports.view','settings.manage','team.manage','integrations.manage',
  'audit.view','tasks.view','tasks.edit'
]

export const rolePermissions: Record<TeamRole, Permission[]> = {
  owner: all,
  admin: all,
  sales: [
    'dashboard.view','crm.view','crm.edit','clients.view','clients.edit',
    'reports.view','tasks.view','tasks.edit'
  ],
  marketing: [
    'dashboard.view','clients.view','marketing.view','marketing.edit',
    'reports.view','tasks.view','tasks.edit'
  ],
  finance: [
    'dashboard.view','clients.view','finance.view','finance.edit',
    'reports.view','tasks.view','tasks.edit'
  ],
  viewer: [
    'dashboard.view','crm.view','clients.view','marketing.view',
    'finance.view','reports.view','tasks.view'
  ]
}

export function can(role: TeamRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export function roleForEmail(email: string | undefined, members: Array<{ email: string; role: TeamRole; active: boolean }>): TeamRole {
  if (!email) return 'viewer'
  return members.find((member) => member.email.toLowerCase() === email.toLowerCase() && member.active)?.role ?? 'viewer'
}
