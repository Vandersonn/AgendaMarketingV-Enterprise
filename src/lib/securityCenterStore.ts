import { create } from 'zustand'
import { loadLocal, saveLocal } from './storage'
import { logSystem } from './systemLogStore'

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  lockAfterFailedAttempts: number
  requireStrongPassword: boolean
  twoFactorPrepared: boolean
  lastReviewAt: string
}

interface SecurityState {
  settings: SecuritySettings
  update: (partial: Partial<SecuritySettings>) => void
  review: () => number
}

const defaults: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  lockAfterFailedAttempts: 5,
  requireStrongPassword: true,
  twoFactorPrepared: false,
  lastReviewAt: ''
}

const initial=loadLocal<SecuritySettings>('security_center',defaults)

export const useSecurityCenterStore=create<SecurityState>((set,get)=>({
  settings:{...defaults,...initial},
  update:(partial)=>set((state)=>{
    const settings={...state.settings,...partial}
    saveLocal('security_center',settings)
    return {settings}
  }),
  review:()=>{
    const current=get().settings
    let score=100
    if(!current.requireStrongPassword) score-=25
    if(current.sessionTimeoutMinutes>120) score-=15
    if(current.lockAfterFailedAttempts>10) score-=20
    if(!current.twoFactorPrepared) score-=20
    const settings={...current,lastReviewAt:new Date().toISOString()}
    saveLocal('security_center',settings)
    set({settings})
    logSystem('info','Segurança','Revisão concluída',`Pontuação ${score}/100`)
    return Math.max(0,score)
  }
}))
