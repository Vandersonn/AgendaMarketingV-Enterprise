const prefix = 'amv_professional_'

function reportStorageError(operation: string, key: string, error: unknown): void {
  console.error(`AgendaMarketingV storage ${operation} failed for ${key}:`, error)

  try {
    const raw = localStorage.getItem(prefix + 'system_logs')
    const logs = raw ? JSON.parse(raw) as Array<Record<string, unknown>> : []
    logs.unshift({
      id: crypto.randomUUID(),
      level: 'error',
      source: 'Armazenamento',
      message: `Falha ao ${operation} dados`,
      details: `${key}: ${error instanceof Error ? error.message : String(error)}`,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem(prefix + 'system_logs', JSON.stringify(logs.slice(0, 1000)))
  } catch {
    // Não lança outro erro quando o armazenamento estiver indisponível.
  }
}

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(prefix + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (error) {
    reportStorageError('carregar', key, error)
    return fallback
  }
}

export function saveLocal<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value))
    return true
  } catch (error) {
    reportStorageError('salvar', key, error)
    return false
  }
}

export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(prefix + key)
  } catch (error) {
    reportStorageError('remover', key, error)
  }
}

export function exportLocalData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith(prefix)) continue

    try {
      data[key] = JSON.parse(localStorage.getItem(key) ?? 'null')
    } catch {
      data[key] = localStorage.getItem(key)
    }
  }

  return data
}

export function importLocalData(payload: Record<string, unknown>): number {
  let imported = 0

  for (const [key, value] of Object.entries(payload)) {
    if (!key.startsWith(prefix)) continue

    try {
      localStorage.setItem(key, JSON.stringify(value))
      imported += 1
    } catch (error) {
      reportStorageError('importar', key, error)
    }
  }

  return imported
}

export function getStorageDiagnostics(): {
  keys: number
  estimatedBytes: number
  corruptedKeys: string[]
} {
  let keys = 0
  let estimatedBytes = 0
  const corruptedKeys: string[] = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith(prefix)) continue

    keys += 1
    const raw = localStorage.getItem(key) ?? ''
    estimatedBytes += new Blob([key, raw]).size

    try {
      JSON.parse(raw)
    } catch {
      corruptedKeys.push(key)
    }
  }

  return { keys, estimatedBytes, corruptedKeys }
}

export function listApplicationKeys(): string[] {
  const keys: string[] = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(prefix)) keys.push(key)
  }

  return keys.sort()
}
