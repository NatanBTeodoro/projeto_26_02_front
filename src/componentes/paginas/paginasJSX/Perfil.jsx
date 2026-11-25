import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import AlternarTema from '../../atomos/atomosJSX/AlternarTema'
import Titulo from '../../atomos/atomosJSX/Titulo'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { gravarSessao, lerSessao } from '../../../utils/sessao'
import { validarSenha, DICA_SENHA } from '../../../utils/formatacao'

function textoEsquecimento(perfil) {
  if (perfil === 'GESTOR') return 'Se esqueceu a senha, só o admin pode alterá-la.'
  if (perfil === 'USUARIO') return 'Se esqueceu a senha, só o gestor pode alterá-la.'
  return 'A troca pede a senha atual.'
}

function Perfil() {
  const sessao = lerSessao()
  const [conta, setConta] = useState(null)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    apiJson(endpoints.eu)
      .then((corpo) => {
        setConta(corpo)
        gravarSessao({ ...lerSessao(), ...corpo, token: lerSessao().token })
      })
      .catch((falha) => setErro(falha.message))
  }, [])

  async function trocar(evento) {
    evento.preventDefault()
    setErro('')
    setAviso('')
    if (senhaNova !== confirmacao) {
      setErro('A confirmação não confere com a nova senha.')
      return
    }
    const falhaSenha = validarSenha(senhaNova)
    if (falhaSenha) {
      setErro(falhaSenha)
      return
    }
    try {
      await apiJson(endpoints.senha, {
        method: 'POST',
        body: JSON.stringify({ senhaAtual, senhaNova }),
      })
      setSenhaAtual('')
      setSenhaNova('')
      setConfirmacao('')
      setAviso('Senha alterada.')
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/perfil">
      <div className="pagina">
        <CabecalhoPagina titulo="Perfil" descricao={textoEsquecimento(sessao.perfil)} />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        <section className="pagina__painel">
          <p><strong>Nome</strong><br />{conta?.nome || '—'}</p>
          <p><strong>E-mail</strong><br />{conta?.email || sessao.usuarioEmail}</p>
          <div className="perfil__tema">
            <strong>Aparência</strong>
            <AlternarTema />
          </div>
        </section>
        <form className="formulario pagina__painel" onSubmit={trocar}>
          <Titulo nivel={2} texto="Trocar senha" />
          <FormField id="senha-atual" rotulo="Senha atual" tipo="password" valor={senhaAtual} onChange={setSenhaAtual} obrigatorio />
          <FormField id="senha-nova" rotulo="Nova senha" tipo="password" valor={senhaNova} onChange={setSenhaNova} dica={DICA_SENHA} obrigatorio />
          <FormField id="senha-confirma" rotulo="Confirmar nova senha" tipo="password" valor={confirmacao} onChange={setConfirmacao} obrigatorio />
          <Botao texto="Salvar senha" tipo="submit" />
        </form>
      </div>
    </TemplateAutenticado>
  )
}

export default Perfil
