import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowDown, ArrowUp, BriefcaseBusiness, CircleDollarSign,
  Clock3, LayoutGrid, ListChecks, RotateCcw, Settings2, TrendingUp, UsersRound
} from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useDashboardWidgetsStore, type WidgetId } from '../../../lib/dashboardWidgetsStore'
import { calculateExecutiveMetrics, generatePredictionAlerts } from '../../../lib/executiveAnalytics'
import { useFinanceStore } from '../../../lib/financeStore'
import { buildGlobalTimeline } from '../../../lib/globalTimeline'
import { useMarketingStore } from '../../../lib/marketingStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useTasksStore } from '../../../lib/tasksStore'
import { useCalendarStore } from '../../../lib/calendarStore'

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function WidgetDashboardPage() {
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const finance = useFinanceStore((state) => state.entries)
  const contracts = useContractsStore((state) => state.contracts)
  const projects = useProjectsStore((state) => state.projects)
  const tasks = useTasksStore((state) => state.tasks)
  const tickets = useSupportStore((state) => state.tickets)
  const contents = useMarketingStore((state) => state.contents)
  const events = useCalendarStore((state) => state.events)
  const { widgets, toggle, move, resize, reset } = useDashboardWidgetsStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const metrics = useMemo(() => calculateExecutiveMetrics({
    clients, leads, finance, contracts, projects, tasks, tickets
  }), [clients, leads, finance, contracts, projects, tasks, tickets])

  const alerts = useMemo(() => generatePredictionAlerts(metrics), [metrics])
  const timeline = useMemo(() => buildGlobalTimeline({
    leads, finance, contracts, projects, tasks, tickets, contents, events
  }), [leads, finance, contracts, projects, tasks, tickets, contents, events])

  const visible = [...widgets].filter((item) => item.visible).sort((a, b) => a.order - b.order)

  function widgetContent(id: WidgetId) {
    if (id === 'revenue') return <><CircleDollarSign/><span>Receita</span><strong>{currency(metrics.revenue)}</strong><small>Lucro: {currency(metrics.profit)}</small></>
    if (id === 'pipeline') return <><TrendingUp/><span>Pipeline</span><strong>{currency(metrics.pipeline)}</strong><small>{metrics.conversionRate.toFixed(1)}% conversão</small></>
    if (id === 'clients') return <><UsersRound/><span>Clientes ativos</span><strong>{metrics.activeClients}</strong><small>{metrics.atRiskClients} em risco</small></>
    if (id === 'tasks') return <><ListChecks/><span>Tarefas atrasadas</span><strong>{metrics.overdueTasks}</strong><small>Atenção operacional</small></>
    if (id === 'projects') return <><BriefcaseBusiness/><span>Projetos críticos</span><strong>{metrics.criticalProjects}</strong><small>{metrics.activeProjects} ativos</small></>
    if (id === 'support') return <><Clock3/><span>SLA vencido</span><strong>{metrics.slaBreaches}</strong><small>{metrics.openTickets} chamados abertos</small></>
    if (id === 'forecast') return <><TrendingUp/><span>Previsão 30 dias</span><strong>{currency(metrics.forecast30)}</strong><small>90 dias: {currency(metrics.forecast90)}</small></>
    if (id === 'alerts') return <div className="widget-alert-list">{alerts.slice(0,5).map((alert) => <div key={alert.id} className={`severity-${alert.severity}`}><AlertTriangle size={16}/><div><strong>{alert.title}</strong><p>{alert.description}</p></div></div>)}{!alerts.length && <span>Sem alertas relevantes.</span>}</div>
    return <div className="widget-timeline">{timeline.slice(0,8).map((item) => <div key={item.id}><span className={`timeline-type ${item.type}`}/><div><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></div></div>)}</div>
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">PAINEL TITANIUM</span><h1>Espaço de trabalho configurável</h1><p>Escolha, organize e dimensione os indicadores do seu dia.</p></div>
      <Button onClick={() => setSettingsOpen(true)}><Settings2 size={18}/> Personalizar widgets</Button>
    </header>

    <section className="widget-dashboard-grid">
      {visible.map((widget) => <article key={widget.id} className={`panel-card dashboard-widget size-${widget.size}`}>
        <div className="dashboard-widget-title"><LayoutGrid size={15}/><span>{widget.title}</span></div>
        <div className="dashboard-widget-content">{widgetContent(widget.id)}</div>
      </article>)}
    </section>

    <Modal title="Personalizar dashboard" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
      <div className="widget-settings-list">
        {widgets.sort((a,b) => a.order - b.order).map((widget) => <div key={widget.id}>
          <label><input type="checkbox" checked={widget.visible} onChange={() => toggle(widget.id)}/><span>{widget.title}</span></label>
          <select value={widget.size} onChange={(event) => resize(widget.id, event.target.value as typeof widget.size)}>
            <option value="small">Pequeno</option>
            <option value="medium">Médio</option>
            <option value="large">Grande</option>
          </select>
          <button type="button" aria-label={`Mover ${widget.title} para cima`} onClick={() => move(widget.id,'up')}><ArrowUp size={15}/></button>
          <button type="button" aria-label={`Mover ${widget.title} para baixo`} onClick={() => move(widget.id,'down')}><ArrowDown size={15}/></button>
        </div>)}
      </div>
      <Button variant="secondary" className="full" onClick={reset}><RotateCcw size={16}/> Restaurar padrão</Button>
    </Modal>
  </div>
}
