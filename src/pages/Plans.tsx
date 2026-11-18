import { useEffect, useState } from 'react'
import { api, ApiError, money } from '../api/client'
import type { Plano } from '../api/types'
import { useAuth } from '../auth/AuthContext'

export function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plano[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Plano[]>('/v1/plans', { auth: false })
      .then(setPlans)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro'))
  }, [])

  async function interest(codigo: string) {
    if (!user) {
      setMsg('Faça login para registrar interesse.')
      return
    }
    try {
      const res = await api<{ status: string; mensagem?: string }>(`/v1/plans/${codigo}/interest`, {
        method: 'POST',
      })
      setMsg(res.mensagem || `Interesse registrado: ${res.status}`)
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Falha')
    }
  }

  return (
    <div className="container page-title">
      <h1>Planos</h1>
      <p>Sem pagamento nesta entrega — registre interesse no PRO (RF-52).</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info">{msg}</div>}
      <div className="grid-cards">
        {plans.map((p) => (
          <article key={p.id} className="panel">
            <h2 style={{ marginBottom: '0.25rem' }}>{p.nome}</h2>
            <p className="muted">{p.codigo}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-leaf)' }}>
              {Number(p.precoMensal) === 0 ? 'Grátis' : money(p.precoMensal)}
              <span className="muted" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {' '}
                / mês
              </span>
            </p>
            <p>{p.beneficios}</p>
            {p.codigo !== 'ESSENCIAL' && (
              <button type="button" className="btn btn-primary" onClick={() => interest(p.codigo)}>
                Tenho interesse
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
