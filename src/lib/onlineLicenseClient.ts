import { loadLocal } from './storage'

export interface OnlineActivationResult {
  ok: boolean
  message: string
  license?: {
    key: string
    plan: 'free' | 'pro' | 'enterprise'
    expiresAt: string
    maxDevices: number
  }
}

function endpoint(): string {
  return (loadLocal<{endpoint?:string}>('license_server_config',{}).endpoint||'').replace(/\/$/,'')
}

export async function activateOnline(input:{
  key:string
  deviceId:string
  deviceName:string
  organizationId:string
}):Promise<OnlineActivationResult>{
  const base=endpoint()
  if(!base) return {ok:false,message:'Servidor de licenças não configurado.'}
  try{
    const response=await fetch(`${base}/api/licenses/activate`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(input)
    })
    const data=await response.json()
    return response.ok?{ok:true,message:'Licença online ativada.',license:data.license}:{ok:false,message:data.message||'Falha na ativação.'}
  }catch(error){
    return {ok:false,message:error instanceof Error?error.message:String(error)}
  }
}

export async function validateOnline(input:{key:string;deviceId:string}):Promise<OnlineActivationResult>{
  const base=endpoint()
  if(!base) return {ok:false,message:'Servidor não configurado.'}
  try{
    const response=await fetch(`${base}/api/licenses/validate`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(input)
    })
    const data=await response.json()
    return response.ok?{ok:true,message:'Licença validada.',license:data.license}:{ok:false,message:data.message||'Licença inválida.'}
  }catch(error){
    return {ok:false,message:error instanceof Error?error.message:String(error)}
  }
}
