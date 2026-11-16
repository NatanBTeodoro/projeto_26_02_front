// templates/templatesJSX/TemplateAutenticado.jsx
//
// USO: todas as rotas depois do login.
// NECESSIDADE: menu, conteúdo e rodapé no mesmo esqueleto para os quatro perfis.
//
// PROPS:
//   rotaAtual (string)
//   children  (node)
//
// EXEMPLOS DE USO:
//   <TemplateAutenticado rotaAtual="/produtos">{conteudo}</TemplateAutenticado>

import Navbar from '../../organismos/organismosJSX/Navbar'
import Footer from '../../organismos/organismosJSX/Footer'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, lerVisao, limparSessao, limparVisao } from '../../../utils/sessao'
import Botao from '../../atomos/atomosJSX/Botao'
import '../templatesCSS/TemplateAutenticado.css'

async function sair() {
  try {
    await apiJson(endpoints.logout, { method: 'POST' })
  } catch {
    /* sessão já encerrada: segue para o login */
  }
  limparSessao()
  window.location.href = '/login'
}

function sairDaVisao() {
  limparVisao()
  window.location.href = '/restaurantes'
}

function TemplateAutenticado({ rotaAtual, children }) {
  const sessao = lerSessao()
  const visao = lerVisao()

  return (
    <div className="template-autenticado">
      <Navbar perfil={sessao.perfil} rotaAtual={rotaAtual} onSair={sair} />
      <div className="template-autenticado__corpo">
        {emVisaoGestor() ? (
          <div className="visao-gestor">
            <span>
              Visão de gestor: {visao.restauranteNome}
              {visao.restauranteStatus === 'FECHADO' ? ' (Fechado)' : ''}
              {visao.restauranteStatus === 'INATIVO' ? ' (Inativo)' : ''}
            </span>
            <Botao texto="Voltar ao admin" variante="secundario" onClick={sairDaVisao} />
          </div>
        ) : null}
        <main className="template-autenticado__main">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

export default TemplateAutenticado
