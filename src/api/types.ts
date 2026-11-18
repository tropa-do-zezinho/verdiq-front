export type Papel = 'ADMIN' | 'COMERCIANTE' | 'CLIENTE'

export type User = {
  id: number
  nome: string
  email: string
  telefone?: string | null
  papel: Papel
  cidade?: string | null
  uf?: string | null
  consentimentoNotificacoes?: boolean
  consentimentoComparativos?: boolean
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInMinutes: number
  user: User
}

export type ApiErrorBody = {
  timestamp?: string
  code?: string
  message?: string
  details?: string[]
}

export type ProductListItem = {
  id: number
  nome: string
  categoria: string
  unidadeBase: string
  seloEpoca: string
  precoAtacado: number | null
  fontePreco: string | null
  producaoSpT: number | null
  producaoAno: number | null
  fonteProducao: string | null
}

export type ProductDetail = {
  id: number
  nome: string
  categoria: string
  unidadeBase: string
  sinonimos: string[]
  seloEpoca: string
  precoAtualAtacado: number | null
  precoAtualData: string | null
  fontePreco: string | null
  producao: Array<{ ano: number; uf: string; producaoT: number; fonte: string }>
  aviso: string
  seriePrecos: Array<{ data: string; precoMedio: number; volumeKg?: number; fonte: string }>
  calendario12Meses: Array<{
    mes: number
    mesNome: string
    indicePreco: number
    confianca: string
    selo: string
  }>
  substitutos: Array<{ id: number; nome: string }>
}

export type SeasonsNow = {
  uf: string
  mes: number
  emSafra: Array<Record<string, unknown>>
  precoAcimaDoNormal: Array<Record<string, unknown>>
  atualizadoEm: string
}

export type Oferta = {
  id: number
  comercianteId: number
  produtoId: number
  precoNormal: number
  precoPromocional: number
  quantidadeKg?: number | null
  inicio?: string | null
  fim: string
  status: string
  ultimaChance?: boolean
  loteInfo?: string | null
  criadoEm?: string
}

export type Plano = {
  id: number
  codigo: string
  nome: string
  precoMensal: number
  beneficios: string
  ativo: boolean
}

export type Notificacao = {
  id: number
  usuarioId: number
  titulo: string
  corpo: string
  tipo: string
  lida: boolean
  criadoEm: string
}

export type PreferenciaNotificacao = {
  id?: number
  usuarioId?: number
  canalWebPush: boolean
  canalInApp: boolean
  maxPorSemana: number
  horaInicio?: string
  horaFim?: string
  tiposAlerta?: string
}

export type EtlRun = {
  id: number
  fonte: string
  status: string
  iniciadoEm?: string
  finalizadoEm?: string
  registros?: number
  mensagem?: string
  autorUsuarioId?: number
}

export type Recomendacao = {
  id: number
  produtoId: number
  tipo: string
  titulo: string
  mensagem: string
  confianca: string
  fonte?: string
  geradoEm?: string
}

export type EventoSazonal = {
  id: number
  nome: string
  regraData: string
  mesTipico?: number | null
  descricao?: string | null
}
