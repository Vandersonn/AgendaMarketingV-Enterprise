export type LeadStage = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  city: string
  state: string
  document: string
  notes: string
  createdAt: string
}

export interface Lead {
  id: string
  clientId?: string
  name: string
  company: string
  email: string
  phone: string
  whatsapp?: string
  city?: string
  state?: string
  cpf?: string
  source: string
  stage: LeadStage
  value: number
  owner: string
  nextAction: string
  nextActionAt?: string
  followUpPriority?: 'low' | 'normal' | 'high'
  consentStatus?: 'unknown' | 'granted' | 'revoked'
  consentSource?: string
  doNotContact?: boolean
  lastContactAt?: string
  lastResponseAt?: string
  contactCount?: number
  createdAt: string
  updatedAt: string
  stageEnteredAt?: string
}

export interface Activity {
  id: string
  leadId?: string
  clientId?: string
  type: 'note' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'task'
  title: string
  description: string
  date: string
}

export interface Proposal {
  id: string
  leadId?: string
  clientId?: string
  title: string
  value: number
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  validUntil: string
  description: string
  createdAt: string
}
