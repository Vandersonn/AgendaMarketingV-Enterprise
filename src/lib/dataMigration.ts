import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface MigrationResult {
  fromVersion: number
  toVersion: number
  applied: string[]
  success: boolean
}

const CURRENT_SCHEMA_VERSION = 1

export function getCurrentSchemaVersion(): number {
  return loadLocal<number>('schema_version', 0)
}

export function runDataMigrations(): MigrationResult {
  const fromVersion = getCurrentSchemaVersion()
  const applied: string[] = []

  try {
    if (fromVersion < 1) {
      const agents = loadLocal<unknown>('ai_agents', null)
      if (!agents) {
        saveLocal('ai_agents', { agents: [], insights: [], memories: [] })
        applied.push('Inicialização segura da estrutura de agentes.')
      }

      const plugins = loadLocal<unknown>('plugin_registry', null)
      if (!plugins) {
        saveLocal('plugin_registry', [])
        applied.push('Inicialização do registro de plugins.')
      }

      saveLocal('schema_version', 1)
      applied.push('Schema atualizado para versão 1.')
    }

    logSystem('info','Migração de dados','Migrações concluídas',applied.join(' • ') || 'Nenhuma migração necessária.')

    return {
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      applied,
      success:true
    }
  } catch (error) {
    logSystem('error','Migração de dados','Falha na migração',error instanceof Error ? error.message : String(error))
    return {
      fromVersion,
      toVersion:getCurrentSchemaVersion(),
      applied,
      success:false
    }
  }
}
