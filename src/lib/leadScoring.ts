import type { Lead } from './crmTypes'

export type LeadTemperature = 'cold' | 'warm' | 'hot' | 'very_hot'

export interface LeadScoreResult {
  score: number
  temperature: LeadTemperature
  label: string
  reasons: string[]
  recommendedAction: string
}

export function calculateLeadScore(lead: Lead): LeadScoreResult {
  let score = 0
  const reasons: string[] = []
  if (lead.name?.trim()) { score += 5; reasons.push('Nome identificado') }
  if (lead.city?.trim() && lead.state?.trim()) { score += 5; reasons.push('Localização completa') }
  if (lead.cpf?.replace(/\D/g, '').length === 11) { score += 8; reasons.push('CPF preenchido') }
  if ((lead.whatsapp || lead.phone)?.replace(/\D/g, '').length >= 10) { score += 12; reasons.push('Telefone disponível') }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || '')) { score += 8; reasons.push('E-mail válido') }
  if (lead.consentStatus === 'granted') { score += 15; reasons.push('Opt-in confirmado') }
  if (lead.lastResponseAt) { score += 20; reasons.push('Já respondeu') }
  if ((lead.contactCount || 0) > 0) { score += Math.min(10, (lead.contactCount || 0) * 2); reasons.push('Histórico de contato') }
  if (lead.value >= 5000) { score += 10; reasons.push('Alto valor potencial') }
  else if (lead.value > 0) { score += 5; reasons.push('Valor estimado') }
  if (lead.followUpPriority === 'high') { score += 7; reasons.push('Prioridade alta') }
  if (lead.stage === 'proposal') { score += 12; reasons.push('Proposta apresentada') }
  if (lead.stage === 'negotiation') { score += 18; reasons.push('Em negociação') }
  if (lead.stage === 'won') score = 100
  if (lead.stage === 'lost' || lead.doNotContact || lead.consentStatus === 'revoked') score = Math.min(score, 15)
  score = Math.max(0, Math.min(100, Math.round(score)))

  if (score >= 80) return { score, temperature: 'very_hot', label: 'Muito quente', reasons, recommendedAction: 'Contato imediato e proposta personalizada.' }
  if (score >= 60) return { score, temperature: 'hot', label: 'Quente', reasons, recommendedAction: 'Priorizar follow-up comercial hoje.' }
  if (score >= 35) return { score, temperature: 'warm', label: 'Morno', reasons, recommendedAction: 'Nutrir com conteúdo relevante e confirmar interesse.' }
  return { score, temperature: 'cold', label: 'Frio', reasons, recommendedAction: 'Validar dados, consentimento e necessidade antes de ofertar.' }
}
