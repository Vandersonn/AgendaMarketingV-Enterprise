import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type DistributionMode = 'balanced' | 'round_robin'

interface LeadDistributionState {
  mode: DistributionMode
  maxActivePerOwner: number
  autoAssignImports: boolean
  setMode: (mode: DistributionMode) => void
  setMaxActivePerOwner: (value: number) => void
  setAutoAssignImports: (value: boolean) => void
}

const saved = loadLocal('lead_distribution_settings', { mode: 'balanced' as DistributionMode, maxActivePerOwner: 50, autoAssignImports: true })
const persist = (state: Pick<LeadDistributionState, 'mode'|'maxActivePerOwner'|'autoAssignImports'>) => saveLocal('lead_distribution_settings', state)

export const useLeadDistributionStore = create<LeadDistributionState>((set) => ({
  ...saved,
  setMode: (mode) => set((state) => { const next={...state,mode}; persist(next); return {mode} }),
  setMaxActivePerOwner: (value) => set((state) => { const maxActivePerOwner=Math.max(1,value||1); const next={...state,maxActivePerOwner}; persist(next); return {maxActivePerOwner} }),
  setAutoAssignImports: (value) => set((state) => { const next={...state,autoAssignImports:value}; persist(next); return {autoAssignImports:value} })
}))
