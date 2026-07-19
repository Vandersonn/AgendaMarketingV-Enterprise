import { useEffect, useState } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  currency?: 'BRL' | 'USD' | 'EUR'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

const localeByCurrency = { BRL: 'pt-BR', USD: 'en-US', EUR: 'pt-PT' } as const
const symbolByCurrency = { BRL: 'R$', USD: 'US$', EUR: '€' } as const

function formatDigits(value: number, currency: keyof typeof localeByCurrency) {
  return new Intl.NumberFormat(localeByCurrency[currency], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0)
}

function parseCurrency(text: string) {
  const digits = text.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export function CurrencyInput({ value, onChange, currency = 'BRL', placeholder, required, disabled, className }: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => formatDigits(value, currency))

  useEffect(() => setDisplay(formatDigits(value, currency)), [value, currency])

  return (
    <div className={`currency-input ${className || ''}`}>
      <span>{symbolByCurrency[currency]}</span>
      <input
        inputMode="numeric"
        value={display}
        placeholder={placeholder || '0,00'}
        required={required}
        disabled={disabled}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const parsed = parseCurrency(event.target.value)
          onChange(parsed)
          setDisplay(formatDigits(parsed, currency))
        }}
        aria-label={`Valor em ${currency}`}
      />
    </div>
  )
}
