import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/client'
import type { Papel, TokenResponse, User } from '../api/types'

type AuthState = {
  user: User | null
  loading: boolean
  login: (login: string, senha: string) => Promise<User>
  logout: () => void
  refreshMe: () => Promise<void>
  hasRole: (...roles: Papel[]) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return
    }
    try {
      const me = await api<User>('/v1/auth/me')
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        if (getAccessToken()) {
          await refreshMe()
        } else if (getRefreshToken()) {
          try {
            const data = await api<TokenResponse>('/v1/auth/refresh', {
              method: 'POST',
              body: { refreshToken: getRefreshToken() },
              auth: false,
            })
            setTokens(data.accessToken, data.refreshToken)
            setUser(data.user)
          } catch {
            clearTokens()
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshMe])

  const login = useCallback(async (loginId: string, senha: string) => {
    const data = await api<TokenResponse>('/v1/auth/login', {
      method: 'POST',
      body: { login: loginId, senha },
      auth: false,
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: Papel[]) => !!user && roles.includes(user.papel),
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe, hasRole }),
    [user, loading, login, logout, refreshMe, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora de AuthProvider')
  return ctx
}
