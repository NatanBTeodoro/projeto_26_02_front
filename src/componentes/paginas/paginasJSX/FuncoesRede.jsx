import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import ListaFuncoes from '../../moleculas/moleculasJSX/ListaFuncoes'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Titulo from '../../atomos/atomosJSX/Titulo'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { rotuloFuncao } from '../../../utils/formatacao'

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
        <form className="formulario pagina__painel" onSubmit={criar}>
          <FormField id="rotulo-funcao" rotulo="Rótulo" valor={rotulo} onChange={setRotulo} obrigatorio />
          <FormField id="descricao-funcao" rotulo="Descrição" valor={descricao} onChange={setDescricao} />
          <ListaFuncoes authorities={minhas} marcadas={marcadas} onAlternar={alternar} idPrefixo="catalogo" />
          <Botao texto="Criar função" tipo="submit" />
        </form>
        <Titulo nivel={2} texto="Cargos da rede" />
        <form onSubmit={criarCargo}>
          <FormField id="nome-cargo" rotulo="Nome do cargo" valor={nomeCargo} onChange={setNomeCargo} obrigatorio />
          <p>As funções marcadas acima entram no cargo.</p>
          <Botao texto="Criar cargo" tipo="submit" />
        </form>
        <Tabela
          linhas={cargos}
          vazio="Nenhum cargo cadastrado."
          colunas={[
            { chave: 'nome', rotulo: 'Cargo' },
            { chave: 'authorities', rotulo: 'Funções', papel: 'texto', celula: (cargo) => (cargo.authorities || []).map(rotuloFuncao).join(', ') },
            { chave: 'ativo', rotulo: 'Ativo', celula: (cargo) => (cargo.ativo ? 'sim' : 'não') },
            { chave: 'acao', rotulo: '', papel: 'acoes', celula: (cargo) => (cargo.ativo ? <Botao texto="Desativar" variante="fantasma" onClick={() => desativarCargo(cargo)} /> : null) },
          ]}
        />
        <Tabela
          linhas={catalogo}
          vazio="Nenhuma função no catálogo."
          colunas={[
            { chave: 'rotulo', rotulo: 'Rótulo' },
            { chave: 'authority', rotulo: 'Função', celula: (item) => rotuloFuncao(item.authority) },
            { chave: 'descricao', rotulo: 'Descrição', papel: 'texto' },
            { chave: 'acao', rotulo: '', papel: 'acoes', celula: (item) => <Botao texto="Desativar" variante="fantasma" onClick={() => desativar(item)} /> },
          ]}
        />
        <Titulo nivel={2} texto="Auditoria de permissão" />
        <Tabela
          linhas={auditoria}
          vazio="Nenhum registro de auditoria."
          colunas={[
            { chave: 'dataHora', rotulo: 'Quando' },
            { chave: 'autorId', rotulo: 'Quem' },
            { chave: 'alvoId', rotulo: 'Para quem' },
            { chave: 'restauranteId', rotulo: 'Restaurante' },
            { chave: 'authority', rotulo: 'Função', celula: (item) => rotuloFuncao(item.authority) },
            { chave: 'acao', rotulo: 'Ação' },
          ]}
        />
      </div>
    </TemplateAutenticado>
  )
}

export default FuncoesRede
