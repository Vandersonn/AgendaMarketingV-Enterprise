import { runSystemDiagnostics, type DiagnosticCheck } from './systemDiagnostics'
import { loadLocal } from './storage'
import { usePluginRegistryStore } from './pluginRegistryStore'
import { usePerformanceMonitorStore } from './performanceMonitorStore'

export interface DiagnosticSuiteResult {
  checks: DiagnosticCheck[]
  score: number
  generatedAt: string
}

export function runDiagnosticSuite(): DiagnosticSuiteResult {
  const checks=[...runSystemDiagnostics()]
  const plugins=usePluginRegistryStore.getState().plugins
  const errors=loadLocal<unknown[]>('system_logs',[]).filter((item)=>{
    return Boolean(item && typeof item==='object' && 'level' in item && item.level==='error')
  })
  const latestPerformance=usePerformanceMonitorStore.getState().snapshots[0]

  checks.push({
    id:'plugins',
    name:'Plugins',
    status:plugins.some((item)=>item.status==='error')?'critical':plugins.some((item)=>item.status==='disabled')?'warning':'healthy',
    message:`${plugins.filter((item)=>item.status==='active').length} ativos, ${plugins.filter((item)=>item.status==='disabled').length} desativados e ${plugins.filter((item)=>item.status==='error').length} com erro.`,
    recommendation:plugins.some((item)=>item.status==='error')?'Revise os plugins com erro antes do piloto.':'Registro de plugins operacional.'
  })

  checks.push({
    id:'errors',
    name:'Erros recentes',
    status:errors.length>=10?'critical':errors.length?'warning':'healthy',
    message:`${errors.length} erro(s) armazenado(s) nos logs técnicos.`,
    recommendation:errors.length?'Abra o Central de Erros e classifique as falhas.':'Nenhuma falha registrada.'
  })

  checks.push({
    id:'performance',
    name:'Desempenho',
    status:!latestPerformance?'warning':latestPerformance.score>=85?'healthy':latestPerformance.score>=65?'warning':'critical',
    message:latestPerformance?`Última pontuação: ${latestPerformance.score}/100.`:'Nenhuma medição realizada.',
    recommendation:latestPerformance?'Use o Central de Desempenho para acompanhar tendências.':'Execute uma medição de desempenho.'
  })

  const weights={healthy:100,warning:60,critical:0}
  const score=Math.round(checks.reduce((sum,item)=>sum+weights[item.status],0)/checks.length)
  return {checks,score,generatedAt:new Date().toISOString()}
}
