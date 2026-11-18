import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../api/client'
import type { ProductListItem } from '../../api/types'

export function MerchantOffers() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [ultima, setUltima] = useState(false)

  useEffect(() => {
    api<ProductListItem[]>('/v1/products', { auth: false }).then(setProducts).catch(() => {})
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      produtoId: Number(fd.get('produtoId')),
      precoNormal: Number(fd.get('precoNormal')),
      precoPromocional: Number(fd.get('precoPromocional')),
      quantidadeKg: Number(fd.get('quantidadeKg') || 0) || null,
      inicio: fd.get('inicio') || null,
      fim: fd.get('fim'),
      ultimaChance: ultima,
    }
    if (ultima) body.loteInfo = fd.get('loteInfo')
    try {
      await api('/v1/offers', { method: 'POST', body })
      setMsg('Oferta criada.')
      e.currentTarget.reset()
      setUltima(false)
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="container page-title" style={{ maxWidth: 640 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Nova oferta</h1>
        <Link className="btn btn-ghost" to="/comerciante">
          Voltar
        </Link>
      </div>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form className="panel" onSubmit={onSubmit}>
        <div className="field">
          <label>Produto</label>
          <select name="produtoId" required>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Preço normal</label>
            <input name="precoNormal" type="number" step="0.01" required />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Preço promocional</label>
            <input name="precoPromocional" type="number" step="0.01" required />
          </div>
        </div>
        <div className="field">
          <label>Quantidade kg</label>
          <input name="quantidadeKg" type="number" step="0.01" />
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Início</label>
            <input name="inicio" type="date" defaultValue={today} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Fim</label>
            <input name="fim" type="date" required />
          </div>
        </div>
        <label className="row" style={{ marginBottom: '1rem' }}>
          <input type="checkbox" checked={ultima} onChange={(e) => setUltima(e.target.checked)} />
          Última chance
        </label>
        {ultima && (
          <div className="field">
            <label>Info do lote</label>
            <input name="loteInfo" required placeholder="ex.: lote do dia, maduro" />
          </div>
        )}
        <button className="btn btn-primary" type="submit">
          Publicar
        </button>
      </form>
    </div>
  )
}
