import { useMemo, useState } from 'react'
import { Download, File, FileImage, FileText, Search, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCrmStore } from '../../../lib/crmStore'
import { useDocumentsStore, type ClientDocument } from '../../../lib/documentsStore'

const labels: Record<ClientDocument['category'], string> = {
  contract: 'Contrato', proposal: 'Proposta', creative: 'Criativo',
  report: 'Relatório', invoice: 'Financeiro', other: 'Outro'
}

export function DocumentsPage() {
  const clients = useCrmStore((state) => state.clients)
  const { documents, addDocument, removeDocument } = useDocumentsStore()
  const [clientId, setClientId] = useState('')
  const [category, setCategory] = useState<ClientDocument['category']>('other')
  const [notes, setNotes] = useState('')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => documents.filter((item) =>
    `${item.name} ${labels[item.category]} ${item.notes}`.toLowerCase().includes(query.toLowerCase())
  ), [documents, query])

  function upload(file?: File) {
    if (!file) return
    const maxBytes = 3 * 1024 * 1024
    if (file.size > maxBytes) {
      setMessage('O arquivo deve ter no máximo 3 MB no modo local.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      addDocument({
        clientId: clientId || undefined,
        name: file.name,
        category,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: String(reader.result),
        notes
      })
      setNotes('')
      setMessage('Documento salvo na biblioteca local.')
    }
    reader.readAsDataURL(file)
  }

  function download(document: ClientDocument) {
    const anchor = window.document.createElement('a')
    anchor.href = document.dataUrl
    anchor.download = document.name
    anchor.click()
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">CENTRAL DE DOCUMENTOS</span><h1>Arquivos e materiais</h1><p>Organize propostas, contratos, criativos e relatórios por cliente.</p></div>
    </header>

    {message && <div className="form-message success">{message}</div>}

    <section className="document-upload panel-card">
      <div className="document-drop">
        <UploadCloud size={34}/>
        <strong>Adicionar documento</strong>
        <span>PDF, imagem ou arquivo de até 3 MB no armazenamento local.</span>
        <label className="btn btn-primary">Selecionar arquivo<input hidden type="file" onChange={(event) => upload(event.target.files?.[0])}/></label>
      </div>
      <div className="document-options form-grid">
        <label>Cliente<select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value as ClientDocument['category'])}>{Object.entries(labels).map(([key,value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label className="full">Observações<input value={notes} onChange={(event) => setNotes(event.target.value)}/></label>
      </div>
    </section>

    <div className="search-box document-search"><Search size={18}/><input placeholder="Buscar documentos..." value={query} onChange={(event) => setQuery(event.target.value)}/></div>

    <section className="documents-grid">
      {filtered.map((document) => {
        const client = clients.find((item) => item.id === document.clientId)
        const Icon = document.mimeType.startsWith('image/') ? FileImage : document.mimeType.includes('pdf') ? FileText : File
        return <article key={document.id} className="panel-card document-card">
          <div className="document-icon"><Icon/></div>
          <div><strong>{document.name}</strong><span>{labels[document.category]} • {(document.size/1024).toFixed(0)} KB</span><small>{client?.name || 'Sem cliente'} • {new Date(document.createdAt).toLocaleDateString('pt-BR')}</small></div>
          {document.notes && <p>{document.notes}</p>}
          <div className="document-actions"><Button variant="secondary" onClick={() => download(document)}><Download size={16}/> Baixar</Button><button type="button" className="icon-danger" onClick={() => removeDocument(document.id)}><Trash2 size={17}/></button></div>
        </article>
      })}
      {!filtered.length && <article className="panel-card empty-panel"><strong>Nenhum documento encontrado</strong><span>Adicione arquivos para começar.</span></article>}
    </section>
  </div>
}
