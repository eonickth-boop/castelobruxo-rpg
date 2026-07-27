import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    }

    bootstrap()
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }

    let cancelled = false
    supabase
      .from('perfis')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Falha ao carregar perfil:', error)
        setProfile(data ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function login(username, password) {
    const email = `${username.trim().toLowerCase()}@castelobruxo.local`
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function logout() {
    return supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({ session, profile, loading, login, logout, isAuthenticated: Boolean(session) }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return context
}
