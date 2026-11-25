import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Titulo from '../../atomos/atomosJSX/Titulo'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarBooleano, rotuloStatus, validarSenha, DICA_SENHA } from '../../../utils/formatacao'
import { lerSessao } from '../../../utils/sessao'

function Admins() {
  const sessao = lerSessao()
  const [admins, setAdmins] = useState([])
  const [equipe, setEquipe] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeTi, setNomeTi] = useState('')
  const [emailTi, setEmailTi] = useState('')
  const [senhaTi, setSenhaTi] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function carregar() {
    const [listaAdmins, listaEquipe] = await Promise.all([
      apiJson(endpoints.admins),
      apiJson(endpoints.usuariosTi),
    ])
    setAdmins(listaAdmins)
    setEquipe(listaEquipe)
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  async function criar(evento) {
    evento.preventDefault()
    setErro('')
    const falhaSenha = validarSenha(senha)
    if (falhaSenha) {
      setErro(falhaSenha)
      return
    }
    try {
      await apiJson(endpoints.admins, {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha }),
      })
      setNome('')
      setEmail('')
      setSenha('')
      setAviso('Administrador cadastrado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function alternar(admin) {
    setErro('')
    try {
      await apiJson(admin.ativo ? endpoints.inativarAdmin(admin.id) : endpoints.reativarAdmin(admin.id), {
        method: 'POST',
      })
      setAviso(admin.ativo
        ? 'Administrador inativado. Gestores, usuários e restaurantes vinculados também foram inativados.'
        : 'Administrador reativado. Quem tinha sido inativado junto com ele voltou.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function criarTi(evento) {
    evento.preventDefault()
    setErro('')
    const falhaSenha = validarSenha(senhaTi)
    if (falhaSenha) {
      setErro(falhaSenha)
      return
    }
    try {
      await apiJson(endpoints.usuariosTi, {
        method: 'POST',
        body: JSON.stringify({ nome: nomeTi, email: emailTi, senha: senhaTi }),
      })
      setNomeTi('')
      setEmailTi('')
      setSenhaTi('')
      setAviso('Usuário de TI cadastrado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function removerTi(usuario) {
    const confirma = window.confirm(`Remover ${usuario.nome} da equipe de TI?`)
    if (!confirma) return
    setErro('')
    try {
      await apiJson(endpoints.usuarioTi(usuario.id), { method: 'DELETE' })
      setAviso('Usuário de TI removido.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function deletar(admin) {
    const confirma = window.confirm(
      `Deletar ${admin.nome}? Restaurantes, gestores, usuários e todos os dados vinculados serão apagados.`,
    )
    if (!confirma) return
    setErro('')
    try {
      await apiJson(endpoints.admin(admin.id), { method: 'DELETE' })
      setAviso('Administrador e os dados vinculados foram deletados.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/admins">
      <div className="pagina">
        <CabecalhoPagina
          titulo="TI"
          descricao="Cadastro da equipe de TI e das contas de administrador, com os restaurantes de cada uma."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        <section className="pagina__painel">
          <Titulo nivel={2} texto="Usuários TI" />
          <form className="formulario" onSubmit={criarTi}>
            <FormField id="nome-ti" rotulo="Nome" valor={nomeTi} onChange={setNomeTi} obrigatorio />
            <FormField id="email-ti" rotulo="E-mail" tipo="email" valor={emailTi} onChange={setEmailTi} obrigatorio />
            <FormField id="senha-ti" rotulo="Senha" tipo="password" valor={senhaTi} onChange={setSenhaTi} dica={DICA_SENHA} obrigatorio />
            <Botao texto="Cadastrar usuário TI" tipo="submit" />
          </form>
          <Tabela
            linhas={equipe}
            colunas={[
              { chave: 'nome', rotulo: 'Nome' },
              { chave: 'email', rotulo: 'E-mail' },
              { chave: 'ativo', rotulo: 'Ativo', celula: (usuario) => formatarBooleano(usuario.ativo) },
              {
                chave: 'acao',
                rotulo: '',
                papel: 'acoes',
                celula: (usuario) => (
                  <>
                    {usuario.principal ? <span>Conta principal</span> : null}
                    {!usuario.principal && String(usuario.id) !== String(sessao.usuarioId) ? (
                      <Botao texto="Remover" variante="perigo" onClick={() => removerTi(usuario)} />
                    ) : null}
                  </>
                ),
              },
            ]}
          />
        </section>
        <section className="pagina__painel">
          <Titulo nivel={2} texto="Contas de administrador" />
          <form className="formulario" onSubmit={criar}>
            <FormField id="nome" rotulo="Nome" valor={nome} onChange={setNome} obrigatorio />
            <FormField id="email" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} obrigatorio />
            <FormField id="senha" rotulo="Senha" tipo="password" valor={senha} onChange={setSenha} dica={DICA_SENHA} obrigatorio />
            <Botao texto="Cadastrar administrador" tipo="submit" />
          </form>
          <Tabela
            linhas={admins}
            colunas={[
              { chave: 'nome', rotulo: 'Nome' },
              { chave: 'email', rotulo: 'E-mail' },
              { chave: 'ativo', rotulo: 'Ativo', celula: (admin) => formatarBooleano(admin.ativo) },
              {
                chave: 'restaurantes',
                rotulo: 'Restaurantes',
                celula: (admin) => (admin.restaurantes?.length
                  ? admin.restaurantes.map((restaurante) => (
                    <div key={restaurante.id}>
                      {restaurante.nome} ({rotuloStatus(restaurante.status)})
                    </div>
                  ))
                  : 'Nenhum'),
              },
              {
                chave: 'acao',
                rotulo: '',
                papel: 'acoes',
                celula: (admin) => (
                  <>
                    <Botao
                      texto={admin.ativo ? 'Inativar' : 'Reativar'}
                      variante="secundario"
                      onClick={() => alternar(admin)}
                    />
                    <Botao texto="Deletar" variante="perigo" onClick={() => deletar(admin)} />
                  </>
                ),
              },
            ]}
          />
        </section>
      </div>
    </TemplateAutenticado>
  )
}

export default Admins
