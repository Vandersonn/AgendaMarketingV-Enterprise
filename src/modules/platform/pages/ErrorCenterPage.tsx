import { useMemo, useState } from 'react'
import { AlertTriangle, Bug, Download, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useSystemLogStore } from '../../../lib/systemLogStore'

export function ErrorCenterPage(){
  const logs=useSystemLogStore((state)=>state.logs)
  const clearLogs=useSystemLogStore((state)=>state.clearLogs)
  const[query,setQuery]=useState('')
  const[level,setLevel]=useState<'all'|'error'|'warning'|'info'>('all')
  const filtered=useMemo(()=>logs
    .filter((item)=>level==='all'||item.level===level)
    .filter((item)=>`${item.source} ${item.message} ${item.details}`.toLowerCase().includes(query.toLowerCase())),[logs,query,level])
  const errors=logs.filter((item)=>item.level==='error').length

  function suggestion(source:string,message:string){
    const text=`${source} ${message}`.toLowerCase()
    if(text.includes('storage')||text.includes('armazen')) return 'Crie um backup, reduza arquivos locais e valide registros corrompidos.'
    if(text.includes('integra')) return 'Teste o endpoint, token, CORS e disponibilidade do provedor.'
    if(text.includes('interface')||text.includes('render')) return 'Use Recuperar Inicialização e revise o último módulo alterado.'
    if(text.includes('migra')) return 'Restaure um snapshot e execute novamente as migrações.'
    return 'Reproduza o fluxo, registre evidências e consulte os detalhes técnicos.'
  }

  function exportCsv(){
    const rows=[['Nível','Origem','Mensagem','Detalhes','Data'],...filtered.map((item)=>[item.level,item.source,item.message,item.details,item.createdAt])]
    const csv=rows.map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
    const anchor=document.createElement('a');anchor.href=url;anchor.download='AgendaMarketingV-erros.csv';anchor.click();URL.revokeObjectURL(url)
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">OBSERVABILIDADE</span><h1>Central de Erros</h1><p>Classifique falhas, consulte detalhes e veja soluções sugeridas.</p></div><div className="actions"><Button variant="secondary" onClick={exportCsv}><Download size={17}/> Exportar CSV</Button><Button variant="danger" onClick={clearLogs}><Trash2 size={17}/> Limpar logs</Button></div></header>
    <section className="error-summary panel-card"><Bug/><div><span>Erros registrados</span><strong>{errors}</strong></div><div><span>Eventos totais</span><strong>{logs.length}</strong></div></section>
    <div className="app-center-toolbar"><div className="search-box"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar erro, módulo ou detalhe..."/></div><select value={level} onChange={(event)=>setLevel(event.target.value as typeof level)}><option value="all">Todos os níveis</option><option value="error">Erros</option><option value="warning">Avisos</option><option value="info">Informações</option></select></div>
    <section className="error-list">{filtered.map((item)=><article key={item.id} className={`panel-card error-item level-${item.level}`}><div className="error-icon"><AlertTriangle/></div><div><span>{item.level} • {item.source}</span><strong>{item.message}</strong><p>{item.details||'Sem detalhes adicionais.'}</p><small>Solução sugerida: {suggestion(item.source,item.message)}</small></div><time>{new Date(item.createdAt).toLocaleString('pt-BR')}</time></article>)}{!filtered.length&&<article className="panel-card empty-panel"><strong>Nenhum evento encontrado.</strong></article>}</section>
  </div>
}
