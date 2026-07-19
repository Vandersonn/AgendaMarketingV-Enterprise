import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled'

export interface Contract {
  id: string
  clientId: string
  title: string
  value: number
  startDate: string
  endDate: string
  status: ContractStatus
  autoRenew: boolean
  noticeDays: number
  notes: string
  createdAt: string
}

interface ContractsState {
  contracts: Contract[]
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
  removeContract: (id: string) => void
  setStatus: (id: string, status: ContractStatus) => void
}

const initial = loadLocal<Contract[]>('contracts', [])

function persist(contracts: Contract[]) {
  saveLocal('contracts', contracts)
}

export const useContractsStore = create<ContractsState>((set) => ({
  contracts: initial,
  addContract: (data) => set((state) => {
    const contract = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const contracts = [contract, ...state.contracts]
    persist(contracts)
    useAuditStore.getState().log({
      action: 'create',
      module: 'Contratos',
      description: `Contrato ${contract.title} criado.`,
      user: 'Vanderson de Castro'
    })
    return { contracts }
  }),
  removeContract: (id) => set((state) => {
    const contracts = state.contracts.filter((item) => item.id !== id)
    persist(contracts)
    return { contracts }
  }),
  setStatus: (id, status) => set((state) => {
    const contracts = state.contracts.map((item) => item.id === id ? { ...item, status } : item)
    persist(contracts)
    return { contracts }
  })
}))
