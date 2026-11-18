import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const user = await login(String(fd.get('login')), String(fd.get('senha')))
      if (user.papel === 'ADMIN') navigate('/admin')
      else if (user.papel === 'COMERCIANTE') navigate('/comerciante')
      else if (user.papel === 'CLIENTE') navigate('/conta')
      else navigate(from)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha no login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page-title" style={{ maxWidth: 480 }}>
      <h1>Entrar</h1>
      <p>
        Seed: <code>marta@naepoca.local</code> / <code>ana@naepoca.local</code> /{' '}
        <code>admin@naepoca.local</code> — senha <code>Senha@123</code>
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="panel" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="login">E-mail</label>
          <input id="login" name="login" type="email" required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input id="senha" name="senha" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="muted">
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  )
}
