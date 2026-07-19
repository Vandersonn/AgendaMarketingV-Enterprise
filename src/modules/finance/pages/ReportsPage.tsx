import { Download, FileText } from 'lucide-react'
import { Button } from '../../../components/Button'
import { useCrmStore } from '../../../lib/crmStore'
import { useMarketingStore } from '../../../lib/marketingStore'
import { useAiStore } from '../../../lib/aiStore'
import { useCalendarStore } from '../../../lib/calendarStore'
import { useFinanceStore } from '../../../lib/financeStore'
import { useProjectsStore } from '../../../lib/projectsStore'
import { useGoalsStore } from '../../../lib/goalsStore'
import { useSupportStore } from '../../../lib/supportStore'
import { useServiceCatalogStore } from '../../../lib/serviceCatalogStore'

function escapeCsv(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadCsv<T extends object>(filename: string, rows: T[]): void {
  if (!rows.length) return

  const normalizedRows = rows.map((row) => row as Record<string, unknown>)
  const headers = Object.keys(normalizedRows[0])

  const csv = [
    headers.map(escapeCsv).join(','),
    ...normalizedRows.map((row) =>
      headers.map((key) => escapeCsv(row[key])).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const clients = useCrmStore((state) => state.clients)
  const leads = useCrmStore((state) => state.leads)
  const contents = useMarketingStore((state) => state.contents)
  const metrics = useAiStore((state) => state.metrics)
  const events = useCalendarStore((state) => state.events)
  const finance = useFinanceStore((state) => state.entries)
  const projects = useProjectsStore((state) => state.projects)
  const goals = useGoalsStore((state) => state.objectives)
  const tickets = useSupportStore((state) => state.tickets)
  const services = useServiceCatalogStore((state) => state.services)

  const cards = [
    {
      title: 'Clientes',
      value: clients.length,
      action: () => downloadCsv('clientes.csv', clients)
    },
    {
      title: 'Leads e pipeline',
      value: leads.length,
      action: () => downloadCsv('leads.csv', leads)
    },
    {
      title: 'Conteúdos',
      value: contents.length,
      action: () => downloadCsv('conteudos.csv', contents)
    },
    {
      title: 'Métricas',
      value: metrics.length,
      action: () => downloadCsv('metricas.csv', metrics)
    },
    {
      title: 'Agenda',
      value: events.length,
      action: () => downloadCsv('agenda.csv', events)
    },
    {
      title: 'Financeiro',
      value: finance.length,
      action: () => downloadCsv('financeiro.csv', finance)
    },
    {
      title: 'Projetos',
      value: projects.length,
      action: () => downloadCsv('projetos.csv', projects)
    },
    {
      title: 'Metas e OKRs',
      value: goals.length,
      action: () => downloadCsv('metas-okrs.csv', goals)
    },
    {
      title: 'Suporte',
      value: tickets.length,
      action: () => downloadCsv('suporte.csv', tickets)
    },
    {
      title: 'Catálogo',
      value: services.length,
      action: () => downloadCsv('catalogo-servicos.csv', services)
    }
  ]

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">RELATÓRIOS E EXPORTAÇÃO</span>
          <h1>Central de relatórios</h1>
          <p>Exporte dados operacionais em CSV para Excel e Power BI.</p>
        </div>
      </header>

      <section className="report-grid">
        {cards.map((card) => (
          <article key={card.title} className="panel-card report-card">
            <div className="report-icon">
              <FileText />
            </div>

            <span>{card.title}</span>
            <strong>{card.value}</strong>

            <Button
              variant="secondary"
              onClick={card.action}
              disabled={!card.value}
            >
              <Download size={17} /> Exportar CSV
            </Button>
          </article>
        ))}
      </section>
    </div>
  )
}
