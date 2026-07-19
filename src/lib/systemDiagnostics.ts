import { getStorageDiagnostics, loadLocal } from './storage'
import { supabaseConfigured } from './supabase'

export type DiagnosticStatus = 'healthy' | 'warning' | 'critical'

export interface DiagnosticCheck {
  id: string
  name: string
  status: DiagnosticStatus
  message: string
  recommendation: string
}

function collectionSize(key: string): number {
  const value = loadLocal<unknown>(key, [])
  return Array.isArray(value) ? value.length : 0
}

export function runSystemDiagnostics(): DiagnosticCheck[] {
  const storage = getStorageDiagnostics()
  const megabytes = storage.estimatedBytes / 1024 / 1024
  const currentUser = loadLocal<unknown>('current_user', null)
  const backup = loadLocal<{ settings?: { lastBackupAt?: string } }>('backup_center', {})
  const lastBackup = backup.settings?.lastBackupAt
  const daysSinceBackup = lastBackup
    ? (Date.now() - new Date(lastBackup).getTime()) / 86400000
    : Number.POSITIVE_INFINITY

  return [
    {
      id: 'storage',
      name: 'Armazenamento local',
      status: megabytes < 3 ? 'healthy' : megabytes < 4.5 ? 'warning' : 'critical',
      message: `${megabytes.toFixed(2)} MB utilizados em ${storage.keys} registros.`,
      recommendation: megabytes >= 3
        ? 'Exporte documentos antigos e migre arquivos para Supabase Storage.'
        : 'Capacidade local dentro do esperado.'
    },
    {
      id: 'integrity',
      name: 'Integridade dos dados',
      status: storage.corruptedKeys.length === 0 ? 'healthy' : 'critical',
      message: storage.corruptedKeys.length
        ? `${storage.corruptedKeys.length} registro(s) com JSON inválido.`
        : 'Nenhum registro corrompido detectado.',
      recommendation: storage.corruptedKeys.length
        ? 'Restaure um backup ou remova os registros corrompidos.'
        : 'Nenhuma ação necessária.'
    },
    {
      id: 'authentication',
      name: 'Sessão de usuário',
      status: currentUser ? 'healthy' : 'warning',
      message: currentUser ? 'Usuário autenticado no modo atual.' : 'Nenhum usuário local autenticado.',
      recommendation: currentUser ? 'Sessão operacional.' : 'Entre novamente no aplicativo.'
    },
    {
      id: 'cloud',
      name: 'Banco em nuvem',
      status: supabaseConfigured ? 'healthy' : 'warning',
      message: supabaseConfigured ? 'Supabase configurado.' : 'Aplicativo operando somente com armazenamento local.',
      recommendation: supabaseConfigured
        ? 'Valide as políticas RLS antes da produção.'
        : 'Configure Supabase para sincronização entre dispositivos.'
    },
    {
      id: 'backup',
      name: 'Backup',
      status: daysSinceBackup <= 2 ? 'healthy' : daysSinceBackup <= 7 ? 'warning' : 'critical',
      message: lastBackup
        ? `Último backup em ${new Date(lastBackup).toLocaleString('pt-BR')}.`
        : 'Nenhum backup automático registrado.',
      recommendation: daysSinceBackup > 2
        ? 'Crie um backup agora e mantenha a rotina automática ativa.'
        : 'Rotina de backup atualizada.'
    },
    {
      id: 'volume',
      name: 'Volume operacional',
      status: 'healthy',
      message: `${collectionSize('clients')} clientes, ${collectionSize('work_tasks')} tarefas e ${collectionSize('projects')} projetos armazenados.`,
      recommendation: 'Use filtros e exportações quando a base crescer.'
    }
  ]
}
