const CHAVES = ['usuarioId', 'usuarioEmail', 'perfil', 'token']

export function gravarSessao(usuario) {
  if (!usuario) return
  localStorage.setItem('usuarioId', usuario.id != null ? String(usuario.id) : '')
  localStorage.setItem('usuarioEmail', usuario.email || '')
  localStorage.setItem('perfil', usuario.perfil || '')
  localStorage.setItem('token', usuario.token || '')
}

export function lerSessao() {
  return {
    usuarioId: localStorage.getItem('usuarioId') || '',
    usuarioEmail: localStorage.getItem('usuarioEmail') || '',
    perfil: localStorage.getItem('perfil') || '',
    token: localStorage.getItem('token') || '',
  }
}

export function autenticado() {
  return Boolean(localStorage.getItem('token'))
}

export function limparSessao() {
  CHAVES.forEach((chave) => localStorage.removeItem(chave))
}
