import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarBooleano, rotuloStatus } from '../../../utils/formatacao'

function Admins() {
  const [admins, setAdmins] = useState([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function carregar() {
    setAdmins(await apiJson(endpoints.admins))
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  async function criar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      await apiJson(endpoints.admins, {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha }),
      })
      setNome('')
      setEmail('')
      setSenha('')
      setAviso('Admin cadastrado.')
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
        ? 'Admin inativado. Gestores, usuários e restaurantes vinculados também foram inativados.'
        : 'Admin reativado. Quem tinha sido inativado junto com ele voltou.')
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
      setAviso('Admin e os dados vinculados foram deletados.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/admins">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Admins"
          descricao="Cadastro, inativação e exclusão das contas de admin, com os restaurantes de cada uma."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        <form className="formulario pagina__painel" onSubmit={criar}>
          <FormField id="nome" rotulo="Nome" valor={nome} onChange={setNome} obrigatorio />
          <FormField id="email" rotulo="E-mail" tipo="email" valor={email} onChange={setEmail} obrigatorio />
          <FormField id="senha" rotulo="Senha" tipo="password" valor={senha} onChange={setSenha} obrigatorio />
          <Botao texto="Cadastrar admin" tipo="submit" />
        </form>
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Ativo</th>
              <th>Restaurantes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.nome}</td>
                <td>{admin.email}</td>
                <td>{formatarBooleano(admin.ativo)}</td>
                <td>
                  {admin.restaurantes?.length
                    ? admin.restaurantes.map((restaurante) => (
                      <div key={restaurante.id}>
                        {restaurante.nome} ({rotuloStatus(restaurante.status)})
                      </div>
                    ))
                    : 'Nenhum'}
                </td>
                <td>
                  <Botao
                    texto={admin.ativo ? 'Inativar' : 'Reativar'}
                    variante="secundario"
                    onClick={() => alternar(admin)}
                  />
                  <Botao texto="Deletar" variante="perigo" onClick={() => deletar(admin)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TemplateAutenticado>
  )
}

export default Admins
