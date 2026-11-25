import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { formatarBooleano, rotuloPerfil, rotuloStatus, validarSenha, DICA_SENHA } from '../../../utils/formatacao'
import { PainelFuncoes, podeAtribuir } from './FuncoesEquipe'

const perfis = [
  { valor: 'GESTOR', rotulo: 'Gestor' },
  { valor: 'USUARIO', rotulo: 'Usuário' },
]

function Cadastros() {
  const sessao = lerSessao()
  const gestor = sessao.perfil === 'GESTOR' || emVisaoGestor()
  const bloqueado = visaoBloqueada()
  const [restaurantes, setRestaurantes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [nomeRestaurante, setNomeRestaurante] = useState('')
  const [editandoRestaurante, setEditandoRestaurante] = useState(null)
  const [exclusao, setExclusao] = useState(null)
  const [restauranteId, setRestauranteId] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState(gestor ? 'USUARIO' : 'GESTOR')
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [minhasFuncoes, setMinhasFuncoes] = useState([])
  const [alvoFuncoes, setAlvoFuncoes] = useState(null)

  async function carregar() {
    const pedidos = [apiJson(gestor ? endpoints.usuarios : `${endpoints.usuarios}${restauranteId ? `?restauranteId=${restauranteId}` : ''}`)]
    if (!gestor) pedidos.unshift(apiJson(endpoints.restaurantes))
    const respostas = await Promise.all(pedidos)
    if (!gestor) {
      setRestaurantes(respostas[0])
      setUsuarios(respostas[1])
    } else {
      setUsuarios(respostas[0])
    }
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [restauranteId])

  useEffect(() => {
    apiJson(endpoints.funcoesMinhas)
      .then(setMinhasFuncoes)
      .catch(() => setMinhasFuncoes([]))
  }, [])

  async function salvarRestaurante(evento) {
    evento.preventDefault()
    setErro('')
    try {
      if (editandoRestaurante) {
        await apiJson(endpoints.restaurante(editandoRestaurante.id), {
          method: 'PUT',
          body: JSON.stringify({ nome: nomeRestaurante.trim() }),
        })
      } else {
        await apiJson(endpoints.restaurantes, {
          method: 'POST',
          body: JSON.stringify({ nome: nomeRestaurante.trim() }),
        })
      }
      setNomeRestaurante('')
      setEditandoRestaurante(null)
      setAviso(editandoRestaurante ? 'Restaurante atualizado.' : 'Restaurante cadastrado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function alternarRestaurante(restaurante) {
    setErro('')
    try {
      const caminho = restaurante.status === 'ATIVO'
        ? endpoints.inativarRestaurante(restaurante.id)
        : endpoints.reativarRestaurante(restaurante.id)
      await apiJson(caminho, { method: 'POST' })
      setAviso(restaurante.status === 'ATIVO'
        ? 'Restaurante inativado. Gestores e usuários dele também foram inativados.'
        : 'Restaurante reativado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function pedirExclusao(restaurante) {
    const confirma = window.confirm(`Confirmar a exclusão de ${restaurante.nome}?`)
    if (confirma) setExclusao(restaurante)
  }

  async function fechar(restaurante) {
    setErro('')
    try {
      await apiJson(endpoints.fecharRestaurante(restaurante.id), { method: 'POST' })
      setExclusao(null)
      setAviso('Informações mantidas. O restaurante fica fechado, some do Dashboard e a equipe foi inativada.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function apagar(restaurante) {
    setErro('')
    try {
      await apiJson(endpoints.restaurante(restaurante.id), { method: 'DELETE' })
      setExclusao(null)
      setAviso('Restaurante, gestores, usuários e os dados vinculados foram apagados.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function salvarUsuario(evento) {
    evento.preventDefault()
    if (bloqueado) return
    setErro('')
    if (!gestor && !editandoUsuario && !restauranteId) {
      setErro('Escolha o restaurante.')
      return
    }
    if (!editandoUsuario) {
      const falhaSenha = validarSenha(senha)
      if (falhaSenha) {
        setErro(falhaSenha)
        return
      }
    }
    const trocaPerfil = Boolean(editandoUsuario) && !gestor && perfil !== editandoUsuario.perfil
    if (trocaPerfil) {
      const confirma = window.confirm(
        `Alterar o perfil de ${nome.trim()} para ${rotuloPerfil(perfil)}? Depois disso, essa pessoa vê só as telas do novo perfil.`,
      )
      if (!confirma) return
    }
    try {
      if (editandoUsuario) {
        const corpo = { nome: nome.trim(), email: email.trim() }
        if (trocaPerfil) corpo.perfil = perfil
        await apiJson(endpoints.usuario(editandoUsuario.id), {
          method: 'PUT',
          body: JSON.stringify(corpo),
        })
      } else {
        await apiJson(endpoints.usuarios, {
          method: 'POST',
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            senha,
            perfil: gestor ? 'USUARIO' : perfil,
            restauranteId: gestor ? null : Number(restauranteId),
          }),
        })
      }
      setNome('')
      setEmail('')
      setSenha('')
      setEditandoUsuario(null)
      setAviso(editandoUsuario ? 'Cadastro atualizado.' : 'Cadastro criado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function editarUsuario(usuario) {
    setEditandoUsuario(usuario)
    setNome(usuario.nome || '')
    setEmail(usuario.email || '')
    setSenha('')
    setPerfil(usuario.perfil)
    setRestauranteId(usuario.restauranteId ? String(usuario.restauranteId) : restauranteId)
  }

  async function alternarUsuario(usuario) {
    setErro('')
    try {
      await apiJson(endpoints.usuario(usuario.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo: !usuario.ativo }),
      })
      setAviso(usuario.ativo ? 'Perfil inativado.' : 'Perfil reativado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function deletarUsuario(usuario) {
    const confirma = window.confirm(`Deletar ${usuario.nome}? Os pedidos dele continuam visíveis.`)
    if (!confirma) return
    setErro('')
    try {
      await apiJson(endpoints.usuario(usuario.id), { method: 'DELETE' })
      setAviso('Perfil deletado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function redefinirSenha(usuario) {
    const nova = window.prompt(`Nova senha de ${usuario.nome}`)
    if (!nova) return
    const falhaSenha = validarSenha(nova)
    if (falhaSenha) {
      setErro(falhaSenha)
      return
    }
    setErro('')
    try {
      await apiJson(endpoints.senhaUsuario(usuario.id), {
        method: 'POST',
        body: JSON.stringify({ senhaNova: nova }),
      })
      setAviso('Senha redefinida.')
    } catch (falha) {
      setErro(falha.message)
    }
  }

  const opcoesRestaurante = [
    { valor: '', rotulo: 'Todos' },
    ...restaurantes.map((restaurante) => ({
      valor: String(restaurante.id),
      rotulo: restaurante.status === 'FECHADO' ? `${restaurante.nome} (Fechado)` : restaurante.nome,
    })),
  ]

  const podeSenha = (usuario) => (
    sessao.perfil === 'ADMINISTRADOR' || (sessao.perfil === 'GESTOR' && usuario.perfil === 'USUARIO')
  )

  return (
    <TemplateAutenticado rotaAtual="/cadastros">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Cadastros"
          descricao={gestor
            ? 'Usuários do restaurante, com inativação, exclusão e troca de senha esquecida.'
            : 'Restaurantes, gestores e usuários. A exclusão de restaurante pede confirmação e a escolha do que fazer com os dados.'}
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        {bloqueado ? <p>Restaurante fechado ou inativo: os cadastros desta visão ficam bloqueados.</p> : null}

        {!gestor ? (
          <section className="pagina__painel">
            <h2>Restaurantes</h2>
            <form className="formulario" onSubmit={salvarRestaurante}>
              <FormField
                id="nome-restaurante"
                rotulo="Nome"
                valor={nomeRestaurante}
                onChange={setNomeRestaurante}
                obrigatorio
              />
              <div className="formulario__acoes">
                <Botao texto={editandoRestaurante ? 'Salvar restaurante' : 'Cadastrar restaurante'} tipo="submit" />
                {editandoRestaurante ? (
                  <Botao texto="Cancelar" variante="fantasma" onClick={() => { setEditandoRestaurante(null); setNomeRestaurante('') }} />
                ) : null}
              </div>
            </form>
            {exclusao ? (
              <div className="recorte">
                <p>O que fazer com as informações de {exclusao.nome}?</p>
                {exclusao.status !== 'FECHADO' ? (
                  <Botao texto="Manter informações" variante="secundario" onClick={() => fechar(exclusao)} />
                ) : null}
                <Botao texto="Apagar tudo" variante="perigo" onClick={() => apagar(exclusao)} />
                <Botao texto="Cancelar" variante="fantasma" onClick={() => setExclusao(null)} />
              </div>
            ) : null}
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Situação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {restaurantes.map((restaurante) => (
                  <tr key={restaurante.id}>
                    <td>
                      {restaurante.nome}
                      {restaurante.status === 'FECHADO' ? ' (Fechado)' : ''}
                    </td>
                    <td>{rotuloStatus(restaurante.status)}</td>
                    <td>
                      {restaurante.status !== 'FECHADO' ? (
                        <Botao
                          texto="Editar"
                          variante="secundario"
                          onClick={() => {
                            setEditandoRestaurante(restaurante)
                            setNomeRestaurante(restaurante.nome)
                          }}
                        />
                      ) : null}
                      {restaurante.status === 'ATIVO' ? (
                        <Botao texto="Inativar" variante="fantasma" onClick={() => alternarRestaurante(restaurante)} />
                      ) : null}
                      {restaurante.status === 'INATIVO' ? (
                        <Botao texto="Reativar" variante="fantasma" onClick={() => alternarRestaurante(restaurante)} />
                      ) : null}
                      <Botao texto="Deletar" variante="perigo" onClick={() => pedirExclusao(restaurante)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="pagina__painel">
          <h2>{gestor ? 'Usuários' : 'Gestores e usuários'}</h2>
          {!bloqueado ? (
            <form className="formulario" onSubmit={salvarUsuario}>
              {!gestor && !editandoUsuario ? (
                <>
                  <label htmlFor="restaurante-cadastro">Restaurante</label>
                  <Select
                    id="restaurante-cadastro"
                    valor={restauranteId}
                    onChange={setRestauranteId}
                    opcoes={opcoesRestaurante.filter((opcao) => opcao.valor !== '')}
                  />
                </>
              ) : null}
              <FormField id="nome-pessoa" rotulo="Nome" valor={nome} onChange={setNome} obrigatorio />
              <FormField id="email-pessoa" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} obrigatorio />
              {!editandoUsuario ? (
                <FormField id="senha-pessoa" rotulo="Senha" tipo="password" valor={senha} onChange={setSenha} dica={DICA_SENHA} obrigatorio />
              ) : null}
              {!gestor && (!editandoUsuario || String(editandoUsuario.id) !== String(sessao.usuarioId)) ? (
                <>
                  <label htmlFor="perfil">Perfil</label>
                  <Select id="perfil" valor={perfil} onChange={setPerfil} opcoes={perfis} />
                </>
              ) : null}
              <div className="formulario__acoes">
                <Botao texto={editandoUsuario ? 'Salvar' : 'Cadastrar'} tipo="submit" />
                {editandoUsuario ? (
                  <Botao texto="Cancelar" variante="fantasma" onClick={() => { setEditandoUsuario(null); setNome(''); setEmail(''); setSenha('') }} />
                ) : null}
              </div>
            </form>
          ) : null}
          {!gestor ? (
            <>
              <label htmlFor="filtro-restaurante">Filtrar restaurante</label>
              <Select id="filtro-restaurante" valor={restauranteId} onChange={setRestauranteId} opcoes={opcoesRestaurante} />
            </>
          ) : null}
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                {!gestor ? <th>Restaurante</th> : null}
                <th>Perfil</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  {!gestor ? <td>{usuario.restauranteNome}</td> : null}
                  <td>{rotuloPerfil(usuario.perfil)}</td>
                  <td>{formatarBooleano(usuario.ativo)}</td>
                  <td>
                    {!bloqueado ? (
                      <>
                        <Botao texto="Editar" variante="secundario" onClick={() => editarUsuario(usuario)} />
                        <Botao
                          texto={usuario.ativo ? 'Inativar' : 'Reativar'}
                          variante="fantasma"
                          onClick={() => alternarUsuario(usuario)}
                        />
                        <Botao texto="Deletar" variante="perigo" onClick={() => deletarUsuario(usuario)} />
                        {podeSenha(usuario) ? (
                          <Botao texto="Nova senha" variante="fantasma" onClick={() => redefinirSenha(usuario)} />
                        ) : null}
                        {podeAtribuir(minhasFuncoes) ? (
                          <Botao texto="Atribuir funções" variante="secundario" onClick={() => setAlvoFuncoes(usuario)} />
                        ) : null}
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alvoFuncoes ? (
            <PainelFuncoes
              usuario={alvoFuncoes}
              minhas={minhasFuncoes}
              gestor={gestor}
              onFechar={() => setAlvoFuncoes(null)}
            />
          ) : null}
        </section>
      </div>
    </TemplateAutenticado>
  )
}

export default Cadastros
