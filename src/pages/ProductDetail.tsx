import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, money, tons } from '../api/client'
import type { ProductDetail } from '../api/types'
import { SeasonBadge } from '../components/SeasonBadge'
import { useAuth } from '../auth/AuthContext'
import styles from './ProductDetail.module.css'

export function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState<ProductDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favMsg, setFavMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api<ProductDetail>(`/v1/products/${id}`, { auth: false })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro'))
  }, [id])

  const maxIdx = useMemo(() => {
    if (!data?.calendario12Meses?.length) return 1
    return Math.max(...data.calendario12Meses.map((c) => Number(c.indicePreco) || 1), 1.5)
  }, [data])

  const maxPrice = useMemo(() => {
    if (!data?.seriePrecos?.length) return 1
    return Math.max(...data.seriePrecos.map((p) => Number(p.precoMedio) || 0), 1)
  }, [data])

  async function favorite() {
    if (!user || !id) return
    try {
      await api(`/v1/me/favorites/products/${id}`, { method: 'POST' })
      setFavMsg('Produto favoritado.')
    } catch (e) {
      setFavMsg(e instanceof ApiError ? e.message : 'Falha ao favoritar')
    }
  }

  if (error) {
    return (
      <div className="container page-title">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container page-title">
        <p className="muted">Carregando produto…</p>
      </div>
    )
  }

  return (
    <div className="container page-title fade-up">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem' }}>
            {data.categoria}
          </p>
          <h1 style={{ marginBottom: '0.5rem' }}>{data.nome}</h1>
          <div className="row">
            <SeasonBadge selo={data.seloEpoca} />
            {data.sinonimos?.length > 0 && (
              <span className="muted">também: {data.sinonimos.join(', ')}</span>
            )}
          </div>
        </div>
        {user && (
          <button type="button" className="btn btn-secondary" onClick={favorite}>
            Favoritar
          </button>
        )}
      </div>
      {favMsg && <div className="alert alert-ok">{favMsg}</div>}
      <div className="alert alert-info">{data.aviso}</div>

      <div className={styles.layout}>
        <div className="stack">
          <section className="panel">
            <h2>Preço de referência</h2>
            <p className="price" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-leaf)', margin: 0 }}>
              {money(data.precoAtualAtacado)}
            </p>
            <p className="muted">
              {data.precoAtualData ? `ref. ${data.precoAtualData}` : ''} · fonte {data.fontePreco || '—'}
            </p>
            {data.seriePrecos?.length > 0 && (
              <div className={styles.spark} aria-label="Série de preços">
                {data.seriePrecos.slice(-24).map((p, i) => (
                  <span
                    key={`${p.data}-${i}`}
                    title={`${p.data}: ${money(p.precoMedio)}`}
                    style={{ height: `${(Number(p.precoMedio) / maxPrice) * 100}%` }}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Calendário sazonal (12 meses)</h2>
            <div className={styles.bars}>
              {data.calendario12Meses
                ?.slice()
                .sort((a, b) => a.mes - b.mes)
                .map((c) => (
                  <div key={c.mes} className={styles.barRow}>
                    <span>{c.mesNome?.slice(0, 3) || c.mes}</span>
                    <div className={styles.track}>
                      <div
                        className={styles.fill}
                        style={{ width: `${Math.min(100, (Number(c.indicePreco) / maxIdx) * 100)}%` }}
                      />
                    </div>
                    <span>{Number(c.indicePreco).toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <h2>Produção</h2>
            {data.producao?.length ? (
              <ul>
                {data.producao.map((p) => (
                  <li key={`${p.ano}-${p.uf}-${p.fonte}`}>
                    {p.uf} {p.ano}: <strong>{tons(p.producaoT)}</strong> · {p.fonte}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Sem produção persistida. Rode o ETL SIDRA.</p>
            )}
          </section>

          <section className="panel">
            <h2>Substitutos</h2>
            {data.substitutos?.length ? (
              <div className="row">
                {data.substitutos.map((s) => (
                  <Link key={s.id} to={`/produtos/${s.id}`} className="btn btn-ghost">
                    {s.nome}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">Nenhum substituto cadastrado.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
