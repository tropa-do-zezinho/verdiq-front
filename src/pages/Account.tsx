import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, clearTokens } from '../api/client'
import type { Notificacao, PreferenciaNotificacao, ProductListItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'

type ShoppingList = { id: number; nome: string; criadoEm?: string }

export function AccountPage() {
  const { user, refreshMe, logout } = useAuth()
  const navigate = useNavigate()
  const [inbox, setInbox] = useState<Notificacao[]>([])
  const [prefs, setPrefs] = useState<PreferenciaNotificacao | null>(null)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const [n, p, l, prod] = await Promise.all([
      api<Notificacao[]>('/v1/me/notifications'),
      api<PreferenciaNotificacao>('/v1/me/notification-preferences'),
      api<ShoppingList[]>('/v1/me/shopping-lists'),
      api<ProductListItem[]>('/v1/products', { auth: false }),
    ])
    setInbox(n)
    setPrefs(p)
    setLists(l)
    setProducts(prod)
  }

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof ApiError ? e.message : 'Erro'))
  }, [])

  async function markRead(id: number) {
    await api(`/v1/me/notifications/${id}/read`, { method: 'POST' })
    await load()
  }

  async function savePrefs(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const updated = await api<PreferenciaNotificacao>('/v1/me/notification-preferences', {
        method: 'PUT',
        body: {
          canalInApp: fd.get('canalInApp') === 'on',
          canalWebPush: fd.get('canalWebPush') === 'on',
          maxPorSemana: Number(fd.get('maxPorSemana') || 3),
          tiposAlerta: fd.get('tiposAlerta'),
        },
      })
      setPrefs(updated)
      setMsg('Preferências salvas.')
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function createList(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const produtos = String(fd.get('produtos') || '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter(Boolean)
    try {
      await api('/v1/me/shopping-lists', {
        method: 'POST',
        body: { nome: fd.get('nome'), produtos },
      })
      setMsg('Lista criada.')
      e.currentTarget.reset()
      await load()
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      await api('/v1/auth/me', {
        method: 'PUT',
        body: {
          nome: fd.get('nome'),
          cidade: fd.get('cidade'),
          uf: fd.get('uf'),
          consentimentoNotificacoes: fd.get('notif') === 'on',
          consentimentoComparativos: fd.get('comp') === 'on',
        },
      })
      await refreshMe()
      setMsg('Perfil atualizado.')
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha')
    }
  }

  async function deleteAccount() {
    if (!window.confirm('Excluir conta (LGPD)? Esta ação não pode ser desfeita.')) return
    try {
      await api('/v1/auth/me', { method: 'DELETE' })
      clearTokens()
      logout()
      navigate('/')
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Falha ao excluir')
    }
  }

  async function tryWebPush() {
    try {
      const { publicKey } = await api<{ publicKey: string }>('/v1/me/webpush/vapid-public-key')
      if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setMsg('Web Push indisponível neste navegador ou sem VAPID.')
        return
      }
      setMsg(`VAPID ok (${publicKey.slice(0, 12)}…). Subscribe completo exige service worker — registre preferência canalWebPush por enquanto.`)
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Web Push indisponível')
    }
  }

  return (
    <div className="container page-title">
      <h1>Minha conta</h1>
      <p>
        Olá, {user?.nome}. Papel: {user?.papel}.
      </p>
      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="stack">
        <section className="panel">
          <h2>Perfil</h2>
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Nome</label>
              <input name="nome" defaultValue={user?.nome || ''} required />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Cidade</label>
                <input name="cidade" defaultValue={user?.cidade || ''} />
              </div>
              <div className="field" style={{ width: 80 }}>
                <label>UF</label>
                <input name="uf" defaultValue={user?.uf || ''} maxLength={2} />
              </div>
            </div>
            <label className="row">
              <input name="notif" type="checkbox" defaultChecked={!!user?.consentimentoNotificacoes} />{' '}
              Notificações
            </label>
            <label className="row" style={{ marginBottom: '1rem' }}>
              <input name="comp" type="checkbox" defaultChecked={!!user?.consentimentoComparativos} />{' '}
              Comparativos
            </label>
            <div className="row">
              <button className="btn btn-primary" type="submit">
                Salvar
              </button>
              <button className="btn btn-danger" type="button" onClick={deleteAccount}>
                Excluir conta
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Notificações</h2>
          {inbox.length === 0 ? (
            <p className="muted">Inbox vazia.</p>
          ) : (
            <ul>
              {inbox.map((n) => (
                <li key={n.id} style={{ marginBottom: '0.75rem' }}>
                  <strong>{n.titulo}</strong> {n.lida ? '' : '(nova)'}
                  <div className="muted">{n.corpo}</div>
                  {!n.lida && (
                    <button type="button" className="btn btn-ghost" onClick={() => markRead(n.id)}>
                      Marcar lida
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>Preferências de alerta</h2>
          {prefs && (
            <form onSubmit={savePrefs}>
              <label className="row">
                <input name="canalInApp" type="checkbox" defaultChecked={prefs.canalInApp} /> In-app
              </label>
              <label className="row">
                <input name="canalWebPush" type="checkbox" defaultChecked={prefs.canalWebPush} /> Web
                Push
              </label>
              <div className="field">
                <label>Máx. por semana</label>
                <input name="maxPorSemana" type="number" defaultValue={prefs.maxPorSemana} />
              </div>
              <div className="field">
                <label>Tipos de alerta</label>
                <input name="tiposAlerta" defaultValue={prefs.tiposAlerta || 'JANELA_COMPRA,EM_SAFRA'} />
              </div>
              <div className="row">
                <button className="btn btn-primary" type="submit">
                  Salvar preferências
                </button>
                <button className="btn btn-ghost" type="button" onClick={tryWebPush}>
                  Checar VAPID
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="panel">
          <h2>Listas de compra</h2>
          <ul>
            {lists.map((l) => (
              <li key={l.id}>
                {l.nome} <span className="muted">#{l.id}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={createList}>
            <div className="field">
              <label>Nome da lista</label>
              <input name="nome" required />
            </div>
            <div className="field">
              <label>IDs de produtos (vírgula)</label>
              <input
                name="produtos"
                placeholder={products
                  .slice(0, 3)
                  .map((p) => p.id)
                  .join(',')}
              />
            </div>
            <button className="btn btn-secondary" type="submit">
              Criar lista
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
