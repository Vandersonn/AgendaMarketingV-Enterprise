import { useMemo, useState } from 'react'
import { ArchiveRestore, Download, HardDriveDownload, RefreshCcw, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useBackupStore } from '../../../lib/backupStore'

export function RecoveryCenterPage(){
  const{snapshots,createSnapshot,deleteSnapshot,restoreSnapshot}=useBackupStore()
  const[selectedA,setSelectedA]=useState('')
  const[selectedB,setSelectedB]=useState('')
  const[message,setMessage]=useState('')

  const comparison=useMemo(()=>{
    const a=snapshots.find((item)=>item.id===selectedA)
    const b=snapshots.find((item)=>item.id===selectedB)
    if(!a||!b) return null
    const keysA=new Set(Object.keys(a.data))
    const keysB=new Set(Object.keys(b.data))
    return {
      added:[...keysB].filter((key)=>!keysA.has(key)),
      removed:[...keysA].filter((key)=>!keysB.has(key)),
      common:[...keysA].filter((key)=>keysB.has(key)),
      bytesDiff:b.estimatedBytes-a.estimatedBytes
    }
  },[snapshots,selectedA,selectedB])

  function restore(id:string){
    const restored=restoreSnapshot(id)
    setMessage(`${restored} registro(s) restaurado(s). Reinicie o aplicativo para recarregar tudo.`)
  }

  function exportSnapshot(id:string){
    const snapshot=snapshots.find((item)=>item.id===id)
    if(!snapshot) return
    const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}))
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`backup-${snapshot.createdAt.slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url)
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">RECOVERY & ROLLBACK</span><h1>Central de Recuperação</h1><p>Crie snapshots, compare versões, exporte e restaure dados.</p></div><Button onClick={()=>createSnapshot(`Snapshot RC2 ${new Date().toLocaleString('pt-BR')}`)}><HardDriveDownload size={17}/> Criar snapshot</Button></header>
    {message&&<div className="form-message success">{message}</div>}
    <section className="recovery-grid">
      {snapshots.map((snapshot)=><article key={snapshot.id} className="panel-card recovery-card"><div className="recovery-card-head"><ArchiveRestore/><div><strong>{snapshot.label}</strong><span>{new Date(snapshot.createdAt).toLocaleString('pt-BR')} • {(snapshot.estimatedBytes/1024).toFixed(0)} KB</span></div></div><div className="recovery-actions"><Button variant="secondary" onClick={()=>restore(snapshot.id)}><RefreshCcw size={16}/> Restaurar</Button><button type="button" onClick={()=>exportSnapshot(snapshot.id)}><Download size={16}/></button><button type="button" className="danger" onClick={()=>deleteSnapshot(snapshot.id)}><Trash2 size={16}/></button></div></article>)}
      {!snapshots.length&&<article className="panel-card empty-panel"><strong>Nenhum snapshot disponível.</strong></article>}
    </section>
    <article className="panel-card comparison-card"><div className="panel-header"><div><h2>Comparar snapshots</h2><p>Compare as chaves e o tamanho entre duas versões.</p></div></div><div className="comparison-selects"><select value={selectedA} onChange={(event)=>setSelectedA(event.target.value)}><option value="">Versão anterior</option>{snapshots.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={selectedB} onChange={(event)=>setSelectedB(event.target.value)}><option value="">Versão posterior</option>{snapshots.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></div>{comparison&&<section className="comparison-summary"><div><span>Novas chaves</span><strong>{comparison.added.length}</strong></div><div><span>Removidas</span><strong>{comparison.removed.length}</strong></div><div><span>Em comum</span><strong>{comparison.common.length}</strong></div><div><span>Diferença</span><strong>{(comparison.bytesDiff/1024).toFixed(1)} KB</strong></div></section>}</article>
  </div>
}
