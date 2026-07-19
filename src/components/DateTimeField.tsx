interface DateTimeFieldProps {
  value: string
  onChange: (value: string) => void
  includeTime?: boolean
  min?: string
  required?: boolean
}

function localValue(date: Date, includeTime: boolean) {
  const pad = (value: number) => String(value).padStart(2, '0')
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return includeTime ? `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}` : datePart
}

export function DateTimeField({ value, onChange, includeTime = true, min, required }: DateTimeFieldProps) {
  const setPreset = (days: number, hour?: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    if (includeTime) {
      date.setHours(hour ?? 9, 0, 0, 0)
    }
    onChange(localValue(date, includeTime))
  }

  return <div className="smart-date-field">
    <input type={includeTime ? 'datetime-local' : 'date'} value={value} min={min} required={required} onChange={(event) => onChange(event.target.value)} />
    <div className="date-presets">
      <button type="button" onClick={() => setPreset(0, 9)}>Hoje</button>
      <button type="button" onClick={() => setPreset(1, 9)}>Amanhã</button>
      <button type="button" onClick={() => setPreset(7, 9)}>+7 dias</button>
    </div>
  </div>
}
