import type { ApiErrorBody, TokenResponse } from './types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

const ACCESS_KEY = 'verdiq.access'
const REFRESH_KEY = 'verdiq.refresh'

export class ApiError extends Error {
  code: string
  details?: string[]
  status: number

  constructor(status: number, body: ApiErrorBody | string) {
    if (typeof body === 'string') {
      super(body)
      this.code = 'HTTP_ERROR'
    } else {
      super(body.message || 'Erro na API')
      this.code = body.code || 'API_ERROR'
      this.details = body.details
    }
    this.status = status
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  formData?: FormData
  raw?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = (await res.json()) as TokenResponse
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const auth = opts.auth !== false
  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let body: BodyInit | undefined
  if (opts.formData) {
    body = opts.formData
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: opts.method || (opts.body || opts.formData ? 'POST' : 'GET'),
      headers,
      body,
    })

  let res = await doFetch()
  if (res.status === 401 && auth && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => {
        refreshPromise = null
      })
    }
    const ok = await refreshPromise
    if (ok) {
      const token = getAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
      res = await doFetch()
    }
  }

  if (opts.raw) {
    if (!res.ok) {
      const text = await res.text()
      throw new ApiError(res.status, text || res.statusText)
    }
    return res as unknown as T
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) {
    throw new ApiError(res.status, (data as ApiErrorBody) || text)
  }
  return data as T
}

export function money(v: number | null | undefined) {
  if (v == null || Number.isNaN(Number(v))) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function tons(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toLocaleString('pt-BR')} t`
}

export function seloClass(selo?: string | null) {
  if (selo === 'EM_SAFRA') return 'badge badge-safra'
  if (selo === 'FORA_DE_EPOCA' || selo === 'PRECO_ALTO') return 'badge badge-fora'
  return 'badge badge-neutro'
}

export function seloLabel(selo?: string | null) {
  if (selo === 'EM_SAFRA') return 'Em safra'
  if (selo === 'FORA_DE_EPOCA') return 'Fora de época'
  if (selo === 'PRECO_ALTO') return 'Preço alto'
  return 'Neutro'
}
