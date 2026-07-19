import { routes as dashboardRoutes } from '../modules/dashboard'
import { routes as crmRoutes } from '../modules/crm'
import { routes as clientsRoutes } from '../modules/clients'
import { routes as workRoutes } from '../modules/work'
import { routes as marketingRoutes } from '../modules/marketing'
import { routes as aiRoutes } from '../modules/ai'
import { routes as financeRoutes } from '../modules/finance'
import { routes as integrationsRoutes } from '../modules/integrations'
import { routes as knowledgeRoutes } from '../modules/knowledge'
import { routes as platformRoutes } from '../modules/platform'
import { routes as licensingRoutes } from '../modules/licensing'

export const appRoutes = [
  ...dashboardRoutes,
  ...crmRoutes,
  ...clientsRoutes,
  ...workRoutes,
  ...marketingRoutes,
  ...aiRoutes,
  ...financeRoutes,
  ...integrationsRoutes,
  ...knowledgeRoutes,
  ...platformRoutes,
  ...licensingRoutes,
]
