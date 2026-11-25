import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { lerSessao } from '../../../utils/sessao'
import { formatarBooleano, rotuloPerfil, validarSenha, DICA_SENHA } from '../../../utils/formatacao'

const perfis = [
  { valor: 'GESTOR', rotulo: 'Gestor' },
  { valor: 'ADMINISTRADOR', rotulo: 'Administrador' },
]

function Usuarios() {
  const sessao = lerSessao()
  const [usuarios, setUsuarios] = useState([])
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState('GESTOR')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function carregar() {
    setUsuarios(await apiJson(endpoints.usuarios))
  }

  useEffect(() => {
    if (sessao.perfil !== 'ADMINISTRADOR') return
    carregar().catch((falha) => setErro(falha.message))
  }, [sessao.perfil])

  async function criar(evento) {
    evento.preventDefault()
    setErro('')
    const falhaSenha = validarSenha(senha)
    if (falhaSenha) {
      setErro(falhaSenha)
      return
    }
    try {
      await apiJson(endpoints.usuarios, {
        method: 'POST',
        body: JSON.stringify({ email, senha, perfil }),
      })
      setEmail('')
      setSenha('')
      setAviso('Usuário cadastrado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function atualizar(usuario, campos) {
    setErro('')
    try {
      await apiJson(endpoints.usuario(usuario.id), {
        method: 'PUT',
        body: JSON.stringify(campos),
      })
      setAviso('Usuário atualizado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  if (sessao.perfil !== 'ADMINISTRADOR') {
    return (
      <TemplateAutenticado rotaAtual="/usuarios">
        <div className="pagina">
          <CabecalhoPagina titulo="Usuários" />
          <MensagemErro texto="Acesso negado" />
        </div>
      </TemplateAutenticado>
    )
  }

  return (
    <TemplateAutenticado rotaAtual="/usuarios">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Usuários"
          descricao="O administrador redefine a senha. A resposta da API não devolve o hash."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        <form className="formulario pagina__painel" onSubmit={criar}>
          <FormField id="email" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} obrigatorio />
          <FormField id="senha" rotulo="Senha" tipo="password" valor={senha} onChange={setSenha} dica={DICA_SENHA} obrigatorio />
          <FormFieldSelect id="perfil" rotulo="Perfil" valor={perfil} onChange={setPerfil} opcoes={perfis} />
          <Botao texto="Cadastrar" tipo="submit" />
        </form>
        <Tabela
          linhas={usuarios}
          colunas={[
            { chave: 'email', rotulo: 'E-mail' },
            { chave: 'perfil', rotulo: 'Perfil', celula: (usuario) => rotuloPerfil(usuario.perfil) },
            { chave: 'ativo', rotulo: 'Ativo', celula: (usuario) => formatarBooleano(usuario.ativo) },
            {
              chave: 'acao',
              rotulo: '',
              papel: 'acoes',
              celula: (usuario) => (
                <>
                  <Botao
                    texto={usuario.perfil === 'ADMINISTRADOR' ? 'Tornar gestor' : 'Tornar administrador'}
                    variante="secundario"
                    onClick={() => atualizar(usuario, {
                      perfil: usuario.perfil === 'ADMINISTRADOR' ? 'GESTOR' : 'ADMINISTRADOR',
                    })}
                  />
                  <Botao
                    texto={usuario.ativo ? 'Inativar' : 'Reativar'}
                    variante="fantasma"
                    onClick={() => atualizar(usuario, { ativo: !usuario.ativo })}
                  />
                  <Botao
                    texto="Redefinir senha"
                    variante="fantasma"
                    onClick={() => {
                      const nova = window.prompt('Nova senha')
                      if (!nova) return
                      const falhaSenha = validarSenha(nova)
                      if (falhaSenha) {
                        setErro(falhaSenha)
                        return
                      }
                      atualizar(usuario, { senha: nova })
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </div>
    </TemplateAutenticado>
  )
}

export default Usuarios
