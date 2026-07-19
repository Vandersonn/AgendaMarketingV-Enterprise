import type { NavigationGroup } from './navigation'
import { navigation as dashboardNavigation } from '../modules/dashboard'
import { navigation as crmNavigation } from '../modules/crm'
import { navigation as clientsNavigation } from '../modules/clients'
import { navigation as workNavigation } from '../modules/work'
import { navigation as marketingNavigation } from '../modules/marketing'
import { navigation as aiNavigation } from '../modules/ai'
import { navigation as financeNavigation } from '../modules/finance'
import { navigation as integrationsNavigation } from '../modules/integrations'
import { navigation as knowledgeNavigation } from '../modules/knowledge'
import { navigation as platformNavigation } from '../modules/platform'
import { navigation as licensingNavigation } from '../modules/licensing'

export const navigationGroups: NavigationGroup[] = [dashboardNavigation, crmNavigation, clientsNavigation, workNavigation, marketingNavigation, aiNavigation, financeNavigation, integrationsNavigation, knowledgeNavigation, ...platformNavigation, licensingNavigation].sort((a,b)=>a.order-b.order)
