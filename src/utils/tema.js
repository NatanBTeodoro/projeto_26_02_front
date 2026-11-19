const CHAVE = 'tema'

export function temaSalvo() {
  const salvo = localStorage.getItem(CHAVE)
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  return ''
}

export function temaDoSistema() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro'
}

export function aplicarTema(tema, persistir = false) {
  document.documentElement.dataset.tema = tema
  if (persistir) localStorage.setItem(CHAVE, tema)
}

export function alternarTema() {
  const atual = document.documentElement.dataset.tema === 'claro' ? 'claro' : 'escuro'
  const proximo = atual === 'escuro' ? 'claro' : 'escuro'
  aplicarTema(proximo, true)
  return proximo
}
