import { useMemo, useState } from 'react'
import { CheckCircle2, Plus, Target, Trash2, WalletCards } from 'lucide-react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { CurrencyInput } from '../../../components/CurrencyInput'
import { DateTimeField } from '../../../components/DateTimeField'
import { useCrmStore } from '../../../lib/crmStore'
import { useFinanceStore, type FinanceStatus, type FinanceType } from '../../../lib/financeStore'

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinancePage() {
  const { entries, monthlyGoal, addEntry, removeEntry, markPaid, setMonthlyGoal } = useFinanceStore()
  const clients = useCrmStore((state) => state.clients)
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(monthlyGoal)
  const [form, setForm] = useState({
    type: 'income' as FinanceType,
    description: '',
    category: 'Serviços',
    clientId: '',
    value: 0,
    dueDate: new Date().toISOString().slice(0, 10),
    paidDate: '',
    status: 'pending' as FinanceStatus,
    paymentMethod: 'PIX',
    recurring: false,
    notes: ''
  })

  const summary = useMemo(() => {
    const paidIncome = entries.filter((item) => item.type === 'income' && item.status === 'paid').reduce((sum, item) => sum + item.value, 0)
    const pendingIncome = entries.filter((item) => item.type === 'income' && item.status === 'pending').reduce((sum, item) => sum + item.value, 0)
    const paidExpense = entries.filter((item) => item.type === 'expense' && item.status === 'paid').reduce((sum, item) => sum + item.value, 0)
    const overdue = entries.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + item.value, 0)
    return { paidIncome, pendingIncome, paidExpense, overdue, balance: paidIncome - paidExpense }
  }, [entries])

  const goalPercent = monthlyGoal ? Math.min(100, Math.round((summary.paidIncome / monthlyGoal) * 100)) : 0

  function create(event: React.FormEvent) {
    event.preventDefault()
    addEntry(form)
    setOpen(false)
    setForm({
      type: 'income', description: '', category: 'Serviços', clientId: '', value: 0,
      dueDate: new Date().toISOString().slice(0, 10), paidDate: '', status: 'pending',
      paymentMethod: 'PIX', recurring: false, notes: ''
    })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">GESTÃO FINANCEIRA</span>
          <h1>Financeiro</h1>
          <p>Receitas, despesas, cobranças e meta mensal.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> Novo lançamento</Button>
      </header>

      <section className="metrics-grid">
        <article className="metric-card green"><span>Receitas recebidas</span><strong>{currency(summary.paidIncome)}</strong><small>Entradas confirmadas</small></article>
        <article className="metric-card blue"><span>A receber</span><strong>{currency(summary.pendingIncome)}</strong><small>Cobranças pendentes</small></article>
        <article className="metric-card orange"><span>Despesas pagas</span><strong>{currency(summary.paidExpense)}</strong><small>Saídas confirmadas</small></article>
        <article className="metric-card purple"><span>Saldo realizado</span><strong>{currency(summary.balance)}</strong><small>Receitas menos despesas</small></article>
      </section>

      <section className="finance-grid">
        <article className="panel-card goal-card">
          <div className="panel-header">
            <div><h2>Meta mensal</h2><p>Acompanhe o objetivo de faturamento.</p></div>
            <Target />
          </div>
          <div className="goal-value"><strong>{currency(summary.paidIncome)}</strong><span>de {currency(monthlyGoal)}</span></div>
          <div className="progress-track"><div style={{ width: `${goalPercent}%` }} /></div>
          <div className="goal-footer"><strong>{goalPercent}% concluído</strong><span>Faltam {currency(Math.max(0, monthlyGoal - summary.paidIncome))}</span></div>
          <div className="inline-form goal-form">
            <CurrencyInput value={goal} onChange={setGoal} />
            <Button variant="secondary" onClick={() => setMonthlyGoal(goal)}>Atualizar meta</Button>
          </div>
        </article>

        <article className="panel-card finance-alert-card">
          <WalletCards size={30} />
          <h2>Alertas financeiros</h2>
          <div className="finance-alert"><span>Valores vencidos</span><strong>{currency(summary.overdue)}</strong></div>
          <div className="finance-alert"><span>Lançamentos recorrentes</span><strong>{entries.filter((item) => item.recurring).length}</strong></div>
          <div className="finance-alert"><span>Cobranças pendentes</span><strong>{entries.filter((item) => item.type === 'income' && item.status === 'pending').length}</strong></div>
        </article>
      </section>

      <article className="panel-card library-panel">
        <div className="panel-header"><div><h2>Lançamentos</h2><p>Controle completo das movimentações.</p></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Descrição</th><th>Tipo</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.description}</strong><small>{item.category}</small></td>
                  <td>{item.type === 'income' ? 'Receita' : 'Despesa'}</td>
                  <td>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                  <td className={item.type === 'income' ? 'finance-income' : 'finance-expense'}>{currency(item.value)}</td>
                  <td><span className={`finance-status ${item.status}`}>{item.status}</span></td>
                  <td className="table-actions">
                    {item.status !== 'paid' && <button type="button" onClick={() => markPaid(item.id)} title="Marcar como pago"><CheckCircle2 size={17} /></button>}
                    <button type="button" className="icon-danger" onClick={() => removeEntry(item.id)} title="Excluir"><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
              {!entries.length && <tr><td colSpan={6} className="empty-inline">Nenhum lançamento financeiro.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>

      <Modal title="Novo lançamento financeiro" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={create}>
          <label>Tipo
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FinanceType }))}>
              <option value="income">Receita</option><option value="expense">Despesa</option>
            </select>
          </label>
          <label>Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FinanceStatus }))}>
              <option value="pending">Pendente</option><option value="paid">Pago</option>
              <option value="overdue">Vencido</option><option value="cancelled">Cancelado</option>
            </select>
          </label>
          <label className="full">Descrição<input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required /></label>
          <label>Categoria<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
          <label>Cliente
            <select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}>
              <option value="">Sem cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label>Valor<CurrencyInput value={form.value} onChange={(value) => setForm((current) => ({ ...current, value }))} required /></label>
          <label>Vencimento<DateTimeField includeTime={false} value={form.dueDate} onChange={(dueDate) => setForm((current) => ({ ...current, dueDate }))} /></label>
          <label>Pagamento<input value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.recurring} onChange={(event) => setForm((current) => ({ ...current, recurring: event.target.checked }))} /> Lançamento recorrente</label>
          <label className="full">Observações<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
          <Button className="full">Salvar lançamento</Button>
        </form>
      </Modal>
    </div>
  )
}
