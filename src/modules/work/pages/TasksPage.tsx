import { useMemo, useState } from 'react'
import { CalendarClock, Filter, LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useCrmStore } from '../../../lib/crmStore'
import { useTasksStore, type TaskPriority, type TaskStatus } from '../../../lib/tasksStore'
import { useTeamStore } from '../../../lib/teamStore'

const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: 'backlog', label: 'Planejadas' },
  { id: 'doing', label: 'Em andamento' },
  { id: 'review', label: 'Em revisão' },
  { id: 'done', label: 'Concluídas' }
]

const priorityLabels: Record<TaskPriority, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }

export function TasksPage() {
  const tasks = useTasksStore((state) => state.tasks)
  const addTask = useTasksStore((state) => state.addTask)
  const moveTask = useTasksStore((state) => state.moveTask)
  const removeTask = useTasksStore((state) => state.removeTask)
  const clients = useCrmStore((state) => state.clients)
  const allMembers = useTeamStore((state) => state.members)
  const members = useMemo(() => allMembers.filter((member) => member.active), [allMembers])

  const [open, setOpen] = useState(false)
  const [dragged, setDragged] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const defaultAssignee = members[0]?.email ?? 'produtosecursosnet@gmail.com'
  const [form, setForm] = useState({
    title: '', description: '', clientId: '', assigneeEmail: defaultAssignee,
    dueDate: '', priority: 'medium' as TaskPriority, status: 'backlog' as TaskStatus, tags: ''
  })

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const client = clients.find((item) => item.id === task.clientId)
    const searchable = `${task.title} ${task.description} ${client?.name ?? ''} ${task.assigneeEmail} ${task.tags.join(' ')}`.toLowerCase()
    return searchable.includes(query.toLowerCase())
      && (priorityFilter === 'all' || task.priority === priorityFilter)
      && (assigneeFilter === 'all' || task.assigneeEmail === assigneeFilter)
  }), [tasks, clients, query, priorityFilter, assigneeFilter])

  const overdue = useMemo(() => tasks.filter((item) =>
    item.status !== 'done' && item.dueDate && new Date(`${item.dueDate}T23:59:59`) < new Date()
  ).length, [tasks])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addTask({ ...form, assigneeEmail: form.assigneeEmail || defaultAssignee, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) })
    setOpen(false)
    setForm({ title: '', description: '', clientId: '', assigneeEmail: defaultAssignee, dueDate: '', priority: 'medium', status: 'backlog', tags: '' })
  }

  function drop(status: TaskStatus) {
    if (!dragged) return
    moveTask(dragged, status)
    setDragged(null)
  }

  function taskCard(task: (typeof tasks)[number]) {
    const client = clients.find((item) => item.id === task.clientId)
    return (
      <article key={task.id} className={`lead-card task-card priority-${task.priority}`} draggable={view === 'board'} onDragStart={() => setDragged(task.id)}>
        <div className="lead-card-header">
          <div><strong>{task.title}</strong><span>{client?.name || 'Sem cliente'}</span></div>
          <button type="button" onClick={() => removeTask(task.id)} aria-label="Excluir tarefa"><Trash2 size={15} /></button>
        </div>
        {task.description && <p>{task.description}</p>}
        <div className="task-due"><CalendarClock size={14} /> {task.dueDate ? new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'}</div>
        <div className="task-assignee">{task.assigneeEmail}</div>
        <div className="task-tags"><span className={`priority-tag ${task.priority}`}>{priorityLabels[task.priority]}</span>{task.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </article>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div><span className="eyebrow">PRODUTIVIDADE</span><h1>Central de tarefas</h1><p>Organize entregas, responsáveis, prazos e prioridades.</p></div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Nova tarefa</Button>
      </header>

      <section className="crm-summary">
        <article className="panel-card compact-card"><span>Total</span><strong>{tasks.length}</strong></article>
        <article className="panel-card compact-card"><span>Em andamento</span><strong>{tasks.filter((item) => item.status === 'doing').length}</strong></article>
        <article className="panel-card compact-card"><span>Atrasadas</span><strong>{overdue}</strong></article>
      </section>

      <section className="panel-card task-toolbar">
        <div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tarefas..." /></div>
        <label><Filter size={15} /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}><option value="all">Todas as prioridades</option>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="all">Todos os responsáveis</option>{members.map((member) => <option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
        <div className="view-switch"><button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><LayoutGrid size={17} /></button><button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={17} /></button></div>
      </section>

      {view === 'board' ? (
        <section className="task-board">
          {columns.map((column) => (
            <div key={column.id} className={`kanban-column task-${column.id}`} onDragOver={(event) => event.preventDefault()} onDrop={() => drop(column.id)}>
              <div className="kanban-header"><strong>{column.label}</strong><span>{filteredTasks.filter((item) => item.status === column.id).length}</span></div>
              <div className="kanban-list">{filteredTasks.filter((item) => item.status === column.id).map(taskCard)}</div>
            </div>
          ))}
        </section>
      ) : (
        <section className="panel-card task-list-view">
          {filteredTasks.map((task) => <div key={task.id} className="task-list-row">{taskCard(task)}<select value={task.status} onChange={(event) => moveTask(task.id, event.target.value as TaskStatus)}>{columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</select></div>)}
          {!filteredTasks.length && <div className="empty-panel"><strong>Nenhuma tarefa encontrada</strong><span>Altere os filtros ou crie uma nova tarefa.</span></div>}
        </section>
      )}

      <Modal title="Nova tarefa" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label className="full">Título<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
          <label className="full">Descrição<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          <label>Cliente<select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Responsável<select value={form.assigneeEmail} onChange={(event) => setForm((current) => ({ ...current, assigneeEmail: event.target.value }))}>{members.map((member) => <option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
          <label>Prazo<input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
          <label>Prioridade<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}>{Object.entries(priorityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="full">Tags<input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="design, cliente, urgente" /></label>
          <Button className="full">Criar tarefa</Button>
        </form>
      </Modal>
    </div>
  )
}
