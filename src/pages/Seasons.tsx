import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { EventoSazonal, SeasonsNow } from '../api/types'
import { SeasonBadge } from '../components/SeasonBadge'

type SeasonItem = {
  produtoId: number
  nome: string
  categoria: string
  indicePreco: number
  indiceOferta: number
  confianca: string
  selo?: string
}

export function SeasonsPage() {
  const [data, setData] = useState<SeasonsNow | null>(null)
  const [events, setEvents] = useState<EventoSazonal[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<SeasonsNow>('/v1/seasons/now?uf=SP', { auth: false })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Erro'))
    api<EventoSazonal[]>('/v1/seasonal-events')
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [])

  const emSafra = (data?.emSafra || []) as unknown as SeasonItem[]
  const caros = (data?.precoAcimaDoNormal || []) as unknown as SeasonItem[]

  return (
    <div className="container page-title">
      <h1>Safra agora</h1>
      <p>Leitura do motor sazonal para SP — oferta alta e preço abaixo do normal.</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stack">
        <section className="panel">
          <h2>Em safra</h2>
          {emSafra.length === 0 ? (
            <p className="muted">Nenhum item no critério atual.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Selo</th>
                    <th>Índice preço</th>
                    <th>Oferta</th>
                    <th>Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {emSafra.map((i) => (
                    <tr key={i.produtoId}>
                      <td>
                        <Link to={`/produtos/${i.produtoId}`}>{i.nome}</Link>
                      </td>
                      <td>
                        <SeasonBadge selo={i.selo || 'EM_SAFRA'} />
                      </td>
                      <td>{Number(i.indicePreco).toFixed(2)}</td>
                      <td>{Number(i.indiceOferta).toFixed(2)}</td>
                      <td>{i.confianca}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Preço acima do normal</h2>
          {caros.length === 0 ? (
            <p className="muted">Nenhum item.</p>
          ) : (
            <ul>
              {caros.map((i) => (
                <li key={i.produtoId}>
                  <Link to={`/produtos/${i.produtoId}`}>{i.nome}</Link> — índice {Number(i.indicePreco).toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {events.length > 0 && (
          <section className="panel">
            <h2>Eventos sazonais</h2>
            <ul>
              {events.map((e) => (
                <li key={e.id}>
                  <strong>{e.nome}</strong> — {e.descricao || e.regraData}
                  {e.mesTipico ? ` (mês típico ${e.mesTipico})` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
