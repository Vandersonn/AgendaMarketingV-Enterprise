import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, Clock3,
  ContactRound, Flame, Goal, Landmark, LayoutDashboard, ListTodo, Search, Sparkles,
  TrendingUp, UsersRound
} from 'lucide-react'
import { useAuthStore } from '../../../lib/authStore'
import { useCrmStore } from '../../../lib/crmStore'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useTasksStore } from '../../../lib/tasksStore'
import { useMarketingStore } from '../../../lib/marketingStore'
import { calculateLeadScore } from '../../../lib/leadScoring'
import { roleForEmail } from '../../../lib/permissions'
import { useTeamStore, type TeamRole } from '../../../lib/teamStore'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function sameDay(value: string, target: Date) {
  const date = new Date(value)
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate()
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const members = useTeamStore((state) => state.members)
  const role = roleForEmail(user?.email, members)
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const events = useCalendarStore((state) => state.events)
  const entries = useFinanceStore((state) => state.entries)
  const monthlyGoal = useFinanceStore((state) => state.monthlyGoal)
  const tasks = useTasksStore((state) => state.tasks)
  const contents = useMarketingStore((state) => state.contents)

  const now = new Date()
  const name = ('name' in (user ?? {}) ? (user as { name?: string }).name : undefined)
    || (user as { user_metadata?: { full_name?: string } } | null)?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Usuário'

  const summary = useMemo(() => {
    const todayEvents = events
      .filter((item) => sameDay(item.start, now) && item.status !== 'cancelled')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    const openTasks = tasks.filter((item) => item.status !== 'done').sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aDue - bDue
    })
    const overdueTasks = openTasks.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < now.getTime())
    const activeLeads = leads.filter((item) => item.stage !== 'won' && item.stage !== 'lost')
    const hotLeads = activeLeads.filter((item) => calculateLeadScore(item).score >= 60)
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthlyIncome = entries
      .filter((item) => item.type === 'income' && item.status === 'paid')
      .filter((item) => {
        const date = new Date(item.paidDate || item.dueDate || item.createdAt)
        return date.getMonth() === month && date.getFullYear() === year
      })
      .reduce((sum, item) => sum + item.value, 0)
    const pipeline = activeLeads.reduce((sum, item) => sum + item.value, 0)
    return { todayEvents, openTasks, overdueTasks, activeLeads, hotLeads, monthlyIncome, pipeline }
  }, [events, tasks, leads, entries])

  const goalProgress = monthlyGoal > 0 ? Math.min(Math.round((summary.monthlyIncome / monthlyGoal) * 100), 100) : 0
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  const workspaceProfiles: Record<TeamRole, { label: string; description: string; paths: string[] }> = {
    owner: { label: 'Visão executiva', description: 'Decisões, receita, clientes e desempenho da operação em uma única visão.', paths: ['/executive','/finance','/crm','/clients','/tasks','/ai-executive'] },
    admin: { label: 'Visão administrativa', description: 'Acompanhe a operação, a equipe e os principais indicadores do negócio.', paths: ['/workspace','/clients','/tasks','/finance','/reports','/settings'] },
    sales: { label: 'Visão comercial', description: 'Priorize Leads, compromissos, propostas e ações que geram novas vendas.', paths: ['/crm','/lead-scoring','/calendar','/proposal-builder','/clients','/tasks'] },
    marketing: { label: 'Visão de marketing', description: 'Organize conteúdos, campanhas, aprovações e resultados de marketing.', paths: ['/marketing','/content-calendar','/approvals','/metrics','/tasks','/ai-studio'] },
    finance: { label: 'Visão financeira', description: 'Controle receitas, despesas, contratos, metas e relatórios financeiros.', paths: ['/finance','/contracts','/reports','/clients','/tasks','/goals'] },
    viewer: { label: 'Minha visão', description: 'Acesse rapidamente as informações e atividades disponíveis para seu perfil.', paths: ['/','/clients','/tasks','/calendar','/reports','/knowledge'] }
  }
  const profileView = workspaceProfiles[role]
  const shortcutCatalog = [
    { label: 'Clientes', detail: `${clients.length} cadastrados`, icon: UsersRound, path: '/clients', tone: 'blue' },
    { label: 'Leads', detail: `${summary.activeLeads.length} em andamento`, icon: ContactRound, path: '/crm', tone: 'cyan' },
    { label: 'Agenda', detail: `${summary.todayEvents.length} hoje`, icon: CalendarClock, path: '/calendar', tone: 'orange' },
    { label: 'Financeiro', detail: currency.format(summary.monthlyIncome), icon: Landmark, path: '/finance', tone: 'green' },
    { label: 'Tarefas', detail: `${summary.openTasks.length} abertas`, icon: ListTodo, path: '/tasks', tone: 'purple' },
    { label: 'IA AMV', detail: 'Insights e criação', icon: Sparkles, path: '/ai-executive', tone: 'violet' },
    { label: 'Painel executivo', detail: 'Indicadores estratégicos', icon: TrendingUp, path: '/executive', tone: 'violet' },
    { label: 'Espaço de trabalho', detail: 'Operação centralizada', icon: LayoutDashboard, path: '/workspace', tone: 'blue' },
    { label: 'Relatórios', detail: 'Análises consolidadas', icon: CircleDollarSign, path: '/reports', tone: 'green' },
    { label: 'Configurações', detail: 'Administração do sistema', icon: Goal, path: '/settings', tone: 'orange' },
    { label: 'Pontuação de Leads', detail: `${summary.hotLeads.length} Leads quentes`, icon: Flame, path: '/lead-scoring', tone: 'orange' },
    { label: 'Propostas', detail: 'Criar e acompanhar', icon: Landmark, path: '/proposal-builder', tone: 'green' },
    { label: 'Marketing', detail: `${contents?.length ?? 0} conteúdos`, icon: Sparkles, path: '/marketing', tone: 'violet' },
    { label: 'Calendário editorial', detail: 'Planejamento de conteúdo', icon: CalendarClock, path: '/content-calendar', tone: 'orange' },
    { label: 'Aprovações', detail: 'Pendências de revisão', icon: CheckCircle2, path: '/approvals', tone: 'green' },
    { label: 'Métricas', detail: 'Resultados de marketing', icon: TrendingUp, path: '/metrics', tone: 'cyan' },
    { label: 'Estúdio IA', detail: 'Criação assistida', icon: Sparkles, path: '/ai-studio', tone: 'violet' },
    { label: 'Contratos', detail: 'Gestão contratual', icon: Landmark, path: '/contracts', tone: 'blue' },
    { label: 'Metas', detail: `${goalProgress}% concluído`, icon: Goal, path: '/goals', tone: 'green' },
    { label: 'Base de conhecimento', detail: 'Materiais e processos', icon: Search, path: '/knowledge', tone: 'blue' }
  ]
  const shortcuts = profileView.paths.map((path) => shortcutCatalog.find((item) => item.path === path)).filter(Boolean) as typeof shortcutCatalog

  return (
    <div className="page smart-workspace">
      <section className="workspace-hero">
        <div>
          <span className="eyebrow">{profileView.label.toUpperCase()}</span>
          <h1>{greeting}, {name.split(' ')[0]}!</h1>
          <p>{profileView.description}</p>
        </div>
        <button className="workspace-global-search" type="button" onClick={() => navigate('/global-search')}>
          <Search size={20}/><span>Pesquisar clientes, Leads, vendas, tarefas e documentos</span><kbd>Ctrl + K</kbd>
        </button>
      </section>

      <section className="workspace-kpis">
        <article><div className="kpi-icon blue"><CircleDollarSign/></div><span>Receita no mês</span><strong>{currency.format(summary.monthlyIncome)}</strong><small>{goalProgress}% da meta de {currency.format(monthlyGoal)}</small></article>
        <article><div className="kpi-icon cyan"><TrendingUp/></div><span>Pipeline comercial</span><strong>{currency.format(summary.pipeline)}</strong><small>{summary.activeLeads.length} Leads ativos</small></article>
        <article><div className="kpi-icon orange"><CalendarClock/></div><span>Compromissos hoje</span><strong>{summary.todayEvents.length}</strong><small>{summary.todayEvents[0] ? `Próximo às ${new Date(summary.todayEvents[0].start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Agenda livre'}</small></article>
        <article><div className="kpi-icon red"><Flame/></div><span>Prioridades</span><strong>{summary.hotLeads.length + summary.overdueTasks.length}</strong><small>{summary.hotLeads.length} Leads quentes • {summary.overdueTasks.length} tarefas vencidas</small></article>
      </section>

      <section className="workspace-shortcuts">
        {shortcuts.map(({ label, detail, icon: Icon, path, tone }) => (
          <button key={label} type="button" className={`workspace-shortcut tone-${tone}`} onClick={() => navigate(path)}>
            <span className="shortcut-icon"><Icon/></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={18}/>
          </button>
        ))}
      </section>

      <section className="workspace-grid">
        <article className="panel-card workspace-agenda">
          <div className="panel-header"><div><h2><CalendarClock size={19}/> Agenda de hoje</h2><p>Próximos compromissos e contatos programados.</p></div><button type="button" className="text-action" onClick={() => navigate('/calendar')}>Abrir agenda <ArrowRight size={15}/></button></div>
          <div className="workspace-list">
            {summary.todayEvents.slice(0, 6).map((item) => <button type="button" key={item.id} onClick={() => navigate('/calendar')}><span className="time-badge">{new Date(item.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span><div><strong>{item.title}</strong><small>{item.location || item.notes || 'Sem detalhes adicionais'}</small></div><span className={`status-dot status-${item.status}`}/></button>)}
            {!summary.todayEvents.length && <div className="workspace-empty"><CheckCircle2/><strong>Nenhum compromisso para hoje</strong><span>Aproveite para planejar novas ações comerciais.</span></div>}
          </div>
        </article>

        <article className="panel-card workspace-priorities">
          <div className="panel-header"><div><h2><Flame size={19}/> Prioridades comerciais</h2><p>Leads com maior potencial ou ação pendente.</p></div><button type="button" className="text-action" onClick={() => navigate('/lead-scoring')}>Ver pontuação <ArrowRight size={15}/></button></div>
          <div className="workspace-list">
            {summary.activeLeads.slice().sort((a, b) => calculateLeadScore(b).score - calculateLeadScore(a).score).slice(0, 6).map((lead) => <button type="button" key={lead.id} onClick={() => navigate('/crm')}><span className="lead-avatar">{lead.name.slice(0, 2).toUpperCase()}</span><div><strong>{lead.name}</strong><small>{lead.company || lead.nextAction || 'Lead sem empresa'}</small></div><span className="score-pill">{calculateLeadScore(lead).score}</span></button>)}
            {!summary.activeLeads.length && <div className="workspace-empty"><ContactRound/><strong>Nenhum Lead ativo</strong><span>Cadastre oportunidades para alimentar o funil.</span></div>}
          </div>
        </article>

        <article className="panel-card workspace-goal">
          <div className="panel-header"><div><h2><Goal size={19}/> Meta mensal</h2><p>Acompanhamento da receita realizada.</p></div></div>
          <div className="goal-ring" style={{ '--progress': `${goalProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{goalProgress}%</strong><span>concluído</span></div></div>
          <div className="goal-details"><span><small>Realizado</small><strong>{currency.format(summary.monthlyIncome)}</strong></span><span><small>Meta</small><strong>{currency.format(monthlyGoal)}</strong></span></div>
          <button type="button" className="workspace-primary-action" onClick={() => navigate('/goals')}>Gerenciar metas <ArrowRight size={16}/></button>
        </article>

        <article className="panel-card workspace-tasks">
          <div className="panel-header"><div><h2><ListTodo size={19}/> Tarefas em aberto</h2><p>Atividades que exigem acompanhamento.</p></div><button type="button" className="text-action" onClick={() => navigate('/tasks')}>Ver tarefas <ArrowRight size={15}/></button></div>
          <div className="workspace-list compact">
            {summary.openTasks.slice(0, 5).map((task) => <button type="button" key={task.id} onClick={() => navigate('/tasks')}><span className={`priority-marker priority-${task.priority}`}/><div><strong>{task.title}</strong><small><Clock3 size={12}/>{task.dueDate ? dateTime.format(new Date(task.dueDate)) : 'Sem prazo definido'}</small></div></button>)}
            {!summary.openTasks.length && <div className="workspace-empty"><CheckCircle2/><strong>Tudo em dia</strong><span>Não há tarefas pendentes no momento.</span></div>}
          </div>
        </article>
      </section>
    </div>
  )
}
