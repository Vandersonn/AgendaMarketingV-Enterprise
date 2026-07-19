import { useState } from 'react'
import { Play, Plus, Power, Trash2, Workflow } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useAutomationStore } from '../../../lib/automationStore'

export function AutomationsPage() {
  const { automations, addAutomation, toggle, remove, run } = useAutomationStore()
  const [open,setOpen]=useState(false)
  const [message,setMessage]=useState('')
  const [form,setForm]=useState({name:'',trigger:'Novo lead',actions:'Criar tarefa, Enviar webhook',enabled:false,webhookUrl:''})
  function submit(e:React.FormEvent){e.preventDefault();addAutomation({name:form.name,trigger:form.trigger,actions:form.actions.split(',').map(a=>a.trim()).filter(Boolean),enabled:form.enabled,webhookUrl:form.webhookUrl});setOpen(false)}
  async function test(id:string){setMessage(await run(id))}
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">AUTOMAÇÕES VISUAIS</span><h1>Central de automações</h1><p>Conecte gatilhos, ações e webhooks.</p></div><Button onClick={()=>setOpen(true)}><Plus size={18}/> Nova automação</Button></header>
    {message && <div className="form-message success">{message}</div>}
    <section className="automation-grid">
      {automations.map((item)=><article key={item.id} className="panel-card automation-card">
        <div className="automation-top"><div className="automation-icon"><Workflow/></div><button type="button" className={`automation-switch ${item.enabled?'on':''}`} onClick={()=>toggle(item.id)}><Power size={16}/></button></div>
        <h2>{item.name}</h2><p><strong>Quando:</strong> {item.trigger}</p>
        <div className="automation-flow">{item.actions.map((action,index)=><span key={action}>{index>0 && <i>→</i>}{action}</span>)}</div>
        <div className="automation-meta"><span>{item.runs} execução(ões)</span><span>{item.webhookUrl?'Integração configurada':'Sem integração configurada'}</span></div>
        <div className="automation-actions"><Button variant="secondary" onClick={()=>test(item.id)}><Play size={16}/> Testar</Button><button type="button" className="icon-danger" onClick={()=>remove(item.id)}><Trash2 size={17}/></button></div>
      </article>)}
    </section>
    <Modal title="Nova automação" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Nome<input value={form.name} onChange={(e)=>setForm((current) => ({...current,name:e.target.value}))} required/></label>
        <label className="full">Gatilho<input value={form.trigger} onChange={(e)=>setForm((current) => ({...current,trigger:e.target.value}))}/></label>
        <label className="full">Ações separadas por vírgula<input value={form.actions} onChange={(e)=>setForm((current) => ({...current,actions:e.target.value}))}/></label>
        <label className="full">Webhook<input value={form.webhookUrl} onChange={(e)=>setForm((current) => ({...current,webhookUrl:e.target.value}))}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={form.enabled} onChange={(e)=>setForm((current) => ({...current,enabled:e.target.checked}))}/> Ativar ao salvar</label>
        <Button className="full">Criar automação</Button>
      </form>
    </Modal>
  </div>
}
