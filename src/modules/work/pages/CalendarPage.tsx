import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, List, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { DateTimeField } from '../../../components/DateTimeField'
import { Modal } from '../../../components/Modal'
import { useCalendarStore, type CalendarEvent } from '../../../lib/calendarStore'
import { useCrmStore } from '../../../lib/crmStore'

const typeLabels: Record<CalendarEvent['type'], string> = {
  meeting: 'Reunião', delivery: 'Entrega', content: 'Conteúdo', task: 'Tarefa', call: 'Ligação', visit: 'Visita'
}
const statusLabels: Record<CalendarEvent['status'], string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado'
}

type EventForm = Omit<CalendarEvent, 'id'>

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function blankForm(date = new Date()): EventForm {
  const start = new Date(date)
  start.setHours(Math.max(8, start.getHours()), 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return { title: '', clientId: '', start: toLocalInput(start), end: toLocalInput(end), type: 'meeting', status: 'scheduled', notes: '', location: '', reminderMinutes: 30, allDay: false }
}

export function CalendarPage() {
  const { events, addEvent, updateEvent, removeEvent } = useCalendarStore()
  const clients = useCrmStore((state) => state.clients)
  const [current, setCurrent] = useState(() => new Date())
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(() => blankForm())
  const [view, setView] = useState<'month' | 'list'>('month')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarEvent['type']>('all')

  const filteredEvents = useMemo(() => events
    .filter((item) => typeFilter === 'all' || item.type === typeFilter)
    .filter((item) => `${item.title} ${item.location || ''} ${item.notes}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()), [events, query, typeFilter])

  const days = useMemo(() => {
    const year = current.getFullYear()
    const month = current.getMonth()
    const first = new Date(year, month, 1)
    const start = new Date(year, month, 1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [current])

  const todayEvents = events.filter((item) => new Date(item.start).toDateString() === new Date().toDateString() && item.status !== 'cancelled')
  const upcomingEvents = events.filter((item) => new Date(item.start).getTime() > Date.now() && item.status !== 'cancelled')

  function openNew(date = new Date()) {
    setEditingId(null)
    setForm(blankForm(date))
    setOpen(true)
  }

  function edit(item: CalendarEvent) {
    setEditingId(item.id)
    setForm({ ...item, start: item.start.slice(0, 16), end: item.end.slice(0, 16) })
    setOpen(true)
  }

  function setStart(start: string) {
    const previousStart = new Date(form.start).getTime()
    const previousEnd = new Date(form.end).getTime()
    const duration = Number.isFinite(previousEnd - previousStart) ? Math.max(15 * 60000, previousEnd - previousStart) : 60 * 60000
    const nextEnd = start ? toLocalInput(new Date(new Date(start).getTime() + duration)) : form.end
    setForm((current) => ({ ...current, start, end: nextEnd }))
  }

  function setDuration(minutes: number) {
    if (!form.start) return
    setForm((current) => ({ ...current, end: toLocalInput(new Date(new Date(form.start).getTime() + minutes * 60000)) }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (new Date(form.end).getTime() <= new Date(form.start).getTime()) return
    if (editingId) updateEvent({ ...form, id: editingId })
    else addEvent(form)
    setOpen(false)
  }

  return <div className="page smart-calendar-page">
    <header className="page-header">
      <div><span className="eyebrow">AGENDA INTELIGENTE</span><h1>{current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h1><p>Cadastre compromissos com atalhos de data, duração automática e visão em lista.</p></div>
      <div className="actions"><div className="calendar-view-toggle"><button type="button" className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}><CalendarDays size={16}/> Mês</button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16}/> Lista</button></div><Button onClick={() => openNew()}><Plus size={18}/> Novo compromisso</Button></div>
    </header>

    <section className="calendar-summary-grid">
      <article className="panel-card"><CalendarDays/><span>Hoje</span><strong>{todayEvents.length}</strong><small>compromissos</small></article>
      <article className="panel-card"><Clock3/><span>Próximos</span><strong>{upcomingEvents.length}</strong><small>na agenda</small></article>
      <article className="panel-card"><CheckCircle2/><span>Concluídos</span><strong>{events.filter((item) => item.status === 'completed').length}</strong><small>registrados</small></article>
    </section>

    <section className="calendar-toolbar panel-card">
      <div className="calendar-controls"><button type="button" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft/></button><button type="button" onClick={() => setCurrent(new Date())}>Hoje</button><button type="button" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight/></button></div>
      <label className="calendar-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar compromisso, local ou observação..."/></label>
      <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}><option value="all">Todos os tipos</option>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    </section>

    {view === 'month' ? <section className="content-calendar panel-card">
      {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((label) => <div key={label} className="calendar-weekday">{label}</div>)}
      {days.map((day) => {
        const items = filteredEvents.filter((item) => new Date(item.start).toDateString() === day.toDateString())
        return <div key={day.toISOString()} className={`calendar-cell ${day.getMonth() !== current.getMonth() ? 'outside' : ''} ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`} onDoubleClick={() => openNew(day)}>
          <button type="button" className="calendar-day-number" onClick={() => openNew(day)}>{day.getDate()}</button>
          <div className="calendar-items">{items.slice(0, 4).map((item) => <button type="button" key={item.id} className={`calendar-content event-${item.type} status-${item.status}`} onClick={() => edit(item)}><span>{new Date(item.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · {item.title}</span></button>)}{items.length > 4 && <small>+{items.length - 4} compromisso(s)</small>}</div>
        </div>
      })}
    </section> : <section className="calendar-list panel-card">{filteredEvents.map((item) => <article key={item.id} className={`calendar-list-item event-${item.type}`}><div className="calendar-list-date"><strong>{new Date(item.start).getDate()}</strong><span>{new Date(item.start).toLocaleDateString('pt-BR',{month:'short'})}</span></div><div><span className="calendar-list-meta">{new Date(item.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}–{new Date(item.end).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · {typeLabels[item.type]}</span><h3>{item.title}</h3><p>{item.location && <><MapPin size={13}/> {item.location} · </>}{statusLabels[item.status]}</p></div><div className="row-actions"><button type="button" onClick={() => edit(item)} aria-label={`Editar compromisso ${item.title}`}><Pencil size={16}/></button><button type="button" className="icon-danger" onClick={() => removeEvent(item.id)} aria-label={`Excluir compromisso ${item.title}`}><Trash2 size={16}/></button></div></article>)}{!filteredEvents.length && <div className="empty-inline">Nenhum compromisso encontrado.</div>}</section>}

    <Modal title={editingId ? 'Editar compromisso' : 'Novo compromisso'} open={open} onClose={() => setOpen(false)}>
      <form className="form-grid smart-calendar-form" onSubmit={save}>
        <label className="full">Título<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Reunião de apresentação" required/></label>
        <label>Cliente<select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Tipo<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CalendarEvent['type'] }))}>{Object.entries(typeLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="full">Início<DateTimeField value={form.start} onChange={setStart} required/></label>
        <label className="full">Duração rápida<div className="duration-presets"><button type="button" onClick={() => setDuration(30)}>30 min</button><button type="button" onClick={() => setDuration(60)}>1 hora</button><button type="button" onClick={() => setDuration(90)}>1h30</button><button type="button" onClick={() => setDuration(120)}>2 horas</button></div></label>
        <label>Fim<input type="datetime-local" value={form.end} min={form.start} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} required/></label>
        <label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CalendarEvent['status'] }))}>{Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Local ou link<input value={form.location || ''} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Sala, endereço ou Google Meet"/></label>
        <label>Lembrete<select value={form.reminderMinutes ?? 30} onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: Number(event.target.value) }))}><option value={0}>Sem lembrete</option><option value={10}>10 minutos antes</option><option value={30}>30 minutos antes</option><option value={60}>1 hora antes</option><option value={1440}>1 dia antes</option></select></label>
        <label className="full">Observações<textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Pauta, materiais necessários e próximos passos"/></label>
        <div className="full modal-form-actions">{editingId && <Button type="button" variant="secondary" onClick={() => { removeEvent(editingId); setOpen(false) }}><Trash2 size={16}/> Excluir</Button>}<Button>{editingId ? 'Salvar alterações' : 'Salvar compromisso'}</Button></div>
      </form>
    </Modal>
  </div>
}
