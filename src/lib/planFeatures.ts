import type { LicensePlan } from './licenseStore'

export interface PlanFeature {
  id: string
  label: string
  free: boolean
  pro: boolean
  enterprise: boolean
}

export const planFeatures: PlanFeature[] = [
  { id: 'crm', label: 'CRM e clientes', free: true, pro: true, enterprise: true },
  { id: 'tasks', label: 'Tarefas e agenda', free: true, pro: true, enterprise: true },
  { id: 'finance', label: 'Financeiro completo', free: false, pro: true, enterprise: true },
  { id: 'projects', label: 'Projetos e OKRs', free: false, pro: true, enterprise: true },
  { id: 'ai', label: 'Agentes de IA', free: false, pro: true, enterprise: true },
  { id: 'integrations', label: 'Integrações e webhooks', free: false, pro: true, enterprise: true },
  { id: 'multi_company', label: 'Multiempresa', free: false, pro: false, enterprise: true },
  { id: 'audit', label: 'Auditoria e governança', free: false, pro: false, enterprise: true }
]

export function planHasFeature(plan: LicensePlan, featureId: string): boolean {
  const feature = planFeatures.find((item) => item.id === featureId)
  return feature ? feature[plan] : false
}
