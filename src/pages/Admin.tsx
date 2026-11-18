import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import type { EtlRun, EventoSazonal, ProductListItem } from '../api/types'

type Audit = { id: number; usuarioId: number; acao: string; detalhe?: string; criadoEm?: string }
type Tab = 'etl' | 'produtos' | 'eventos' | 'impacto'

type EtlSummaryRow = {
  fonte?: string
  status?: string
  registros?: number
  error?: string
  avisos?: string[]
  produtos?: number
}

function summarizeEtl(payload: unknown): EtlSummaryRow[] {
  if (!payload || typeof payload !== 'object') return []
  const runs = (payload as { runs?: unknown }).runs
  if (!Array.isArray(runs)) return []
  return runs.map((raw) => {
    const r = raw as Record<string, unknown>
    const produtos = Array.isArray(r.produtos) ? r.produtos.length : undefined
    return {
      fonte: typeof r.fonte === 'string' ? r.fonte : undefined,
      status: typeof r.status === 'string' ? r.status : undefined,
      registros: typeof r.registros === 'number' ? r.registros : produtos,
      error: typeof r.error === 'string' ? r.error : undefined,
      avisos: Array.isArray(r.avisos) ? (r.avisos as string[]).slice(0, 3) : undefined,
      produtos,
    }
  })
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('etl')
  const [runs, setRuns] = useState<EtlRun[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [impact, setImpact] = useState<Record<string, unknown> | null>(null)
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [events, setEvents] = useState<EventoSazonal[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [etlSummary, setEtlSummary] = useState<EtlSummaryRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState<Partial<Record<Tab, boolean>>>({})

  const loadEtl = useCallback(async () => {
    const [r, a] = await Promise.all([
      api<EtlRun[]>('/v1/admin/etl/runs'),
      api<Audit[]>('/v1/admin/audit'),
    ])
    setRuns(r.slice(0, 30))
    setAudit(a.slice(0, 40))
    setLoaded((s) => ({ ...s, etl: true }))
  }, [])

  const loadProdutos = useCallback(async () => {
    const p = await api<ProductListItem[]>('/v1/products', { auth: false })
    setProducts(p)
    setLoaded((s) => ({ ...s, produtos: true }))
  }, [])

  const loadEventos = useCallback(async () => {
    const e = await api<EventoSazonal[]>('/v1/seasonal-events').catch(() => [] as EventoSazonal[])
    setEvents(e)
    setLoaded((s) => ({ ...s, eventos: true }))
  }, [])

  const loadImpacto = useCallback(async () => {
    const i = await api<Record<string, unknown>>('/v1/admin/impact')
    setImpact(i)
    setLoaded((s) => ({ ...s, impacto: true }))
  }, [])

  useEffect(() => {
    const loaders: Record<Tab, () => Promise<void>> = {
      etl: loadEtl,
      produtos: loadProdutos,
      eventos: loadEventos,
      impacto: loadImpacto,
    }
    if (loaded[tab]) return
    loaders[tab]().catch((e) => setMsg(e instanceof ApiError ? e.message : 'Erro'))
  }, [tab, loaded, loadEtl, loadProdutos, loadEventos, loadImpacto])

  async function runEtl() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await api('/v1/admin/etl/run', { method: 'POST' })
      setEtlSummary(summarizeEtl(res))
      setMsg('ETL disparado.')
      setLoaded((s) => ({ ...s, etl: false }))
      await loadEtl()
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Falha ETL')
    } finally {
      setBusy(false)
    }
  }

  async function uploadPrices(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await api('/v1/admin/market-uploads', { method: 'POST', formData: fd })
      setMsg('Upload de preços aceito (RF-48).')
      e.currentTarget.reset()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha no upload')
    }
  }

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await api('/v1/admin/products', {
        method: 'POST',
        body: {
          nome: fd.get('nome'),
          categoria: fd.get('categoria'),
          unidadeBase: fd.get('unidadeBase'),
        },
      })
      setMsg('Produto criado.')
      e.currentTarget.reset()
      await loadProdutos()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function toggleProduct(id: number) {
    try {
      await api(`/v1/admin/products/${id}`, {
        method: 'PUT',
        body: { ativo: 'false' },
      })
      setMsg(`Produto ${id} desativado.`)
      await loadProdutos()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await api('/v1/admin/seasonal-events', {
        method: 'POST',
        body: {
          nome: fd.get('nome'),
          regraData: fd.get('regraData'),
          mesTipico: Number(fd.get('mesTipico') || 0) || null,
          descricao: fd.get('descricao'),
        },
      })
      setMsg('Evento criado.')
      e.currentTarget.reset()
      await loadEventos()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  const tabs = useMemo(
    () =>
      [
        { id: 'etl' as const, label: 'ETL e upload' },
        { id: 'produtos' as const, label: 'Produtos' },
        { id: 'eventos' as const, label: 'Eventos' },
        { id: 'impacto' as const, label: 'Impacto e audit' },
      ] as const,
    [],
  )

  return (
    <div className="container page-title">
      <h1>Admin</h1>
      <p>ETL, upload de preços, produtos, eventos, auditoria e impacto.</p>
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="row" style={{ marginBottom: '1rem', gap: '0.35rem' }} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'etl' && (
        <div className="stack">
          <section className="panel">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>ETL</h2>
              <button className="btn btn-primary" type="button" disabled={busy} onClick={runEtl}>
                {busy ? 'Rodando…' : 'Rodar agora'}
              </button>
            </div>
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fonte</th>
                    <th>Status</th>
                    <th>Registros</th>
                    <th>Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.fonte}</td>
                      <td>{r.status}</td>
                      <td>{r.registros ?? '—'}</td>
                      <td className="muted" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.mensagem || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {etlSummary && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Última execução (resumo)</h3>
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Fonte</th>
                        <th>Status</th>
                        <th>Regs</th>
                        <th>Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {etlSummary.map((row, i) => (
                        <tr key={`${row.fonte}-${i}`}>
                          <td>{row.fonte || '—'}</td>
                          <td>{row.status || '—'}</td>
                          <td>{row.registros ?? row.produtos ?? '—'}</td>
                          <td className="muted">{row.error || row.avisos?.join('; ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Upload preços (RF-48)</h2>
            <p className="muted">CSV: produto,data,preco,praca_id[,volume]</p>
            <form className="row" onSubmit={uploadPrices}>
              <input type="hidden" name="tipo" value="PRECO_MERCADO" />
              <div className="field" style={{ margin: 0 }}>
                <label>Arquivo</label>
                <input name="file" type="file" accept=".csv" required />
              </div>
              <button className="btn btn-secondary" type="submit" style={{ alignSelf: 'end' }}>
                Enviar
              </button>
            </form>
          </section>
        </div>
      )}

      {tab === 'produtos' && (
        <section className="panel">
          <h2>Produtos</h2>
          <form className="row" onSubmit={createProduct} style={{ marginBottom: '1rem' }}>
            <div className="field" style={{ margin: 0, flex: 1 }}>
              <label>Nome</label>
              <input name="nome" required />
            </div>
            <div className="field" style={{ margin: 0, width: 120 }}>
              <label>Categoria</label>
              <input name="categoria" defaultValue="FRUTA" />
            </div>
            <div className="field" style={{ margin: 0, width: 100 }}>
              <label>Unidade</label>
              <input name="unidadeBase" defaultValue="KG" />
            </div>
            <button className="btn btn-primary" type="submit" style={{ alignSelf: 'end' }}>
              Criar
            </button>
          </form>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.nome}</td>
                    <td>{p.categoria}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => toggleProduct(p.id)}>
                        Desativar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'eventos' && (
        <section className="panel">
          <h2>Eventos sazonais</h2>
          <ul>
            {events.map((ev) => (
              <li key={ev.id}>
                {ev.nome} — {ev.regraData}
              </li>
            ))}
          </ul>
          <form onSubmit={createEvent}>
            <div className="field">
              <label>Nome</label>
              <input name="nome" required />
            </div>
            <div className="field">
              <label>Regra data</label>
              <input name="regraData" required placeholder="ex.: movel:pascoa" />
            </div>
            <div className="field">
              <label>Mês típico</label>
              <input name="mesTipico" type="number" min={1} max={12} />
            </div>
            <div className="field">
              <label>Descrição</label>
              <textarea name="descricao" rows={2} />
            </div>
            <button className="btn btn-secondary" type="submit">
              Criar evento
            </button>
          </form>
        </section>
      )}

      {tab === 'impacto' && (
        <div className="stack">
          <section className="panel">
            <h2>Impacto</h2>
            {impact ? (
              <ul>
                {Object.entries(impact).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {String(v)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Carregando…</p>
            )}
          </section>
          <section className="panel">
            <h2>Auditoria (últimos 40)</h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.usuarioId}</td>
                      <td>{a.acao}</td>
                      <td>{a.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
