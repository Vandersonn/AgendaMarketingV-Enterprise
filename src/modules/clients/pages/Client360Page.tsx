import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, CircleDollarSign, FileSignature, FolderOpen, MessageCircle, Plus, Search, Tag, UserRoundCheck, UsersRound, X } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useClientRelationshipStore, type RelationshipStatus } from '../../../lib/clientRelationshipStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useDocumentsStore } from '../../../lib/documentsStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useMarketingStore } from '../../../lib/marketingStore'

const statusLabels: Record<RelationshipStatus, string> = {
  prospect: 'Prospect',
  active: 'Ativo',
  at_risk: 'Em risco',
  inactive: 'Inativo'
}

export function Client360Page() {
  const [searchParams, setSearchParams] = useSearchParams()
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const activities = useCrmStore((state) => state.activities)
  const proposals = useCrmStore((state) => state.proposals)
  const addActivity = useCrmStore((state) => state.addActivity)
  const events = useCalendarStore((state) => state.events)
  const contracts = useContractsStore((state) => state.contracts)
  const documents = useDocumentsStore((state) => state.documents)
  const finance = useFinanceStore((state) => state.entries)
  const contents = useMarketingStore((state) => state.contents)
  const profiles = useClientRelationshipStore((state) => state.profiles)
  const upsertProfile = useClientRelationshipStore((state) => state.upsertProfile)
  const addTag = useClientRelationshipStore((state) => state.addTag)
  const removeTag = useClientRelationshipStore((state) => state.removeTag)

  const initialClientId = searchParams.get('client') ?? clients[0]?.id ?? ''
  const [selectedId, setSelectedId] = useState(initialClientId)
  const [query, setQuery] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')

  useEffect(() => {
    const requested = searchParams.get('client')
    if (requested && clients.some((client) => client.id === requested)) setSelectedId(requested)
  }, [searchParams, clients])

  const selected = clients.find((item) => item.id === selectedId)
  const profile = profiles.find((item) => item.clientId === selectedId)
  const clientLeads = leads.filter((item) => item.clientId === selectedId)
  const clientContracts = contracts.filter((item) => item.clientId === selectedId)
  const clientDocs = documents.filter((item) => item.clientId === selectedId)
  const clientFinance = finance.filter((item) => item.clientId === selectedId)
  const clientContents = contents.filter((item) => item.clientId === selectedId)
  const clientEvents = events.filter((item) => item.clientId === selectedId)
  const balance = clientFinance.filter((item) => item.type === 'income' && item.status === 'paid').reduce((sum, item) => sum + item.value, 0)

  const calculatedScore = useMemo(() => {
    let score = 25
    if (selected?.email) score += 8
    if (selected?.phone) score += 8
    score += Math.min(clientLeads.length * 8, 24)
    score += Math.min(clientContracts.filter((item) => item.status === 'active').length * 18, 18)
    score += Math.min(activities.filter((item) => item.clientId === selectedId).length * 3, 12)
    score += Math.min(proposals.filter((item) => item.clientId === selectedId && item.status === 'approved').length * 10, 10)
    return Math.min(score, 100)
  }, [selected, selectedId, clientLeads, clientContracts, activities, proposals])

  const clientTimeline = useMemo(() => {
    if (!selectedId) return []
    const rows = [
      ...activities.filter((item) => item.clientId === selectedId).map((item) => ({ date: item.date, title: item.title, description: item.description, type: 'Atividade' })),
      ...proposals.filter((item) => item.clientId === selectedId).map((item) => ({ date: item.createdAt, title: item.title, description: `Proposta de ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, type: 'Proposta' })),
      ...clientEvents.map((item) => ({ date: item.start, title: item.title, description: item.notes, type: 'Agenda' })),
      ...clientContracts.map((item) => ({ date: item.createdAt, title: item.title, description: `Contrato ${item.status}`, type: 'Contrato' })),
      ...clientFinance.map((item) => ({ date: item.createdAt, title: item.description, description: `${item.type === 'income' ? 'Receita' : 'Despesa'} • ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, type: 'Financeiro' })),
      ...clientDocs.map((item) => ({ date: item.createdAt, title: item.name, description: 'Documento adicionado', type: 'Documento' }))
    ]
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedId, activities, proposals, clientEvents, clientContracts, clientFinance, clientDocs])

  const filtered = clients.filter((client) => `${client.name} ${client.company} ${client.email}`.toLowerCase().includes(query.toLowerCase()))

  function selectClient(id: string) {
    setSelectedId(id)
    setSearchParams({ client: id })
  }

  function saveRelationship(data: Partial<{ status: RelationshipStatus; score: number; owner: string; nextContactAt: string }>) {
    if (!selectedId) return
    upsertProfile(selectedId, { score: profile?.score ?? calculatedScore, ...data })
  }

  function submitTag(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !tagInput.trim()) return
    addTag(selectedId, tagInput)
    setTagInput('')
  }

  function submitNote(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !noteTitle.trim()) return
    addActivity({
      clientId: selectedId,
      type: 'note',
      title: noteTitle.trim(),
      description: noteDescription.trim(),
      date: new Date().toISOString()
    })
    upsertProfile(selectedId, { lastContactAt: new Date().toISOString(), score: Math.min((profile?.score ?? calculatedScore) + 2, 100) })
    setNoteTitle('')
    setNoteDescription('')
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CRM 360º ENTERPRISE</span><h1>Central de relacionamento</h1><p>Perfil, inteligência, histórico e próximos passos do cliente em uma única visão.</p></div></header>
    <section className="client360-layout">
      <aside className="panel-card client360-list">
        <div className="search-box"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente..."/></div>
        {filtered.map((client) => <button type="button" key={client.id} className={selectedId === client.id ? 'active' : ''} onClick={() => selectClient(client.id)}><div className="avatar">{client.name.slice(0, 2).toUpperCase()}</div><div><strong>{client.name}</strong><span>{client.company || client.email}</span></div></button>)}
      </aside>
      <div className="client360-main">
        {!selected ? <article className="panel-card empty-panel"><strong>Selecione um cliente</strong></article> : <>
          <article className="panel-card client360-profile relationship-profile">
            <div><span className="eyebrow">PERFIL ESTRATÉGICO</span><h2>{selected.name}</h2><p>{selected.company} • {selected.city}{selected.state ? `/${selected.state}` : ''}</p></div>
            <div className="relationship-score"><span>Score</span><strong>{profile?.score ?? calculatedScore}</strong><small>/100</small></div>
            <div className="client360-contact"><span>{selected.email}</span><span>{selected.phone}</span></div>
          </article>

          <article className="panel-card relationship-controls">
            <div className="relationship-field"><label>Status</label><select value={profile?.status ?? 'prospect'} onChange={(event) => saveRelationship({ status: event.target.value as RelationshipStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="relationship-field"><label>Responsável</label><input value={profile?.owner ?? ''} onChange={(event) => saveRelationship({ owner: event.target.value })} placeholder="Responsável comercial"/></div>
            <div className="relationship-field"><label>Próximo contato</label><input type="datetime-local" value={profile?.nextContactAt?.slice(0, 16) ?? ''} onChange={(event) => saveRelationship({ nextContactAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}/></div>
            <div className="relationship-field score-range"><label>Score manual</label><input type="range" min="0" max="100" value={profile?.score ?? calculatedScore} onChange={(event) => saveRelationship({ score: Number(event.target.value) })}/><span>{profile?.score ?? calculatedScore}</span></div>
          </article>

          <section className="client360-metrics">
            <article className="panel-card"><UsersRound/><span>Oportunidades</span><strong>{clientLeads.length}</strong></article>
            <article className="panel-card"><FileSignature/><span>Contratos</span><strong>{clientContracts.length}</strong></article>
            <article className="panel-card"><FolderOpen/><span>Documentos</span><strong>{clientDocs.length}</strong></article>
            <article className="panel-card"><CircleDollarSign/><span>Receita recebida</span><strong>{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></article>
            <article className="panel-card"><MessageCircle/><span>Conteúdos</span><strong>{clientContents.length}</strong></article>
            <article className="panel-card"><CalendarDays/><span>Eventos</span><strong>{clientEvents.length}</strong></article>
          </section>

          <section className="relationship-grid">
            <article className="panel-card">
              <div className="panel-header"><div><h2><Tag size={18}/> Segmentação</h2><p>Tags para campanhas, filtros e priorização.</p></div></div>
              <div className="relationship-tags">{(profile?.tags ?? []).map((tag) => <span key={tag}>{tag}<button type="button" onClick={() => removeTag(selectedId, tag)} aria-label={`Remover ${tag}`}><X size={13}/></button></span>)}{!(profile?.tags ?? []).length && <small>Nenhuma tag adicionada.</small>}</div>
              <form className="tag-form" onSubmit={submitTag}><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Ex.: VIP, Clínica, Retenção"/><Button type="submit" variant="secondary"><Plus size={16}/> Adicionar</Button></form>
            </article>
            <article className="panel-card">
              <div className="panel-header"><div><h2><UserRoundCheck size={18}/> Nota rápida</h2><p>Registre uma interação sem sair da visão 360°.</p></div></div>
              <form className="quick-note-form" onSubmit={submitNote}><input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Título da interação" required/><textarea value={noteDescription} onChange={(event) => setNoteDescription(event.target.value)} placeholder="Resumo, decisão ou próximo passo"/><Button type="submit"><Plus size={16}/> Registrar na timeline</Button></form>
            </article>
          </section>

          <article className="panel-card">
            <div className="panel-header"><div><h2>Timeline completa</h2><p>Histórico cronológico e unificado do relacionamento.</p></div><span className={`relationship-status status-${profile?.status ?? 'prospect'}`}>{statusLabels[profile?.status ?? 'prospect']}</span></div>
            <div className="timeline client360-timeline">{clientTimeline.map((item, index) => <div key={`${item.date}-${index}`}><span>{new Date(item.date).toLocaleString('pt-BR')} • {item.type}</span><strong>{item.title}</strong><p>{item.description}</p></div>)}{!clientTimeline.length && <div className="empty-inline">Nenhuma atividade registrada.</div>}</div>
          </article>
        </>}
      </div>
    </section>
  </div>
}
