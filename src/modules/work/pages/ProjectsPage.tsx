import { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Flag, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useCrmStore } from '../../../lib/crmStore'
import { useProjectsStore, type ProjectStatus } from '../../../lib/projectsStore'
import { useTeamStore } from '../../../lib/teamStore'

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planejamento',
  active: 'Em andamento',
  paused: 'Pausado',
  completed: 'Concluído'
}

export function ProjectsPage() {
  const { projects, addProject, removeProject, setProgress, setStatus, addMilestone, toggleMilestone } = useProjectsStore()
  const clients = useCrmStore((state) => state.clients)
  const members = useTeamStore((state) => state.members)
  const activeMembers = useMemo(() => members.filter((member) => member.active), [members])
  const [open, setOpen] = useState(false)
  const [milestoneProject, setMilestoneProject] = useState<string | null>(null)
  const [milestone, setMilestone] = useState({ title: '', dueDate: '' })
  const [form, setForm] = useState({
    name: '',
    clientId: '',
    ownerEmail: 'produtosecursosnet@gmail.com',
    startDate: new Date().toISOString().slice(0,10),
    endDate: '',
    budget: 0,
    status: 'planning' as ProjectStatus,
    progress: 0,
    health: 'healthy' as const,
    description: ''
  })

  const active = projects.filter((item) => item.status === 'active').length
  const critical = projects.filter((item) => item.health === 'critical').length
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addProject(form)
    setOpen(false)
    setForm({
      name: '', clientId: '', ownerEmail: 'produtosecursosnet@gmail.com',
      startDate: new Date().toISOString().slice(0,10), endDate: '', budget: 0,
      status: 'planning', progress: 0, health: 'healthy', description: ''
    })
  }

  function saveMilestone() {
    if (!milestoneProject || !milestone.title) return
    addMilestone(milestoneProject, milestone)
    setMilestone({ title: '', dueDate: '' })
    setMilestoneProject(null)
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">GESTÃO DE PROJETOS</span><h1>Projetos e entregas</h1><p>Controle escopo, responsáveis, orçamento, marcos e progresso.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={18}/> Novo projeto</Button>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Projetos ativos</span><strong>{active}</strong></article>
      <article className="panel-card compact-card"><span>Em risco</span><strong>{critical}</strong></article>
      <article className="panel-card compact-card"><span>Orçamento total</span><strong>{totalBudget.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></article>
    </section>

    <section className="projects-grid">
      {projects.map((project) => {
        const client = clients.find((item) => item.id === project.clientId)
        const completedMilestones = project.milestones.filter((item) => item.completed).length
        return <article key={project.id} className={`panel-card project-card health-${project.health}`}>
          <div className="project-card-header">
            <div><span className="project-health"><CircleAlert size={14}/>{project.health}</span><h2>{project.name}</h2><p>{client?.name || 'Projeto interno'}</p></div>
            <button type="button" className="icon-danger" onClick={() => removeProject(project.id)}><Trash2 size={17}/></button>
          </div>
          <p className="project-description">{project.description}</p>
          <div className="project-meta"><span>Responsável</span><strong>{project.ownerEmail}</strong></div>
          <div className="project-meta"><span>Prazo</span><strong>{project.endDate || 'Sem data'}</strong></div>
          <div className="project-progress-head"><span>Progresso</span><strong>{project.progress}%</strong></div>
          <input className="project-range" type="range" min="0" max="100" value={project.progress} onChange={(event) => setProgress(project.id, Number(event.target.value))}/>
          <div className="project-progress-track"><div style={{width:`${project.progress}%`}}/></div>
          <div className="project-controls">
            <select value={project.status} onChange={(event) => setStatus(project.id, event.target.value as ProjectStatus)}>
              {Object.entries(statusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <Button variant="secondary" onClick={() => setMilestoneProject(project.id)}><Flag size={16}/> Marco</Button>
          </div>
          <div className="milestone-list">
            <div className="milestone-title"><strong>Marcos</strong><span>{completedMilestones}/{project.milestones.length}</span></div>
            {project.milestones.map((item) => <button type="button" key={item.id} className={item.completed?'completed':''} onClick={() => toggleMilestone(project.id,item.id)}>
              <CheckCircle2 size={15}/><span>{item.title}</span><small>{item.dueDate}</small>
            </button>)}
          </div>
        </article>
      })}
      {!projects.length && <article className="panel-card empty-panel"><strong>Nenhum projeto cadastrado</strong><span>Crie projetos para acompanhar entregas e resultados.</span></article>}
    </section>

    <Modal title="Novo projeto" open={open} onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Nome<input value={form.name} onChange={(event)=>setForm((current) => ({...current,name:event.target.value}))} required/></label>
        <label>Cliente<select value={form.clientId} onChange={(event)=>setForm((current) => ({...current,clientId:event.target.value}))}><option value="">Projeto interno</option>{clients.map((client)=><option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Responsável<select value={form.ownerEmail} onChange={(event)=>setForm((current) => ({...current,ownerEmail:event.target.value}))}>{activeMembers.map((member)=><option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
        <label>Início<input type="date" value={form.startDate} onChange={(event)=>setForm((current) => ({...current,startDate:event.target.value}))}/></label>
        <label>Término<input type="date" value={form.endDate} onChange={(event)=>setForm((current) => ({...current,endDate:event.target.value}))}/></label>
        <label>Orçamento<input type="number" step="0.01" value={form.budget} onChange={(event)=>setForm((current) => ({...current,budget:Number(event.target.value)}))}/></label>
        <label>Status<select value={form.status} onChange={(event)=>setForm((current) => ({...current,status:event.target.value as ProjectStatus}))}>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label className="full">Descrição<textarea value={form.description} onChange={(event)=>setForm((current) => ({...current,description:event.target.value}))}/></label>
        <Button className="full">Criar projeto</Button>
      </form>
    </Modal>

    <Modal title="Novo marco" open={Boolean(milestoneProject)} onClose={() => setMilestoneProject(null)}>
      <div className="form-grid">
        <label className="full">Título<input value={milestone.title} onChange={(event)=>setMilestone((current) => ({...current,title:event.target.value}))}/></label>
        <label className="full">Prazo<input type="date" value={milestone.dueDate} onChange={(event)=>setMilestone((current) => ({...current,dueDate:event.target.value}))}/></label>
        <Button className="full" onClick={saveMilestone}>Salvar marco</Button>
      </div>
    </Modal>
  </div>
}
