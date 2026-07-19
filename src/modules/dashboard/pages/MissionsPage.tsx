import { useMemo, useState } from 'react'
import { CheckCircle2, Flag, Pause, Play, Plus, Target, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useMissionsStore, type BusinessMission } from '../../../lib/missionsStore'

const areaLabels: Record<BusinessMission['area'], string> = {
  commercial: 'Comercial',
  financial: 'Financeiro',
  marketing: 'Marketing',
  projects: 'Projetos',
  support: 'Atendimento',
  executive: 'Executivo'
}

export function MissionsPage() {
  const { missions, addMission, updateProgress, toggleStep, setStatus, removeMission } = useMissionsStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', objective: '', area: 'executive' as BusinessMission['area'],
    priority: 'medium' as BusinessMission['priority'], targetValue: 100,
    unit: '%', dueDate: '', owner: ''
  })

  const summary = useMemo(() => ({
    active: missions.filter((item) => item.status === 'active').length,
    completed: missions.filter((item) => item.status === 'completed').length,
    critical: missions.filter((item) => item.priority === 'critical' && item.status === 'active').length,
    average: missions.length ? missions.reduce((sum, item) => sum + Math.min(100, item.targetValue ? item.currentValue / item.targetValue * 100 : 0), 0) / missions.length : 0
  }), [missions])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addMission({
      ...form,
      steps: [
        { id: crypto.randomUUID(), title: 'Definir plano de ação', completed: false, owner: form.owner, dueDate: form.dueDate },
        { id: crypto.randomUUID(), title: 'Executar primeira revisão', completed: false, owner: form.owner, dueDate: form.dueDate }
      ]
    })
    setOpen(false)
    setForm({ title:'', objective:'', area:'executive', priority:'medium', targetValue:100, unit:'%', dueDate:'', owner:'' })
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">GALAXY MISSION CONTROL</span><h1>Central de Missões</h1><p>Transforme objetivos estratégicos em execução acompanhável.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={18}/> Nova missão</Button>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Ativas</span><strong>{summary.active}</strong></article>
      <article className="panel-card compact-card"><span>Concluídas</span><strong>{summary.completed}</strong></article>
      <article className="panel-card compact-card"><span>Críticas</span><strong>{summary.critical}</strong></article>
      <article className="panel-card compact-card"><span>Progresso médio</span><strong>{summary.average.toFixed(0)}%</strong></article>
    </section>

    <section className="missions-grid">
      {missions.map((mission) => {
        const progress = Math.min(100, mission.targetValue ? mission.currentValue / mission.targetValue * 100 : 0)
        return <article key={mission.id} className={`panel-card mission-card priority-${mission.priority}`}>
          <div className="mission-head"><div><span>{areaLabels[mission.area]}</span><h2>{mission.title}</h2></div><Flag/></div>
          <p>{mission.objective}</p>
          <div className="mission-meta"><span>{mission.owner || 'Sem responsável'}</span><span>{mission.dueDate || 'Sem prazo'}</span></div>
          <div className="mission-progress-line"><div><span>Progresso</span><strong>{mission.currentValue} / {mission.targetValue} {mission.unit}</strong></div><div className="project-progress-track"><div style={{ width: `${progress}%` }}/></div></div>
          <label className="mission-progress-input">Atualizar resultado<input type="number" value={mission.currentValue} onChange={(event) => updateProgress(mission.id, Number(event.target.value))}/></label>
          <div className="mission-steps">
            {mission.steps.map((step) => <label key={step.id}><input type="checkbox" checked={step.completed} onChange={() => toggleStep(mission.id, step.id)}/><span>{step.title}</span></label>)}
          </div>
          <div className="mission-actions">
            {mission.status === 'active' ? <Button variant="secondary" onClick={() => setStatus(mission.id,'paused')}><Pause size={15}/> Pausar</Button> : mission.status === 'paused' ? <Button variant="secondary" onClick={() => setStatus(mission.id,'active')}><Play size={15}/> Retomar</Button> : <span className="mission-completed"><CheckCircle2 size={16}/> {mission.status}</span>}
            <button type="button" className="icon-danger" onClick={() => removeMission(mission.id)}><Trash2 size={16}/></button>
          </div>
        </article>
      })}
      {!missions.length && <article className="panel-card empty-panel"><Target size={38}/><strong>Nenhuma missão criada</strong><span>Comece com um objetivo estratégico mensurável.</span></article>}
    </section>

    <Modal title="Nova missão" open={open} onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Título<input value={form.title} onChange={(event) => setForm((current) => ({...current,title:event.target.value}))} required/></label>
        <label className="full">Objetivo<textarea value={form.objective} onChange={(event) => setForm((current) => ({...current,objective:event.target.value}))} required/></label>
        <label>Área<select value={form.area} onChange={(event) => setForm((current) => ({...current,area:event.target.value as BusinessMission['area']}))}>{Object.entries(areaLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Prioridade<select value={form.priority} onChange={(event) => setForm((current) => ({...current,priority:event.target.value as BusinessMission['priority']}))}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></label>
        <label>Meta<input type="number" value={form.targetValue} onChange={(event) => setForm((current) => ({...current,targetValue:Number(event.target.value)}))}/></label>
        <label>Unidade<input value={form.unit} onChange={(event) => setForm((current) => ({...current,unit:event.target.value}))}/></label>
        <label>Prazo<input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({...current,dueDate:event.target.value}))}/></label>
        <label>Responsável<input value={form.owner} onChange={(event) => setForm((current) => ({...current,owner:event.target.value}))}/></label>
        <Button className="full">Criar missão</Button>
      </form>
    </Modal>
  </div>
}
