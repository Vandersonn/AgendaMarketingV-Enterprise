import type { Lead } from './crmTypes'

export interface LeadIntelligence {
  lead: Lead
  score: number
  probability: number
  expectedValue: number
  risk: 'low' | 'medium' | 'high'
  recommendation: string
}

const stageWeight: Record<Lead['stage'], number> = {
  new: 15,
  contacted: 30,
  proposal: 55,
  negotiation: 75,
  won: 100,
  lost: 0
}

export function analyzeLead(lead: Lead): LeadIntelligence {
  let score = stageWeight[lead.stage]
  if (lead.email) score += 5
  if (lead.phone) score += 5
  if (lead.nextAction) score += 8
  if (lead.value >= 5000) score += 5
  if (lead.source) score += 2

  const daysWithoutUpdate = Math.max(
    0,
    Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / 86400000)
  )

  if (daysWithoutUpdate > 30) score -= 25
  else if (daysWithoutUpdate > 14) score -= 12
  else if (daysWithoutUpdate <= 3) score += 8

  score = Math.max(0, Math.min(100, score))
  const probability = lead.stage === 'won' ? 100 : lead.stage === 'lost' ? 0 : Math.round(score * 0.92)
  const expectedValue = lead.value * (probability / 100)
  const risk = daysWithoutUpdate > 30 || score < 35 ? 'high' : daysWithoutUpdate > 14 || score < 60 ? 'medium' : 'low'

  let recommendation = 'Continue acompanhando a oportunidade.'
  if (lead.stage === 'new') recommendation = 'Faça o primeiro contato e registre a necessidade.'
  if (lead.stage === 'contacted') recommendation = 'Agende uma demonstração ou diagnóstico.'
  if (lead.stage === 'proposal') recommendation = 'Confirme o recebimento e trate objeções.'
  if (lead.stage === 'negotiation') recommendation = 'Defina prazo de decisão e próximos passos.'
  if (risk === 'high' && !['won', 'lost'].includes(lead.stage)) recommendation = 'Prioridade alta: retome o contato hoje.'
  if (lead.stage === 'won') recommendation = 'Converta em cliente, contrato e projeto.'
  if (lead.stage === 'lost') recommendation = 'Registre o motivo da perda e programe reativação futura.'

  return { lead, score, probability, expectedValue, risk, recommendation }
}

export function analyzeLeads(leads: Lead[]): LeadIntelligence[] {
  return leads.map(analyzeLead).sort((a, b) => b.score - a.score)
}
