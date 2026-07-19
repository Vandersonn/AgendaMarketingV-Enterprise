import { Button } from '../../components/Button'
import { CurrencyInput } from '../../components/CurrencyInput'
import { DateTimeField } from '../../components/DateTimeField'
import { Modal } from '../../components/Modal'
import type { LeadFormValues } from './leadFormModel'

interface LeadFormModalProps {
  open: boolean
  form: LeadFormValues
  onChange: (patch: Partial<LeadFormValues>) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function LeadFormModal({ open, form, onChange, onClose, onSubmit }: LeadFormModalProps) {
  return (
    <Modal title="Novo lead" open={open} onClose={onClose} initialFocusSelector="input[name='name']">
      <form className="form-grid" onSubmit={onSubmit}>
        <label>Nome<input name="name" autoComplete="name" value={form.name} onChange={(event) => onChange({ name: event.target.value })} required /></label>
        <label>Empresa<input name="company" autoComplete="organization" value={form.company} onChange={(event) => onChange({ company: event.target.value })} /></label>
        <label>E-mail<input name="email" autoComplete="email" type="email" value={form.email} onChange={(event) => onChange({ email: event.target.value })} /></label>
        <label>WhatsApp<input name="phone" autoComplete="tel" value={form.phone} onChange={(event) => onChange({ phone: event.target.value })} /></label>
        <label>Origem<input name="source" value={form.source} onChange={(event) => onChange({ source: event.target.value })} /></label>
        <label>Valor<CurrencyInput value={form.value} onChange={(value) => onChange({ value })} /></label>
        <label>Responsável<input name="owner" value={form.owner} onChange={(event) => onChange({ owner: event.target.value })} /></label>
        <label>Próxima ação<input name="nextAction" value={form.nextAction} onChange={(event) => onChange({ nextAction: event.target.value })} /></label>
        <label>Data do retorno<DateTimeField value={form.nextActionAt} onChange={(nextActionAt) => onChange({ nextActionAt })} /></label>
        <label>Prioridade<select value={form.followUpPriority} onChange={(event) => onChange({ followUpPriority: event.target.value as LeadFormValues['followUpPriority'] })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></select></label>
        <Button type="submit" className="full">Criar lead</Button>
      </form>
    </Modal>
  )
}
