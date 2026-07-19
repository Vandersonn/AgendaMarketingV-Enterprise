import { useMemo, useState } from 'react'
import { BookOpenCheck, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useKnowledgeStore } from '../../../lib/knowledgeStore'

export function KnowledgeBasePage() {
  const { articles, addArticle, togglePublished, incrementView, removeArticle } = useKnowledgeStore()
  const [open,setOpen]=useState(false)
  const [selected,setSelected]=useState<string|null>(null)
  const [query,setQuery]=useState('')
  const [form,setForm]=useState({title:'',category:'Geral',summary:'',content:'',published:true})

  const filtered=useMemo(()=>articles.filter((item)=>`${item.title} ${item.category} ${item.summary}`.toLowerCase().includes(query.toLowerCase())),[articles,query])
  const current=articles.find((item)=>item.id===selected)

  function submit(event:React.FormEvent){event.preventDefault();addArticle(form);setOpen(false);setForm({title:'',category:'Geral',summary:'',content:'',published:true})}
  function openArticle(id:string){setSelected(id);incrementView(id)}

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">BASE DE CONHECIMENTO</span><h1>Artigos e procedimentos</h1><p>Documente processos, respostas e orientações para equipe e clientes.</p></div><Button onClick={()=>setOpen(true)}><Plus size={18}/> Novo artigo</Button></header>
    <div className="search-box knowledge-search"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar artigos..."/></div>
    <section className="knowledge-layout">
      <div className="knowledge-grid">
        {filtered.map((article)=><article key={article.id} className="panel-card knowledge-card">
          <div className="knowledge-card-head"><div className="knowledge-icon"><BookOpenCheck/></div><div><span>{article.category}</span><h2>{article.title}</h2></div><button type="button" className="icon-danger" onClick={()=>removeArticle(article.id)}><Trash2 size={17}/></button></div>
          <p>{article.summary}</p>
          <div className="knowledge-meta"><span><Eye size={14}/>{article.views} visualizações</span><button type="button" className={article.published?'published':'draft'} onClick={()=>togglePublished(article.id)}>{article.published?'Publicado':'Rascunho'}</button></div>
          <Button variant="secondary" onClick={()=>openArticle(article.id)}>Abrir artigo</Button>
        </article>)}
        {!filtered.length&&<article className="panel-card empty-panel"><strong>Nenhum artigo encontrado</strong></article>}
      </div>
      {current&&<aside className="panel-card knowledge-reader"><button type="button" className="reader-close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">{current.category}</span><h1>{current.title}</h1><p>{current.summary}</p><div className="knowledge-content">{current.content}</div></aside>}
    </section>
    <Modal title="Novo artigo" open={open} onClose={()=>setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="full">Título<input value={form.title} onChange={(event)=>setForm((current) => ({...current,title:event.target.value}))} required/></label>
        <label>Categoria<input value={form.category} onChange={(event)=>setForm((current) => ({...current,category:event.target.value}))}/></label>
        <label className="checkbox-label"><input type="checkbox" checked={form.published} onChange={(event)=>setForm((current) => ({...current,published:event.target.checked}))}/> Publicar imediatamente</label>
        <label className="full">Resumo<textarea value={form.summary} onChange={(event)=>setForm((current) => ({...current,summary:event.target.value}))}/></label>
        <label className="full">Conteúdo<textarea className="knowledge-editor" value={form.content} onChange={(event)=>setForm((current) => ({...current,content:event.target.value}))}/></label>
        <Button className="full">Salvar artigo</Button>
      </form>
    </Modal>
  </div>
}
