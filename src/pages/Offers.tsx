import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, money } from '../api/client'
import type { Oferta, ProductListItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'

export function OffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<Oferta[]>([])
  const [names, setNames] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [onlyChance, setOnlyChance] = useState(false)

  async function load(ultimaChance: boolean) {
    setError(null)
    try {
      const qs = ultimaChance ? '?ultimaChance=true' : ''
      const [list, products] = await Promise.all([
        api<Oferta[]>(`/v1/offers${qs}`, { auth: false }),
        api<ProductListItem[]>('/v1/products', { auth: false }),
      ])
      setOffers(list)
      setNames(Object.fromEntries(products.map((p) => [p.id, p.nome])))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro')
    }
  }

  useEffect(() => {
    load(onlyChance)
  }, [onlyChance])

  async function report(id: number) {
    if (!user) return
    const motivo = window.prompt('Motivo da denúncia (opcional)') ?? ''
    try {
      await api(`/v1/offers/${id}/report`, { method: 'POST', body: { motivo } })
      setMsg('Denúncia registrada.')
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Falha')
    }
  }

  return (
    <div className="container page-title">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Ofertas</h1>
          <p>Promoções de comerciantes — inclusive última chance de lote.</p>
        </div>
        <label className="row" style={{ fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={onlyChance}
            onChange={(e) => setOnlyChance(e.target.checked)}
          />
          Só última chance
        </label>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-ok">{msg}</div>}

      <div className="grid-cards">
        {offers.map((o) => (
          <article key={o.id} className="panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>
                <Link to={`/produtos/${o.produtoId}`}>{names[o.produtoId] || `Produto #${o.produtoId}`}</Link>
              </h3>
              {o.ultimaChance && <span className="badge badge-fora">Última chance</span>}
            </div>
            <p style={{ marginTop: '0.75rem' }}>
              <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)' }}>
                {money(o.precoNormal)}
              </span>{' '}
              <strong style={{ color: 'var(--color-leaf)', fontSize: '1.2rem' }}>
                {money(o.precoPromocional)}
              </strong>
            </p>
            <p className="muted">
              Até {o.fim}
              {o.quantidadeKg != null ? ` · ${o.quantidadeKg} kg` : ''}
              {o.loteInfo ? ` · ${o.loteInfo}` : ''}
            </p>
            {user && (
              <button type="button" className="btn btn-ghost" onClick={() => report(o.id)}>
                Denunciar
              </button>
            )}
          </article>
        ))}
      </div>
      {offers.length === 0 && !error && <p className="muted">Nenhuma oferta ativa.</p>}
    </div>
  )
}
