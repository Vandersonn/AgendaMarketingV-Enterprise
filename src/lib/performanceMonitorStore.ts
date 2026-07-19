import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface PerformanceSnapshot {
  id: string
  createdAt: string
  memoryMb: number
  storageMb: number
  navigationMs: number
  domNodes: number
  resourceCount: number
  longTasks: number
  score: number
}

interface PerformanceMonitorState {
  snapshots: PerformanceSnapshot[]
  capture: () => PerformanceSnapshot
  clear: () => void
}

const initial = loadLocal<PerformanceSnapshot[]>('performance_snapshots', [])

function estimateStorageMb(): number {
  let bytes = 0
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key) continue
    bytes += key.length + (localStorage.getItem(key)?.length ?? 0)
  }
  return bytes * 2 / 1024 / 1024
}

function memoryMb(): number {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
  return memory?.usedJSHeapSize ? memory.usedJSHeapSize / 1024 / 1024 : 0
}

export const usePerformanceMonitorStore = create<PerformanceMonitorState>((set)=>({
  snapshots: Array.isArray(initial) ? initial : [],

  capture: ()=>{
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const navigationMs = navigation ? navigation.loadEventEnd - navigation.startTime : 0
    const resourceCount = performance.getEntriesByType('resource').length
    const longTasks = performance.getEntriesByType('longtask').length
    const storageMb = estimateStorageMb()
    const memory = memoryMb()
    const domNodes = document.querySelectorAll('*').length

    let score = 100
    if (navigationMs > 3000) score -= 25
    else if (navigationMs > 1800) score -= 12
    if (memory > 350) score -= 20
    else if (memory > 220) score -= 10
    if (storageMb > 4.5) score -= 20
    else if (storageMb > 3) score -= 10
    if (domNodes > 2500) score -= 15
    if (longTasks > 10) score -= 10

    const snapshot: PerformanceSnapshot = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      memoryMb: memory,
      storageMb,
      navigationMs: Math.max(0, navigationMs),
      domNodes,
      resourceCount,
      longTasks,
      score: Math.max(0, score)
    }

    set((state)=>{
      const snapshots=[snapshot,...state.snapshots].slice(0,100)
      saveLocal('performance_snapshots',snapshots)
      return {snapshots}
    })
    logSystem('info','Performance','Medição concluída',`Pontuação ${snapshot.score}/100`)
    return snapshot
  },

  clear: ()=>{
    saveLocal('performance_snapshots',[])
    set({snapshots:[]})
  }
}))
