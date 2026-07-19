import { useMemo, useState } from 'react'
import { Plus, Target, Trash2, TrendingUp } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useGoalsStore } from '../../../lib/goalsStore'
import { useTeamStore } from '../../../lib/teamStore'

export function GoalsPage() {
  const { objectives, addObjective, removeObjective, addKeyResult, updateKeyResult } = useGoalsStore()
  const members = useTeamStore((state) => state.members)
  const activeMembers = useMemo(() => members.filter((member) => member.active), [members])
  const [open, setOpen] = useState(false)
  const [keyResultObjective, setKeyResultObjective] = useState<string | null>(null)
  const [keyResult, setKeyResult] = useState({ title: '', target: 100, unit: '%' })
  const [form, setForm] = useState({
    title: '',
    ownerEmail: 'produtosecursosnet@gmail.com',
    period: new Date().toISOString().slice(0,7),
    status: 'active' as const
  })

  const average = objectives.length ? Math.round(objectives.reduce((sum, objective) => {
    if (!objective.keyResults.length) return sum
    return sum + objective.keyResults.reduce((krSum, item) => krSum + Math.min(100, (item.current / Math.max(item.target,1)) * 100), 0) / objective.keyResults.length
  }, 0) / objectives.length) : 0

  function submit(event: React.FormEvent) {
    event.preventDefault()
    addObjective(form)
    setOpen(false)
    setForm({ title:'', ownerEmail:'produtosecursosnet@gmail.com', period:new Date().toISOString().slice(0,7), status:'active' })
  }

  function saveKeyResult() {
    if (!keyResultObjective || !keyResult.title) return
    addKeyResult(keyResultObjective, keyResult)
    setKeyResultObjective(null)
    setKeyResult({ title:'', target:100, unit:'%' })
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">METAS E OKRs</span><h1>Objetivos estratégicos</h1><p>Transforme metas em resultados mensuráveis.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={18}/> Novo objetivo</Button>
    </header>

    <section className="crm-summary">
      <article className="panel-card compact-card"><span>Objetivos ativos</span><strong>{objectives.filter((item)=>item.status==='active').length}</strong></article>
      <article className="panel-card compact-card"><span>Progresso médio</span><strong>{average}%</strong></article>
      <article className="panel-card compact-card"><span>Resultados-chave</span><strong>{objectives.reduce((sum,item)=>sum+item.keyResults.length,0)}</strong></article>
    </section>

    <section className="goals-grid">
      {objectives.map((objective) => {
        const progress = objective.keyResults.length ? Math.round(objective.keyResults.reduce((sum,item)=>sum+Math.min(100,(item.current/Math.max(item.target,1))*100),0)/objective.keyResults.length) : 0
        return <article key={objective.id} className="panel-card goal-objective-card">
          <div className="goal-objective-header">
            <div className="goal-objective-icon"><Target/></div>
            <div><span>{objective.period}</span><h2>{objective.title}</h2><p>{objective.ownerEmail}</p></div>
            <button type="button" className="icon-danger" onClick={()=>removeObjective(objective.id)}><Trash2 size={17}/></button>
          </div>
          <div className="goal-main-progress"><div><span>Progresso</span><strong>{progress}%</strong></div><div className="project-progress-track"><div style={{width:`${progress}%`}}/></div></div>
          <div className="key-results">
            {objective.keyResults.map((item)=><div key={item.id}>
              <div><strong>{item.title}</strong><span>{item.current} de {item.target} {item.unit}</span></div>
              <input type="number" value={item.current} onChange={(event)=>updateKeyResult(objective.id,item.id,Number(event.target.value))}/>
            </div>)}
            {!objective.keyResults.length && <div className="empty-inline">Nenhum resultado-chave.</div>}
          </div>
          <Button variant="secondary" onClick={()=>setKeyResultObjective(objective.id)}><TrendingUp size={16}/> Adicionar resultado</Button>
        </article>
      })}
      {!objectives.length && <article className="panel-card empty-panel"><strong>Nenhum objetivo criado</strong><span>Defina metas mensuráveis para a empresa e equipe.</span></article>}
    </section>

    <Modal title="Novo objetivo" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Objetivo<input value={form.title} onChange={(event)=>setForm((current) => ({...current,title:event.target.value}))} required/></label>
        <label>Responsável<select value={form.ownerEmail} onChange={(event)=>setForm((current) => ({...current,ownerEmail:event.target.value}))}>{activeMembers.map((member)=><option key={member.id} value={member.email}>{member.name}</option>)}</select></label>
        <label>Período<input type="month" value={form.period} onChange={(event)=>setForm((current) => ({...current,period:event.target.value}))}/></label>
        <Button className="full">Criar objetivo</Button>
      </form>
    </Modal>

    <Modal title="Novo resultado-chave" open={Boolean(keyResultObjective)} onClose={()=>setKeyResultObjective(null)}>
      <div className="form-grid">
        <label className="full">Resultado<input value={keyResult.title} onChange={(event)=>setKeyResult((current) => ({...current,title:event.target.value}))}/></label>
        <label>Meta<input type="number" value={keyResult.target} onChange={(event)=>setKeyResult((current) => ({...current,target:Number(event.target.value)}))}/></label>
        <label>Unidade<input value={keyResult.unit} onChange={(event)=>setKeyResult((current) => ({...current,unit:event.target.value}))}/></label>
        <Button className="full" onClick={saveKeyResult}>Salvar resultado</Button>
      </div>
    </Modal>
  </div>
}
