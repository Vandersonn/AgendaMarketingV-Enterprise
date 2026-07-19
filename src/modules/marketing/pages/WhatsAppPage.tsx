import { useMemo, useState } from 'react'
import { ExternalLink, MessageCircle, Save } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCrmStore } from '../../../lib/crmStore'
import { useWhatsAppBusinessStore } from '../../../lib/whatsappBusinessStore'

export function WhatsAppPage() {
  const clients = useCrmStore((state) => state.clients)
  const { channels, updateChannel } = useWhatsAppBusinessStore()
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [channelId, setChannelId] = useState(channels[0].id)
  const [message, setMessage] = useState('Olá! Tudo bem? Estou entrando em contato pela AgendaMarketingV.')
  const [status, setStatus] = useState('')

  const selected = useMemo(() => clients.find((item) => item.id === clientId), [clients, clientId])
  const channel = channels.find((item) => item.id === channelId) || channels[0]

  function openWhatsApp() {
    if (!selected?.phone) return setStatus('O cliente selecionado não possui WhatsApp.')
    const digits = selected.phone.replace(/\D/g, '')
    const number = digits.startsWith('55') ? digits : `55${digits}`
    window.agendaDesktop?.openExternal(`https://wa.me/${number}?text=${encodeURIComponent(message)}`)
    setStatus(`Conversa aberta. Confirme o envio pela conta "${channel.name}" (${channel.phoneNumber || 'número ainda não configurado'}).`)
  }

  return <div className="page">
    <header className="page-header"><div><span className="eyebrow">WHATSAPP BUSINESS</span><h1>Central com dois números</h1><p>Escolha o canal comercial ou de atendimento antes de iniciar cada contato.</p></div></header>
    {status && <div className="form-message success">{status}</div>}

    <section className="integration-grid">
      {channels.map((item) => <article className="panel-card integration-card" key={item.id}>
        <h2>{item.name}</h2>
        <label>Nome do canal<input value={item.name} onChange={(event) => updateChannel(item.id, { name: event.target.value })}/></label>
        <label>Número com DDD<input value={item.phoneNumber} onChange={(event) => updateChannel(item.id, { phoneNumber: event.target.value })} placeholder="(00) 00000-0000"/></label>
        <label>Finalidade<input value={item.purpose} onChange={(event) => updateChannel(item.id, { purpose: event.target.value })}/></label>
        <label><input type="checkbox" checked={item.enabled} onChange={(event) => updateChannel(item.id, { enabled: event.target.checked })}/> Canal ativo</label>
        <small><Save size={14}/> Configuração local salva automaticamente. Nenhum token é armazenado.</small>
      </article>)}
    </section>

    <section className="whatsapp-layout">
      <article className="panel-card whatsapp-form-card">
        <div className="whatsapp-icon"><MessageCircle size={30}/></div>
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label className="full">Canal de saída<select value={channelId} onChange={(event) => setChannelId(event.target.value as typeof channelId)}>
            {channels.filter((item) => item.enabled).map((item) => <option key={item.id} value={item.id}>{item.name} — {item.phoneNumber || 'configurar número'}</option>)}
          </select></label>
          <label className="full">Cliente<select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} — {client.phone}</option>)}</select></label>
          <label className="full">Mensagem<textarea value={message} onChange={(event) => setMessage(event.target.value)}/></label>
          <Button type="button" onClick={openWhatsApp}><ExternalLink size={17}/> Abrir pelo canal selecionado</Button>
        </form>
      </article>

      <article className="panel-card"><h2>Respostas rápidas</h2><div className="quick-replies">{[
        'Olá! Como posso ajudar?',
        'Vou preparar uma proposta e retorno em breve.',
        'Sua reunião está confirmada.',
        'Obrigado pelo contato! Podemos agendar uma conversa?'
      ].map((text) => <button type="button" key={text} onClick={() => setMessage(text)}>{text}</button>)}</div>
      <div className="security-note">Sem a API oficial, confirme manualmente qual conta está aberta antes de enviar. A seleção fica preparada para conectar os dois números futuramente.</div></article>
    </section>
  </div>
}
