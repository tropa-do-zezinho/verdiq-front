import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, getAccessToken } from '../../api/client'

type Lot = {
  id: number
  tipo: string
  origem: string
  arquivoNome?: string
  qtdLinhas?: number
  criadoEm?: string
}

export function MerchantRecords() {
  const [records, setRecords] = useState<Record<string, unknown> | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [r, l] = await Promise.all([
        api<Record<string, unknown>>('/v1/merchant/records?tipo=ALL'),
        api<Lot[]>('/v1/merchant/lots'),
      ])
      setRecords(r)
      setLots(l)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onImport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await api<{ loteId: number; linhas: number }>('/v1/merchant/imports', {
        method: 'POST',
        formData: fd,
      })
      setMsg(`Import ok — lote ${res.loteId}, ${res.linhas} linhas`)
      await load()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha no import')
    }
  }

  async function onExport(tipo: string) {
    const token = getAccessToken()
    const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
    const res = await fetch(`${base}/v1/merchant/export?tipo=${tipo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      setMsg('Falha no export')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${tipo.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container page-title">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Registros e lotes</h1>
          <p>Histórico de envios, import CSV/XLSX e export.</p>
        </div>
        <Link className="btn btn-ghost" to="/comerciante">
          Voltar ao dashboard
        </Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-info">{msg}</div>}

      <section className="panel" style={{ marginBottom: '1rem' }}>
        <h2>Importar planilha</h2>
        <form className="row" onSubmit={onImport}>
          <div className="field" style={{ margin: 0 }}>
            <label>Tipo</label>
            <select name="tipo" defaultValue="VENDA">
              <option value="COMPRA">Compra</option>
              <option value="VENDA">Venda</option>
              <option value="PERDA">Perda</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Arquivo</label>
            <input name="file" type="file" accept=".csv,.xlsx,.xls" required />
          </div>
          <button className="btn btn-primary" type="submit" style={{ alignSelf: 'end' }}>
            Enviar
          </button>
        </form>
      </section>

      <section className="panel" style={{ marginBottom: '1rem' }}>
        <h2>Export CSV</h2>
        <div className="row">
          {['COMPRA', 'VENDA', 'PERDA'].map((t) => (
            <button key={t} type="button" className="btn btn-secondary" onClick={() => onExport(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginBottom: '1rem' }}>
        <h2>Lotes</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Arquivo</th>
                <th>Linhas</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.tipo}</td>
                  <td>{l.origem}</td>
                  <td>{l.arquivoNome || '—'}</td>
                  <td>{l.qtdLinhas ?? '—'}</td>
                  <td>{l.criadoEm || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Resumo dos registros</h2>
        {records ? (
          <ul>
            {Object.entries(records).map(([k, v]) => (
              <li key={k}>
                <strong>{k}</strong>: {Array.isArray(v) ? `${v.length} itens` : typeof v}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Carregando…</p>
        )}
      </section>
    </div>
  )
}
