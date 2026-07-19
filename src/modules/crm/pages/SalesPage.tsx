import { useMemo, useState } from 'react'
import { BarChart3, CalendarClock, CheckCircle2, CircleDollarSign, Filter, Flame, Goal, ListChecks, Pencil, Plus, Search, Target, Trash2, TrendingUp, Trophy, UsersRound, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { CurrencyInput } from '../../../components/CurrencyInput'
import { DateTimeField } from '../../../components/DateTimeField'
import { useSalesStore, type SalesOpportunity, type SalesPriority, type SalesStatus } from '../../../lib/salesStore'

const statusOptions: Array<{ value: SalesStatus; label: string }> = [
  { value: 'prospecting', label: 'Prospecção' }, { value: 'qualification', label: 'Qualificação' },
  { value: 'diagnosis', label: 'Diagnóstico' }, { value: 'proposal', label: 'Proposta' },
  { value: 'negotiation', label: 'Negociação' }, { value: 'won', label: 'Ganho' }, { value: 'lost', label: 'Perdido' }
]
const priorityOptions: Array<{ value: SalesPriority; label: string }> = [
  { value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }, { value: 'urgent', label: 'Urgente' }
]
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const blankForm = (): Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '', contact: '', company: '', email: '', phone: '', value: 0, probability: 30,
  status: 'prospecting', priority: 'medium', source: 'Instagram', owner: 'Vanderson de Castro',
  expectedClose: new Date().toISOString().slice(0, 10), nextStep: '', notes: ''
})

export function SalesPage() {
  const { opportunities, tasks, monthlyGoal, addOpportunity, updateOpportunity, deleteOpportunity, addTask, toggleTask, deleteTask, setMonthlyGoal } = useSalesStore()
  const [openOpportunity, setOpenOpportunity] = useState(false)
  const [openTask, setOpenTask] = useState(false)
  const [editing, setEditing] = useState<SalesOpportunity | null>(null)
  const [form, setForm] = useState(blankForm())
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: new Date().toISOString().slice(0, 10), priority: 'medium' as SalesPriority, opportunityId: '' })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SalesStatus>('all')
  const [goalEditing, setGoalEditing] = useState(false)

  const openDeals = opportunities.filter((item) => !['won', 'lost'].includes(item.status))
  const wonDeals = opportunities.filter((item) => item.status === 'won')
  const pipeline = openDeals.reduce((sum, item) => sum + item.value, 0)
  const forecast = openDeals.reduce((sum, item) => sum + item.value * item.probability / 100, 0)
  const wonRevenue = wonDeals.reduce((sum, item) => sum + item.value, 0)
  const conversion = opportunities.length ? (wonDeals.length / opportunities.length) * 100 : 0
  const goalProgress = monthlyGoal ? Math.min(100, (wonRevenue / monthlyGoal) * 100) : 0

  const funnelData = statusOptions.map((status) => ({
    name: status.label,
    value: opportunities.filter((item) => item.status === status.value).reduce((sum, item) => sum + item.value, 0)
  })).filter((item) => item.value > 0)

  const filtered = useMemo(() => opportunities.filter((item) => {
    const text = `${item.title} ${item.contact} ${item.company} ${item.owner}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (statusFilter === 'all' || item.status === statusFilter)
  }), [opportunities, query, statusFilter])

  const priorityDeals = openDeals
    .map((item) => ({ ...item, score: item.probability * 0.55 + (item.priority === 'urgent' ? 35 : item.priority === 'high' ? 24 : item.priority === 'medium' ? 12 : 4) }))
    .sort((a, b) => b.score - a.score).slice(0, 4)

  function submitOpportunity(event: React.FormEvent) {
    event.preventDefault()
    if (editing) updateOpportunity({ ...editing, ...form })
    else addOpportunity(form)
    setEditing(null); setForm(blankForm()); setOpenOpportunity(false)
  }

  function editOpportunity(item: SalesOpportunity) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = item
    setEditing(item); setForm(data); setOpenOpportunity(true)
  }

  function submitTask(event: React.FormEvent) {
    event.preventDefault(); addTask(taskForm)
    setTaskForm({ title: '', dueDate: new Date().toISOString().slice(0, 10), priority: 'medium', opportunityId: '' }); setOpenTask(false)
  }

  return <div className="page sales-command-page">
    <header className="page-header">
      <div><span className="eyebrow">CENTRAL COMERCIAL</span><h1>Vendas profissionais</h1><p>Controle previsibilidade, oportunidades, metas e ações que geram fechamento.</p></div>
      <div className="sales-header-actions"><Button variant="secondary" onClick={() => setOpenTask(true)}><ListChecks size={18}/> Nova atividade</Button><Button onClick={() => { setEditing(null); setForm(blankForm()); setOpenOpportunity(true) }}><Plus size={18}/> Nova oportunidade</Button></div>
    </header>

    <section className="sales-kpi-grid">
      <article className="sales-kpi"><span><CircleDollarSign size={18}/> Pipeline aberto</span><strong>{currency(pipeline)}</strong><small>{openDeals.length} oportunidades em andamento</small></article>
      <article className="sales-kpi"><span><TrendingUp size={18}/> Receita prevista</span><strong>{currency(forecast)}</strong><small>Valor ponderado por probabilidade</small></article>
      <article className="sales-kpi"><span><Trophy size={18}/> Receita ganha</span><strong>{currency(wonRevenue)}</strong><small>{wonDeals.length} negócios fechados</small></article>
      <article className="sales-kpi"><span><Target size={18}/> Conversão</span><strong>{conversion.toFixed(1)}%</strong><small>Ganho sobre oportunidades totais</small></article>
    </section>

    <section className="sales-top-grid">
      <article className="panel-card sales-goal-card">
        <div className="panel-title-row"><div><span className="eyebrow">META DO MÊS</span><h2>{currency(monthlyGoal)}</h2></div><button type="button" className="icon-action" onClick={() => setGoalEditing(!goalEditing)}><Pencil size={17}/></button></div>
        {goalEditing && <div className="inline-goal-editor"><CurrencyInput value={monthlyGoal} onChange={setMonthlyGoal}/><Button onClick={() => setGoalEditing(false)}>Salvar</Button></div>}
        <div className="goal-progress"><div style={{ width: `${goalProgress}%` }}/></div>
        <div className="goal-caption"><span>{goalProgress.toFixed(0)}% realizado</span><strong>Faltam {currency(Math.max(0, monthlyGoal - wonRevenue))}</strong></div>
        <div className="sales-goal-insight"><Goal size={20}/><p>{forecast + wonRevenue >= monthlyGoal ? 'A projeção atual indica potencial para superar a meta.' : 'Priorize negócios com alta probabilidade para acelerar a meta.'}</p></div>
      </article>

      <article className="panel-card sales-chart-card">
        <div className="panel-title-row"><div><span className="eyebrow">FUNIL FINANCEIRO</span><h2>Valor por etapa</h2></div><BarChart3 size={20}/></div>
        <div className="sales-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={funnelData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{ fontSize: 11 }}/><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`}/><Tooltip formatter={(v) => currency(Number(v))}/><Bar dataKey="value" radius={[6, 6, 0, 0]}>{funnelData.map((_, index) => <Cell key={index}/>)}</Bar></BarChart></ResponsiveContainer></div>
      </article>

      <article className="panel-card sales-priority-card">
        <div className="panel-title-row"><div><span className="eyebrow">FOCO COMERCIAL</span><h2>Prioridades</h2></div><Flame size={20}/></div>
        <div className="priority-list">{priorityDeals.map((item) => <button type="button" key={item.id} onClick={() => editOpportunity(item)}><span className={`priority-dot ${item.priority}`}/><div><strong>{item.company || item.contact}</strong><small>{item.nextStep || 'Definir próxima ação'}</small></div><b>{item.probability}%</b></button>)}</div>
      </article>
    </section>

    <section className="sales-work-grid">
      <article className="panel-card sales-opportunities-card">
        <div className="sales-table-toolbar"><div><span className="eyebrow">OPERAÇÃO</span><h2>Oportunidades</h2></div><div className="sales-filters"><label><Search size={16}/><input placeholder="Buscar oportunidade..." value={query} onChange={(e) => setQuery(e.target.value)}/></label><label><Filter size={16}/><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | SalesStatus)}><option value="all">Todas as etapas</option>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div></div>
        <div className="sales-table-wrap"><table className="sales-table"><thead><tr><th>Oportunidade</th><th>Etapa</th><th>Valor</th><th>Prob.</th><th>Fechamento</th><th>Próxima ação</th><th/></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><span>{item.company || item.contact}</span></td><td><span className={`sales-status ${item.status}`}>{statusOptions.find((s) => s.value === item.status)?.label}</span></td><td><strong>{currency(item.value)}</strong></td><td><span className="probability"><i style={{ width: `${item.probability}%` }}/></span><small>{item.probability}%</small></td><td>{new Date(`${item.expectedClose}T12:00:00`).toLocaleDateString('pt-BR')}</td><td><span className="next-step-cell">{item.nextStep || 'Não definida'}</span></td><td><div className="row-actions"><button type="button" onClick={() => editOpportunity(item)}><Pencil size={15}/></button><button type="button" onClick={() => deleteOpportunity(item.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-sales">Nenhuma oportunidade encontrada.</div>}</div>
      </article>

      <article className="panel-card sales-activities-card">
        <div className="panel-title-row"><div><span className="eyebrow">EXECUÇÃO</span><h2>Atividades</h2></div><CalendarClock size={20}/></div>
        <div className="sales-task-list">{tasks.map((task) => <div key={task.id} className={`sales-task ${task.completed ? 'done' : ''}`}><button type="button" onClick={() => toggleTask(task.id)}>{task.completed ? <CheckCircle2 size={19}/> : <span className="task-check"/>}</button><div><strong>{task.title}</strong><span>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('pt-BR')} · <b className={`task-priority ${task.priority}`}>{priorityOptions.find((p) => p.value === task.priority)?.label}</b></span></div><button type="button" onClick={() => deleteTask(task.id)}><Trash2 size={15}/></button></div>)}</div>
      </article>
    </section>

    <Modal title={editing ? 'Editar oportunidade' : 'Nova oportunidade'} open={openOpportunity} onClose={() => setOpenOpportunity(false)}>
      <form className="form-grid sales-form" onSubmit={submitOpportunity}>
        <label className="full">Título da oportunidade<input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} required/></label>
        <label>Contato<input value={form.contact} onChange={(e) => setForm((current) => ({ ...current, contact: e.target.value }))} required/></label><label>Empresa<input value={form.company} onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}/></label>
        <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}/></label><label>WhatsApp<input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}/></label>
        <label>Valor<CurrencyInput value={form.value} onChange={(value) => setForm((current) => ({ ...current, value }))}/></label><label>Probabilidade (%)<input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm((current) => ({ ...current, probability: Number(e.target.value) }))}/></label>
        <label>Etapa<select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as SalesStatus }))}>{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Prioridade<select value={form.priority} onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value as SalesPriority }))}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Origem<input value={form.source} onChange={(e) => setForm((current) => ({ ...current, source: e.target.value }))}/></label><label>Responsável<input value={form.owner} onChange={(e) => setForm((current) => ({ ...current, owner: e.target.value }))}/></label>
        <label>Previsão de fechamento<DateTimeField includeTime={false} value={form.expectedClose} onChange={(expectedClose) => setForm((current) => ({ ...current, expectedClose }))}/></label><label>Próxima ação<input value={form.nextStep} onChange={(e) => setForm((current) => ({ ...current, nextStep: e.target.value }))}/></label>
        <label className="full">Observações<textarea rows={3} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}/></label>
        <div className="full modal-form-actions"><Button variant="secondary" type="button" onClick={() => setOpenOpportunity(false)}><XCircle size={17}/> Cancelar</Button><Button><CheckCircle2 size={17}/> {editing ? 'Salvar alterações' : 'Criar oportunidade'}</Button></div>
      </form>
    </Modal>

    <Modal title="Nova atividade comercial" open={openTask} onClose={() => setOpenTask(false)}><form className="form-grid" onSubmit={submitTask}><label className="full">Atividade<input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required/></label><label>Prazo<DateTimeField includeTime={false} value={taskForm.dueDate} onChange={(dueDate) => setTaskForm({ ...taskForm, dueDate })}/></label><label>Prioridade<select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as SalesPriority })}>{priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="full">Oportunidade<select value={taskForm.opportunityId} onChange={(e) => setTaskForm({ ...taskForm, opportunityId: e.target.value })}><option value="">Atividade geral</option>{openDeals.map((item) => <option key={item.id} value={item.id}>{item.company || item.contact} — {item.title}</option>)}</select></label><Button className="full"><Plus size={17}/> Criar atividade</Button></form></Modal>
  </div>
}
