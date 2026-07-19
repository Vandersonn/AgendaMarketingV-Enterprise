import { LocalStorageProvider } from './providers/LocalStorageProvider.ts'
import { CrmRepository, type CrmData } from './repositories/CrmRepository.ts'
import { migrateLegacyData } from './migrations/migrateLegacyData.ts'

export class DataService {
  readonly crm: CrmRepository

  constructor(defaultCrmData: CrmData) {
    const provider = new LocalStorageProvider()
    migrateLegacyData(provider, defaultCrmData)
    this.crm = new CrmRepository(provider, defaultCrmData)
  }
}
