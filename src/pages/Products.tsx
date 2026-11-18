import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { ProductListItem } from '../api/types'
import { ProductCard } from '../components/ProductCard'

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<ProductListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const q = params.get('q') || ''
  const categoria = params.get('categoria') || ''
  const epoca = params.get('epoca') || ''

  useEffect(() => {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (categoria) qs.set('categoria', categoria)
    if (epoca) qs.set('epoca', epoca)
    setLoading(true)
    api<ProductListItem[]>(`/v1/products?${qs}`, { auth: false })
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Falha ao carregar'))
      .finally(() => setLoading(false))
  }, [q, categoria, epoca])

  return (
    <div className="container page-title">
      <h1>Produtos FLV</h1>
      <p>Busque por nome, filtre por categoria ou selo de época. Preços de atacado e produção SIDRA quando disponíveis.</p>

      <form
        className="panel row"
        style={{ marginBottom: '1.5rem' }}
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const next = new URLSearchParams()
          const nq = String(fd.get('q') || '').trim()
          const nc = String(fd.get('categoria') || '')
          const ne = String(fd.get('epoca') || '')
          if (nq) next.set('q', nq)
          if (nc) next.set('categoria', nc)
          if (ne) next.set('epoca', ne)
          setParams(next)
        }}
      >
        <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}>
          <label htmlFor="q">Busca</label>
          <input id="q" name="q" defaultValue={q} placeholder="ex.: tomate" />
        </div>
        <div className="field" style={{ margin: 0, minWidth: 140 }}>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={categoria}>
            <option value="">Todas</option>
            <option value="FRUTA">Fruta</option>
            <option value="LEGUME">Legume</option>
            <option value="VERDURA">Verdura</option>
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 140 }}>
          <label htmlFor="epoca">Época</label>
          <select id="epoca" name="epoca" defaultValue={epoca}>
            <option value="">Qualquer</option>
            <option value="EM_SAFRA">Em safra</option>
            <option value="NEUTRO">Neutro</option>
            <option value="FORA_DE_EPOCA">Fora de época</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'end' }}>
          Filtrar
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Carregando…</p>
      ) : (
        <div className="grid-cards">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      {!loading && items.length === 0 && !error && <p className="muted">Nenhum produto encontrado.</p>}
    </div>
  )
}
