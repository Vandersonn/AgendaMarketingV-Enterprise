import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import type { Lead, LeadStage } from './crmTypes'

export type SlaLevel = 'ok' | 'warning' | 'breached' | 'closed'
export type StageSlaConfig = Record<LeadStage, number>

const defaultLimits: StageSlaConfig = { new: 4, contacted: 24, proposal: 48, negotiation: 72, won: 0, lost: 0 }

interface CommercialSlaState {
  limits: StageSlaConfig
  warningPercent: number
  setLimit: (stage: LeadStage, hours: number) => void
  setWarningPercent: (value: number) => void
}

const saved = loadLocal<{ limits: StageSlaConfig; warningPercent: number }>('commercial_sla_config', { limits: defaultLimits, warningPercent: 75 })

export const useCommercialSlaStore = create<CommercialSlaState>((set) => ({
  ...saved,
  setLimit: (stage, hours) => set((state) => {
    const next = { ...state, limits: { ...state.limits, [stage]: Math.max(1, hours) } }
    saveLocal('commercial_sla_config', { limits: next.limits, warningPercent: next.warningPercent })
    return next
  }),
  setWarningPercent: (warningPercent) => set((state) => {
    const next = { ...state, warningPercent: Math.min(95, Math.max(25, warningPercent)) }
    saveLocal('commercial_sla_config', { limits: next.limits, warningPercent: next.warningPercent })
    return next
  })
}))

export function getLeadSla(lead: Lead, limits: StageSlaConfig, warningPercent = 75) {
  if (lead.stage === 'won' || lead.stage === 'lost') return { level: 'closed' as SlaLevel, elapsedHours: 0, limitHours: 0, remainingHours: 0, percent: 0 }
  const limitHours = limits[lead.stage]
  const enteredAt = lead.stageEnteredAt || lead.updatedAt || lead.createdAt
  const elapsedHours = Math.max(0, (Date.now() - new Date(enteredAt).getTime()) / 36e5)
  const percent = Math.round((elapsedHours / limitHours) * 100)
  const level: SlaLevel = elapsedHours >= limitHours ? 'breached' : percent >= warningPercent ? 'warning' : 'ok'
  return { level, elapsedHours, limitHours, remainingHours: Math.max(0, limitHours - elapsedHours), percent }
}
