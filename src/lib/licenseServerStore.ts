import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface RemoteLicense {
  id: string
  key: string
  plan: string
  status: string
  customerName: string
  customerEmail: string
  companyName: string
  cnpj: string
  maxDevices: number
  issuedAt: string
  expiresAt: string
  notes: string
}

export interface RemoteActivation {
  id: string
  licenseKey: string
  deviceId: string
  deviceName: string
  organizationId: string
  status: string
  activatedAt: string
  lastSeenAt: string
  releasedAt: string
}

export interface RemoteEvent {
  id: string
  licenseKey: string
  type: string
  description: string
  createdAt: string
}

interface Overview {
  licenses: number
  activeLicenses: number
  revokedLicenses: number
  activeDevices: number
}

interface LicenseServerState {
  endpoint: string
  adminToken: string
  connected: boolean
  loading: boolean
  overview: Overview
  licenses: RemoteLicense[]
  activations: RemoteActivation[]
  events: RemoteEvent[]
  lastSyncAt: string
  error: string
  configure: (endpoint: string, adminToken: string) => void
  testConnection: () => Promise<boolean>
  syncOverview: () => Promise<void>
  publishLicense: (license: RemoteLicense) => Promise<void>
  updateLicense: (id: string, patch: Partial<RemoteLicense>) => Promise<void>
  updateActivation: (id: string, patch: Partial<RemoteActivation>) => Promise<void>
}

const saved=loadLocal<{endpoint?:string;adminToken?:string}>('license_server_config',{})

function normalize(endpoint:string){ return endpoint.trim().replace(/\/$/,'') }

export const useLicenseServerStore=create<LicenseServerState>((set,get)=>({
  endpoint:saved.endpoint??'http://localhost:8787',
  adminToken:saved.adminToken??'',
  connected:false,
  loading:false,
  overview:{licenses:0,activeLicenses:0,revokedLicenses:0,activeDevices:0},
  licenses:[],
  activations:[],
  events:[],
  lastSyncAt:'',
  error:'',

  configure:(endpoint,adminToken)=>{
    const normalized=normalize(endpoint)
    saveLocal('license_server_config',{endpoint:normalized,adminToken})
    set({endpoint:normalized,adminToken})
  },

  testConnection:async()=>{
    set({loading:true,error:''})
    try{
      const response=await fetch(`${get().endpoint}/health`)
      const data=await response.json()
      if(!response.ok||!data.ok) throw new Error(data.message||'Servidor indisponível.')
      set({connected:true,lastSyncAt:new Date().toISOString()})
      return true
    }catch(error){
      set({connected:false,error:error instanceof Error?error.message:String(error)})
      return false
    }finally{set({loading:false})}
  },

  syncOverview:async()=>{
    set({loading:true,error:''})
    try{
      const response=await fetch(`${get().endpoint}/api/admin/overview`,{
        headers:{Authorization:`Bearer ${get().adminToken}`}
      })
      const data=await response.json()
      if(!response.ok||!data.ok) throw new Error(data.message||'Falha ao carregar portal.')
      set({
        connected:true,
        overview:data.summary,
        licenses:data.licenses??[],
        activations:data.activations??[],
        events:data.events??[],
        lastSyncAt:new Date().toISOString()
      })
    }catch(error){
      set({connected:false,error:error instanceof Error?error.message:String(error)})
      throw error
    }finally{set({loading:false})}
  },

  publishLicense:async(license)=>{
    const response=await fetch(`${get().endpoint}/api/admin/licenses`,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${get().adminToken}`},
      body:JSON.stringify(license)
    })
    const data=await response.json()
    if(!response.ok||!data.ok) throw new Error(data.message||'Falha ao publicar licença.')
    logSystem('info','License Server','Licença publicada',license.key)
    await get().syncOverview()
  },

  updateLicense:async(id,patch)=>{
    const response=await fetch(`${get().endpoint}/api/admin/licenses/${id}`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${get().adminToken}`},
      body:JSON.stringify(patch)
    })
    const data=await response.json()
    if(!response.ok||!data.ok) throw new Error(data.message||'Falha ao atualizar licença.')
    await get().syncOverview()
  },

  updateActivation:async(id,patch)=>{
    const response=await fetch(`${get().endpoint}/api/admin/activations/${id}`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${get().adminToken}`},
      body:JSON.stringify(patch)
    })
    const data=await response.json()
    if(!response.ok||!data.ok) throw new Error(data.message||'Falha ao atualizar dispositivo.')
    await get().syncOverview()
  }
}))
