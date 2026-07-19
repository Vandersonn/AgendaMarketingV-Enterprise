import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', children, type = 'button', ...props }: PropsWithChildren<Props>) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
