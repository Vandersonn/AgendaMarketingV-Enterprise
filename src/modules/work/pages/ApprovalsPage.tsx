import { Check, MessageSquareWarning, X } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCrmStore } from '../../../lib/crmStore'
import { useMarketingStore } from '../../../lib/marketingStore'

export function ApprovalsPage() {
  const approvals = useMarketingStore((state) => state.approvals)
  const contents = useMarketingStore((state) => state.contents)
  const moveContent = useMarketingStore((state) => state.moveContent)
  const clients = useCrmStore((state) => state.clients)

  function approve(contentId: string) {
    moveContent(contentId, 'approved')
  }

  function requestChanges(contentId: string) {
    moveContent(contentId, 'draft')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">APROVAÇÕES</span>
          <h1>Aprovação de conteúdo</h1>
          <p>Acompanhe materiais enviados para revisão dos clientes.</p>
        </div>
      </header>

      <section className="approval-grid">
        {approvals.map((approval) => {
          const content = contents.find((item) => item.id === approval.contentId)
          const client = clients.find((item) => item.id === approval.clientId)

          if (!content) return null

          return (
            <article key={approval.id} className="panel-card approval-card">
              <div className="approval-status">
                <MessageSquareWarning size={18} />
                {content.status === 'approved' ? 'Aprovado' : 'Aguardando revisão'}
              </div>

              <h2>{content.title}</h2>
              <p>{client?.name || approval.reviewer || 'Cliente não informado'}</p>

              {content.caption && (
                <div className="approval-preview">
                  {content.caption.slice(0, 180)}
                  {content.caption.length > 180 ? '…' : ''}
                </div>
              )}

              <div className="approval-actions">
                <Button onClick={() => approve(content.id)}>
                  <Check size={17} /> Aprovar
                </Button>

                <Button variant="secondary" onClick={() => requestChanges(content.id)}>
                  <X size={17} /> Solicitar alteração
                </Button>
              </div>
            </article>
          )
        })}

        {!approvals.some((approval) =>
          contents.some((content) => content.id === approval.contentId)
        ) && (
          <article className="panel-card empty-panel">
            <strong>Nenhuma aprovação pendente</strong>
            <span>Mova um conteúdo para “Em revisão” para iniciar o fluxo.</span>
          </article>
        )}
      </section>
    </div>
  )
}
