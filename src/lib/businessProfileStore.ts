import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'

export type IndustryId = 'education' | 'agency' | 'clinic' | 'real_estate' | 'commerce' | 'services' | 'custom'
export type BusinessModel = 'services' | 'products' | 'courses' | 'subscriptions' | 'mixed'
export type ModuleId = 'crm' | 'sales' | 'clients' | 'marketing' | 'finance' | 'projects' | 'support' | 'documents' | 'automation' | 'ai'

export interface BusinessTerminology {
  client: string
  clients: string
  product: string
  products: string
  sale: string
  sales: string
  opportunity: string
  opportunities: string
  seller: string
  contract: string
}

export interface BusinessProfile {
  companyName: string
  industry: IndustryId
  selectedIndustries: IndustryId[]
  customIndustry: string
  specialty: string
  businessModel: BusinessModel
  targetAudience: string
  location: string
  salesChannels: string[]
  enabledModules: ModuleId[]
  terminology: BusinessTerminology
  configured: boolean
  updatedAt: string
}

const allModules: ModuleId[] = ['crm','sales','clients','marketing','finance','projects','support','documents','automation','ai']

const presets: Record<IndustryId, Pick<BusinessProfile, 'businessModel' | 'enabledModules' | 'terminology'>> = {
  education: {
    businessModel: 'courses', enabledModules: allModules,
    terminology: { client:'Aluno', clients:'Alunos', product:'Curso', products:'Cursos', sale:'Matrícula', sales:'Matrículas', opportunity:'Interessado', opportunities:'Interessados', seller:'Consultor', contract:'Termo de matrícula' }
  },
  agency: {
    businessModel: 'services', enabledModules: allModules,
    terminology: { client:'Cliente', clients:'Clientes', product:'Serviço', products:'Serviços', sale:'Venda', sales:'Vendas', opportunity:'Oportunidade', opportunities:'Oportunidades', seller:'Executivo', contract:'Contrato' }
  },
  clinic: {
    businessModel: 'services', enabledModules: ['crm','sales','clients','finance','support','documents','automation'],
    terminology: { client:'Paciente', clients:'Pacientes', product:'Procedimento', products:'Procedimentos', sale:'Atendimento', sales:'Atendimentos', opportunity:'Interessado', opportunities:'Interessados', seller:'Atendente', contract:'Termo' }
  },
  real_estate: {
    businessModel: 'mixed', enabledModules: ['crm','sales','clients','marketing','finance','documents','automation'],
    terminology: { client:'Cliente', clients:'Clientes', product:'Imóvel', products:'Imóveis', sale:'Negociação', sales:'Negociações', opportunity:'Oportunidade', opportunities:'Oportunidades', seller:'Corretor', contract:'Contrato' }
  },
  commerce: {
    businessModel: 'products', enabledModules: ['crm','sales','clients','marketing','finance','support','documents','automation'],
    terminology: { client:'Cliente', clients:'Clientes', product:'Produto', products:'Produtos', sale:'Pedido', sales:'Pedidos', opportunity:'Oportunidade', opportunities:'Oportunidades', seller:'Vendedor', contract:'Contrato' }
  },
  services: {
    businessModel: 'services', enabledModules: allModules,
    terminology: { client:'Cliente', clients:'Clientes', product:'Serviço', products:'Serviços', sale:'Venda', sales:'Vendas', opportunity:'Oportunidade', opportunities:'Oportunidades', seller:'Profissional', contract:'Contrato' }
  },
  custom: {
    businessModel: 'mixed', enabledModules: allModules,
    terminology: { client:'Cliente', clients:'Clientes', product:'Produto ou serviço', products:'Produtos e serviços', sale:'Venda', sales:'Vendas', opportunity:'Oportunidade', opportunities:'Oportunidades', seller:'Responsável', contract:'Contrato' }
  }
}

const loadedProfile = loadLocal<BusinessProfile>('business_profile', {
  companyName: 'DEVVANDERSONAPPS', industry: 'education', selectedIndustries: ['education'], customIndustry: '', specialty: 'Cursos de diversas modalidades', businessModel: 'courses', targetAudience: '', location: '', salesChannels: ['WhatsApp','Instagram'], enabledModules: allModules, terminology: presets.education.terminology, configured: false, updatedAt: new Date().toISOString()
})

const initial: BusinessProfile = {
  ...loadedProfile,
  selectedIndustries: loadedProfile.selectedIndustries?.length ? loadedProfile.selectedIndustries.slice(0, 5) : [loadedProfile.industry || 'education']
}

interface State {
  profile: BusinessProfile
  applyIndustry: (industry: IndustryId) => void
  toggleIndustry: (industry: IndustryId) => void
  updateProfile: (patch: Partial<BusinessProfile>) => void
  updateTerminology: (patch: Partial<BusinessTerminology>) => void
  toggleModule: (module: ModuleId) => void
  completeConfiguration: () => void
}

function persist(profile: BusinessProfile) { saveLocal('business_profile', profile) }

export const industryOptions: Array<{id:IndustryId; label:string; description:string}> = [
  {id:'education',label:'Educação e cursos',description:'Cursos presenciais, online, híbridos e treinamentos'},
  {id:'agency',label:'Agência e marketing',description:'Campanhas, clientes, contratos e entregas'},
  {id:'clinic',label:'Clínica e saúde',description:'Pacientes, procedimentos e atendimentos'},
  {id:'real_estate',label:'Imobiliária',description:'Imóveis, captações, vendas e locações'},
  {id:'commerce',label:'Comércio',description:'Produtos, pedidos, clientes e pós-venda'},
  {id:'services',label:'Prestação de serviços',description:'Serviços, projetos, contratos e recorrência'},
  {id:'custom',label:'Outro ramo',description:'Configuração livre e nomenclaturas próprias'}
]

export const moduleOptions: Array<{id:ModuleId; label:string}> = [
  {id:'crm',label:'CRM'}, {id:'sales',label:'Vendas'}, {id:'clients',label:'Clientes'}, {id:'marketing',label:'Marketing'}, {id:'finance',label:'Financeiro'}, {id:'projects',label:'Projetos'}, {id:'support',label:'Atendimento'}, {id:'documents',label:'Documentos'}, {id:'automation',label:'Automações'}, {id:'ai',label:'Inteligência Artificial'}
]

export const useBusinessProfileStore = create<State>((set) => ({
  profile: initial,
  applyIndustry: (industry) => set((state) => {
    const preset = presets[industry]
    const profile = {...state.profile, industry, selectedIndustries:[industry], businessModel:preset.businessModel, enabledModules:[...preset.enabledModules], terminology:{...preset.terminology}, updatedAt:new Date().toISOString()}
    persist(profile); return {profile}
  }),
  toggleIndustry: (industry) => set((state) => {
    const selected = state.profile.selectedIndustries || [state.profile.industry]
    const alreadySelected = selected.includes(industry)
    if (!alreadySelected && selected.length >= 5) return state
    const selectedIndustries = alreadySelected ? selected.filter((id) => id !== industry) : [...selected, industry]
    if (!selectedIndustries.length) return state
    const primary = selectedIndustries[0]
    const enabledModules = Array.from(new Set(selectedIndustries.flatMap((id) => presets[id].enabledModules))) as ModuleId[]
    const profile = {
      ...state.profile,
      industry: primary,
      selectedIndustries,
      businessModel: selectedIndustries.length > 1 ? 'mixed' as BusinessModel : presets[primary].businessModel,
      enabledModules,
      terminology: alreadySelected && state.profile.industry === industry ? {...presets[primary].terminology} : state.profile.terminology,
      updatedAt: new Date().toISOString()
    }
    persist(profile); return {profile}
  }),
  updateProfile: (patch) => set((state) => { const profile={...state.profile,...patch,updatedAt:new Date().toISOString()}; persist(profile); return {profile} }),
  updateTerminology: (patch) => set((state) => { const profile={...state.profile,terminology:{...state.profile.terminology,...patch},updatedAt:new Date().toISOString()}; persist(profile); return {profile} }),
  toggleModule: (module) => set((state) => { const enabled=state.profile.enabledModules.includes(module); const enabledModules=enabled?state.profile.enabledModules.filter((id)=>id!==module):[...state.profile.enabledModules,module]; const profile={...state.profile,enabledModules,updatedAt:new Date().toISOString()}; persist(profile); return {profile} }),
  completeConfiguration: () => set((state) => { const profile={...state.profile,configured:true,updatedAt:new Date().toISOString()}; persist(profile); saveLocal('onboarding_completed',true); return {profile} })
}))

export function moduleForPath(path:string): ModuleId | null {
  if (['/crm','/crm-intelligence'].includes(path)) return 'crm'
  if (['/sales','/sales-workspace','/proposal-builder','/contracts','/services'].includes(path)) return 'sales'
  if (['/clients','/client-360','/client-health','/client-portal'].includes(path)) return 'clients'
  if (['/marketing','/content-calendar','/approvals','/metrics'].includes(path)) return 'marketing'
  if (path==='/finance') return 'finance'
  if (['/projects','/goals','/tasks','/calendar'].includes(path)) return 'projects'
  if (['/support','/knowledge','/whatsapp'].includes(path)) return 'support'
  if (path==='/documents') return 'documents'
  if (['/automations','/automation-suggestions','/event-bus','/integrations','/integration-hub'].includes(path)) return 'automation'
  if (['/ai-studio','/ai-agents','/ai-executive'].includes(path)) return 'ai'
  return null
}
