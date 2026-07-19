import { Activity, CheckCircle2, Radio, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useEventBusStore } from '../../../lib/eventBusStore'

export function EventBusPage() {
  const { events, markProcessed, clearProcessed } = useEventBusStore()
  const pending = events.filter((item) => !item.processed).length

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">EVENT-DRIVEN CORE</span><h1>Barramento de Eventos</h1><p>Acompanhe eventos internos que alimentam IA, automações e auditoria.</p></div>
      <Button variant="secondary" onClick={clearProcessed}><Trash2 size={17}/> Limpar processados</Button>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Eventos totais</span><strong>{events.length}</strong></article>
      <article className="panel-card compact-card"><span>Pendentes</span><strong>{pending}</strong></article>
      <article className="panel-card compact-card"><span>Processados</span><strong>{events.length-pending}</strong></article>
    </section>

    <article className="panel-card event-bus-panel">
      <div className="panel-header"><div><h2>Fluxo de eventos</h2><p>Eventos mais recentes primeiro.</p></div><Radio/></div>
      <div className="event-bus-list">
        {events.map((event) => <div key={event.id} className={event.processed ? 'processed' : ''}>
          <div className="event-bus-icon">{event.processed ? <CheckCircle2/> : <Activity/>}</div>
          <div><span>{event.type} • {event.source}</span><strong>{event.title}</strong><p>{event.description}</p><small>{new Date(event.createdAt).toLocaleString('pt-BR')}</small></div>
          {!event.processed && <button type="button" onClick={() => markProcessed(event.id)}>Marcar processado</button>}
        </div>)}
        {!events.length && <div className="empty-inline">Nenhum evento publicado.</div>}
      </div>
    </article>
  </div>
}
