import { useMemo, useState } from 'react'
import { AlertTriangle, FileSignature, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useContractsStore, type ContractStatus } from '../../../lib/contractsStore'
import { useCrmStore } from '../../../lib/crmStore'

const statusLabels: Record<ContractStatus,string> = { draft:'Rascunho',active:'Ativo',expired:'Vencido',cancelled:'Cancelado' }

export function ContractsPage() {
  const { contracts, addContract, removeContract, setStatus } = useContractsStore()
  const clients = useCrmStore((state) => state.clients)
  const [open,setOpen] = useState(false)
  const [form,setForm] = useState({
    clientId:'',title:'',value:0,startDate:new Date().toISOString().slice(0,10),
    endDate:'',status:'draft' as ContractStatus,autoRenew:false,noticeDays:30,notes:''
  })
  const expiring = useMemo(() => contracts.filter((item) => {
    if (!item.endDate || item.status !== 'active') return false
    const days = (new Date(item.endDate).getTime() - Date.now()) / 86400000
    return days >= 0 && days <= item.noticeDays
  }), [contracts])

  function submit(e:React.FormEvent){e.preventDefault();addContract(form);setOpen(false)}
  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">CONTRATOS E RENOVAÇÕES</span><h1>Contratos</h1><p>Controle vigência, valores e alertas de renovação.</p></div><Button onClick={()=>setOpen(true)}><Plus size={18}/> Novo contrato</Button></header>
    {expiring.length>0 && <div className="form-message"><AlertTriangle size={17}/> {expiring.length} contrato(s) próximo(s) da renovação.</div>}
    <section className="contract-grid">
      {contracts.map((contract) => {
        const client = clients.find((c)=>c.id===contract.clientId)
        return <article key={contract.id} className="panel-card contract-card">
          <div className="contract-icon"><FileSignature/></div>
          <div className="contract-head"><div><strong>{contract.title}</strong><span>{client?.name || 'Cliente não localizado'}</span></div><button type="button" className="icon-danger" onClick={()=>removeContract(contract.id)}><Trash2 size={17}/></button></div>
          <div className="contract-value">{contract.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
          <div className="contract-dates"><span>{contract.startDate || '—'}</span><span>até</span><span>{contract.endDate || 'Sem término'}</span></div>
          <div className="contract-footer"><select value={contract.status} onChange={(e)=>setStatus(contract.id,e.target.value as ContractStatus)}>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><em>{contract.autoRenew?'Renovação automática':'Renovação manual'}</em></div>
        </article>
      })}
      {!contracts.length && <article className="panel-card empty-panel"><strong>Nenhum contrato cadastrado</strong><span>Crie contratos vinculados aos clientes.</span></article>}
    </section>
    <Modal title="Novo contrato" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Cliente<select value={form.clientId} onChange={(e)=>setForm((current) => ({...current,clientId:e.target.value}))} required><option value="">Selecione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="full">Título<input value={form.title} onChange={(e)=>setForm((current) => ({...current,title:e.target.value}))} required/></label>
        <label>Valor<input type="number" step="0.01" value={form.value} onChange={(e)=>setForm((current) => ({...current,value:Number(e.target.value)}))}/></label>
        <label>Status<select value={form.status} onChange={(e)=>setForm((current) => ({...current,status:e.target.value as ContractStatus}))}>{Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <label>Início<input type="date" value={form.startDate} onChange={(e)=>setForm((current) => ({...current,startDate:e.target.value}))}/></label>
        <label>Término<input type="date" value={form.endDate} onChange={(e)=>setForm((current) => ({...current,endDate:e.target.value}))}/></label>
        <label>Dias para alerta<input type="number" value={form.noticeDays} onChange={(e)=>setForm((current) => ({...current,noticeDays:Number(e.target.value)}))}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={form.autoRenew} onChange={(e)=>setForm((current) => ({...current,autoRenew:e.target.checked}))}/> Renovação automática</label>
        <label className="full">Observações<textarea value={form.notes} onChange={(e)=>setForm((current) => ({...current,notes:e.target.value}))}/></label>
        <Button className="full">Salvar contrato</Button>
      </form>
    </Modal>
  </div>
}
