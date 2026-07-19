import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

export interface Automation {
  id: string
  name: string
  trigger: string
  actions: string[]
  enabled: boolean
  webhookUrl: string
  runs: number
  createdAt: string
}

interface AutomationState {
  automations: Automation[]
  addAutomation: (automation: Omit<Automation, 'id' | 'createdAt' | 'runs'>) => void
  toggle: (id: string) => void
  remove: (id: string) => void
  run: (id: string) => Promise<string>
}

const defaults: Automation[] = loadLocal('automations', [{
  id: 'welcome-lead',
  name: 'Boas-vindas para novo lead',
  trigger: 'Novo lead cadastrado',
  actions: ['Criar tarefa de follow-up', 'Preparar mensagem de WhatsApp'],
  enabled: false,
  webhookUrl: '',
  runs: 0,
  createdAt: new Date().toISOString()
}])

function persist(automations: Automation[]) {
  saveLocal('automations', automations)
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  automations: defaults,
  addAutomation: (data) => set((state) => {
    const automation = {
      ...data,
      id: crypto.randomUUID(),
      runs: 0,
      createdAt: new Date().toISOString()
    }
    const automations = [...state.automations, automation]
    persist(automations)
    return { automations }
  }),
  toggle: (id) => set((state) => {
    const automations = state.automations.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)
    persist(automations)
    return { automations }
  }),
  remove: (id) => set((state) => {
    const automations = state.automations.filter((item) => item.id !== id)
    persist(automations)
    return { automations }
  }),
  run: async (id) => {
    const target = get().automations.find((item) => item.id === id)
    if (!target) return 'Automação não encontrada.'
    if (!target.webhookUrl) return 'Configure um webhook antes de testar.'
    try {
      const response = await fetch(target.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'AgendaMarketingV',
          automation: target.name,
          trigger: target.trigger,
          actions: target.actions,
          test: true
        })
      })
      if (!response.ok) throw new Error()
      const automations = get().automations.map((item) => item.id === id ? { ...item, runs: item.runs + 1 } : item)
      persist(automations)
      set({ automations })
      useAuditStore.getState().log({
        action: 'execute',
        module: 'Automações',
        description: `Automação ${target.name} executada em modo de teste.`,
        user: 'Vanderson de Castro'
      })
      return 'Automação executada com sucesso.'
    } catch {
      return 'Falha ao executar o webhook.'
    }
  }
}))
