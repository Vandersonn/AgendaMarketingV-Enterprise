import { useMemo } from 'react'
import {
  Activity, AlertTriangle, BadgeDollarSign, BriefcaseBusiness,
  CircleDollarSign, Clock3, Gauge, Target, TrendingUp, UsersRound
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useContractsStore } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'
import { calculateExecutiveMetrics, generatePredictionAlerts } from '../../../lib/executiveAnalytics'
import { useFinanceStore } from '../../../lib/financeStore'
import { buildGlobalTimeline } from '../../../lib/globalTimeline'
import { useMarketingStore } from '../../../lib/marketingStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useTasksStore } from '../../../lib/tasksStore'

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ExecutiveDashboardPage() {
  const navigate = useNavigate()
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const finance = useFinanceStore((state) => state.entries)
  const contracts = useContractsStore((state) => state.contracts)
  const projects = useProjectsStore((state) => state.projects)
  const tasks = useTasksStore((state) => state.tasks)
  const tickets = useSupportStore((state) => state.tickets)
  const contents = useMarketingStore((state) => state.contents)
  const events = useCalendarStore((state) => state.events)

  const metrics = useMemo(() => calculateExecutiveMetrics({
    clients, leads, finance, contracts, projects, tasks, tickets
  }), [clients, leads, finance, contracts, projects, tasks, tickets])

  const alerts = useMemo(() => generatePredictionAlerts(metrics), [metrics])
  const timeline = useMemo(() => buildGlobalTimeline({
    leads, finance, contracts, projects, tasks, tickets, contents, events
  }), [leads, finance, contracts, projects, tasks, tickets, contents, events])

  const chart = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const revenue = finance
        .filter((item) => item.type === 'income' && item.status === 'paid' && (item.paidDate || item.dueDate).slice(0, 7) === key)
        .reduce((sum, item) => sum + item.value, 0)
      const expenses = finance
        .filter((item) => item.type === 'expense' && item.status === 'paid' && (item.paidDate || item.dueDate).slice(0, 7) === key)
        .reduce((sum, item) => sum + item.value, 0)
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue,
        expenses,
        profit: revenue - expenses
      }
    })
  }, [finance])

  return <div className="page">
    <header className="executive-hero">
      <div>
        <span className="eyebrow">CENTRAL EXECUTIVA</span>
        <h1>Visão estratégica da empresa</h1>
        <p>Financeiro, comercial, clientes, projetos e previsões em um único painel.</p>
      </div>
      <div className="executive-score">
        <Gauge size={22}/>
        <div><span>Lucro acumulado</span><strong>{currency(metrics.profit)}</strong></div>
      </div>
    </header>

    <section className="executive-kpi-grid">
      <article className="panel-card"><CircleDollarSign/><span>Receita</span><strong>{currency(metrics.revenue)}</strong><small>Realizada</small></article>
      <article className="panel-card"><BadgeDollarSign/><span>Previsão 30 dias</span><strong>{currency(metrics.forecast30)}</strong><small>Receita esperada</small></article>
      <article className="panel-card"><TrendingUp/><span>Pipeline</span><strong>{currency(metrics.pipeline)}</strong><small>{metrics.conversionRate.toFixed(1)}% de conversão</small></article>
      <article className="panel-card"><UsersRound/><span>Clientes em risco</span><strong>{metrics.atRiskClients}</strong><small>de {metrics.activeClients} clientes</small></article>
      <article className="panel-card"><Target/><span>LTV estimado</span><strong>{currency(metrics.ltv)}</strong><small>CAC {currency(metrics.cac)}</small></article>
      <article className="panel-card"><BriefcaseBusiness/><span>Projetos críticos</span><strong>{metrics.criticalProjects}</strong><small>{metrics.overdueTasks} tarefa(s) atrasada(s)</small></article>
    </section>

    <section className="executive-main-grid">
      <article className="panel-card executive-chart-card">
        <div className="panel-header"><div><h2>Resultado financeiro</h2><p>Receita, despesa e lucro dos últimos seis meses.</p></div></div>
        <div className="executive-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip formatter={(value) => currency(Number(value))}/>
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98122" strokeWidth={3}/>
              <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="#dc262622" strokeWidth={2}/>
              <Area type="monotone" dataKey="profit" stroke="#7c3aed" fill="#7c3aed22" strokeWidth={3}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="panel-card predictive-card">
        <div className="panel-header"><div><h2>Alertas preditivos</h2><p>Riscos e oportunidades identificados.</p></div><Activity/></div>
        <div className="predictive-list">
          {alerts.map((alert) => <button type="button" key={alert.id} className={`severity-${alert.severity}`} onClick={() => navigate(alert.path)}>
            <AlertTriangle size={17}/>
            <div><strong>{alert.title}</strong><p>{alert.description}</p></div>
          </button>)}
          {!alerts.length && <div className="empty-inline">Nenhum risco relevante detectado.</div>}
        </div>
      </article>
    </section>

    <section className="executive-secondary-grid">
      <article className="panel-card indicator-table">
        <div className="panel-header"><div><h2>Indicadores estratégicos</h2><p>Eficiência comercial e retenção.</p></div></div>
        <div><span>Ticket médio</span><strong>{currency(metrics.averageTicket)}</strong></div>
        <div><span>CAC estimado</span><strong>{currency(metrics.cac)}</strong></div>
        <div><span>LTV estimado</span><strong>{currency(metrics.ltv)}</strong></div>
        <div><span>Churn estimado</span><strong>{metrics.churnRate.toFixed(1)}%</strong></div>
        <div><span>Previsão 90 dias</span><strong>{currency(metrics.forecast90)}</strong></div>
        <div><span>SLA vencido</span><strong>{metrics.slaBreaches}</strong></div>
      </article>

      <article className="panel-card global-timeline-card">
        <div className="panel-header"><div><h2>Timeline global</h2><p>Últimas movimentações da empresa.</p></div><Clock3/></div>
        <div className="global-timeline">
          {timeline.slice(0, 20).map((item) => <button type="button" key={item.id} onClick={() => navigate(item.path)}>
            <span className={`timeline-type ${item.type}`}/>
            <div><strong>{item.title}</strong><p>{item.description}</p><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></div>
          </button>)}
          {!timeline.length && <div className="empty-inline">Nenhuma atividade registrada.</div>}
        </div>
      </article>
    </section>
  </div>
}
