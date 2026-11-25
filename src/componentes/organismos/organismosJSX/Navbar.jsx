// organismos/organismosJSX/Navbar.jsx
//
// USO: menu lateral de todas as telas autenticadas.
// NECESSIDADE: concentra os atalhos dos métodos e marca o que está fora do perfil.
//
// PROPS:
//   perfil     (string)
//   rotaAtual  (string)
//   onSair     (function)
//
// EXEMPLOS DE USO:
//   <Navbar perfil="GESTOR" rotaAtual="/produtos" onSair={sair} />

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../atomos/atomosJSX/Logo'
import Badge from '../../atomos/atomosJSX/Badge'
import Botao from '../../atomos/atomosJSX/Botao'
import NavItem from '../../moleculas/moleculasJSX/NavItem'
import { itemVisivel, menuDe } from '../../../utils/menu'
import { useFuncoes } from '../../../utils/funcoes'
import { emVisaoGestor, lerSessao, lerVisao } from '../../../utils/sessao'
import { rotuloPerfil } from '../../../utils/formatacao'
import { destinoVisao, visoesDoUsuario } from '../../../utils/cargos'
import '../organismosCSS/Navbar.css'

function Navbar({ perfil, rotaAtual, onSair }) {
  const [aberto, setAberto] = useState(false)
  const navigate = useNavigate()
  const sessao = lerSessao()
  const visao = lerVisao()
  const emVisao = emVisaoGestor()
  const { tem, pronto, visao: visaoFuncao, cargos, escolherVisao } = useFuncoes()
  const opcoesVisao = perfil === 'USUARIO' && !emVisao ? visoesDoUsuario(cargos) : []
  const secoes = menuDe(emVisao ? 'GESTOR' : perfil, [], pronto, visaoFuncao)
    .map((secao) => ({
      ...secao,
      itens: secao.itens.filter((item) => itemVisivel(item, pronto, tem)),
    }))
    .filter((secao) => secao.itens.length > 0)

  return (
    <>
      <button className="navbar__abrir" type="button" onClick={() => setAberto(true)}>
        Menu
      </button>
      {aberto ? <button className="navbar__velo" type="button" aria-label="Fechar menu" onClick={() => setAberto(false)} /> : null}
      <aside className={`navbar ${aberto ? 'navbar--aberto' : ''}`}>
        <div className="navbar__topo">
          <Logo compacto />
          <button className="navbar__fechar" type="button" onClick={() => setAberto(false)}>
            Fechar
          </button>
        </div>
        <p className="navbar__usuario">
          <span>{sessao.usuarioNome || sessao.usuarioEmail || 'Sessão local'}</span>
          <Badge texto={emVisao ? 'Admin · visão de gestor' : rotuloPerfil(perfil)} variante="marca" />
          {emVisao ? <span>{visao.restauranteNome}</span> : null}
          {opcoesVisao.length > 1 ? (
            <label className="navbar__visao">
              Visão
              <select
                value={opcoesVisao.includes(visaoFuncao) ? visaoFuncao : opcoesVisao[0]}
                onChange={(evento) => {
                  const nome = evento.target.value
                  escolherVisao(nome)
                  setAberto(false)
                  navigate(destinoVisao(nome))
                }}
              >
                {opcoesVisao.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </label>
          ) : null}
        </p>
        <nav className="navbar__menu">
          {secoes.map((secao) => (
            <div key={secao.titulo} className="navbar__secao">
              <p className="navbar__secao-titulo">{secao.titulo}</p>
              {secao.itens.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  texto={item.rotulo}
                  ativo={rotaAtual === item.href}
                  onClick={() => setAberto(false)}
                />
              ))}
            </div>
          ))}
        </nav>
        <div className="navbar__sair">
          <Botao texto="Sair" variante="fantasma" larguraTotal onClick={onSair} />
        </div>
      </aside>
    </>
  )
}

export default Navbar
