import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Mail, MessageCircle, Pause, Phone, Play, ShieldAlert, Trash2, UsersRound } from 'lucide-react'
import { Button } from '../../../components/Button'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { StatusMessage } from '../../../components/StatusMessage'
import { useContactCampaignStore } from '../../../lib/contactCampaignStore'
import { useCrmStore } from '../../../lib/crmStore'

export function ContactCampaignsPage() {
  const campaigns = useContactCampaignStore((state) => state.campaigns)
  const updateCampaign = useContactCampaignStore((state) => state.updateCampaign)
  const removeCampaign = useContactCampaignStore((state) => state.removeCampaign)
  const markContacted = useContactCampaignStore((state) => state.markContacted)
  const leads = useCrmStore((state) => state.leads)
  const addActivity = useCrmStore((state) => state.addActivity)
  const updateLead = useCrmStore((state) => state.updateLead)
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id || '')
  const [feedback, setFeedback] = useState<{message:string;tone:'success'|'error'|'warning'} | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const selected = campaigns.find((item) => item.id === selectedId) || campaigns[0]
  const queue = useMemo(() => selected ? selected.leadIds.map((id) => leads.find((lead) => lead.id === id)).filter(Boolean) : [], [selected, leads])
  const eligible = queue.filter((lead) => lead && lead.consentStatus === 'granted' && !lead.doNotContact)
  const pending = eligible.filter((lead) => lead && !selected?.contactedLeadIds.includes(lead.id))

  function openNext() {
    if (!selected) return
    const lead = pending[0]
    if (!lead) return
    const now = new Date().toISOString()
    const text = selected.message.split('{nome}').join(lead.name).split('{cidade}').join(lead.city || '').split('{empresa}').join(lead.company || '')
    if (selected.channel === 'whatsapp') {
      const phone = (lead.whatsapp || lead.phone).replace(/\D/g, '')
      if (!phone) { setFeedback({ message: 'Este lead não possui WhatsApp ou telefone.', tone: 'warning' }); return }
      window.open(`https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    } else if (selected.channel === 'email') {
      if (!lead.email) { setFeedback({ message: 'Este lead não possui e-mail.', tone: 'warning' }); return }
      window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(selected.name)}&body=${encodeURIComponent(text)}`
    } else {
      if (!lead.phone) { setFeedback({ message: 'Este lead não possui telefone.', tone: 'warning' }); return }
      window.location.href = `tel:${lead.phone.replace(/\D/g, '')}`
    }
    addActivity({ leadId: lead.id, type: selected.channel, title: `Contato da campanha ${selected.name}`, description: text, date: now })
    updateLead({ ...lead, lastContactAt: now, contactCount: (lead.contactCount || 0) + 1 })
    markContacted(selected.id, lead.id)
  }

  return <div className="page">
    {feedback && <StatusMessage message={feedback.message} tone={feedback.tone} onClose={() => setFeedback(null)}/>}
    <ConfirmDialog open={confirmDelete} title="Excluir campanha" message="Excluir esta campanha? Esta ação não remove os Leads vinculados." danger confirmLabel="Excluir" onClose={() => setConfirmDelete(false)} onConfirm={() => { if (selected) { removeCampaign(selected.id); setFeedback({ message: 'Campanha excluída com sucesso.', tone: 'success' }) } setConfirmDelete(false) }}/>
    <header className="page-header"><div><span className="eyebrow">CRM • ENTREGABILIDADE</span><h1>Campanhas e cadências</h1><p>Organize contatos consentidos em uma fila segura, sempre com ação humana e histórico no CRM.</p></div></header>

    <section className="campaign-metrics">
      <article className="panel-card compact-card"><span>Campanhas</span><strong>{campaigns.length}</strong></article>
      <article className="panel-card compact-card"><span>Leads em filas</span><strong>{campaigns.reduce((sum, item) => sum + item.leadIds.length, 0)}</strong></article>
      <article className="panel-card compact-card"><span>Contatos concluídos</span><strong>{campaigns.reduce((sum, item) => sum + item.contactedLeadIds.length, 0)}</strong></article>
      <article className="panel-card compact-card"><span>Com opt-in</span><strong>{leads.filter((lead) => lead.consentStatus === 'granted' && !lead.doNotContact).length}</strong></article>
    </section>

    {!campaigns.length ? <section className="panel-card empty-campaign"><MessageCircle size={34}/><h2>Nenhuma campanha criada</h2><p>Selecione leads no Kanban do CRM e use “Criar campanha”.</p></section> : <section className="campaign-layout">
      <aside className="panel-card campaign-list">{campaigns.map((campaign) => <button type="button" key={campaign.id} className={campaign.id === selected?.id ? 'active' : ''} onClick={() => setSelectedId(campaign.id)}><div>{campaign.channel === 'whatsapp' ? <MessageCircle/> : campaign.channel === 'email' ? <Mail/> : <Phone/>}<span><strong>{campaign.name}</strong><small>{campaign.contactedLeadIds.length}/{campaign.leadIds.length} contatos</small></span></div><b>{campaign.status}</b></button>)}</aside>
      {selected && <main className="panel-card campaign-detail">
        <div className="campaign-detail-head"><div><span>{selected.channel}</span><h2>{selected.name}</h2><p>{selected.message}</p></div><button type="button" className="danger-icon" onClick={() => setConfirmDelete(true)}><Trash2/></button></div>
        <div className="campaign-settings"><div><Clock3/><span><strong>{selected.intervalMinutes} min</strong><small>intervalo recomendado</small></span></div><div><UsersRound/><span><strong>{selected.dailyLimit}/dia</strong><small>limite configurado</small></span></div><div><ShieldAlert/><span><strong>{queue.length - eligible.length}</strong><small>suprimidos/sem opt-in</small></span></div><div><CheckCircle2/><span><strong>{pending.length}</strong><small>pendentes elegíveis</small></span></div></div>
        <div className="campaign-actions"><Button onClick={openNext} disabled={!pending.length}><Play size={17}/> Abrir próximo contato</Button><Button className="secondary" onClick={() => updateCampaign(selected.id, { status: selected.status === 'paused' ? 'active' : 'paused' })}>{selected.status === 'paused' ? <Play size={17}/> : <Pause size={17}/>} {selected.status === 'paused' ? 'Retomar' : 'Pausar'}</Button></div>
        <div className="campaign-queue">{queue.map((lead) => lead && <article key={lead.id} className={selected.contactedLeadIds.includes(lead.id) ? 'done' : lead.consentStatus !== 'granted' || lead.doNotContact ? 'blocked' : ''}><div><strong>{lead.name}</strong><span>{lead.company || lead.city || 'Sem empresa'}</span></div><small>{selected.contactedLeadIds.includes(lead.id) ? 'Concluído' : lead.consentStatus !== 'granted' || lead.doNotContact ? 'Bloqueado por consentimento' : 'Aguardando contato'}</small></article>)}</div>
      </main>}
    </section>}
  </div>
}
