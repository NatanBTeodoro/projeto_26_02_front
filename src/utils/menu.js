const MENUS = {
  TI: [
    {
      titulo: 'TI',
      itens: [
        { href: '/admins', rotulo: 'TI' },
        { href: '/reclamacoes', rotulo: 'Relatórios / Reclamações' },
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
        { href: '/cadastros', rotulo: 'Cadastros' },
        { href: '/funcoes', rotulo: 'Funções' },
        { href: '/suporte', rotulo: 'Suporte / Reclamações' },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
  GESTOR: [
    {
      titulo: 'Gestor',
      itens: [
        { href: '/dashboard', rotulo: 'Dashboard' },
        { href: '/produtos', rotulo: 'Produtos' },
        { href: '/pedidos', rotulo: 'Pedidos' },
        { href: '/cadastros', rotulo: 'Cadastros' },
        { href: '/suporte', rotulo: 'Suporte / Reclamações' },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
  USUARIO: [
    {
      titulo: 'Usuário',
      itens: [
        { href: '/dashboard', rotulo: 'Dashboard' },
        { href: '/pedidos', rotulo: 'Pedidos' },
        { href: '/cardapio', rotulo: 'Cardápio' },
        { href: '/perfil', rotulo: 'Perfil' },
      ],
    },
  ],
}

export function menuDe(perfil) {
  return MENUS[perfil] || []
}
