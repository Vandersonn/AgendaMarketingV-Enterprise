import { useState } from 'react'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useAiStore } from '../../../lib/aiStore'
import type { IntegrationConfig } from '../../../lib/aiTypes'

const definitions: Array<{
  key: keyof IntegrationConfig
  title: string
  description: string
}> = [
  { key: 'imageEndpoint', title: 'Gerador de imagens', description: 'Backend seguro, n8n ou Make. Nunca coloque a chave diretamente no EXE.' },
  { key: 'textEndpoint', title: 'Gerador de textos', description: 'Endpoint de IA para copies, roteiros e mensagens.' },
  { key: 'whatsappWebhook', title: 'WhatsApp API', description: 'Webhook autorizado para envio de mensagens.' },
  { key: 'powerBiUrl', title: 'Power BI', description: 'URL pública segura ou embed do relatório.' },
  { key: 'canvaUrl', title: 'Canva', description: 'Página inicial, equipe ou template.' },
  { key: 'facebookUrl', title: 'Facebook', description: 'Página ou área comercial.' },
  { key: 'instagramUrl', title: 'Instagram', description: 'Perfil profissional.' },
  { key: 'metaBusinessUrl', title: 'Meta Business Suite', description: 'Planejamento, conteúdo e anúncios.' },
  { key: 'n8nWebhook', title: 'n8n', description: 'Automação de fluxos e integrações.' },
  { key: 'makeWebhook', title: 'Make', description: 'Cenários e automações.' },
  { key: 'supabaseUrl', title: 'Supabase', description: 'Painel do projeto e banco em nuvem.' },
  { key: 'generalWebhook', title: 'Integração geral', description: 'Eventos personalizados do aplicativo.' },
  { key: 'googleCalendarUrl', title: 'Google Calendar', description: 'Calendário da equipe.' },
  { key: 'gmailUrl', title: 'Gmail', description: 'Caixa de entrada comercial.' }
]

export function IntegrationsPage() {
  const stored = useAiStore((state) => state.integrations)
  const saveIntegrations = useAiStore((state) => state.saveIntegrations)
  const [config, setConfig] = useState(stored)
  const [message, setMessage] = useState('')

  function update(key: keyof IntegrationConfig, value: string) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function save() {
    saveIntegrations(config)
    setMessage('Integrações salvas com sucesso.')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CENTRAL DE INTEGRAÇÕES</span>
          <h1>Serviços e automações</h1>
          <p>Configure URLs e webhooks sem expor segredos no aplicativo.</p>
        </div>
        <Button onClick={save}><Save size={18} /> Salvar tudo</Button>
      </header>

      {message && <div className="form-message success">{message}</div>}

      <section className="integration-grid">
        {definitions.map((item) => (
          <article key={item.key} className="panel-card integration-card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <input value={config[item.key]} onChange={(e) => update(item.key, e.target.value)} placeholder="URL ou webhook" />
            {config[item.key] && (
              <Button variant="secondary" onClick={() => window.agendaDesktop?.openExternal(config[item.key])}>
                <ExternalLink size={17} /> Abrir
              </Button>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
