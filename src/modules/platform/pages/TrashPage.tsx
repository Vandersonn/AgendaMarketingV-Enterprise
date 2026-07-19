import { ArchiveRestore, Clock3, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useTrashStore } from '../../../lib/trashStore'

const labels: Record<string, string> = {
  client: 'Cliente', lead: 'Lead', opportunity: 'Oportunidade', sales_task: 'Tarefa comercial',
  content: 'Conteúdo', ai_asset: 'Ativo de IA', metric: 'Métrica'
}

type Confirmation =
  | { kind: 'delete'; id: string; title: string }
  | { kind: 'empty'; title: string }
  | null

export function TrashPage() {
  const items = useTrashStore((state) => state.items)
  const restore = useTrashStore((state) => state.restore)
  const removeForever = useTrashStore((state) => state.removeForever)
  const emptyTrash = useTrashStore((state) => state.emptyTrash)
  const cleanupExpired = useTrashStore((state) => state.cleanupExpired)
  const [query, setQuery] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [confirmationText, setConfirmationText] = useState('')
  const [message, setMessage] = useState('')
  const filtered = useMemo(() => items.filter((item) => `${item.title} ${labels[item.entityType]}`.toLowerCase().includes(query.toLowerCase())), [items, query])

  useEffect(() => {
    const removed = cleanupExpired()
    if (removed > 0) setMessage(`${removed} item(ns) vencido(s) foram removidos automaticamente.`)
  }, [cleanupExpired])

  function restoreItem(id: string) {
    if (restore(id)) setMessage('Item restaurado com sucesso.')
  }

  function closeConfirmation() {
    setConfirmation(null)
    setConfirmationText('')
  }

  function confirmPermanentAction() {
    if (!confirmation || confirmationText.trim().toUpperCase() !== 'EXCLUIR') return
    if (confirmation.kind === 'delete') {
      removeForever(confirmation.id)
      setMessage('Item excluído definitivamente.')
    } else {
      emptyTrash()
      setMessage('Lixeira esvaziada definitivamente.')
    }
    closeConfirmation()
  }

  return <div className="page">
    <header className="page-header">
      <div><span className="eyebrow">PROTEÇÃO DE DADOS</span><h1>Lixeira Inteligente</h1><p>Recupere itens excluídos ou remova-os definitivamente. A retenção padrão é de 30 dias.</p></div>
      <Button variant="danger" disabled={!items.length} onClick={() => setConfirmation({ kind: 'empty', title: 'Esvaziar toda a lixeira' })}><Trash2 size={17}/> Esvaziar lixeira</Button>
    </header>

    {message && <div className="trash-feedback" role="status"><ShieldAlert size={18}/><span>{message}</span><button type="button" onClick={() => setMessage('')} aria-label="Fechar mensagem">×</button></div>}

    <section className="notification-summary">
      <article className="panel-card"><Trash2 size={24}/><span>Itens protegidos</span><strong>{items.length}</strong></article>
      <article className="panel-card"><ArchiveRestore size={24}/><span>Recuperáveis</span><strong>{items.length}</strong></article>
      <article className="panel-card"><Clock3 size={24}/><span>Retenção</span><strong>30 dias</strong></article>
      <article className="panel-card"><ShieldAlert size={24}/><span>Exclusão direta</span><strong>Bloqueada</strong></article>
    </section>

    <article className="panel-card">
      <label className="trash-toolbar"><Search size={18}/><span className="sr-only">Buscar na lixeira</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na lixeira..." /></label>
      <div className="trash-list">
        {filtered.map((item) => <div className="trash-row" key={item.id}>
          <div><span className="trash-type">{labels[item.entityType]}</span><strong>{item.title}</strong><small>Excluído em {new Date(item.deletedAt).toLocaleString('pt-BR')} • expira em {new Date(item.expiresAt).toLocaleDateString('pt-BR')}</small></div>
          <div className="actions"><Button variant="secondary" onClick={() => restoreItem(item.id)}><ArchiveRestore size={16}/> Restaurar</Button><Button variant="danger" onClick={() => setConfirmation({ kind: 'delete', id: item.id, title: item.title })}><Trash2 size={16}/> Excluir definitivamente</Button></div>
        </div>)}
        {!filtered.length && <div className="notification-empty large"><Trash2 size={38}/><strong>{items.length ? 'Nenhum resultado encontrado' : 'Lixeira vazia'}</strong><span>{items.length ? 'Ajuste o texto da pesquisa para localizar outro item.' : 'Nenhum item excluído está aguardando recuperação.'}</span></div>}
      </div>
    </article>

    <Modal title="Confirmar exclusão definitiva" open={Boolean(confirmation)} onClose={closeConfirmation}>
      <div className="confirmation-dialog">
        <p>{confirmation?.kind === 'empty' ? 'Todos os itens da lixeira serão removidos permanentemente.' : <>O item <strong>“{confirmation?.title}”</strong> será removido permanentemente.</>}</p>
        <p>Digite <strong>EXCLUIR</strong> para confirmar. Esta ação não poderá ser desfeita.</p>
        <label>Confirmação<input autoFocus value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} placeholder="Digite EXCLUIR" /></label>
        <div className="modal-actions"><Button variant="secondary" onClick={closeConfirmation}>Cancelar</Button><Button variant="danger" disabled={confirmationText.trim().toUpperCase() !== 'EXCLUIR'} onClick={confirmPermanentAction}>Excluir definitivamente</Button></div>
      </div>
    </Modal>
  </div>
}
