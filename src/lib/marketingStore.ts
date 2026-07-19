import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { trashRecord } from './trashStore'

export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published'

export interface ContentItem {
  id: string
  title: string
  clientId: string
  network: string
  format: string
  status: ContentStatus
  scheduledAt: string
  caption: string
  assetUrl: string
  createdAt: string
}

export interface Approval {
  id: string
  contentId: string
  clientId?: string
  reviewer: string
  status: 'pending' | 'approved' | 'changes_requested'
  comment: string
  createdAt: string
}

interface State {
  contents: ContentItem[]
  approvals: Approval[]
  addContent: (data: Omit<ContentItem, 'id' | 'createdAt'>) => void
  moveContent: (id: string, status: ContentStatus) => void
  deleteContent: (id: string) => void
}

interface PersistedMarketingData {
  contents: ContentItem[]
  approvals: Approval[]
}

const legacyContents = loadLocal<ContentItem[]>('marketing_contents', [])
const saved = loadLocal<PersistedMarketingData>('marketing_data', {
  contents: legacyContents,
  approvals: []
})

function persist(contents: ContentItem[], approvals: Approval[]): void {
  saveLocal('marketing_data', { contents, approvals })
  saveLocal('marketing_contents', contents)
}

export const useMarketingStore = create<State>((set) => ({
  contents: saved.contents,
  approvals: saved.approvals,

  addContent: (data) => set((state) => {
    const contents = [
      ...state.contents,
      {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }
    ]
    persist(contents, state.approvals)
    return { contents }
  }),

  moveContent: (id, status) => set((state) => {
    const contents = state.contents.map((item) =>
      item.id === id ? { ...item, status } : item
    )

    let approvals = state.approvals
    const content = contents.find((item) => item.id === id)
    const existing = approvals.find((item) => item.contentId === id)

    if (status === 'review' && content && !existing) {
      approvals = [
        {
          id: crypto.randomUUID(),
          contentId: id,
          clientId: content.clientId || undefined,
          reviewer: 'Cliente',
          status: 'pending',
          comment: '',
          createdAt: new Date().toISOString()
        },
        ...approvals
      ]
    }

    if (existing && status === 'approved') {
      approvals = approvals.map((item) =>
        item.contentId === id ? { ...item, status: 'approved' as const } : item
      )
    }

    if (existing && status === 'draft') {
      approvals = approvals.map((item) =>
        item.contentId === id ? { ...item, status: 'changes_requested' as const } : item
      )
    }

    persist(contents, approvals)
    return { contents, approvals }
  }),

  deleteContent: (id) => set((state) => {
    const content = state.contents.find((item) => item.id === id)
    const relatedApprovals = state.approvals.filter((item) => item.contentId === id)
    if (content) trashRecord({ entityType: 'content', entityId: id, title: content.title, storageKey: 'marketing_data', collection: 'contents', payload: content, related: [{ collection: 'approvals', payload: relatedApprovals }], deletedBy: 'Usuário atual', reason: 'Exclusão solicitada' })
    const contents = state.contents.filter((item) => item.id !== id)
    const approvals = state.approvals.filter((item) => item.contentId !== id)
    persist(contents, approvals)
    return { contents, approvals }
  })
}))
