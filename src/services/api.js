import { lerSessao, limparSessao } from '../utils/sessao'

const definida = import.meta.env.VITE_API_URL
export const API_BASE = (definida == null || definida === ''
  ? 'http://localhost:8080'
  : String(definida)).replace(/\/$/, '')

export async function apiFetch(caminho, opcoes = {}) {
  const metodo = String(opcoes.method || 'GET').toUpperCase()
  const headers = new Headers(opcoes.headers || {})
  const corpoFormulario = typeof FormData !== 'undefined' && opcoes.body instanceof FormData

  if (!corpoFormulario && opcoes.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', headers.get('Accept') || 'application/json')

  const token = lerSessao().token
  if (token && !caminho.includes('/api/auth/login') && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${API_BASE}${caminho}`, {
    ...opcoes,
    method: metodo,
    headers,
  })
}

function mensagemDoCorpo(corpo, status) {
  if (!corpo || typeof corpo !== 'object') return `Erro ${status}`
  const detalhes = Array.isArray(corpo.detalhes) ? corpo.detalhes.filter(Boolean) : []
  const base = corpo.mensagem || corpo.erro || `Erro ${status}`
  return detalhes.length ? `${base} ${detalhes.join(' ')}` : base
}

export async function apiJson(caminho, opcoes = {}) {
  const response = await apiFetch(caminho, opcoes)
  if (response.status === 204) return null

  const texto = await response.text()
  let corpo = null
  if (texto) {
    try {
      corpo = JSON.parse(texto)
    } catch {
      corpo = { mensagem: texto }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !caminho.includes('/api/auth/login')) {
      limparSessao()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    const erro = new Error(mensagemDoCorpo(corpo, response.status))
    erro.status = response.status
    erro.corpo = corpo
    throw erro
  }

  return corpo
}

export async function apiArquivo(caminho) {
  const response = await apiFetch(caminho, {
    headers: { Accept: 'text/csv, application/json' },
  })
  if (!response.ok) {
    const texto = await response.text()
    let corpo = null
    if (texto) {
      try {
        corpo = JSON.parse(texto)
      } catch {
        corpo = { mensagem: texto }
      }
    }
    if (response.status === 401) {
      limparSessao()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    const erro = new Error(mensagemDoCorpo(corpo, response.status))
    erro.status = response.status
    throw erro
  }
  return response.blob()
}
