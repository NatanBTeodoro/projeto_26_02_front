import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'

function FuncoesRede() {
  const [catalogo, setCatalogo] = useState([])
  const [minhas, setMinhas] = useState([])
  const [rotulo, setRotulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [marcadas, setMarcadas] = useState([])
  const [auditoria, setAuditoria] = useState([])
  const [cargos, setCargos] = useState([])
  const [nomeCargo, setNomeCargo] = useState('')
  const [erro, setErro] = useState('')

  async function carregar() {
    const [itens, funcoes, registros, listaCargos] = await Promise.all([
      apiJson(endpoints.funcoesRede),
      apiJson(endpoints.funcoesMinhas),
      apiJson(endpoints.auditoriaPermissoes),
      apiJson(endpoints.cargosRede),
    ])
    setCatalogo(itens)
    setMinhas(funcoes.filter((authority) => !authority.startsWith('PLATAFORMA_')))
    setAuditoria(registros)
    setCargos(listaCargos)
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  function alternar(authority) {
    setMarcadas((lista) => (lista.includes(authority) ? lista.filter((item) => item !== authority) : [...lista, authority]))
  }

  async function criar(evento) {
    evento.preventDefault()
    try {
      await apiJson(endpoints.funcoesRede, {
        method: 'POST',
        body: JSON.stringify({ rotulo, descricao, authorities: marcadas }),
      })
      setRotulo('')
      setDescricao('')
      setMarcadas([])
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function criarCargo(evento) {
    evento.preventDefault()
    try {
      await apiJson(endpoints.cargosRede, {
        method: 'POST',
        body: JSON.stringify({ nome: nomeCargo, descricao: '', authorities: marcadas }),
      })
      setNomeCargo('')
      setMarcadas([])
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function desativarCargo(cargo) {
    try {
      await apiJson(endpoints.cargoRede(cargo.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }
  async function desativar(item) {
    try {
      await apiJson(endpoints.funcaoRede(item.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/funcoes">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Funções da rede"
          descricao="O catálogo só oferece funções que a sua conta já possui."
        />
        <MensagemErro texto={erro} />
        <form onSubmit={criar}>
          <FormField id="rotulo-funcao" rotulo="Rótulo" valor={rotulo} onChange={setRotulo} obrigatorio />
          <FormField id="descricao-funcao" rotulo="Descrição" valor={descricao} onChange={setDescricao} />
          {minhas.map((authority) => (
            <label key={authority}>
              <input type="checkbox" checked={marcadas.includes(authority)} onChange={() => alternar(authority)} />
              {authority}
            </label>
          ))}
          <Botao texto="Criar função" tipo="submit" />
        </form>
        <h2>Cargos da rede</h2>
        <form onSubmit={criarCargo}>
          <FormField id="nome-cargo" rotulo="Nome do cargo" valor={nomeCargo} onChange={setNomeCargo} obrigatorio />
          <p>As funções marcadas acima entram no cargo.</p>
          <Botao texto="Criar cargo" tipo="submit" />
        </form>
        <table className="tabela">
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Funções</th>
              <th>Ativo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((cargo) => (
              <tr key={cargo.id}>
                <td>{cargo.nome}</td>
                <td>{(cargo.authorities || []).join(', ')}</td>
                <td>{cargo.ativo ? 'sim' : 'não'}</td>
                <td>
                  {cargo.ativo ? <Botao texto="Desativar" variante="fantasma" onClick={() => desativarCargo(cargo)} /> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="tabela">
          <thead>
            <tr>
              <th>Rótulo</th>
              <th>Função</th>
              <th>Descrição</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {catalogo.map((item) => (
              <tr key={item.id}>
                <td>{item.rotulo}</td>
                <td>{item.authority}</td>
                <td>{item.descricao}</td>
                <td>
                  <Botao texto="Desativar" variante="fantasma" onClick={() => desativar(item)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Auditoria de permissão</h2>
        <table className="tabela">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Quem</th>
              <th>Para quem</th>
              <th>Restaurante</th>
              <th>Função</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {auditoria.map((item) => (
              <tr key={item.id}>
                <td>{item.dataHora}</td>
                <td>{item.autorId}</td>
                <td>{item.alvoId}</td>
                <td>{item.restauranteId}</td>
                <td>{item.authority}</td>
                <td>{item.acao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TemplateAutenticado>
  )
}

export default FuncoesRede
