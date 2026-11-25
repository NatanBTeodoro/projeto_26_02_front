export const CARGOS_USUARIO = ['Atendente', 'Caixa', 'Estoquista']

const FUNCOES_USUARIO = [
  'COMANDA_LER',
  'COMANDA_ABRIR',
  'COMANDA_FECHAR',
  'PEDIDO_LER',
  'PEDIDO_LANCAR',
  'PEDIDO_EDITAR',
  'PEDIDO_CANCELAR',
  'PEDIDO_ESTORNAR',
  'CARDAPIO_LER',
  'CARDAPIO_ESCREVER',
  'CUSTO_LER',
]

const FUNCOES_GESTOR = [
  'EQUIPE_LER',
  'EQUIPE_USUARIO_GERIR',
  'EQUIPE_SENHA_REDEFINIR',
  'EQUIPE_FUNCAO_ATRIBUIR',
  'CARDAPIO_LER',
  'CARDAPIO_ESCREVER',
  'CUSTO_LER',
  'COMANDA_LER',
  'COMANDA_ABRIR',
  'COMANDA_FECHAR',
  'PEDIDO_LER',
  'PEDIDO_LANCAR',
  'PEDIDO_EDITAR',
  'PEDIDO_CANCELAR',
  'PEDIDO_ESTORNAR',
  'PEDIDO_ESTORNAR_PAGO',
  'ANALISE_VER_OPERACIONAL',
  'ANALISE_VER_FINANCEIRO',
  'RECLAMACAO_ABRIR',
  'RECLAMACAO_LER',
  'RECLAMACAO_RESPONDER',
]

export function cargoCabe(perfil, nome) {
  if (perfil === 'USUARIO') return CARGOS_USUARIO.includes(nome)
  if (perfil === 'GESTOR') return Boolean(nome) && !CARGOS_USUARIO.includes(nome)
  return false
}

export function cargosPara(lista, perfil) {
  return (lista || []).filter((cargo) => cargoCabe(perfil, cargo.nome))
}

export function funcoesPara(lista, perfil) {
  const permitidas = perfil === 'USUARIO' ? FUNCOES_USUARIO : perfil === 'GESTOR' ? FUNCOES_GESTOR : []
  return (lista || []).filter((authority) => permitidas.includes(authority))
}

export function visoesDoUsuario(cargos) {
  return CARGOS_USUARIO.filter((nome) => (cargos || []).includes(nome))
}

export function visaoInicial(cargos, salva) {
  const opcoes = visoesDoUsuario(cargos)
  if (opcoes.length === 0) return 'Atendente'
  if (opcoes.includes(salva)) return salva
  if (opcoes.includes('Atendente')) return 'Atendente'
  return opcoes[0]
}

export function destinoVisao(visao) {
  if (visao === 'Caixa') return '/pedidos'
  if (visao === 'Estoquista') return '/produtos'
  return '/dashboard'
}
