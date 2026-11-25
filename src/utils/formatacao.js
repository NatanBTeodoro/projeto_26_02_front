const ROTULOS_CLASSE = {
  ESTRELA: 'Estrela',
  VACA_LEITEIRA: 'Vaca leiteira',
  ENIGMA: 'Enigma',
  CAO: 'Cão',
  DADO_INCOMPLETO: 'Dado incompleto',
}

export const CORES_CLASSE = {
  ESTRELA: 'var(--cor-estrela)',
  VACA_LEITEIRA: 'var(--cor-vaca)',
  ENIGMA: 'var(--cor-enigma)',
  CAO: 'var(--cor-cao)',
  DADO_INCOMPLETO: 'var(--cor-incompleto)',
}

export const LEGENDAS_CLASSE = [
  ['ESTRELA', 'Popular e com lucro alto. É o item que sustenta o cardápio.'],
  ['VACA_LEITEIRA', 'Popular, mas com lucro baixo. Vende bem e rende pouco.'],
  ['ENIGMA', 'Pouco popular e com lucro alto. Rende bem e sai pouco.'],
  ['CAO', 'Pouco popular e com lucro baixo. Sai pouco e rende pouco.'],
  ['DADO_INCOMPLETO', 'Sem custo cadastrado. Fica de fora da classificação até o custo ser informado.'],
]

const ROTULOS_PERFIL = {
  TI: 'TI',
  ADMINISTRADOR: 'Admin',
  GESTOR: 'Gestor',
  USUARIO: 'Usuário',
}

const ROTULOS_STATUS = {
  ATIVO: 'Ativo',
  PAGO: 'Pago',
  INATIVO: 'Inativo',
  FECHADO: 'Fechado',
  ESTORNADO: 'Estornado',
  CANCELADO: 'Cancelado',
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDA: 'Resolvida',
  PENDENTE: 'Pendente',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  FALHOU: 'Falhou',
  PROCESSANDO: 'Processando',
  CONCLUIDA_COM_ERROS: 'Concluída com erros',
  CAO_RECORRENTE: 'Cão recorrente',
  PONDERADA: 'Média ponderada',
  SIMPLES: 'Média simples',
  DIA: 'Dia',
  MES: 'Mês',
  TRIMESTRE: 'Trimestre',
  ANO: 'Ano',
}

export function normalizarBusca(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor)
  return `${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor)
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarNumero(valor, casas = 2) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor)
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

export function formatarDataHora(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function formatarHora(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export function varianteStatus(status) {
  if (status === 'ATIVO' || status === 'PAGO') return 'sucesso'
  if (status === 'CANCELADO') return 'erro'
  if (status === 'ESTORNADO') return 'incompleto'
  return 'neutro'
}

export function totalPedido(pedido) {
  return (pedido?.itens || []).reduce(
    (soma, item) => soma + Number(item.precoUnitario || 0) * Number(item.quantidade || 0),
    0,
  )
}

export function formatarBooleano(valor) {
  if (valor === true) return 'Sim'
  if (valor === false) return 'Não'
  return '—'
}

const ROTULOS_FUNCAO = {
  EQUIPE_LER: 'Ver equipe',
  EQUIPE_USUARIO_GERIR: 'Gerir usuários',
  EQUIPE_GESTOR_GERIR: 'Gerir gestores',
  EQUIPE_SENHA_REDEFINIR: 'Redefinir senha',
  EQUIPE_FUNCAO_ATRIBUIR: 'Atribuir função',
  CARDAPIO_LER: 'Ver cardápio',
  CARDAPIO_ESCREVER: 'Editar cardápio',
  CUSTO_LER: 'Ver custo',
  COMANDA_LER: 'Ver comandas',
  COMANDA_ABRIR: 'Abrir comanda',
  COMANDA_FECHAR: 'Fechar comanda',
  PEDIDO_LER: 'Ver pedidos',
  PEDIDO_LANCAR: 'Lançar pedido',
  PEDIDO_EDITAR: 'Editar pedido',
  PEDIDO_CANCELAR: 'Cancelar pedido',
  PEDIDO_ESTORNAR: 'Estornar pedido',
  PEDIDO_ESTORNAR_PAGO: 'Estornar pedido pago',
  ANALISE_VER_OPERACIONAL: 'Ver análise operacional',
  ANALISE_VER_FINANCEIRO: 'Ver análise financeira',
  CATALOGO_FUNCOES_GERIR: 'Gerir catálogo de funções',
  RECLAMACAO_ABRIR: 'Abrir reclamação',
  RECLAMACAO_LER: 'Ver reclamações',
  RECLAMACAO_RESPONDER: 'Responder reclamação',
  AUDITORIA_VER: 'Ver auditoria',
  PLATAFORMA_TI_GERIR: 'Gerir contas de TI',
  PLATAFORMA_ADMIN_GERIR: 'Gerir administradores',
}

const GRUPOS_FUNCAO = [
  ['Equipe', ['EQUIPE_LER', 'EQUIPE_USUARIO_GERIR', 'EQUIPE_GESTOR_GERIR', 'EQUIPE_SENHA_REDEFINIR', 'EQUIPE_FUNCAO_ATRIBUIR']],
  ['Cardápio', ['CARDAPIO_LER', 'CARDAPIO_ESCREVER', 'CUSTO_LER']],
  ['Comanda', ['COMANDA_LER', 'COMANDA_ABRIR', 'COMANDA_FECHAR']],
  ['Pedido', ['PEDIDO_LER', 'PEDIDO_LANCAR', 'PEDIDO_EDITAR', 'PEDIDO_CANCELAR', 'PEDIDO_ESTORNAR', 'PEDIDO_ESTORNAR_PAGO']],
  ['Análise', ['ANALISE_VER_OPERACIONAL', 'ANALISE_VER_FINANCEIRO']],
  ['Reclamação', ['RECLAMACAO_ABRIR', 'RECLAMACAO_LER', 'RECLAMACAO_RESPONDER']],
  ['Rede', ['CATALOGO_FUNCOES_GERIR', 'AUDITORIA_VER', 'PLATAFORMA_TI_GERIR', 'PLATAFORMA_ADMIN_GERIR']],
]

export function rotuloFuncao(authority) {
  return ROTULOS_FUNCAO[authority] || authority || '—'
}

export function agruparFuncoes(authorities) {
  const restantes = new Set(authorities || [])
  const grupos = GRUPOS_FUNCAO.map(([titulo, itens]) => {
    const presentes = itens.filter((item) => restantes.has(item))
    presentes.forEach((item) => restantes.delete(item))
    return [titulo, presentes]
  }).filter(([, itens]) => itens.length > 0)
  if (restantes.size > 0) grupos.push(['Outras', [...restantes]])
  return grupos
}

export function rotuloClasse(classe) {
  return ROTULOS_CLASSE[classe] || classe || '—'
}

export function rotuloPerfil(perfil) {
  return ROTULOS_PERFIL[perfil] || perfil || '—'
}

export function rotuloStatus(status) {
  return ROTULOS_STATUS[status] || status || '—'
}

export function textoResposta(item) {
  const quem = item?.destino === 'ADMINISTRADOR' ? 'administrador' : 'TI'
  if (item?.resposta) return `Resposta do ${quem}: ${item.resposta}`
  return `Sem resposta do ${quem}.`
}

export function paraInstantLocal(valorDatetimeLocal) {
  if (!valorDatetimeLocal) return null
  const data = new Date(valorDatetimeLocal)
  if (Number.isNaN(data.getTime())) return null
  return data.toISOString()
}

function paraInputLocal(data) {
  const deslocamento = data.getTimezoneOffset()
  const local = new Date(data.getTime() - deslocamento * 60000)
  return local.toISOString().slice(0, 16)
}

export function periodoMesAtual() {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0)
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 0)
  return { inicio: paraInputLocal(inicio), fim: paraInputLocal(fim) }
}

export const DICA_SENHA = 'Mínimo de 6 caracteres, com uma letra maiúscula, um número e um caractere especial.'

export function validarSenha(senha) {
  const texto = senha || ''
  const ok = texto.length >= 6
    && texto.length <= 72
    && /\p{Lu}/u.test(texto)
    && /\p{Nd}/u.test(texto)
    && /[^\p{L}\p{N}]/u.test(texto)
  if (!ok) {
    return 'A senha precisa ter de 6 a 72 caracteres, com uma letra maiúscula, um número e um caractere especial.'
  }
  return ''
}

export function numeroOuNulo(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isNaN(numero) ? null : numero
}
