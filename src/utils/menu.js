const MENUS = {
  TI: [
    {
      titulo: 'TI',
      itens: [
        { href: '/admins', rotulo: 'TI' },
        { href: '/reclamacoes', rotulo: 'Relatórios / Reclamações', funcoes: ['RECLAMACAO_LER', 'RECLAMACAO_RESPONDER'] },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
  ADMINISTRADOR: [
    {
      titulo: 'Admin',
      itens: [
        { href: '/dashboard', rotulo: 'Dashboard' },
        { href: '/matriz', rotulo: 'Matriz' },
        { href: '/restaurantes', rotulo: 'Restaurantes' },
        { href: '/cadastros', rotulo: 'Cadastros', funcoes: ['EQUIPE_LER', 'EQUIPE_USUARIO_GERIR', 'EQUIPE_GESTOR_GERIR', 'EQUIPE_SENHA_REDEFINIR', 'EQUIPE_FUNCAO_ATRIBUIR'] },
        { href: '/funcoes', rotulo: 'Funções', funcoes: ['CATALOGO_FUNCOES_GERIR', 'AUDITORIA_VER'] },
        { href: '/suporte', rotulo: 'Suporte / Reclamações', funcoes: ['RECLAMACAO_ABRIR', 'RECLAMACAO_LER', 'RECLAMACAO_RESPONDER'] },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
  GESTOR: [
    {
      titulo: 'Gestor',
      itens: [
        { href: '/dashboard', rotulo: 'Dashboard', funcoes: ['ANALISE_VER_OPERACIONAL', 'ANALISE_VER_FINANCEIRO'] },
        { href: '/produtos', rotulo: 'Produtos', funcoes: ['CARDAPIO_LER', 'CARDAPIO_ESCREVER'] },
        { href: '/pedidos', rotulo: 'Pedidos', funcoes: ['PEDIDO_LER', 'PEDIDO_LANCAR', 'COMANDA_LER', 'COMANDA_ABRIR', 'COMANDA_FECHAR'] },
        { href: '/cadastros', rotulo: 'Cadastros', funcoes: ['EQUIPE_LER', 'EQUIPE_USUARIO_GERIR', 'EQUIPE_GESTOR_GERIR', 'EQUIPE_SENHA_REDEFINIR', 'EQUIPE_FUNCAO_ATRIBUIR'] },
        { href: '/suporte', rotulo: 'Suporte / Reclamações', funcoes: ['RECLAMACAO_ABRIR', 'RECLAMACAO_LER', 'RECLAMACAO_RESPONDER'] },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
  USUARIO: [
    {
      titulo: 'Usuário',
      itens: [
        { href: '/dashboard', rotulo: 'Dashboard', funcoes: ['PEDIDO_LER'] },
        { href: '/pedidos', rotulo: 'Pedidos', funcoes: ['PEDIDO_LER', 'PEDIDO_LANCAR', 'COMANDA_LER', 'COMANDA_ABRIR'] },
        { href: '/cardapio', rotulo: 'Cardápio', funcoes: ['CARDAPIO_LER'] },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
}

export function menuDe(perfil) {
  return MENUS[perfil] || []
}
