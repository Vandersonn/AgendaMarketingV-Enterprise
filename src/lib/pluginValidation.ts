import type { AppPlugin } from './pluginRegistryStore'

export interface PluginValidation {
  pluginId: string
  valid: boolean
  issues: string[]
  score: number
}

export function validatePlugin(plugin: AppPlugin): PluginValidation {
  const issues:string[]=[]
  if(!/^[a-z0-9-]+$/.test(plugin.id)) issues.push('ID deve conter apenas letras minúsculas, números e hífen.')
  if(!plugin.name.trim()) issues.push('Nome obrigatório.')
  if(!/^\d+\.\d+\.\d+/.test(plugin.version)) issues.push('Versão fora do padrão semântico.')
  if(!plugin.route.startsWith('/')) issues.push('Rota inválida.')
  if(!plugin.description.trim()) issues.push('Descrição obrigatória.')
  if(!plugin.updatedAt || Number.isNaN(new Date(plugin.updatedAt).getTime())) issues.push('Data de atualização inválida.')
  const score=Math.max(0,100-issues.length*20)
  return {pluginId:plugin.id,valid:issues.length===0,issues,score}
}
