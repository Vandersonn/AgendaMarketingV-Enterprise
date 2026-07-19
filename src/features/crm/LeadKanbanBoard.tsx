import { CalendarClock, CircleDollarSign, Clock3, Flame, MessageCircle, Trash2 } from 'lucide-react'
import type { Lead, LeadStage } from '../../lib/crmTypes'
import { calculateLeadScore } from '../../lib/leadScoring'
import { getLeadSla, type StageSlaConfig } from '../../lib/commercialSlaStore'

export const leadStages: Array<{ id: LeadStage; label: string }> = [
  { id: 'new', label: 'Novo lead' },
  { id: 'contacted', label: 'Contato' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'negotiation', label: 'Negociação' },
  { id: 'won', label: 'Fechado' },
  { id: 'lost', label: 'Perdido' }
]

interface LeadKanbanBoardProps {
  leads: Lead[]
  selectedLost: string[]
  selectedCampaignLeads: string[]
  slaLimits: StageSlaConfig
  slaWarningPercent: number
  onDropStage: (stage: LeadStage) => void
  onDragStart: (id: string) => void
  onOpenLead: (lead: Lead) => void
  onToggleLost: (id: string) => void
  onSetSelectedLost: (ids: string[]) => void
  onDeleteSelectedLost: () => void
  onDeleteLostLead: (id: string, name: string) => void
  onToggleCampaignLead: (id: string) => void
}

export function LeadKanbanBoard(props: LeadKanbanBoardProps) {
  const {
    leads, selectedLost, selectedCampaignLeads, slaLimits, slaWarningPercent,
    onDropStage, onDragStart, onOpenLead, onToggleLost, onSetSelectedLost,
    onDeleteSelectedLost, onDeleteLostLead, onToggleCampaignLead
  } = props

  return (
    <section className="kanban-board">
      {leadStages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.stage === stage.id)
        const allLostSelected = stage.id === 'lost' && stageLeads.length > 0 && stageLeads.every((lead) => selectedLost.includes(lead.id))
        return (
          <div key={stage.id} className={`kanban-column stage-${stage.id}`} onDragOver={(event) => event.preventDefault()} onDrop={() => onDropStage(stage.id)}>
            <div className="kanban-header"><strong>{stage.label}</strong><span>{stageLeads.length}</span></div>
            {stage.id === 'lost' && stageLeads.length > 0 && (
              <div className="lost-bulk-toolbar">
                <label><input type="checkbox" checked={allLostSelected} onChange={() => onSetSelectedLost(allLostSelected ? [] : stageLeads.map((lead) => lead.id))} /> Selecionar todos</label>
                <button type="button" disabled={!selectedLost.length} onClick={onDeleteSelectedLost}><Trash2 size={14} /> Excluir ({selectedLost.length})</button>
              </div>
            )}
            <div className="kanban-list">
              {stageLeads.map((lead) => {
                const score = calculateLeadScore(lead)
                const sla = getLeadSla(lead, slaLimits, slaWarningPercent)
                return (
                  <article key={lead.id} className="lead-card" onClick={() => onOpenLead(lead)} draggable onDragStart={() => onDragStart(lead.id)}>
                    <div className="lead-card-header">
                      {stage.id !== 'lost' && <input className="campaign-select-checkbox" type="checkbox" checked={selectedCampaignLeads.includes(lead.id)} onChange={() => onToggleCampaignLead(lead.id)} onClick={(event) => event.stopPropagation()} aria-label={`Selecionar ${lead.name} para campanha`} />}
                      {stage.id === 'lost' && <input className="lost-select-checkbox" type="checkbox" checked={selectedLost.includes(lead.id)} onChange={() => onToggleLost(lead.id)} onClick={(event) => event.stopPropagation()} aria-label={`Selecionar ${lead.name}`} />}
                      <div><strong title={lead.name}>{lead.name}</strong><span>{lead.company || 'Sem empresa'}</span></div>
                      {stage.id === 'lost' && <button type="button" className="lost-delete-button" onClick={(event) => { event.stopPropagation(); onDeleteLostLead(lead.id, lead.name) }} aria-label={`Excluir ${lead.name} da aba Perdidos`} title="Excluir e enviar para a Lixeira"><Trash2 size={15} /></button>}
                    </div>
                    <div className="lead-value"><CircleDollarSign size={16} />{lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    <div className="lead-meta">{lead.source} • {lead.owner}</div>
                    <div className={`kanban-score ${score.temperature}`}><Flame size={13}/><span>Score {score.score} • {score.label}</span></div>
                    {sla.level !== 'closed' && <div className={`kanban-sla ${sla.level}`}><Clock3 size={13}/><span>{sla.level === 'breached' ? `SLA estourado há ${Math.round(sla.elapsedHours - sla.limitHours)}h` : sla.level === 'warning' ? `SLA em atenção • ${Math.round(sla.remainingHours)}h restantes` : `${Math.round(sla.remainingHours)}h até o SLA`}</span></div>}
                    {lead.nextAction && <div className={`next-action ${lead.nextActionAt && new Date(lead.nextActionAt).getTime() < Date.now() ? 'overdue' : ''}`}><CalendarClock size={13} /> <span>{lead.nextAction}{lead.nextActionAt ? ` • ${new Date(lead.nextActionAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span></div>}
                    <div className="kanban-contact-actions">
                      <button type="button" onClick={(event) => { event.stopPropagation(); onOpenLead(lead) }} title="Abrir comunicação"><MessageCircle size={15} /> Comunicar</button>
                      <span className={`consent-pill ${lead.doNotContact || lead.consentStatus === 'revoked' ? 'blocked' : lead.consentStatus === 'granted' ? 'ok' : 'pending'}`}>{lead.doNotContact || lead.consentStatus === 'revoked' ? 'Suprimido' : lead.consentStatus === 'granted' ? 'Opt-in' : 'Consentimento pendente'}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
