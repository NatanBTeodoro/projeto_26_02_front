const CHAVES = [
  'usuarioId',
  'usuarioNome',
  'usuarioEmail',
  'perfil',
  'token',
  'restauranteId',
  'restauranteNome',
  'restauranteStatus',
]

export function gravarSessao(usuario) {
  if (!usuario) return
  localStorage.setItem('usuarioId', usuario.id != null ? String(usuario.id) : '')
  localStorage.setItem('usuarioNome', usuario.nome || '')
  localStorage.setItem('usuarioEmail', usuario.email || '')
  localStorage.setItem('perfil', usuario.perfil || '')
  localStorage.setItem('token', usuario.token || '')
}

export function lerSessao() {
  return {
    usuarioId: localStorage.getItem('usuarioId') || '',
    usuarioNome: localStorage.getItem('usuarioNome') || '',
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

export function gravarVisao(restaurante) {
  localStorage.setItem('restauranteId', String(restaurante.id))
  localStorage.setItem('restauranteNome', restaurante.nome || '')
  localStorage.setItem('restauranteStatus', restaurante.status || '')
}

export function lerVisao() {
  return {
    restauranteId: localStorage.getItem('restauranteId') || '',
    restauranteNome: localStorage.getItem('restauranteNome') || '',
    restauranteStatus: localStorage.getItem('restauranteStatus') || '',
  }
}

export function limparVisao() {
  localStorage.removeItem('restauranteId')
  localStorage.removeItem('restauranteNome')
  localStorage.removeItem('restauranteStatus')
}

export function emVisaoGestor() {
  return lerSessao().perfil === 'ADMINISTRADOR' && Boolean(localStorage.getItem('restauranteId'))
}

export function visaoBloqueada() {
  return emVisaoGestor() && localStorage.getItem('restauranteStatus') !== 'ATIVO'
}

export function destinoInicial(perfil) {
  if (perfil === 'TI') return '/admins'
  return '/dashboard'
}
