import type { StorageProvider } from '../providers/StorageProvider.ts'
import { CRM_STORAGE_KEY, type CrmData } from '../repositories/CrmRepository.ts'

export const DATA_SCHEMA_KEY = 'data_schema_version'
export const CURRENT_DATA_SCHEMA_VERSION = 1

export function migrateLegacyData(storage: StorageProvider, fallback: CrmData): CrmData {
  const currentVersion = storage.get<number>(DATA_SCHEMA_KEY, 0)
  const current = storage.get<Partial<CrmData>>(CRM_STORAGE_KEY, fallback)
  const migrated: CrmData = {
    clients: Array.isArray(current.clients) ? current.clients : fallback.clients,
    leads: Array.isArray(current.leads) ? current.leads : fallback.leads,
    activities: Array.isArray(current.activities) ? current.activities : fallback.activities,
    proposals: Array.isArray(current.proposals) ? current.proposals : fallback.proposals
  }

  if (currentVersion < CURRENT_DATA_SCHEMA_VERSION) {
    storage.set(CRM_STORAGE_KEY, migrated)
    storage.set(DATA_SCHEMA_KEY, CURRENT_DATA_SCHEMA_VERSION)
  }

  return migrated
}
