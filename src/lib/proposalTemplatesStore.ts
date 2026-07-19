import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface ProposalTemplate {
  id: string
  name: string
  introduction: string
  scope: string
  terms: string
  paymentTerms: string
  validityDays: number
  createdAt: string
}

interface State {
  templates: ProposalTemplate[]
  addTemplate: (template: Omit<ProposalTemplate, 'id' | 'createdAt'>) => void
  removeTemplate: (id: string) => void
}

const initial = loadLocal<ProposalTemplate[]>('proposal_templates', [{
  id: 'default',
  name: 'Proposta padrão DEVVANDERSONAPPS',
  introduction: 'Apresentamos uma solução personalizada para acelerar seus resultados.',
  scope: 'Planejamento, execução, acompanhamento e relatório dos serviços contratados.',
  terms: 'O projeto será executado conforme o cronograma acordado entre as partes.',
  paymentTerms: 'Pagamento via PIX, boleto ou transferência, conforme negociação.',
  validityDays: 15,
  createdAt: new Date().toISOString()
}])

export const useProposalTemplatesStore = create<State>((set) => ({
  templates: initial,
  addTemplate: (data) => set((state) => {
    const templates = [...state.templates, {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }]
    saveLocal('proposal_templates', templates)
    return { templates }
  }),
  removeTemplate: (id) => set((state) => {
    const templates = state.templates.filter((item) => item.id !== id)
    saveLocal('proposal_templates', templates)
    return { templates }
  })
}))
