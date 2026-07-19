import { useMemo, useState } from 'react'
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges'
import { CheckCircle2, FileSpreadsheet, Mail, MessageCircle, Phone, Plus, ShieldCheck, Upload } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { StatusMessage } from '../../../components/StatusMessage'
import { useCrmStore } from '../../../lib/crmStore'
import type { Lead, LeadStage } from '../../../lib/crmTypes'
import { parseLeadSpreadsheet, type LeadImportResult } from '../../../lib/leadSpreadsheetImporter'
import { useContactCampaignStore, type CampaignChannel } from '../../../lib/contactCampaignStore'
import { useNavigate } from 'react-router-dom'
import { useCommercialSlaStore } from '../../../lib/commercialSlaStore'
import { normalizeText } from '../../../lib/dataValidation'
import { LeadFormModal } from '../../../features/crm/LeadFormModal'
import { LeadKanbanBoard, leadStages } from '../../../features/crm/LeadKanbanBoard'
import { useWhatsAppBusinessStore } from '../../../lib/whatsappBusinessStore'
import { emptyLeadForm, findDuplicateLead, leadFormFromSubmit, validateLeadForm } from '../../../features/crm/leadFormModel'

function activitiesForLead(leadId: string, activities: ReturnType<typeof useCrmStore.getState>['activities']) {
  return activities.filter((activity) => activity.leadId === leadId).sort((a, b) => b.date.localeCompare(a.date))
}

export function CrmPage() {
  const { leads, addLead, importLeads, moveLead, deleteLead, addActivity, updateLead } = useCrmStore()
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importResult, setImportResult] = useState<LeadImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [communicationLead, setCommunicationLead] = useState<Lead | null>(null)
  const [contactNote, setContactNote] = useState('')
  const whatsappChannels = useWhatsAppBusinessStore((state) => state.channels)
  const whatsappAssignments = useWhatsAppBusinessStore((state) => state.assignments)
  const assignWhatsAppContact = useWhatsAppBusinessStore((state) => state.assignContact)
  const [whatsappChannelId, setWhatsappChannelId] = useState<'channel-1' | 'channel-2'>('channel-1')
  const [selectedLost, setSelectedLost] = useState<string[]>([])
  const [selectedCampaignLeads, setSelectedCampaignLeads] = useState<string[]>([])
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ message: string; tone: 'success' | 'warning' | 'error' | 'info' }>({ message: '', tone: 'info' })
  const [pendingContact, setPendingContact] = useState<'whatsapp' | 'email' | 'call' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [discardLeadOpen, setDiscardLeadOpen] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ name: '', channel: 'whatsapp' as CampaignChannel, whatsappChannelId: 'channel-1' as 'channel-1' | 'channel-2', message: 'Olá, {nome}! Tudo bem? Gostaria de conversar sobre uma solução para {empresa}.', dailyLimit: 40, intervalMinutes: 15 })
  const createCampaign = useContactCampaignStore((state) => state.createCampaign)
  const navigate = useNavigate()
  const slaLimits = useCommercialSlaStore((state) => state.limits)
  const slaWarningPercent = useCommercialSlaStore((state) => state.warningPercent)
  const [form, setForm] = useState(emptyLeadForm)

  const totalPipeline = useMemo(
    () => leads.filter((lead) => !['won', 'lost'].includes(lead.stage)).reduce((sum, lead) => sum + lead.value, 0),
    [leads]
  )


  const communicationActivities = useMemo(() =>
    communicationLead ? activitiesForLead(communicationLead.id, useCrmStore.getState().activities) : [],
    [communicationLead, leads]
  )

  function contactRecommendation(lead: Lead) {
    if (lead.doNotContact || lead.consentStatus === 'revoked') return { level: 'blocked', label: 'Contato bloqueado', detail: 'O lead está na lista de supressão ou revogou o consentimento.' }
    if (lead.consentStatus !== 'granted') return { level: 'warning', label: 'Confirmar consentimento', detail: 'Registre a autorização antes de iniciar mensagens comerciais.' }
    if (!lead.lastContactAt) return { level: 'ok', label: 'Primeiro contato autorizado', detail: 'Personalize a mensagem e explique por que está entrando em contato.' }
    const hours = (Date.now() - new Date(lead.lastContactAt).getTime()) / 36e5
    if (hours < 24 && !lead.lastResponseAt) return { level: 'warning', label: 'Aguardar antes de insistir', detail: `Último contato há ${Math.max(1, Math.floor(hours))} hora(s), sem resposta registrada.` }
    return { level: 'ok', label: 'Contato liberado', detail: 'Use uma mensagem relevante e respeite eventual pedido de descadastro.' }
  }

  function openLeadCommunication(lead: Lead) {
    setCommunicationLead(lead)
    const assigned = whatsappAssignments[`lead:${lead.id}`]
    const available = whatsappChannels.find((channel) => channel.id === assigned && channel.enabled) || whatsappChannels.find((channel) => channel.enabled) || whatsappChannels[0]
    setWhatsappChannelId(available.id)
  }

  function updateCommunicationLead(patch: Partial<Lead>) {
    if (!communicationLead) return
    const updated = { ...communicationLead, ...patch }
    updateLead(updated)
    setCommunicationLead(updated)
  }

  function executeContact(type: 'whatsapp' | 'email' | 'call', registerActivity = true) {
    if (!communicationLead) return
    const whatsappChannel = whatsappChannels.find((channel) => channel.id === whatsappChannelId) || whatsappChannels[0]
    const phone = (communicationLead.whatsapp || communicationLead.phone).replace(/\D/g, '')

    if (type === 'whatsapp') {
      if (!phone) {
        setStatusMessage({ message: 'Este Lead não possui WhatsApp ou telefone.', tone: 'warning' })
        return
      }
      if (!whatsappChannel.enabled) {
        setStatusMessage({ message: 'O canal de WhatsApp selecionado está desativado.', tone: 'warning' })
        return
      }
      assignWhatsAppContact(`lead:${communicationLead.id}`, whatsappChannel.id)
    }
    if (type === 'email' && !communicationLead.email) {
      setStatusMessage({ message: 'Este Lead não possui e-mail.', tone: 'warning' })
      return
    }
    if (type === 'call' && !communicationLead.phone) {
      setStatusMessage({ message: 'Este Lead não possui telefone.', tone: 'warning' })
      return
    }

    if (registerActivity) {
      const now = new Date().toISOString()
      addActivity({
        leadId: communicationLead.id,
        type,
        title: type === 'whatsapp' ? `Contato pelo WhatsApp • ${whatsappChannel.name}` : type === 'email' ? 'Contato por e-mail' : 'Ligação realizada',
        description: type === 'whatsapp' ? `${contactNote || 'Contato iniciado diretamente pelo Kanban.'} Canal: ${whatsappChannel.name} (${whatsappChannel.phoneNumber || 'número não configurado'}).` : contactNote || 'Contato iniciado diretamente pelo Kanban.',
        date: now
      })
      updateCommunicationLead({ lastContactAt: now, contactCount: (communicationLead.contactCount || 0) + 1 })
    }
    if (type === 'whatsapp') window.open(`https://wa.me/55${phone.replace(/^55/, '')}`, '_blank', 'noopener,noreferrer')
    if (type === 'email') window.location.href = `mailto:${communicationLead.email}`
    if (type === 'call') window.location.href = `tel:${communicationLead.phone.replace(/\D/g, '')}`
    setContactNote('')
  }

  function registerContact(type: 'whatsapp' | 'email' | 'call') {
    if (!communicationLead) return
    const recommendation = contactRecommendation(communicationLead)
    if (recommendation.level === 'blocked') {
      setStatusMessage({ message: recommendation.detail, tone: 'error' })
      return
    }
    if (communicationLead.consentStatus !== 'granted') {
      setPendingContact(type)
      return
    }
    executeContact(type)
  }

  function registerResponse() {
    if (!communicationLead) return
    const now = new Date().toISOString()
    addActivity({ leadId: communicationLead.id, type: 'note', title: 'Resposta recebida', description: contactNote || 'O lead respondeu ao contato.', date: now })
    updateCommunicationLead({ lastResponseAt: now })
    setContactNote('')
  }

  function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const lead = leadFormFromSubmit(form, event.currentTarget)
    const validationMessage = validateLeadForm(lead)
    if (validationMessage) {
      setStatusMessage({ message: validationMessage, tone: 'warning' })
      return
    }

    const duplicate = findDuplicateLead(leads, lead)
    if (duplicate) {
      setStatusMessage({ message: `Já existe um Lead semelhante: ${duplicate.name}${duplicate.company ? ` — ${duplicate.company}` : ''}.`, tone: 'warning' })
      return
    }

    addLead(lead)
    setForm(emptyLeadForm)
    setOpen(false)
    setStatusMessage({ message: `Lead ${lead.name} criado com sucesso.`, tone: 'success' })
  }

  const leadFormDirty = Boolean(
    form.name.trim() || form.company.trim() || form.email.trim() || form.phone.trim() ||
    form.value || form.nextAction.trim() || form.nextActionAt || form.followUpPriority !== 'normal' ||
    normalizeText(form.source) !== 'instagram'
  )
  useUnsavedChanges(open && leadFormDirty)

  function requestCloseLeadForm() {
    if (leadFormDirty) setDiscardLeadOpen(true)
    else setOpen(false)
  }


  async function readLeadFile(file?: File) {
    if (!file) return
    setImportError('')
    setImportResult(null)
    setImporting(true)
    try {
      setImportResult(await parseLeadSpreadsheet(file))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Não foi possível ler esta planilha.')
    } finally {
      setImporting(false)
    }
  }

  function confirmImport() {
    if (!importResult?.leads.length) return
    const before = leads.length
    importLeads(importResult.leads.map((lead) => ({
      name: lead.name,
      company: '',
      email: lead.email,
      phone: lead.phone || lead.whatsapp,
      whatsapp: lead.whatsapp,
      city: lead.city,
      state: lead.state,
      cpf: lead.cpf,
      source: 'Importação de planilha',
      stage: 'new' as LeadStage,
      value: 0,
      owner: 'Vanderson de Castro',
      nextAction: 'Realizar primeiro contato',
      nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      followUpPriority: 'normal'
    })))
    const expected = importResult.leads.length
    setImportOpen(false)
    setImportResult(null)
    setImportError('')
    window.setTimeout(() => {
      const current = useCrmStore.getState().leads.length
      const imported = Math.max(0, current - before)
      const duplicated = expected - imported
      setStatusMessage({
        message: `${imported} ${imported === 1 ? 'Lead importado' : 'Leads importados'}. ${duplicated} ${duplicated === 1 ? 'duplicado foi ignorado' : 'duplicados foram ignorados'}.`,
        tone: imported > 0 ? 'success' : 'warning'
      })
    }, 0)
  }

  function confirmDeleteLead(id: string, name: string) {
    setDeleteTarget({ id, name })
  }

  function deleteConfirmedLead() {
    if (!deleteTarget) return
    deleteLead(deleteTarget.id)
    setSelectedLost((current) => current.filter((item) => item !== deleteTarget.id))
    setStatusMessage({ message: `${deleteTarget.name} foi enviado para a Lixeira.`, tone: 'success' })
    setDeleteTarget(null)
  }

  function toggleCampaignLead(id: string) {
    setSelectedCampaignLeads((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function saveCampaign(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedCampaignLeads.length) return
    if (campaignForm.channel === 'whatsapp' && !whatsappChannels.some((channel) => channel.id === campaignForm.whatsappChannelId && channel.enabled)) {
      setStatusMessage({ message: 'Ative um canal de WhatsApp antes de criar a campanha.', tone: 'warning' })
      return
    }
    createCampaign({ ...campaignForm, leadIds: selectedCampaignLeads })
    setCampaignOpen(false)
    setSelectedCampaignLeads([])
    setCampaignForm({ name: '', channel: 'whatsapp', whatsappChannelId: 'channel-1', message: 'Olá, {nome}! Tudo bem? Gostaria de conversar sobre uma solução para {empresa}.', dailyLimit: 40, intervalMinutes: 15 })
    navigate('/contact-campaigns')
  }

  function toggleLost(id: string) {
    setSelectedLost((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function deleteSelectedLost() {
    if (!selectedLost.length) return
    setBulkDeleteOpen(true)
  }

  function deleteSelectedLostConfirmed() {
    const total = selectedLost.length
    selectedLost.forEach(deleteLead)
    setSelectedLost([])
    setBulkDeleteOpen(false)
    setStatusMessage({ message: `${total} ${total === 1 ? 'Lead foi enviado' : 'Leads foram enviados'} para a Lixeira.`, tone: 'success' })
  }

  function drop(stage: LeadStage) {
    if (!draggedId) return
    moveLead(draggedId, stage)
    addActivity({
      leadId: draggedId,
      type: 'note',
      title: `Lead movido para ${leadStages.find((item) => item.id === stage)?.label}`,
      description: 'Alteração realizada no funil comercial.',
      date: new Date().toISOString()
    })
    setDraggedId(null)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CRM COMERCIAL</span>
          <h1>Funil de vendas</h1>
          <p>Acompanhe oportunidades do primeiro contato ao fechamento.</p>
        </div>
        <div className="page-actions">
          {selectedCampaignLeads.length > 0 && <Button className="secondary" onClick={() => setCampaignOpen(true)}><MessageCircle size={18} /> Criar campanha ({selectedCampaignLeads.length})</Button>}
          <Button className="secondary" onClick={() => setImportOpen(true)}><Upload size={18} /> Importar planilha</Button>
          <Button onClick={() => setOpen(true)}><Plus size={18} /> Novo lead</Button>
        </div>
      </header>

      <StatusMessage message={statusMessage.message} tone={statusMessage.tone} onClose={() => setStatusMessage({ message: '', tone: 'info' })} />

      <section className="crm-summary">
        <article className="panel-card compact-card">
          <span>Oportunidades abertas</span>
          <strong>{leads.filter((lead) => !['won', 'lost'].includes(lead.stage)).length}</strong>
        </article>
        <article className="panel-card compact-card">
          <span>Valor do pipeline</span>
          <strong>{totalPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </article>
        <article className="panel-card compact-card">
          <span>Negócios ganhos</span>
          <strong>{leads.filter((lead) => lead.stage === 'won').length}</strong>
        </article>
      </section>

      <LeadKanbanBoard
        leads={leads}
        selectedLost={selectedLost}
        selectedCampaignLeads={selectedCampaignLeads}
        slaLimits={slaLimits}
        slaWarningPercent={slaWarningPercent}
        onDropStage={drop}
        onDragStart={setDraggedId}
        onOpenLead={openLeadCommunication}
        onToggleLost={toggleLost}
        onSetSelectedLost={setSelectedLost}
        onDeleteSelectedLost={deleteSelectedLost}
        onDeleteLostLead={confirmDeleteLead}
        onToggleCampaignLead={toggleCampaignLead}
      />



      <Modal title="Nova campanha de contatos" open={campaignOpen} onClose={() => setCampaignOpen(false)}>
        <form className="campaign-form" onSubmit={saveCampaign}>
          <div className="form-grid">
            <label>Nome da campanha<input required value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} placeholder="Ex.: Retorno de propostas" /></label>
            <label>Canal<select value={campaignForm.channel} onChange={(event) => setCampaignForm({ ...campaignForm, channel: event.target.value as CampaignChannel })}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="call">Ligação</option></select></label>
            {campaignForm.channel === 'whatsapp' && <label>Número do WhatsApp<select value={campaignForm.whatsappChannelId} onChange={(event) => setCampaignForm({ ...campaignForm, whatsappChannelId: event.target.value as 'channel-1' | 'channel-2' })}>{whatsappChannels.filter((item) => item.enabled).map((item) => <option key={item.id} value={item.id}>{item.name} — {item.phoneNumber || 'configurar número'}</option>)}</select></label>}
            <label>Limite diário<input type="number" min="1" max="500" value={campaignForm.dailyLimit} onChange={(event) => setCampaignForm({ ...campaignForm, dailyLimit: Number(event.target.value) })} /></label>
            <label>Intervalo recomendado (min)<input type="number" min="1" value={campaignForm.intervalMinutes} onChange={(event) => setCampaignForm({ ...campaignForm, intervalMinutes: Number(event.target.value) })} /></label>
          </div>
          <label>Modelo da mensagem<textarea value={campaignForm.message} onChange={(event) => setCampaignForm({ ...campaignForm, message: event.target.value })} /><small>Variáveis disponíveis: {'{nome}'}, {'{cidade}'} e {'{empresa}'}.</small></label>
          <div className="campaign-safety-note"><ShieldCheck size={20}/><p>A fila incluirá os selecionados, mas somente contatos com opt-in e fora da lista de supressão serão liberados.</p></div>
          <div className="modal-actions"><Button type="button" className="secondary" onClick={() => setCampaignOpen(false)}>Cancelar</Button><Button type="submit">Criar campanha</Button></div>
        </form>
      </Modal>

      <Modal title={communicationLead ? `Comunicação • ${communicationLead.name}` : 'Comunicação'} open={Boolean(communicationLead)} onClose={() => { setCommunicationLead(null); setContactNote('') }}>
        {communicationLead && (() => {
          const recommendation = contactRecommendation(communicationLead)
          return <div className="communication-center">
            <div className={`contact-recommendation ${recommendation.level}`}>
              <ShieldCheck size={22} />
              <div><strong>{recommendation.label}</strong><p>{recommendation.detail}</p></div>
            </div>

            <div className="communication-profile">
              <div><span>WhatsApp</span><strong>{communicationLead.whatsapp || communicationLead.phone || 'Não informado'}</strong></div>
              <div><span>E-mail</span><strong>{communicationLead.email || 'Não informado'}</strong></div>
              <div><span>Último contato</span><strong>{communicationLead.lastContactAt ? new Date(communicationLead.lastContactAt).toLocaleString('pt-BR') : 'Nunca'}</strong></div>
              <div><span>Última resposta</span><strong>{communicationLead.lastResponseAt ? new Date(communicationLead.lastResponseAt).toLocaleString('pt-BR') : 'Não registrada'}</strong></div>
            </div>

            <div className="consent-controls">
              <label>Status do consentimento
                <select value={communicationLead.consentStatus || 'unknown'} onChange={(event) => updateCommunicationLead({ consentStatus: event.target.value as Lead['consentStatus'], doNotContact: event.target.value === 'revoked' })}>
                  <option value="unknown">Não confirmado</option><option value="granted">Autorizado (opt-in)</option><option value="revoked">Revogado</option>
                </select>
              </label>
              <label>Origem do consentimento<input value={communicationLead.consentSource || ''} onChange={(event) => updateCommunicationLead({ consentSource: event.target.value })} placeholder="Formulário, contrato, evento..." /></label>
              <label className="suppression-check"><input type="checkbox" checked={Boolean(communicationLead.doNotContact)} onChange={(event) => updateCommunicationLead({ doNotContact: event.target.checked, consentStatus: event.target.checked ? 'revoked' : communicationLead.consentStatus })} /> Não entrar em contato</label>
            </div>

            <label>Canal do WhatsApp
              <select value={whatsappChannelId} onChange={(event) => { const id = event.target.value as 'channel-1' | 'channel-2'; setWhatsappChannelId(id); assignWhatsAppContact(`lead:${communicationLead.id}`, id) }}>
                {whatsappChannels.filter((channel) => channel.enabled).map((channel) => <option key={channel.id} value={channel.id}>{channel.name} — {channel.phoneNumber || 'configurar número'}</option>)}
              </select>
            </label>

            <label className="contact-note">Observação do contato<textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} placeholder="Contexto, assunto ou resultado da conversa" /></label>

            <div className="channel-actions">
              <Button disabled={!communicationLead.whatsapp && !communicationLead.phone || recommendation.level === 'blocked'} onClick={() => registerContact('whatsapp')}><MessageCircle size={17} /> WhatsApp</Button>
              <Button className="secondary" disabled={!communicationLead.email || recommendation.level === 'blocked'} onClick={() => registerContact('email')}><Mail size={17} /> E-mail</Button>
              <Button className="secondary" disabled={!communicationLead.phone || recommendation.level === 'blocked'} onClick={() => registerContact('call')}><Phone size={17} /> Ligar</Button>
              <Button className="secondary" onClick={registerResponse}><CheckCircle2 size={17} /> Registrar resposta</Button>
            </div>

            <div className="followup-editor"><label>Próxima ação<input value={communicationLead.nextAction} onChange={(event) => updateCommunicationLead({ nextAction: event.target.value })} placeholder="Ex.: Retornar com proposta" /></label><label>Data e hora<input type="datetime-local" value={communicationLead.nextActionAt ? communicationLead.nextActionAt.slice(0,16) : ''} onChange={(event) => updateCommunicationLead({ nextActionAt: event.target.value ? new Date(event.target.value).toISOString() : '' })} /></label><label>Prioridade<select value={communicationLead.followUpPriority || 'normal'} onChange={(event) => updateCommunicationLead({ followUpPriority: event.target.value as Lead['followUpPriority'] })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></select></label></div>

            <div className="communication-timeline">
              <strong>Histórico do lead</strong>
              {communicationActivities.length === 0 ? <p>Nenhuma interação registrada.</p> : communicationActivities.map((activity) => <article key={activity.id}><span>{new Date(activity.date).toLocaleString('pt-BR')}</span><strong>{activity.title}</strong><p>{activity.description}</p></article>)}
            </div>
          </div>
        })()}
      </Modal>

      <Modal title="Importação inteligente de leads" open={importOpen} onClose={() => { setImportOpen(false); setImportResult(null); setImportError('') }}>
        <div className="lead-importer">
          <div className="lead-import-dropzone">
            <FileSpreadsheet size={36} />
            <strong>Escolha sua planilha de leads</strong>
            <p>Formatos aceitos: XLSX, XLS, XLSM, XLSB, CSV, TXT, ODS e outros formatos reconhecidos pelo leitor de planilhas.</p>
            <label className="button primary">
              <Upload size={17} /> Selecionar arquivo
              <input type="file" accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.txt,.ods,.fods,.dif,.sylk,.slk,.prn" onChange={(event) => readLeadFile(event.target.files?.[0])} hidden />
            </label>
          </div>

          {importing && <div className="import-status">Analisando colunas e conteúdo da planilha...</div>}
          {importError && <div className="import-error">{importError}</div>}

          {importResult && (
            <>
              <div className="import-summary-grid">
                <div><span>Aba analisada</span><strong>{importResult.sheetName}</strong></div>
                <div><span>Linhas encontradas</span><strong>{importResult.totalRows}</strong></div>
                <div><span>Leads reconhecidos</span><strong>{importResult.validRows}</strong></div>
                <div><span>Linhas ignoradas</span><strong>{importResult.skippedRows}</strong></div>
              </div>

              <div className="detected-columns">
                <strong>Colunas identificadas automaticamente</strong>
                <div>{Object.entries(importResult.detectedColumns).map(([field, column]) => <span key={field}>{field}: <b>{column}</b></span>)}</div>
              </div>

              <div className="import-preview-wrap">
                <table className="import-preview-table">
                  <thead><tr><th>Nome</th><th>Cidade/UF</th><th>CPF</th><th>Telefone</th><th>WhatsApp</th><th>E-mail</th><th>Status</th></tr></thead>
                  <tbody>
                    {importResult.leads.slice(0, 12).map((lead) => (
                      <tr key={lead.sourceRow}>
                        <td>{lead.name}</td>
                        <td>{[lead.city, lead.state].filter(Boolean).join(' / ') || '—'}</td>
                        <td>{lead.cpf || '—'}</td>
                        <td>{lead.phone || '—'}</td>
                        <td>{lead.whatsapp || '—'}</td>
                        <td>{lead.email || '—'}</td>
                        <td>{lead.warnings.length ? <span className="import-warning">{lead.warnings.join(', ')}</span> : <span className="import-ok">Pronto</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.leads.length > 12 && <p className="preview-note">Prévia das primeiras 12 linhas. Mais {importResult.leads.length - 12} serão importadas.</p>}
              </div>
              <div className="modal-actions"><Button className="secondary" onClick={() => setImportResult(null)}>Escolher outra</Button><Button onClick={confirmImport}><Upload size={17} /> Importar {importResult.validRows} leads</Button></div>
            </>
          )}
        </div>
      </Modal>



      <ConfirmDialog
        open={Boolean(pendingContact)}
        title="Consentimento não confirmado"
        message="O consentimento deste Lead ainda não está confirmado. O canal será aberto sem registrar um envio comercial no histórico. Deseja continuar?"
        confirmLabel="Abrir canal"
        onClose={() => setPendingContact(null)}
        onConfirm={() => {
          if (pendingContact) executeContact(pendingContact, false)
          setPendingContact(null)
          setStatusMessage({ message: 'Canal aberto sem registrar envio comercial.', tone: 'warning' })
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Enviar Lead para a Lixeira"
        message={deleteTarget ? `Excluir ${deleteTarget.name} da aba Perdidos? O registro poderá ser restaurado pela Lixeira.` : ''}
        confirmLabel="Enviar para a Lixeira"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteConfirmedLead}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Enviar Leads para a Lixeira"
        message={`Excluir ${selectedLost.length} ${selectedLost.length === 1 ? 'registro selecionado' : 'registros selecionados'} da aba Perdidos? Todos poderão ser restaurados pela Lixeira.`}
        confirmLabel="Enviar para a Lixeira"
        danger
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={deleteSelectedLostConfirmed}
      />


      <ConfirmDialog
        open={discardLeadOpen}
        title="Descartar novo Lead?"
        message="Existem informações ainda não salvas. Ao sair, os dados preenchidos serão perdidos."
        confirmLabel="Descartar alterações"
        danger
        onClose={() => setDiscardLeadOpen(false)}
        onConfirm={() => {
          setDiscardLeadOpen(false)
          setOpen(false)
          setForm(emptyLeadForm)
        }}
      />

      <LeadFormModal
        open={open}
        form={form}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onClose={requestCloseLeadForm}
        onSubmit={createLead}
      />
    </div>
  )
}
