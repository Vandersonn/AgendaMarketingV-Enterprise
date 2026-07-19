import type { Lead, LeadStage } from '../../lib/crmTypes'
import { isValidBrazilianPhone, isValidEmail, normalizeEmail, onlyDigits, samePersonKey } from '../../lib/dataValidation'

export interface LeadFormValues {
  name: string
  company: string
  email: string
  phone: string
  source: string
  stage: LeadStage
  value: number
  owner: string
  nextAction: string
  nextActionAt: string
  followUpPriority: 'low' | 'normal' | 'high'
}

export const emptyLeadForm: LeadFormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: 'Instagram',
  stage: 'new',
  value: 0,
  owner: 'Vanderson de Castro',
  nextAction: '',
  nextActionAt: '',
  followUpPriority: 'normal'
}

export function leadFormFromSubmit(form: LeadFormValues, formElement: HTMLFormElement): LeadFormValues {
  const fields = new FormData(formElement)
  return {
    ...form,
    name: String(fields.get('name') ?? form.name).trim(),
    company: String(fields.get('company') ?? form.company).trim(),
    email: String(fields.get('email') ?? form.email).trim(),
    phone: String(fields.get('phone') ?? form.phone).trim(),
    source: String(fields.get('source') ?? form.source).trim(),
    owner: String(fields.get('owner') ?? form.owner).trim(),
    nextAction: String(fields.get('nextAction') ?? form.nextAction).trim()
  }
}

export function validateLeadForm(lead: LeadFormValues): string | null {
  if (!lead.name) return 'Informe o nome do Lead.'
  if (!isValidEmail(lead.email)) return 'Informe um e-mail válido para o Lead.'
  if (!isValidBrazilianPhone(lead.phone)) return 'Informe um telefone brasileiro válido com DDD.'
  return null
}

export function findDuplicateLead(leads: Lead[], lead: LeadFormValues): Lead | undefined {
  return leads.find((item) => {
    const sameEmail = lead.email && normalizeEmail(item.email) === normalizeEmail(lead.email)
    const samePhone = lead.phone && onlyDigits(item.whatsapp || item.phone) === onlyDigits(lead.phone)
    const sameIdentity = samePersonKey(item.name, item.company) === samePersonKey(lead.name, lead.company)
    return Boolean(sameEmail || samePhone || sameIdentity)
  })
}
