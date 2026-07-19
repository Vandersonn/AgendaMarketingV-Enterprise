import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: 'blue' | 'purple' | 'green' | 'orange'
}

export function MetricCard({ label, value, helper, icon: Icon, tone = 'blue' }: Props) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon"><Icon size={22} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  )
}
