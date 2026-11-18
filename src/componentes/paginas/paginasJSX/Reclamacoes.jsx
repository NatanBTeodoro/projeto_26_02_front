import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldTextarea from '../../moleculas/moleculasJSX/FormFieldTextarea'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import MensagemSucesso from '../../atomos/atomosJSX/MensagemSucesso'
import { apiBlob, apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarDataHora, rotuloStatus } from '../../../utils/formatacao'

const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'ABERTA', rotulo: 'Aberta' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'RESOLVIDA', rotulo: 'Resolvida' },
]

function consulta(status, de, ate) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (de) params.set('de', de)
  if (ate) params.set('ate', ate)
  const texto = params.toString()
  return texto ? `${endpoints.reclamacoes}?${texto}` : endpoints.reclamacoes
}

function Reclamacoes() {
  const [status, setStatus] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [lista, setLista] = useState([])
  const [rascunhos, setRascunhos] = useState({})
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregar(filtroStatus = status, filtroDe = de, filtroAte = ate) {
    const itens = await apiJson(consulta(filtroStatus, filtroDe, filtroAte))
    const mapa = {}
    itens.forEach((item) => {
      mapa[item.id] = { status: item.status, resposta: item.resposta || '' }
    })
    setLista(itens)
    setRascunhos(mapa)
  }

  useEffect(() => {
    carregar('', '', '').catch((falha) => setErro(falha.message))
  }, [])

  async function filtrar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    try {
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function limparFiltros() {
    setStatus('')
    setDe('')
    setAte('')
    setErro('')
    carregar('', '', '').catch((falha) => setErro(falha.message))
  }

  function alterar(id, campo, valor) {
    setRascunhos((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }))
  }

  async function salvar(item) {
    const rascunho = rascunhos[item.id]
    setErro('')
    setSucesso('')
    try {
      await apiJson(endpoints.reclamacao(item.id), {
        method: 'PUT',
        body: JSON.stringify({ status: rascunho.status, resposta: rascunho.resposta }),
      })
      setSucesso('Reclamação atualizada.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function baixar(item) {
    setErro('')
    try {
      const { blob, nome } = await apiBlob(endpoints.anexoReclamacao(item.id))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nome || item.anexoNome || 'anexo'
      link.click()
      URL.revokeObjectURL(url)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/reclamacoes">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Relatórios / Reclamações"
          descricao="Reclamações enviadas ao TI, da mais recente para a mais antiga."
        />
        <MensagemErro texto={erro} />
        <MensagemSucesso texto={sucesso} />
        <form className="formulario pagina__painel" onSubmit={filtrar}>
          <div className="formulario__linha">
            <div>
              <label htmlFor="filtro-status">Status</label>
              <Select id="filtro-status" valor={status} onChange={setStatus} opcoes={STATUS} />
            </div>
            <FormField id="filtro-de" rotulo="De" tipo="date" valor={de} onChange={setDe} />
            <FormField id="filtro-ate" rotulo="Até" tipo="date" valor={ate} onChange={setAte} />
          </div>
          <div className="formulario__acoes">
            <Botao texto="Filtrar" tipo="submit" />
            <Botao texto="Limpar" variante="fantasma" onClick={limparFiltros} />
          </div>
        </form>
        {lista.length === 0 ? <p>Nenhuma reclamação encontrada.</p> : null}
        {lista.map((item) => {
          const rascunho = rascunhos[item.id] || { status: item.status, resposta: item.resposta || '' }
          return (
            <article key={item.id} className="pagina__painel">
              <strong>{item.assunto}</strong>
              <p className="reclamacao__meta">
                <span>{item.autorNome}</span>
                <span>{item.autorEmail}</span>
                {item.restauranteNome ? <span>{item.restauranteNome}</span> : null}
                <span>{formatarDataHora(item.criadoEm)}</span>
                <span>{rotuloStatus(item.status)}</span>
              </p>
              <p>{item.descricao}</p>
              {item.anexoNome ? (
                <Botao texto={item.anexoNome} variante="fantasma" onClick={() => baixar(item)} />
              ) : null}
              <label htmlFor={`status-${item.id}`}>Status</label>
              <Select
                id={`status-${item.id}`}
                valor={rascunho.status}
                onChange={(valor) => alterar(item.id, 'status', valor)}
                opcoes={STATUS.filter((opcao) => opcao.valor)}
              />
              <FormFieldTextarea
                id={`resposta-${item.id}`}
                rotulo="Resposta ou observação"
                valor={rascunho.resposta}
                onChange={(valor) => alterar(item.id, 'resposta', valor)}
              />
              <Botao texto="Salvar" onClick={() => salvar(item)} />
            </article>
          )
        })}
      </div>
    </TemplateAutenticado>
  )
}

export default Reclamacoes
