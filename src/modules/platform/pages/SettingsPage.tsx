import { useState } from 'react'
import { Button } from '../../../components/Button'
import { exportLocalData, importLocalData, loadLocal, saveLocal } from '../../../lib/storage'
import { useAuthStore } from '../../../lib/authStore'

interface BusinessSettings {
  businessName: string
  ownerName: string
  email: string
  phone: string
  cnpj: string
}

const initial = loadLocal<BusinessSettings>('business_settings', {
  businessName: 'DEVVANDERSONAPPS',
  ownerName: 'Vanderson de Castro',
  email: 'produtosecursosnet@gmail.com',
  phone: '(31) 98932-0563',
  cnpj: '39.551.372/0001-41'
})

export function SettingsPage() {
  const [settings, setSettings] = useState(initial)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const changePassword = useAuthStore((state) => state.changePassword)

  function update(key: keyof BusinessSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function saveBusiness(event: React.FormEvent) {
    event.preventDefault()
    saveLocal('business_settings', settings)
    setMessageType('success')
    setMessage('Configurações salvas com sucesso.')
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    if (newPassword.length < 6) {
      setMessageType('error')
      setMessage('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    const error = await changePassword(newPassword)
    setMessageType(error ? 'error' : 'success')
    setMessage(error ?? 'Senha atualizada com sucesso.')
    if (!error) setNewPassword('')
  }

  function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { data?: Record<string, unknown> }
        importLocalData(parsed.data ?? parsed as Record<string, unknown>)
        setMessageType('success')
        setMessage('Backup importado. Reinicie o aplicativo para recarregar todos os módulos.')
      } catch {
        setMessageType('error')
        setMessage('Arquivo de backup inválido.')
      }
    }
    reader.readAsText(file)
  }

  async function backup() {
    const content = JSON.stringify({ generatedAt: new Date().toISOString(), data: exportLocalData() }, null, 2)
    if (window.agendaDesktop) {
      const result = await window.agendaDesktop.saveBackup(content)
      setMessageType(result.ok ? 'success' : 'error')
      setMessage(result.ok ? 'Backup salvo com sucesso.' : 'Backup cancelado.')
      return
    }
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `AgendaMarketingV-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CONFIGURAÇÕES</span>
          <h1>Empresa e segurança</h1>
          <p>Gerencie identidade, acesso e backup.</p>
        </div>
      </header>

      {message && <div className={`form-message ${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</div>}

      <section className="settings-grid">
        <article className="panel-card">
          <div className="panel-header"><h2>Dados da empresa</h2></div>
          <form className="form-grid" onSubmit={saveBusiness}>
            <label>Nome do negócio<input value={settings.businessName} onChange={(e) => update('businessName', e.target.value)} /></label>
            <label>Responsável<input value={settings.ownerName} onChange={(e) => update('ownerName', e.target.value)} /></label>
            <label>E-mail<input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)} /></label>
            <label>WhatsApp<input value={settings.phone} onChange={(e) => update('phone', e.target.value)} /></label>
            <label className="full">CNPJ<input value={settings.cnpj} onChange={(e) => update('cnpj', e.target.value)} /></label>
            <Button className="full">Salvar configurações</Button>
          </form>
        </article>

        <article className="panel-card">
          <div className="panel-header"><h2>Segurança</h2></div>
          <form className="form-grid" onSubmit={savePassword}>
            <label className="full">Nova senha<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
            <Button className="full">Alterar senha</Button>
          </form>
          <div className="divider" />
          <div className="backup-actions">
            <Button variant="secondary" onClick={backup}>Fazer backup</Button>
            <label className="btn btn-secondary import-button">Importar backup<input type="file" accept=".json" onChange={importBackup} hidden /></label>
          </div>
        </article>
      </section>
    </div>
  )
}
