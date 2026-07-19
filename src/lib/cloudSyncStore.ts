import { create } from 'zustand'
import { exportLocalData, loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface SyncJob {
  id: string
  direction: 'upload' | 'download'
  records: number
  status: 'queued' | 'running' | 'success' | 'failed'
  updatedAt: string
}

interface SyncState {
  enabled: boolean
  endpoint: string
  lastSyncAt: string
  status: 'idle' | 'syncing' | 'success' | 'error'
  queue: SyncJob[]
  setEnabled: (enabled: boolean) => void
  setEndpoint: (endpoint: string) => void
  enqueue: (direction: SyncJob['direction']) => void
  process: () => Promise<void>
  clearFinished: () => void
}

const saved = loadLocal<Partial<SyncState>>('cloud_sync', {})

function persist(state: Pick<SyncState,'enabled'|'endpoint'|'lastSyncAt'|'status'|'queue'>) {
  saveLocal('cloud_sync', state)
}

export const useCloudSyncStore = create<SyncState>((set,get)=>({
  enabled: saved.enabled ?? false,
  endpoint: saved.endpoint ?? '',
  lastSyncAt: saved.lastSyncAt ?? '',
  status: saved.status ?? 'idle',
  queue: Array.isArray(saved.queue) ? saved.queue : [],

  setEnabled: (enabled)=>set((state)=>{ const next={...state,enabled}; persist(next); return {enabled} }),
  setEndpoint: (endpoint)=>set((state)=>{ const next={...state,endpoint}; persist(next); return {endpoint} }),

  enqueue: (direction)=>set((state)=>{
    const records=Object.keys(exportLocalData()).length
    const queue=[{id:crypto.randomUUID(),direction,records,status:'queued' as const,updatedAt:new Date().toISOString()},...state.queue].slice(0,100)
    const next={...state,queue}; persist(next); return {queue}
  }),

  process: async ()=>{
    if(!get().enabled){ logSystem('warning','Sincronização em Nuvem','Sincronização bloqueada','Ative o recurso.'); return }
    set((state)=>{ const next={...state,status:'syncing' as const}; persist(next); return {status:'syncing'} })
    for(const job of get().queue.filter((item)=>['queued','failed'].includes(item.status))){
      set((state)=>{ const queue=state.queue.map((item)=>item.id===job.id?{...item,status:'running' as const,updatedAt:new Date().toISOString()}:item); const next={...state,queue}; persist(next); return {queue} })
      await new Promise((resolve)=>window.setTimeout(resolve,250))
      set((state)=>{ const queue=state.queue.map((item)=>item.id===job.id?{...item,status:'success' as const,updatedAt:new Date().toISOString()}:item); const next={...state,queue}; persist(next); return {queue} })
    }
    const lastSyncAt=new Date().toISOString()
    const state={...get(),status:'success' as const,lastSyncAt}
    persist(state)
    set({status:'success',lastSyncAt})
    logSystem('info','Sincronização em Nuvem','Fila processada','Sincronização local preparada.')
  },

  clearFinished: ()=>set((state)=>{
    const queue=state.queue.filter((item)=>!['success','failed'].includes(item.status))
    const next={...state,queue}; persist(next); return {queue}
  })
}))
