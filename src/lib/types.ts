export type ThemeMode = 'light' | 'dark'

export interface Profile {
  id: string
  full_name: string
  company_name: string
  email: string
  phone: string
  cnpj: string
  role: 'owner' | 'admin' | 'member'
}

export interface DashboardMetric {
  label: string
  value: string
  helper: string
  trend?: number
}
