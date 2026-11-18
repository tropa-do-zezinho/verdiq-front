import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, money } from '../../api/client'
import type { ProductListItem, Recomendacao } from '../../api/types'

type Dashboard = {
  periodo?: { de: string; ate: string }
  receita?: number
  custoCompras?: number
  lucroEstimado?: number
  kgPerda?: number
  valorPerda?: number
  rankingPerdas?: Array<{ produtoId: number; nome: string; kgPerda: number }>
  kgEvitadosEstimado?: number
}

export function MerchantDashboard() {
  const [dash, setDash] = useState<Dashboard | null>(null)
  const [recs, setRecs] = useState<Recomendacao[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [comp, setComp] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formMsg, setFormMsg] = useState<string | null>(null)

  async function reload() {
    try {
      const [d, r, p] = await Promise.all([
        api<Dashboard>('/v1/merchant/dashboard'),
        api<Recomendacao[]>('/v1/merchant/recommendations'),
        api<ProductListItem[]>('/v1/products', { auth: false }),
      ])
      setDash(d)
      setRecs(r)
      setProducts(p)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro')
    }
  }

  useEffect(() => {
    reload()
  }, [])

  async function register(kind: 'purchases' | 'sales' | 'losses', e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormMsg(null)
    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      produtoId: Number(fd.get('produtoId')),
      kg: Number(fd.get('kg')),
      dataRef: fd.get('dataRef'),
    }
    if (kind !== 'losses') {
      body.valorTotal = Number(fd.get('valorTotal'))
    } else {
      body.motivo = fd.get('motivo')
      body.valorEstimado = Number(fd.get('valorEstimado') || 0)
    }
    if (kind === 'purchases' && fd.get('fornecedor')) body.fornecedor = fd.get('fornecedor')
    try {
      await api(`/v1/merchant/${kind}`, { method: 'POST', body })
      setFormMsg('Lançamento salvo.')
      e.currentTarget.reset()
      await reload()
    } catch (err) {
      setFormMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function loadComparativo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const produtoId = fd.get('produtoId')
    try {
      const res = await api<Record<string, unknown>>(`/v1/merchant/comparativo?produtoId=${produtoId}`)
      setComp(res)
    } catch (err) {
      setComp({ erro: err instanceof ApiError ? err.message : 'Falha' })
    }
  }

  return (
    <div className="container page-title">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>ERP do comerciante</h1>
          <p>Dashboard, lançamentos, recomendações e comparativo de praça.</p>
        </div>
        <div className="row">
          <Link className="btn btn-ghost" to="/comerciante/registros">
            Registros
          </Link>
          <Link className="btn btn-secondary" to="/comerciante/ofertas">
            Nova oferta
          </Link>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {formMsg && <div className="alert alert-info">{formMsg}</div>}

      <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="panel">
          <p className="muted">Receita</p>
          <strong style={{ fontSize: '1.4rem' }}>{money(dash?.receita)}</strong>
        </div>
        <div className="panel">
          <p className="muted">Custo compras</p>
          <strong style={{ fontSize: '1.4rem' }}>{money(dash?.custoCompras)}</strong>
        </div>
        <div className="panel">
          <p className="muted">Lucro estimado</p>
          <strong style={{ fontSize: '1.4rem' }}>{money(dash?.lucroEstimado)}</strong>
        </div>
        <div className="panel">
          <p className="muted">Perda</p>
          <strong style={{ fontSize: '1.4rem' }}>
            {dash?.kgPerda ?? '—'} kg · {money(dash?.valorPerda)}
          </strong>
        </div>
      </div>

      <div className="stack">
        <section className="panel">
          <h2>Lançar compra</h2>
          <EntryForm products={products} onSubmit={(e) => register('purchases', e)} purchase />
        </section>
        <section className="panel">
          <h2>Lançar venda</h2>
          <EntryForm products={products} onSubmit={(e) => register('sales', e)} />
        </section>
        <section className="panel">
          <h2>Lançar perda</h2>
          <EntryForm products={products} onSubmit={(e) => register('losses', e)} loss />
        </section>

        <section className="panel">
          <h2>Recomendações</h2>
          {recs.length === 0 ? (
            <p className="muted">Nenhuma recomendação.</p>
          ) : (
            <ul>
              {recs.map((r) => (
                <li key={r.id}>
                  <strong>{r.titulo}</strong> — {r.mensagem}{' '}
                  <span className="muted">({r.confianca})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Comparativo de praça</h2>
          <form className="row" onSubmit={loadComparativo}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="cmp">Produto</label>
              <select id="cmp" name="produtoId" required>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'end' }}>
              Consultar
            </button>
          </form>
          {comp && (
            <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
              {JSON.stringify(comp, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </div>
  )
}

function EntryForm({
  products,
  onSubmit,
  purchase,
  loss,
}: {
  products: ProductListItem[]
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  purchase?: boolean
  loss?: boolean
}) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <form className="row" onSubmit={onSubmit}>
      <div className="field" style={{ margin: 0, minWidth: 160 }}>
        <label>Produto</label>
        <select name="produtoId" required>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ margin: 0, width: 100 }}>
        <label>Kg</label>
        <input name="kg" type="number" step="0.01" required />
      </div>
      {!loss && (
        <div className="field" style={{ margin: 0, width: 120 }}>
          <label>Valor total</label>
          <input name="valorTotal" type="number" step="0.01" required />
        </div>
      )}
      {loss && (
        <>
          <div className="field" style={{ margin: 0, width: 140 }}>
            <label>Motivo</label>
            <input name="motivo" defaultValue="ESTRAGOU" required />
          </div>
          <div className="field" style={{ margin: 0, width: 120 }}>
            <label>Valor est.</label>
            <input name="valorEstimado" type="number" step="0.01" />
          </div>
        </>
      )}
      {purchase && (
        <div className="field" style={{ margin: 0, width: 140 }}>
          <label>Fornecedor</label>
          <input name="fornecedor" />
        </div>
      )}
      <div className="field" style={{ margin: 0, width: 140 }}>
        <label>Data</label>
        <input name="dataRef" type="date" defaultValue={today} required />
      </div>
      <button className="btn btn-primary" type="submit" style={{ alignSelf: 'end' }}>
        Salvar
      </button>
    </form>
  )
}
