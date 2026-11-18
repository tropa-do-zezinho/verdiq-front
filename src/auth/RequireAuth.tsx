import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Papel } from '../api/types'

export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode
  roles?: Papel[]
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container page-title">
        <p>Carregando sessão…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.papel)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
