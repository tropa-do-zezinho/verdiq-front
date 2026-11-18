import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError, setTokens } from '../api/client'
import type { TokenResponse } from '../api/types'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { refreshMe } = useAuth()
  const [papel, setPapel] = useState<'CLIENTE' | 'COMERCIANTE'>('CLIENTE')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const body: Record<string, unknown> = {
      nome: fd.get('nome'),
      email: fd.get('email'),
      senha: fd.get('senha'),
      papel,
      cidade: fd.get('cidade') || 'São Paulo',
      uf: fd.get('uf') || 'SP',
      consentimentoNotificacoes: fd.get('notif') === 'on',
      consentimentoComparativos: fd.get('comp') === 'on',
    }
    if (papel === 'COMERCIANTE') {
      body.merchant = {
        nomeFantasia: fd.get('nomeFantasia'),
        tipoNegocio: fd.get('tipoNegocio') || 'SACOLAO',
        pracaId: Number(fd.get('pracaId') || 1),
        produtosPrincipais: String(fd.get('produtos') || '1,3')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter(Boolean),
      }
    } else {
      body.client = {
        cidade: fd.get('cidade') || 'São Paulo',
        uf: fd.get('uf') || 'SP',
        produtosInteresse: String(fd.get('interesse') || '1,2,3')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter(Boolean),
      }
    }
    try {
      const data = await api<TokenResponse>('/v1/auth/register', {
        method: 'POST',
        body,
        auth: false,
      })
      setTokens(data.accessToken, data.refreshToken)
      await refreshMe()
      navigate(papel === 'COMERCIANTE' ? '/comerciante' : '/conta')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha no cadastro')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page-title" style={{ maxWidth: 560 }}>
      <h1>Cadastro</h1>
      <p>Crie conta de cliente ou comerciante.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="panel" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="papel">Perfil</label>
          <select
            id="papel"
            value={papel}
            onChange={(e) => setPapel(e.target.value as 'CLIENTE' | 'COMERCIANTE')}
          >
            <option value="CLIENTE">Cliente</option>
            <option value="COMERCIANTE">Comerciante</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" required />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="senha">Senha (mín. 8)</label>
          <input id="senha" name="senha" type="password" minLength={8} required />
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="cidade">Cidade</label>
            <input id="cidade" name="cidade" defaultValue="São Paulo" />
          </div>
          <div className="field" style={{ width: 80 }}>
            <label htmlFor="uf">UF</label>
            <input id="uf" name="uf" defaultValue="SP" maxLength={2} />
          </div>
        </div>
        {papel === 'COMERCIANTE' ? (
          <>
            <div className="field">
              <label htmlFor="nomeFantasia">Nome fantasia</label>
              <input id="nomeFantasia" name="nomeFantasia" required />
            </div>
            <div className="field">
              <label htmlFor="tipoNegocio">Tipo</label>
              <select id="tipoNegocio" name="tipoNegocio" defaultValue="SACOLAO">
                <option value="SACOLAO">Sacolão</option>
                <option value="FEIRA">Feira</option>
                <option value="HORTIFRUTI">Hortifruti</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pracaId">Praça (1=CEAGESP SP)</label>
              <input id="pracaId" name="pracaId" type="number" defaultValue={1} />
            </div>
            <div className="field">
              <label htmlFor="produtos">Produtos principais (ids)</label>
              <input id="produtos" name="produtos" defaultValue="1,3,4" />
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="interesse">Produtos de interesse (ids)</label>
            <input id="interesse" name="interesse" defaultValue="1,2,3" />
          </div>
        )}
        <label className="row">
          <input name="notif" type="checkbox" defaultChecked /> Consentimento notificações
        </label>
        <label className="row" style={{ marginBottom: '1rem' }}>
          <input name="comp" type="checkbox" defaultChecked /> Consentimento comparativos
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="muted">
        Já tem conta? <Link to="/entrar">Entrar</Link>
      </p>
    </div>
  )
}
