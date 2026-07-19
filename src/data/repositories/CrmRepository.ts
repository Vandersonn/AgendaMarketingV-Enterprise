import type { Activity, Client, Lead, Proposal } from '../../lib/crmTypes.ts'
import type { StorageProvider } from '../providers/StorageProvider.ts'

export interface CrmData {
  clients: Client[]
  leads: Lead[]
  activities: Activity[]
  proposals: Proposal[]
}

export const CRM_STORAGE_KEY = 'crm_data'

export class CrmRepository {
  private readonly storage: StorageProvider
  private readonly defaults: CrmData

  constructor(storage: StorageProvider, defaults: CrmData) {
    this.storage = storage
    this.defaults = defaults
  }

  load(): CrmData {
    const data = this.storage.get<Partial<CrmData>>(CRM_STORAGE_KEY, this.defaults)
    return {
      clients: Array.isArray(data.clients) ? data.clients : this.defaults.clients,
      leads: Array.isArray(data.leads) ? data.leads : this.defaults.leads,
      activities: Array.isArray(data.activities) ? data.activities : this.defaults.activities,
      proposals: Array.isArray(data.proposals) ? data.proposals : this.defaults.proposals
    }
  }

  save(data: CrmData): boolean {
    return this.storage.set(CRM_STORAGE_KEY, data)
  }

  addClient(data: CrmData, client: Client): CrmData {
    return { ...data, clients: [...data.clients, client] }
  }

  updateClient(data: CrmData, client: Client): CrmData {
    return { ...data, clients: data.clients.map((item) => item.id === client.id ? client : item) }
  }

  removeClient(data: CrmData, id: string): CrmData {
    return { ...data, clients: data.clients.filter((item) => item.id !== id) }
  }

  addLead(data: CrmData, lead: Lead): CrmData {
    return { ...data, leads: [...data.leads, lead] }
  }

  updateLead(data: CrmData, lead: Lead): CrmData {
    return { ...data, leads: data.leads.map((item) => item.id === lead.id ? lead : item) }
  }

  removeLead(data: CrmData, id: string): CrmData {
    return { ...data, leads: data.leads.filter((item) => item.id !== id) }
  }
}
