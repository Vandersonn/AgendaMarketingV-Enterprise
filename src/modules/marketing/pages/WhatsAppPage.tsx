import { useMemo, useState } from 'react'
import { ExternalLink, MessageCircle, Send } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAiStore } from '../../../lib/aiStore'
import { useCrmStore } from '../../../lib/crmStore'

export function WhatsAppPage() {
  const clients = useCrmStore((state) => state.clients)
  const integrations = useAiStore((state) => state.integrations)
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [message, setMessage] = useState('Olá! Tudo bem? Estou entrando em contato pela AgendaMarketingV.')
  const [status, setStatus] = useState('')

  const selected = useMemo(() => clients.find((item) => item.id === clientId), [clients, clientId])

  function openWhatsApp() {
    if (!selected?.phone) {
      setStatus('O cliente selecionado não possui WhatsApp.')
      return
    }
    const digits = selected.phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`
    window.agendaDesktop?.openExternal(`https://wa.me/${number}?text=${encodeURIComponent(message)}`)
  }

  async function sendWebhook() {
    if (!integrations.whatsappWebhook) {
      setStatus('Configure o webhook do WhatsApp em Integrações.')
      return
    }
    if (!selected) return
    try {
      const response = await fetch(integrations.whatsappWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selected,
          phone: selected.phone.replace(/\D/g, ''),
          message
        })
      })
      if (!response.ok) throw new Error()
      setStatus('Mensagem enviada ao webhook.')
    } catch {
      setStatus('Falha ao enviar para o webhook.')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">WHATSAPP</span>
          <h1>Central de mensagens</h1>
          <p>Abra conversas ou envie dados para uma API autorizada.</p>
        </div>
      </header>

      {status && <div className="form-message success">{status}</div>}

      <section className="whatsapp-layout">
        <article className="panel-card whatsapp-form-card">
          <div className="whatsapp-icon"><MessageCircle size={30} /></div>
          <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="full">Cliente
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Selecione</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name} — {client.phone}</option>)}
              </select>
            </label>
            <label className="full">Mensagem<textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
            <Button type="button" onClick={openWhatsApp}><ExternalLink size={17} /> Abrir WhatsApp</Button>
            <Button type="button" variant="secondary" onClick={sendWebhook}><Send size={17} /> Enviar ao webhook</Button>
          </form>
        </article>

        <article className="panel-card">
          <h2>Respostas rápidas</h2>
          <div className="quick-replies">
            {[
              'Olá! Como posso ajudar?',
              'Vou preparar uma proposta e retorno em breve.',
              'Sua reunião está confirmada.',
              'Obrigado pelo contato! Podemos agendar uma conversa?'
            ].map((text) => <button type="button" key={text} onClick={() => setMessage(text)}>{text}</button>)}
          </div>
          <div className="security-note">
            Para automações, use uma API autorizada e respeite consentimento, opt-out e as políticas do WhatsApp.
          </div>
        </article>
      </section>
    </div>
  )
}
