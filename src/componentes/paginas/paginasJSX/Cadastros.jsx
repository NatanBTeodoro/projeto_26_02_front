import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Botao from '../../atomos/atomosJSX/Botao'
import Titulo from '../../atomos/atomosJSX/Titulo'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { useFuncoes } from '../../../utils/funcoes'
import { formatarBooleano, rotuloPerfil, rotuloStatus, validarSenha, DICA_SENHA } from '../../../utils/formatacao'
import { EscolhaFuncoes, PainelFuncoes, podeAtribuir } from './FuncoesEquipe'
import { cargosPara } from '../../../utils/cargos'

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
  const [alvoFuncoes, setAlvoFuncoes] = useState(null)
  const [cargosDisponiveis, setCargosDisponiveis] = useState([])
  const [cargosNovos, setCargosNovos] = useState([])
  const { tem, pronto, lista: minhasFuncoes } = useFuncoes()
  const podeUsuario = pronto && tem('EQUIPE_USUARIO_GERIR')
  const podeGestorFuncao = pronto && tem('EQUIPE_GESTOR_GERIR')
  const podeSenhaFuncao = pronto && tem('EQUIPE_SENHA_REDEFINIR')
  const podeAtribuirFuncoes = pronto && podeAtribuir(minhasFuncoes)

  function cargoPadrao(alvo) {
    const nome = alvo === 'GESTOR' ? 'Gerente' : 'Atendente'
    const padrao = cargosPara(cargosDisponiveis, alvo).find((cargo) => cargo.nome === nome)
    return padrao ? [padrao.id] : []
  }

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
    const alvo = gestor ? 'USUARIO' : perfil
    const permitidos = cargosPara(cargosDisponiveis, alvo)
    const ids = new Set(permitidos.map((cargo) => cargo.id))
    setCargosNovos((lista) => {
      const validos = lista.filter((id) => ids.has(id))
      if (validos.length > 0) return validos
      const nome = alvo === 'GESTOR' ? 'Gerente' : 'Atendente'
      const padrao = permitidos.find((cargo) => cargo.nome === nome)
      return padrao ? [padrao.id] : []
    })
  }, [perfil, cargosDisponiveis, gestor])

  useEffect(() => {
    if (!podeAtribuirFuncoes) return undefined
    let vivo = true
    apiJson(endpoints.cargosAtribuiveis)
      .then((lista) => { if (vivo) setCargosDisponiveis(lista) })
      .catch(() => { if (vivo) setCargosDisponiveis([]) })
    return () => { vivo = false }
  }, [podeAtribuirFuncoes])

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
    if (bloqueado || !podeSalvar) return
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
        const corpo = {
          nome: nome.trim(),
          email: email.trim(),
          senha,
          perfil: gestor ? 'USUARIO' : perfil,
          restauranteId: gestor ? null : Number(restauranteId),
        }
        if (podeAtribuirFuncoes && cargosNovos.length > 0) {
          corpo.cargos = cargosNovos
        }
        await apiJson(endpoints.usuarios, {
          method: 'POST',
          body: JSON.stringify(corpo),
        })
      }
      setNome('')
      setEmail('')
      setSenha('')
      setCargosNovos(cargoPadrao(gestor ? 'USUARIO' : perfil))
      setEditandoUsuario(null)
      setAlvoFuncoes(null)
      setAviso(editandoUsuario ? 'Cadastro atualizado.' : 'Cadastro criado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function cancelarEdicao() {
    setEditandoUsuario(null)
    setNome('')
    setEmail('')
    setSenha('')
    setCargosNovos(cargoPadrao(gestor ? 'USUARIO' : perfil))
    setAlvoFuncoes(null)
  }

  function editarUsuario(usuario) {
    setEditandoUsuario(usuario)
    setNome(usuario.nome || '')
    setEmail(usuario.email || '')
    setSenha('')
    setPerfil(usuario.perfil)
    setRestauranteId(usuario.restauranteId ? String(usuario.restauranteId) : restauranteId)
    setAlvoFuncoes(null)
  }

  async function alternarUsuario(usuario) {
    setErro('')
    try {
      const ativo = !usuario.ativo
      await apiJson(endpoints.usuario(usuario.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo }),
      })
      setEditandoUsuario((atual) => (
        atual && String(atual.id) === String(usuario.id) ? { ...atual, ativo } : atual
      ))
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
      if (editandoUsuario && String(editandoUsuario.id) === String(usuario.id)) cancelarEdicao()
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
  const opcoesPerfil = perfis.filter((opcao) => (opcao.valor === 'USUARIO' ? podeUsuario : podeGestorFuncao))

  function podeMexer(usuario) {
    if (!pronto || bloqueado) return false
    if (usuario.perfil === 'USUARIO') return podeUsuario
    if (usuario.perfil === 'GESTOR') return podeGestorFuncao
    return false
  }

  function podeAbrirEdicao(usuario) {
    if (bloqueado) return false
    return podeMexer(usuario)
      || (podeSenhaFuncao && podeSenha(usuario))
      || podeAtribuirFuncoes
  }

  const podeSalvar = editandoUsuario
    ? podeMexer(editandoUsuario)
    : (gestor ? podeUsuario : opcoesPerfil.length > 0)
  const mostraFormulario = !bloqueado && (editandoUsuario ? podeAbrirEdicao(editandoUsuario) : podeSalvar)

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
            <Titulo nivel={2} texto="Restaurantes" />
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
            <Tabela
              linhas={restaurantes}
              colunas={[
                { chave: 'nome', rotulo: 'Nome', celula: (restaurante) => `${restaurante.nome}${restaurante.status === 'FECHADO' ? ' (Fechado)' : ''}` },
                { chave: 'status', rotulo: 'Situação', celula: (restaurante) => rotuloStatus(restaurante.status) },
                {
                  chave: 'acao',
                  rotulo: '',
                  papel: 'acoes',
                  celula: (restaurante) => (
                    <>
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
                    </>
                  ),
                },
              ]}
            />
          </section>
        ) : null}

        <section className="pagina__painel">
          <Titulo nivel={2} texto={gestor ? 'Usuários' : 'Gestores e usuários'} />
          {mostraFormulario ? (
            <form className="formulario" onSubmit={salvarUsuario}>
              {!gestor && !editandoUsuario ? (
                <FormFieldSelect
                  id="restaurante-cadastro"
                  rotulo="Restaurante"
                  valor={restauranteId}
                  onChange={setRestauranteId}
                  opcoes={opcoesRestaurante.filter((opcao) => opcao.valor !== '')}
                />
              ) : null}
              <FormField id="nome-pessoa" rotulo="Nome" valor={nome} onChange={setNome} obrigatorio />
              <FormField id="email-pessoa" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} obrigatorio />
              {!editandoUsuario ? (
                <FormField id="senha-pessoa" rotulo="Senha" tipo="password" valor={senha} onChange={setSenha} dica={DICA_SENHA} obrigatorio />
              ) : null}
              {!gestor && (!editandoUsuario || String(editandoUsuario.id) !== String(sessao.usuarioId)) ? (
                <FormFieldSelect id="perfil" rotulo="Perfil" valor={perfil} onChange={setPerfil} opcoes={opcoesPerfil} />
              ) : null}
              {!editandoUsuario && podeAtribuirFuncoes ? (
                <EscolhaFuncoes
                  cargos={cargosPara(cargosDisponiveis, gestor ? 'USUARIO' : perfil)}
                  cargosMarcados={cargosNovos}
                  perfil={gestor ? 'USUARIO' : perfil}
                  onCargo={(id) => setCargosNovos((lista) => (lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]))}
                />
              ) : null}
              <div className="formulario__acoes">
                {podeSalvar ? <Botao texto={editandoUsuario ? 'Salvar' : 'Cadastrar'} tipo="submit" /> : null}
                {editandoUsuario && podeMexer(editandoUsuario) ? (
                  <Botao
                    texto={editandoUsuario.ativo ? 'Inativar' : 'Reativar'}
                    variante="fantasma"
                    onClick={() => alternarUsuario(editandoUsuario)}
                  />
                ) : null}
                {editandoUsuario && podeSenhaFuncao && podeSenha(editandoUsuario) ? (
                  <Botao texto="Nova senha" variante="fantasma" onClick={() => redefinirSenha(editandoUsuario)} />
                ) : null}
                {editandoUsuario && podeAtribuirFuncoes ? (
                  <Botao
                    texto={alvoFuncoes ? 'Ocultar funções' : 'Atribuir funções'}
                    variante="secundario"
                    onClick={() => setAlvoFuncoes(alvoFuncoes ? null : editandoUsuario)}
                  />
                ) : null}
                {editandoUsuario ? (
                  <Botao texto="Cancelar" variante="fantasma" onClick={cancelarEdicao} />
                ) : null}
              </div>
            </form>
          ) : null}
          {editandoUsuario && alvoFuncoes ? (
            <PainelFuncoes
              usuario={alvoFuncoes}
              minhas={minhasFuncoes}
              gestor={gestor}
              onFechar={() => setAlvoFuncoes(null)}
            />
          ) : null}
          {!gestor ? (
            <FormFieldSelect id="filtro-restaurante" rotulo="Filtrar restaurante" valor={restauranteId} onChange={setRestauranteId} opcoes={opcoesRestaurante} />
          ) : null}
          <Tabela
            linhas={usuarios}
            colunas={[
              { chave: 'nome', rotulo: 'Nome' },
              { chave: 'email', rotulo: 'E-mail' },
              ...(!gestor ? [{ chave: 'restaurante', rotulo: 'Restaurante', celula: (usuario) => usuario.restauranteNome }] : []),
              { chave: 'perfil', rotulo: 'Perfil', celula: (usuario) => rotuloPerfil(usuario.perfil) },
              { chave: 'ativo', rotulo: 'Ativo', celula: (usuario) => formatarBooleano(usuario.ativo) },
              {
                chave: 'acao',
                rotulo: '',
                papel: 'acoes',
                celula: (usuario) => (podeAbrirEdicao(usuario) ? (
                  <>
                    <Botao
                      texto={editandoUsuario && String(editandoUsuario.id) === String(usuario.id) ? 'Editando' : 'Editar'}
                      variante="secundario"
                      onClick={() => (
                        editandoUsuario && String(editandoUsuario.id) === String(usuario.id)
                          ? cancelarEdicao()
                          : editarUsuario(usuario)
                      )}
                    />
                    {podeMexer(usuario) ? <Botao texto="Deletar" variante="perigo" onClick={() => deletarUsuario(usuario)} /> : null}
                  </>
                ) : null),
              },
            ]}
          />
        </section>
      </div>
    </TemplateAutenticado>
  )
}

export default Cadastros
