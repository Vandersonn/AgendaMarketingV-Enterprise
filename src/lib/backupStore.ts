import { create } from 'zustand'
import { exportLocalData, loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface BackupSnapshot {
  id: string
  label: string
  type: 'manual' | 'automatic'
  createdAt: string
  data: Record<string, unknown>
  estimatedBytes: number
}

interface BackupSettings {
  enabled: boolean
  intervalHours: number
  keepLast: number
  lastBackupAt: string
}

interface BackupState {
  snapshots: BackupSnapshot[]
  settings: BackupSettings
  createSnapshot: (label: string, type?: BackupSnapshot['type']) => void
  deleteSnapshot: (id: string) => void
  restoreSnapshot: (id: string) => number
  updateSettings: (settings: Partial<BackupSettings>) => void
  runAutomaticBackupIfNeeded: () => void
}

const BACKUP_KEY = 'amv_professional_backup_center'
const LOG_KEY = 'amv_professional_system_logs'

const defaultSettings: BackupSettings = {
  enabled: true,
  intervalHours: 24,
  keepLast: 7,
  lastBackupAt: ''
}

const loaded = loadLocal<{
  snapshots?: BackupSnapshot[]
  settings?: Partial<BackupSettings>
}>('backup_center', {})


function validateBackupData(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const entries = Object.entries(data as Record<string, unknown>)
  if (!entries.length || entries.length > 500) return false
  return entries.every(([key]) => key.startsWith('amv_professional_') && key.length <= 160)
}

function cleanBackupData(data: Record<string, unknown> | undefined): Record<string, unknown> {
  const clean = { ...(data ?? {}) }

  // Um backup nunca deve armazenar o próprio histórico de backups.
  delete clean[BACKUP_KEY]

  // Logs podem crescer bastante e não são necessários para restaurar dados operacionais.
  delete clean[LOG_KEY]

  return clean
}

function normalizeSnapshots(snapshots: BackupSnapshot[] | undefined): BackupSnapshot[] {
  if (!Array.isArray(snapshots)) return []

  return snapshots.slice(0, 7).map((snapshot) => {
    const data = cleanBackupData(snapshot?.data)
    return {
      id: snapshot?.id || crypto.randomUUID(),
      label: snapshot?.label || 'Backup recuperado',
      type: snapshot?.type === 'automatic' ? 'automatic' : 'manual',
      createdAt: snapshot?.createdAt || new Date().toISOString(),
      data,
      estimatedBytes: new Blob([JSON.stringify(data)]).size
    }
  })
}

const initialSnapshots = normalizeSnapshots(loaded.snapshots)
const initialSettings: BackupSettings = {
  ...defaultSettings,
  ...(loaded.settings ?? {})
}

function estimate(data: Record<string, unknown>): number {
  return new Blob([JSON.stringify(data)]).size
}

function persist(snapshots: BackupSnapshot[], settings: BackupSettings): void {
  saveLocal('backup_center', { snapshots, settings })
}

export const useBackupStore = create<BackupState>((set, get) => ({
  snapshots: initialSnapshots,
  settings: initialSettings,

  createSnapshot: (label, type = 'manual') => {
    const data = cleanBackupData(exportLocalData())
    const snapshot: BackupSnapshot = {
      id: crypto.randomUUID(),
      label,
      type,
      createdAt: new Date().toISOString(),
      data,
      estimatedBytes: estimate(data)
    }

    const current = get()
    const keepLast = Math.max(1, Math.min(30, current.settings.keepLast))
    const snapshots = [snapshot, ...current.snapshots].slice(0, keepLast)
    const settings = { ...current.settings, keepLast, lastBackupAt: snapshot.createdAt }

    const saved = saveLocal('backup_center', { snapshots, settings })

    if (!saved) {
      logSystem(
        'error',
        'Backup',
        'Não foi possível salvar o backup',
        'O armazenamento local pode estar cheio.'
      )
      return
    }

    set({ snapshots, settings })
    logSystem(
      'info',
      'Backup',
      `Backup ${type === 'automatic' ? 'automático' : 'manual'} criado`,
      `${label} • ${(snapshot.estimatedBytes / 1024).toFixed(0)} KB`
    )
  },

  deleteSnapshot: (id) => {
    const current = get()
    const snapshots = current.snapshots.filter((item) => item.id !== id)
    persist(snapshots, current.settings)
    set({ snapshots })
  },

  restoreSnapshot: (id) => {
    const snapshot = get().snapshots.find((item) => item.id === id)
    if (!snapshot) return 0
    if (!validateBackupData(snapshot.data)) {
      logSystem('error', 'Backup', 'Backup inválido bloqueado', snapshot.label)
      return 0
    }

    let restored = 0

    for (const [key, value] of Object.entries(cleanBackupData(snapshot.data))) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        restored += 1
      } catch {
        // Mantém a restauração parcial.
      }
    }

    logSystem('warning', 'Backup', 'Backup restaurado', `${snapshot.label}: ${restored} registros`)
    return restored
  },

  updateSettings: (partial) => {
    const current = get()
    const settings = {
      ...current.settings,
      ...partial,
      intervalHours: Math.max(1, Number(partial.intervalHours ?? current.settings.intervalHours)),
      keepLast: Math.max(1, Math.min(30, Number(partial.keepLast ?? current.settings.keepLast)))
    }
    const snapshots = current.snapshots.slice(0, settings.keepLast)

    persist(snapshots, settings)
    set({ snapshots, settings })
  },

  runAutomaticBackupIfNeeded: () => {
    const { settings, createSnapshot } = get()
    if (!settings.enabled) return

    const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0
    const elapsed = Date.now() - last
    const interval = Math.max(1, settings.intervalHours) * 3600000

    if (!last || elapsed >= interval) {
      createSnapshot(`Backup automático ${new Date().toLocaleString('pt-BR')}`, 'automatic')
    }
  }
}))
