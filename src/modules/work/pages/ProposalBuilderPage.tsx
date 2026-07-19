import { useMemo, useState } from 'react'
import { FileText, Printer, Save } from 'lucide-react'
import { Button } from '../../../components/Button'
import { CurrencyInput } from '../../../components/CurrencyInput'
import { useCrmStore } from '../../../lib/crmStore'
import { useProposalTemplatesStore } from '../../../lib/proposalTemplatesStore'

export function ProposalBuilderPage() {
  const clients = useCrmStore((state) => state.clients)
  const addProposal = useCrmStore((state) => state.addProposal)
  const templates = useProposalTemplatesStore((state) => state.templates)
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [title, setTitle] = useState('Proposta comercial')
  const [value, setValue] = useState(0)
  const [message, setMessage] = useState('')

  const client = clients.find((item) => item.id === clientId)
  const template = templates.find((item) => item.id === templateId)
  const validUntil = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + (template?.validityDays ?? 15))
    return date.toLocaleDateString('pt-BR')
  }, [template])

  function save() {
    if (!client || !template) return
    addProposal({
      clientId: client.id,
      title,
      value,
      status: 'draft',
      validUntil: new Date(Date.now() + template.validityDays * 86400000).toISOString().slice(0,10),
      description: `${template.introduction}\n\n${template.scope}\n\n${template.terms}\n\n${template.paymentTerms}`
    })
    setMessage('Proposta salva no cadastro do cliente.')
  }

  function print() {
    window.print()
  }

  return <div className="page proposal-page">
    <header className="page-header no-print">
      <div><span className="eyebrow">PROPOSTAS PROFISSIONAIS</span><h1>Gerador de proposta</h1><p>Monte, visualize, salve e imprima documentos comerciais.</p></div>
      <div className="actions"><Button variant="secondary" onClick={save}><Save size={17}/> Salvar</Button><Button onClick={print}><Printer size={17}/> Imprimir/PDF</Button></div>
    </header>

    {message && <div className="form-message success no-print">{message}</div>}

    <section className="proposal-builder">
      <aside className="panel-card proposal-settings no-print">
        <label>Cliente<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Modelo<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)}/></label>
        <label>Valor<CurrencyInput value={value} onChange={setValue}/></label>
      </aside>

      <article className="proposal-document">
        <header>
          <div className="proposal-brand"><div className="brand-mark">AMV</div><div><strong>DEVVANDERSONAPPS</strong><span>AgendaMarketingV Enterprise</span></div></div>
          <div className="proposal-company"><strong>Vanderson de Castro</strong><span>produtosecursosnet@gmail.com</span><span>CNPJ 39.551.372/0001-41</span></div>
        </header>

        <div className="proposal-title"><FileText/><div><span>PROPOSTA COMERCIAL</span><h1>{title}</h1></div></div>

        <section className="proposal-client">
          <span>PREPARADA PARA</span>
          <strong>{client?.name || 'Selecione um cliente'}</strong>
          <p>{client?.company} • {client?.email} • {client?.phone}</p>
        </section>

        <section><h2>Apresentação</h2><p>{template?.introduction}</p></section>
        <section><h2>Escopo</h2><p>{template?.scope}</p></section>
        <section className="proposal-investment"><div><span>INVESTIMENTO</span><strong>{value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div><div><span>VALIDADE</span><strong>{validUntil}</strong></div></section>
        <section><h2>Condições</h2><p>{template?.terms}</p><p>{template?.paymentTerms}</p></section>

        <footer><span>DEVVANDERSONAPPS</span><span>AgendaMarketingV Enterprise • Proposta gerada em {new Date().toLocaleDateString('pt-BR')}</span></footer>
      </article>
    </section>
  </div>
}
