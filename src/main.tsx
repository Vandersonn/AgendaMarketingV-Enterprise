import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './lib/authStore'
import { runDataMigrations } from './lib/dataMigration'
import { initializeCloudSalesSync } from './lib/cloudSalesSync'
import './styles/global.css'

function renderApplication() {
  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento raiz da aplicação não encontrado.')

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <App />
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

async function bootstrap() {
  try {
    runDataMigrations()
    await useAuthStore.getState().initialize()
    await initializeCloudSalesSync()
    renderApplication()
  } catch (error) {
    console.error('AgendaMarketingV bootstrap error:', error)

    const root = document.getElementById('root')
    if (!root) return

    const message = error instanceof Error ? error.message : String(error)
    root.innerHTML = `
      <main class="bootstrap-fallback">
        <section>
          <h1>Não foi possível iniciar o AgendaMarketingV</h1>
          <p>O sistema encontrou um problema na inicialização.</p>
          <code>${message.replace(/[&<>"']/g, '')}</code>
          <button type="button" id="amv-reload">Recarregar aplicativo</button>
          <button type="button" id="amv-recover">Recuperar inicialização</button>
        </section>
      </main>
    `

    document.getElementById('amv-reload')?.addEventListener('click', () => window.location.reload())
    document.getElementById('amv-recover')?.addEventListener('click', () => {
      localStorage.removeItem('amv_professional_ai_agents')
      localStorage.removeItem('amv_professional_backup_center')
      window.location.reload()
    })
  }
}

bootstrap()
