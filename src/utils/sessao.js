const CHAVES = [
  'usuarioId',
  'usuarioNome',
  'usuarioEmail',
  'perfil',
  'token',
  'restauranteId',
  'restauranteNome',
  'restauranteStatus',
  'visaoFuncao',
]

const CHAVE_LEMBRAR = 'lembrarLogin'

function deposito(lembrar) {
  if (lembrar === true) return localStorage
  if (lembrar === false) return sessionStorage
  if (sessionStorage.getItem('token')) return sessionStorage
  return localStorage
}

function limparEm(storage) {
  CHAVES.forEach((chave) => storage.removeItem(chave))
}

function lerDe(storage) {
  return {
    usuarioId: storage.getItem('usuarioId') || '',
    usuarioNome: storage.getItem('usuarioNome') || '',
    usuarioEmail: storage.getItem('usuarioEmail') || '',
    perfil: storage.getItem('perfil') || '',
    token: storage.getItem('token') || '',
  }
}

export function lembrarLogin() {
  return localStorage.getItem(CHAVE_LEMBRAR) === '1'
}

export function gravarSessao(usuario, lembrar) {
  if (!usuario) return
  const destino = deposito(lembrar)
  limparEm(destino === localStorage ? sessionStorage : localStorage)
  destino.setItem('usuarioId', usuario.id != null ? String(usuario.id) : '')
  destino.setItem('usuarioNome', usuario.nome || '')
  destino.setItem('usuarioEmail', usuario.email || '')
  destino.setItem('perfil', usuario.perfil || '')
  destino.setItem('token', usuario.token || '')
  if (lembrar === true || lembrar === false) {
    localStorage.setItem(CHAVE_LEMBRAR, lembrar ? '1' : '0')
  }
}

export function lerSessao() {
  if (sessionStorage.getItem('token')) return lerDe(sessionStorage)
  return lerDe(localStorage)
}

export function autenticado() {
  return Boolean(lerSessao().token)
}

export function limparSessao() {
  limparEm(localStorage)
  limparEm(sessionStorage)
}

export function gravarVisao(restaurante) {
  const destino = deposito()
  destino.setItem('restauranteId', String(restaurante.id))
  destino.setItem('restauranteNome', restaurante.nome || '')
  destino.setItem('restauranteStatus', restaurante.status || '')
}

export function lerVisao() {
  const origem = deposito()
  return {
    restauranteId: origem.getItem('restauranteId') || '',
    restauranteNome: origem.getItem('restauranteNome') || '',
    restauranteStatus: origem.getItem('restauranteStatus') || '',
  }
}

export function limparVisao() {
  ;[localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem('restauranteId')
    storage.removeItem('restauranteNome')
    storage.removeItem('restauranteStatus')
  })
}

export function emVisaoGestor() {
  return lerSessao().perfil === 'ADMINISTRADOR' && Boolean(lerVisao().restauranteId)
}

export function visaoBloqueada() {
  return emVisaoGestor() && lerVisao().restauranteStatus !== 'ATIVO'
}

export function lerVisaoFuncao() {
  return deposito().getItem('visaoFuncao') || ''
}

export function gravarVisaoFuncao(nome) {
  deposito().setItem('visaoFuncao', nome || '')
}

export function destinoInicial(perfil) {
  if (perfil === 'TI') return '/admins'
  return '/dashboard'
}
