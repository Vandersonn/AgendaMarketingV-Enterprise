import { useMemo, useState } from 'react'
import { BarChart3, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { useAiStore } from '../../../lib/aiStore'

export function MetricsPage() {
  const { metrics, integrations, addMetric, deleteMetric } = useAiStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    source: 'Meta Ads',
    campaign: '',
    period: new Date().toISOString().slice(0, 7),
    impressions: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    spend: 0,
    revenue: 0
  })

  const totals = useMemo(() => metrics.reduce((acc, item) => ({
    impressions: acc.impressions + item.impressions,
    clicks: acc.clicks + item.clicks,
    leads: acc.leads + item.leads,
    conversions: acc.conversions + item.conversions,
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue
  }), { impressions: 0, clicks: 0, leads: 0, conversions: 0, spend: 0, revenue: 0 }), [metrics])

  const ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0
  const cpl = totals.leads ? totals.spend / totals.leads : 0
  const roas = totals.spend ? totals.revenue / totals.spend : 0

  function createMetric(event: React.FormEvent) {
    event.preventDefault()
    addMetric(form)
    setOpen(false)
  }

  const chart = metrics.slice().reverse().map((item) => ({
    name: item.campaign || item.period,
    investimento: item.spend,
    receita: item.revenue
  }))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">ANALYTICS</span>
          <h1>Métricas e Power BI</h1>
          <p>Centralize desempenho de campanhas e resultados financeiros.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Registrar métrica</Button>
      </header>

      <section className="metrics-grid">
        <article className="metric-card blue"><span>Impressões</span><strong>{totals.impressions.toLocaleString('pt-BR')}</strong><small>Alcance acumulado</small></article>
        <article className="metric-card purple"><span>CTR</span><strong>{ctr.toFixed(2)}%</strong><small>{totals.clicks.toLocaleString('pt-BR')} cliques</small></article>
        <article className="metric-card orange"><span>Custo por lead</span><strong>{cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong><small>{totals.leads} leads</small></article>
        <article className="metric-card green"><span>ROAS</span><strong>{roas.toFixed(2)}x</strong><small>Retorno sobre anúncios</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-header"><div><h2>Investimento x receita</h2><p>Por campanha</p></div></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="investimento" fill="#f59e0b" radius={[6,6,0,0]} />
                <Bar dataKey="receita" fill="#10b981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel-card powerbi-card">
          <div className="panel-header"><div><h2>Power BI</h2><p>Dashboard incorporado</p></div></div>
          {integrations.powerBiUrl ? (
            <>
              <iframe title="Power BI" src={integrations.powerBiUrl} allowFullScreen />
              <Button variant="secondary" onClick={() => window.agendaDesktop?.openExternal(integrations.powerBiUrl)}>
                <ExternalLink size={17} /> Abrir externamente
              </Button>
            </>
          ) : (
            <div className="empty-panel"><BarChart3 size={38} /><strong>Power BI não configurado</strong><span>Adicione a URL em Integrações.</span></div>
          )}
        </article>
      </section>

      <article className="panel-card library-panel">
        <div className="panel-header"><h2>Registros</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Campanha</th><th>Origem</th><th>Período</th><th>Investimento</th><th>Receita</th><th></th></tr></thead>
            <tbody>
              {metrics.map((item) => (
                <tr key={item.id}>
                  <td>{item.campaign}</td><td>{item.source}</td><td>{item.period}</td>
                  <td>{item.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{item.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td><button type="button" className="icon-danger" onClick={() => deleteMetric(item.id)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <Modal title="Registrar métrica" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={createMetric}>
          <label>Origem<input value={form.source} onChange={(e) => setForm((current) => ({ ...current, source: e.target.value }))} /></label>
          <label>Campanha<input value={form.campaign} onChange={(e) => setForm((current) => ({ ...current, campaign: e.target.value }))} required /></label>
          <label>Período<input type="month" value={form.period} onChange={(e) => setForm((current) => ({ ...current, period: e.target.value }))} /></label>
          <label>Impressões<input type="number" value={form.impressions} onChange={(e) => setForm((current) => ({ ...current, impressions: Number(e.target.value) }))} /></label>
          <label>Cliques<input type="number" value={form.clicks} onChange={(e) => setForm((current) => ({ ...current, clicks: Number(e.target.value) }))} /></label>
          <label>Leads<input type="number" value={form.leads} onChange={(e) => setForm((current) => ({ ...current, leads: Number(e.target.value) }))} /></label>
          <label>Conversões<input type="number" value={form.conversions} onChange={(e) => setForm((current) => ({ ...current, conversions: Number(e.target.value) }))} /></label>
          <label>Investimento<input type="number" value={form.spend} onChange={(e) => setForm((current) => ({ ...current, spend: Number(e.target.value) }))} /></label>
          <label>Receita<input type="number" value={form.revenue} onChange={(e) => setForm((current) => ({ ...current, revenue: Number(e.target.value) }))} /></label>
          <Button className="full">Salvar métricas</Button>
        </form>
      </Modal>
    </div>
  )
}
