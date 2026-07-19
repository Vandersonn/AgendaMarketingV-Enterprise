import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  summary: string
  content: string
  published: boolean
  views: number
  createdAt: string
  updatedAt: string
}

interface KnowledgeState {
  articles: KnowledgeArticle[]
  addArticle: (article: Omit<KnowledgeArticle, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => void
  togglePublished: (id: string) => void
  incrementView: (id: string) => void
  removeArticle: (id: string) => void
}

const initial = loadLocal<KnowledgeArticle[]>('knowledge_articles', [{
  id: 'getting-started',
  title: 'Primeiros passos no AgendaMarketingV',
  category: 'Começando',
  summary: 'Configuração inicial, cadastro de clientes e uso dos principais módulos.',
  content: 'Confirme os dados da empresa, altere a senha inicial, cadastre clientes e organize os primeiros leads no CRM.',
  published: true,
  views: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}])

function persist(articles: KnowledgeArticle[]) {
  saveLocal('knowledge_articles', articles)
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  articles: initial,

  addArticle: (data) => set((state) => {
    const now = new Date().toISOString()
    const articles = [{
      ...data,
      id: crypto.randomUUID(),
      views: 0,
      createdAt: now,
      updatedAt: now
    }, ...state.articles]
    persist(articles)
    return { articles }
  }),

  togglePublished: (id) => set((state) => {
    const articles = state.articles.map((item) => item.id === id ? {
      ...item,
      published: !item.published,
      updatedAt: new Date().toISOString()
    } : item)
    persist(articles)
    return { articles }
  }),

  incrementView: (id) => set((state) => {
    const articles = state.articles.map((item) => item.id === id ? { ...item, views: item.views + 1 } : item)
    persist(articles)
    return { articles }
  }),

  removeArticle: (id) => set((state) => {
    const articles = state.articles.filter((item) => item.id !== id)
    persist(articles)
    return { articles }
  })
}))
