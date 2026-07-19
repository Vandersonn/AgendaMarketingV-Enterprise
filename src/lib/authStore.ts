import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'
import { loadLocal, saveLocal } from './storage'
import { useAuditStore } from './auditStore'

interface LocalUser {
  id: string
  email: string
  name: string
}

interface StoredLocalUser extends LocalUser {
  password: string
}

interface AuthState {
  loading: boolean
  user: User | LocalUser | null
  session: Session | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, name: string) => Promise<string | null>
  signOut: () => Promise<void>
  changePassword: (password: string) => Promise<string | null>
  recoverPassword: (email: string) => Promise<string | null>
}

const owner: StoredLocalUser = {
  id: 'owner',
  email: 'produtosecursosnet@gmail.com',
  name: 'Vanderson de Castro',
  password: '123456'
}

function getLocalUsers(): StoredLocalUser[] {
  const users = loadLocal<StoredLocalUser[]>('users', [])
  if (!users.some((item) => item.email.toLowerCase() === owner.email.toLowerCase())) {
    users.unshift(owner)
    saveLocal('users', users)
  }
  return users
}

export const useAuthStore = create<AuthState>((set, get) => ({
  loading: true,
  user: null,
  session: null,

  initialize: async () => {
    if (supabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession()
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })
      return
    }

    getLocalUsers()
    const localUser = loadLocal<LocalUser | null>('current_user', null)
    set({ user: localUser, session: null, loading: false })
  },

  signIn: async (email, password) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    }

    const found = getLocalUsers().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password
    )
    if (!found) return 'E-mail ou senha inválidos.'

    const safeUser: LocalUser = { id: found.id, email: found.email, name: found.name }
    saveLocal('current_user', safeUser)
    saveLocal('session_started_at', new Date().toISOString())
    useAuditStore.getState().log({ action: 'login', module: 'Segurança', description: `Login realizado por ${safeUser.email}.`, user: safeUser.name })
    set({ user: safeUser })
    return null
  },

  signUp: async (email, password, name) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      return error?.message ?? null
    }

    const users = getLocalUsers()
    if (users.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())) {
      return 'Este e-mail já está cadastrado.'
    }

    users.push({
      id: crypto.randomUUID(),
      email: email.trim(),
      name: name.trim(),
      password
    })
    saveLocal('users', users)
    return null
  },

  signOut: async () => {
    if (supabaseConfigured && supabase) await supabase.auth.signOut()
    const current = get().user
    if (current) { useAuditStore.getState().log({ action: 'logout', module: 'Segurança', description: `Saída realizada por ${current.email}.`, user: 'name' in current ? current.name : current.email || 'Usuário' }) }
    localStorage.removeItem('amv_professional_current_user')
    localStorage.removeItem('amv_professional_session_started_at')
    set({ user: null, session: null })
  },

  changePassword: async (password) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password })
      return error?.message ?? null
    }

    const current = get().user
    if (!current) return 'Usuário não autenticado.'

    const users = getLocalUsers().map((item) =>
      item.id === current.id ? { ...item, password } : item
    )
    saveLocal('users', users)
    return null
  },

  recoverPassword: async (email) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      return error?.message ?? null
    }

    const found = getLocalUsers().find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (!found) return 'E-mail não encontrado.'
    return 'Modo local: entre em contato com o administrador para redefinir a senha.'
  }
}))
