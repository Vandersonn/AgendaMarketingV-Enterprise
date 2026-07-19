import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export interface ClientDocument {
  id: string
  clientId?: string
  name: string
  category: 'contract' | 'proposal' | 'creative' | 'report' | 'invoice' | 'other'
  mimeType: string
  size: number
  dataUrl: string
  notes: string
  createdAt: string
}

interface DocumentsState {
  documents: ClientDocument[]
  addDocument: (document: Omit<ClientDocument, 'id' | 'createdAt'>) => void
  removeDocument: (id: string) => void
}

const initial = loadLocal<ClientDocument[]>('client_documents', [])

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: initial,
  addDocument: (data) => set((state) => {
    const documents = [{
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }, ...state.documents]
    saveLocal('client_documents', documents)
    return { documents }
  }),
  removeDocument: (id) => set((state) => {
    const documents = state.documents.filter((item) => item.id !== id)
    saveLocal('client_documents', documents)
    return { documents }
  })
}))
