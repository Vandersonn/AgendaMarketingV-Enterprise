import { create } from 'zustand'
import { exportLocalData, getStorageDiagnostics, loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'blocked'
export type TestCategory = 'core' | 'data' | 'security' | 'business' | 'integration' | 'ux'

export interface AcceptanceTest {
  id: string
  title: string
  description: string
  category: TestCategory
  critical: boolean
  status: TestStatus
  result: string
  executedAt: string
}

export interface ReleaseNote {
  id: string
  type: 'feature' | 'fix' | 'security' | 'known_issue'
  text: string
}

interface ReleaseCandidateState {
  releaseName: string
  buildNumber: string
  schemaVersion: number
  tests: AcceptanceTest[]
  notes: ReleaseNote[]
  lastRunAt: string
  approvedForPilot: boolean
  runAll: () => Promise<void>
  runOne: (id: string) => Promise<void>
  resetTests: () => void
  setApprovedForPilot: (approved: boolean) => void
  addNote: (type: ReleaseNote['type'], text: string) => void
  removeNote: (id: string) => void
}

const defaultTests: AcceptanceTest[] = [
  { id:'storage-read', title:'Leitura do armazenamento', description:'Valida acesso e integridade básica do localStorage.', category:'data', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'storage-write', title:'Escrita no armazenamento', description:'Cria, lê e remove um registro temporário.', category:'data', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'data-integrity', title:'Integridade dos registros', description:'Detecta registros JSON corrompidos.', category:'data', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'auth-session', title:'Sessão autenticada', description:'Verifica se existe sessão válida no modo atual.', category:'core', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'backup', title:'Rotina de backup', description:'Confirma a existência do centro de backup.', category:'core', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'license', title:'Licenciamento', description:'Valida a presença do registro de licença.', category:'security', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'security-policy', title:'Política de segurança', description:'Verifica senha forte e parâmetros de sessão.', category:'security', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'crm', title:'Dados do CRM', description:'Valida a leitura de clientes e leads.', category:'business', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'finance', title:'Dados financeiros', description:'Valida a leitura dos lançamentos financeiros.', category:'business', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'tasks', title:'Tarefas e projetos', description:'Valida tarefas e projetos sem bloquear a interface.', category:'business', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'integrations', title:'Central de integrações', description:'Verifica se a configuração de integrações pode ser carregada.', category:'integration', critical:false, status:'pending', result:'', executedAt:'' },
  { id:'plugins', title:'Registro de plugins', description:'Valida o manifesto local dos módulos.', category:'core', critical:true, status:'pending', result:'', executedAt:'' },
  { id:'search', title:'Pesquisa global', description:'Confirma que os índices principais podem ser construídos.', category:'ux', critical:false, status:'pending', result:'', executedAt:'' },
  { id:'storage-capacity', title:'Capacidade local', description:'Alerta quando o armazenamento se aproxima do limite.', category:'data', critical:false, status:'pending', result:'', executedAt:'' }
]

const saved = loadLocal<Partial<ReleaseCandidateState>>('release_candidate', {})

function persist(state: Pick<ReleaseCandidateState,'releaseName'|'buildNumber'|'schemaVersion'|'tests'|'notes'|'lastRunAt'|'approvedForPilot'>) {
  saveLocal('release_candidate', state)
}

function collection(key: string): unknown[] {
  const value = loadLocal<unknown>(key, [])
  return Array.isArray(value) ? value : []
}

async function executeTest(test: AcceptanceTest): Promise<Pick<AcceptanceTest,'status'|'result'|'executedAt'>> {
  const executedAt = new Date().toISOString()

  try {
    if (test.id === 'storage-read') {
      localStorage.length
      return { status:'passed', result:'Armazenamento acessível.', executedAt }
    }

    if (test.id === 'storage-write') {
      const key = 'amv_rc_temp_test'
      localStorage.setItem(key, JSON.stringify({ ok:true }))
      const ok = JSON.parse(localStorage.getItem(key) ?? '{}').ok === true
      localStorage.removeItem(key)
      if (!ok) throw new Error('Falha na leitura após escrita.')
      return { status:'passed', result:'Escrita e remoção concluídas.', executedAt }
    }

    if (test.id === 'data-integrity') {
      const diagnostics = getStorageDiagnostics()
      if (diagnostics.corruptedKeys.length) throw new Error(`${diagnostics.corruptedKeys.length} registro(s) corrompido(s).`)
      return { status:'passed', result:'Nenhum JSON corrompido.', executedAt }
    }

    if (test.id === 'auth-session') {
      const user = loadLocal<unknown>('current_user', null)
      if (!user) return { status:'blocked', result:'Nenhuma sessão local ativa durante o teste.', executedAt }
      return { status:'passed', result:'Sessão carregada.', executedAt }
    }

    if (test.id === 'backup') {
      const backup = loadLocal<{ snapshots?: unknown[] }>('backup_center', {})
      const count = Array.isArray(backup.snapshots) ? backup.snapshots.length : 0
      return { status: count ? 'passed' : 'blocked', result: count ? `${count} backup(s) disponível(is).` : 'Crie um backup antes do piloto.', executedAt }
    }

    if (test.id === 'license') {
      const license = loadLocal<{ status?: string; plan?: string }>('license', {})
      if (!license.status) return { status:'blocked', result:'Licença ainda não configurada.', executedAt }
      return { status:'passed', result:`Plano ${license.plan ?? 'não informado'} • ${license.status}.`, executedAt }
    }

    if (test.id === 'security-policy') {
      const security = loadLocal<{ requireStrongPassword?: boolean; sessionTimeoutMinutes?: number }>('security_center', {})
      if (security.requireStrongPassword === false) throw new Error('Senha forte desativada.')
      if ((security.sessionTimeoutMinutes ?? 60) > 240) throw new Error('Sessão configurada acima de 240 minutos.')
      return { status:'passed', result:'Políticas mínimas atendidas.', executedAt }
    }

    if (test.id === 'crm') {
      const clients = collection('clients')
      const leads = collection('leads')
      return { status:'passed', result:`${clients.length} cliente(s) e ${leads.length} lead(s) lidos.`, executedAt }
    }

    if (test.id === 'finance') {
      const entries = collection('finance_entries')
      return { status:'passed', result:`${entries.length} lançamento(s) lido(s).`, executedAt }
    }

    if (test.id === 'tasks') {
      const tasks = collection('work_tasks')
      const projects = collection('projects')
      return { status:'passed', result:`${tasks.length} tarefa(s) e ${projects.length} projeto(s).`, executedAt }
    }

    if (test.id === 'integrations') {
      const hub = loadLocal<{ connections?: unknown[] }>('integration_hub', {})
      const count = Array.isArray(hub.connections) ? hub.connections.length : 0
      return { status:'passed', result:`Configuração carregada. ${count} conexão(ões).`, executedAt }
    }

    if (test.id === 'plugins') {
      const plugins = collection('plugin_registry')
      if (!plugins.length) throw new Error('Registro de plugins vazio.')
      return { status:'passed', result:`${plugins.length} plugin(s) registrado(s).`, executedAt }
    }

    if (test.id === 'search') {
      const data = exportLocalData()
      const searchable = Object.keys(data).filter((key)=>/client|lead|task|project|contract|finance/i.test(key))
      return { status:'passed', result:`${searchable.length} fonte(s) indexável(is).`, executedAt }
    }

    if (test.id === 'storage-capacity') {
      const diagnostics = getStorageDiagnostics()
      const mb = diagnostics.estimatedBytes / 1024 / 1024
      if (mb >= 4.5) throw new Error(`${mb.toFixed(2)} MB utilizados. Risco de limite local.`)
      return { status: mb >= 3 ? 'blocked' : 'passed', result:`${mb.toFixed(2)} MB utilizados.`, executedAt }
    }

    return { status:'blocked', result:'Teste sem executor automático.', executedAt }
  } catch (error) {
    return {
      status:'failed',
      result:error instanceof Error ? error.message : String(error),
      executedAt
    }
  }
}

export const useReleaseCandidateStore = create<ReleaseCandidateState>((set,get)=>({
  releaseName: saved.releaseName ?? 'AgendaMarketingV Enterprise 1.0 RC1',
  buildNumber: saved.buildNumber ?? '1.0.0-rc.1',
  schemaVersion: saved.schemaVersion ?? 1,
  tests: Array.isArray(saved.tests) && saved.tests.length ? saved.tests : defaultTests,
  notes: Array.isArray(saved.notes) ? saved.notes : [
    { id:crypto.randomUUID(), type:'feature', text:'Centro de homologação e testes funcionais internos.' },
    { id:crypto.randomUUID(), type:'fix', text:'Consolidação das proteções contra tela branca.' },
    { id:crypto.randomUUID(), type:'known_issue', text:'Atualização, licenciamento e cloud ainda exigem backend seguro para produção.' }
  ],
  lastRunAt: saved.lastRunAt ?? '',
  approvedForPilot: saved.approvedForPilot ?? false,

  runOne: async (id)=>{
    const target=get().tests.find((item)=>item.id===id)
    if(!target) return

    set((state)=>({tests:state.tests.map((item)=>item.id===id?{...item,status:'running',result:''}:item)}))
    await new Promise((resolve)=>window.setTimeout(resolve,120))
    const outcome=await executeTest(target)

    set((state)=>{
      const tests=state.tests.map((item)=>item.id===id?{...item,...outcome}:item)
      const next={...state,tests,lastRunAt:new Date().toISOString()}
      persist(next)
      return {tests,lastRunAt:next.lastRunAt}
    })
  },

  runAll: async ()=>{
    for(const test of get().tests){
      await get().runOne(test.id)
    }
    logSystem('info','Homologação','Bateria de testes concluída',`${get().tests.length} teste(s).`)
  },

  resetTests: ()=>set((state)=>{
    const tests=defaultTests
    const next={...state,tests,lastRunAt:'',approvedForPilot:false}
    persist(next)
    return {tests,lastRunAt:'',approvedForPilot:false}
  }),

  setApprovedForPilot: (approvedForPilot)=>set((state)=>{
    const next={...state,approvedForPilot}
    persist(next)
    return {approvedForPilot}
  }),

  addNote: (type,text)=>set((state)=>{
    const notes=[{id:crypto.randomUUID(),type,text},...state.notes]
    const next={...state,notes}
    persist(next)
    return {notes}
  }),

  removeNote: (id)=>set((state)=>{
    const notes=state.notes.filter((item)=>item.id!==id)
    const next={...state,notes}
    persist(next)
    return {notes}
  })
}))
