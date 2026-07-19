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
  passwordHash: string
  passwordSalt: string
  password?: string
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

const PASSWORD_ITERATIONS = 310_000

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function randomSalt(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)))
}

async function derivePassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: base64ToBytes(salt), iterations: PASSWORD_ITERATIONS },
    key,
    256
  )
  return bytesToBase64(new Uint8Array(bits))
}

async function protectPassword(password: string): Promise<Pick<StoredLocalUser, 'passwordHash' | 'passwordSalt'>> {
  const passwordSalt = randomSalt()
  return { passwordSalt, passwordHash: await derivePassword(password, passwordSalt) }
}

function getLocalUsers(): StoredLocalUser[] {
  return loadLocal<StoredLocalUser[]>('users', [])
}

async function migrateLegacyPasswords(): Promise<void> {
  const users = getLocalUsers()
  let changed = false
  const migrated: StoredLocalUser[] = []
  for (const user of users) {
    if (user.password && (!user.passwordHash || !user.passwordSalt)) {
      const protectedPassword = await protectPassword(user.password)
      const { password: _removed, ...safeUser } = user
      migrated.push({ ...safeUser, ...protectedPassword })
      changed = true
    } else {
      const { password: _removed, ...safeUser } = user
      migrated.push(safeUser as StoredLocalUser)
      if (user.password) changed = true
    }
  }
  if (changed) saveLocal('users', migrated)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  loading: true,
  user: null,
  session: null,

  initialize: async () => {
    if (supabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession()
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
      supabase.auth.onAuthStateChange((_event, session) => set({ session, user: session?.user ?? null }))
      return
    }

    await migrateLegacyPasswords()
    const localUser = loadLocal<LocalUser | null>('current_user', null)
    set({ user: localUser, session: null, loading: false })
  },

  signIn: async (email, password) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    }

    const found = getLocalUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    if (!found?.passwordHash || !found.passwordSalt) return 'E-mail ou senha inválidos.'
    const candidate = await derivePassword(password, found.passwordSalt)
    if (candidate !== found.passwordHash) return 'E-mail ou senha inválidos.'

    const safeUser: LocalUser = { id: found.id, email: found.email, name: found.name }
    saveLocal('current_user', safeUser)
    saveLocal('session_started_at', new Date().toISOString())
    useAuditStore.getState().log({ action: 'login', module: 'Segurança', description: `Login realizado por ${safeUser.email}.`, user: safeUser.name })
    set({ user: safeUser })
    return null
  },

  signUp: async (email, password, name) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      return error?.message ?? null
    }

    const users = getLocalUsers()
    if (users.some((item) => item.email.toLowerCase() === email.trim().toLowerCase())) return 'Este e-mail já está cadastrado.'
    const protectedPassword = await protectPassword(password)
    users.push({ id: crypto.randomUUID(), email: email.trim(), name: name.trim(), ...protectedPassword })
    saveLocal('users', users)
    return null
  },

  signOut: async () => {
    if (supabaseConfigured && supabase) await supabase.auth.signOut()
    const current = get().user
    if (current) useAuditStore.getState().log({ action: 'logout', module: 'Segurança', description: `Saída realizada por ${current.email}.`, user: 'name' in current ? current.name : current.email || 'Usuário' })
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
    const protectedPassword = await protectPassword(password)
    saveLocal('users', getLocalUsers().map((item) => item.id === current.id ? { ...item, ...protectedPassword, password: undefined } : item))
    return null
  },

  recoverPassword: async (email) => {
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      return error?.message ?? null
    }
    return getLocalUsers().some((item) => item.email.toLowerCase() === email.trim().toLowerCase())
      ? 'Modo local: entre em contato com o administrador para redefinir a senha.'
      : 'E-mail não encontrado.'
  }
}))
