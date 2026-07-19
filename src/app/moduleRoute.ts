import type { ComponentType, LazyExoticComponent } from 'react'
import type { Permission } from '../lib/permissions'

export interface ModuleRoute {
  path?: string
  index?: boolean
  component: LazyExoticComponent<ComponentType>
  permission?: Permission
  licenseFeature?: string
  ownerOnly?: boolean
}
