import type { LucideIcon } from 'lucide-react'
import type { Permission } from '../lib/permissions'

export type NavigationColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'slate' | 'red'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  color?: NavigationColor
  permission?: Permission
  ownerOnly?: boolean
}

export interface NavigationGroup {
  id: string
  label: string
  icon: LucideIcon
  order: number
  items: NavigationItem[]
}
