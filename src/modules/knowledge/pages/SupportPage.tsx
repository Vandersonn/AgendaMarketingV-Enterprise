import { useMemo, useState } from 'react'
import { Clock3, MessageSquare, Plus, Star, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useCrmStore } from '../../../lib/crmStore'
import { useSupportStore, type TicketPriority, type TicketStatus } from '../../../lib/supportStore'
import { useTeamStore } from '../../../lib/teamStore'

const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  waiting_client: 'Aguardando cliente',
  resolved: 'Resolvido',
  closed: 'Fechado'
}

export function SupportPage() {
  const { tickets, addTicket, setStatus, assign, addMessage, rate, removeTicket } = useSupportStore()
  const clients = useCrmStore((state) => state.clients)
  const members = useTeamStore((state) => state.members)
  const activeMembers = useMemo(() => members.filter((member) => member.active), [members])
  const [open, setOpen] = useState(false)
  const [messageTicket, setMessageTicket] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<'all' | TicketStatus>('all')
  const [form, setForm] = useState({
    clientId: '',
    subject: '',
    description: '',
    category: 'Suporte geral',
    priority: 'medium' as TicketPriority,
    status: 'open' as TicketStatus,
    assigneeEmail: 'produtosecursosnet@gmail.com',
    slaHours: 24
  })

  const filtered = tickets.filter((item) => filter === 'all' || item.status === filter)
  const overdue = tickets.filter((item) =>
    !['resolved', 'closed'].includes(item.status) && new Date(item.dueAt) < new Date()
  ).length
  const averageRating = tickets.filter((item) => item.rating).length
    ? tickets.filter((item) => item.rating).reduce((sum, item) => sum + (item.rating ?? 0), 0) / tickets.filter((item) => item.rating).length
    : 0

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addTicket(form)
    setOpen(false)
    setForm({
      clientId: '', subject: '', description: '', category: 'Suporte geral',
      priority: 'medium', status: 'open',
      assigneeEmail: 'produtosecursosnet@gmail.com', slaHours: 24
    })
  }

  function sendMessage() {
    if (!messageTicket || !message.trim()) return
    addMessage(messageTicket, 'Vanderson de Castro', message.trim())
    setMessage('')
    setMessageTicket(null)
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">ATENDIMENTO E SLA</span><h1>Central de suporte</h1><p>Organize chamados, responsáveis, prazos e satisfação.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={18}/> Novo chamado</Button>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Chamados abertos</span><strong>{tickets.filter((item)=>!['resolved','closed'].includes(item.status)).length}</strong></article>
      <article className="panel-card compact-card"><span>SLA vencido</span><strong>{overdue}</strong></article>
      <article className="panel-card compact-card"><span>Satisfação média</span><strong>{averageRating ? averageRating.toFixed(1) : '—'}</strong></article>
    </section>

    <div className="support-filters">
      {(['all','open','in_progress','waiting_client','resolved','closed'] as const).map((status) =>
        <button type="button" key={status} className={filter===status?'active':''} onClick={()=>setFilter(status)}>
          {status==='all'?'Todos':statusLabels[status]}
        </button>
      )}
    </div>

    <section className="support-grid">
      {filtered.map((ticket) => {
        const client = clients.find((item)=>item.id===ticket.clientId)
        const isOverdue = !['resolved','closed'].includes(ticket.status) && new Date(ticket.dueAt) < new Date()
        return <article key={ticket.id} className={`panel-card support-ticket priority-${ticket.priority} ${isOverdue?'sla-overdue':''}`}>
          <div className="support-ticket-head">
            <div><span>{ticket.code}</span><h2>{ticket.subject}</h2><p>{client?.name || 'Sem cliente'} • {ticket.category}</p></div>
            <button type="button" className="icon-danger" onClick={()=>removeTicket(ticket.id)}><Trash2 size={17}/></button>
          </div>
          <p className="support-description">{ticket.description}</p>
          <div className="support-sla"><Clock3 size={15}/><span>{isOverdue?'SLA vencido':'Prazo'}: {new Date(ticket.dueAt).toLocaleString('pt-BR')}</span></div>
          <label>Status<select value={ticket.status} onChange={(event)=>setStatus(ticket.id,event.target.value as TicketStatus)}>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <label>Responsável<select value={ticket.assigneeEmail} onChange={(event)=>assign(ticket.id,event.target.value)}>{activeMembers.map((member)=><option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
          <div className="support-ticket-footer">
            <Button variant="secondary" onClick={()=>setMessageTicket(ticket.id)}><MessageSquare size={16}/> Responder ({ticket.messages.length})</Button>
            <div className="ticket-rating">{[1,2,3,4,5].map((value)=><button type="button" key={value} className={(ticket.rating??0)>=value?'active':''} onClick={()=>rate(ticket.id,value)}><Star size={15}/></button>)}</div>
          </div>
          {ticket.messages.length>0 && <div className="ticket-last-message"><strong>{ticket.messages[ticket.messages.length-1].author}</strong><p>{ticket.messages[ticket.messages.length-1].message}</p></div>}
        </article>
      })}
      {!filtered.length && <article className="panel-card empty-panel"><strong>Nenhum chamado encontrado</strong></article>}
    </section>

    <Modal title="Novo chamado" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label>Cliente<select value={form.clientId} onChange={(event)=>setForm((current) => ({...current,clientId:event.target.value}))}><option value="">Sem cliente</option>{clients.map((client)=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Responsável<select value={form.assigneeEmail} onChange={(event)=>setForm((current) => ({...current,assigneeEmail:event.target.value}))}>{activeMembers.map((member)=><option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
        <label className="full">Assunto<input value={form.subject} onChange={(event)=>setForm((current) => ({...current,subject:event.target.value}))} required/></label>
        <label>Categoria<input value={form.category} onChange={(event)=>setForm((current) => ({...current,category:event.target.value}))}/></label>
        <label>Prioridade<select value={form.priority} onChange={(event)=>setForm((current) => ({...current,priority:event.target.value as TicketPriority}))}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
        <label>SLA em horas<input type="number" min="1" value={form.slaHours} onChange={(event)=>setForm((current) => ({...current,slaHours:Number(event.target.value)}))}/></label>
        <label className="full">Descrição<textarea value={form.description} onChange={(event)=>setForm((current) => ({...current,description:event.target.value}))}/></label>
        <Button className="full">Criar chamado</Button>
      </form>
    </Modal>

    <Modal title="Responder chamado" open={Boolean(messageTicket)} onClose={()=>setMessageTicket(null)}>
      <div className="form-grid">
        <label className="full">Mensagem<textarea value={message} onChange={(event)=>setMessage(event.target.value)}/></label>
        <Button className="full" onClick={sendMessage}>Enviar resposta</Button>
      </div>
    </Modal>
  </div>
}
