import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import GraficoMatriz from '../../organismos/organismosJSX/GraficoMatriz'
import GraficoCurvaAbc from '../../organismos/organismosJSX/GraficoCurvaAbc'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao } from '../../../utils/sessao'
import {
  CORES_CLASSE,
  formatarDataHora,
  formatarMoeda,
  formatarPercentual,
  LEGENDAS_CLASSE,
  rotuloClasse,
  rotuloStatus,
} from '../../../utils/formatacao'

const CLASSES = ['ESTRELA', 'VACA_LEITEIRA', 'ENIGMA', 'CAO', 'DADO_INCOMPLETO']

function iso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function inicioPadrao() {
  const hoje = new Date()
  return iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29))
}

function Periodo({ de, ate, setDe, setAte, onSubmit, children }) {
  return (
    <form className="formulario pagina__painel" onSubmit={onSubmit}>
      <div className="formulario__linha">
        <FormField id="de" rotulo="De" tipo="date" valor={de} onChange={setDe} obrigatorio />
        <FormField id="ate" rotulo="Até" tipo="date" valor={ate} onChange={setAte} obrigatorio />
      </div>
      {children}
      <Botao texto="Atualizar" tipo="submit" />
    </form>
  )
}

function TabelaCurva({ curva, mostrarFaixas }) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Lucro</th>
            <th>Participação</th>
            <th>Acumulado</th>
            {mostrarFaixas ? <th>Faixa</th> : null}
          </tr>
        </thead>
        <tbody>
          {(curva?.itens || []).map((item) => (
            <tr key={item.id}>
              <td>
                {item.nome}
                {item.dadoIncompleto ? ' (dado incompleto)' : ''}
              </td>
              <td>{formatarMoeda(item.lucro)}</td>
              <td>{formatarPercentual(item.participacao)}</td>
              <td>{formatarPercentual(item.acumulado)}</td>
              {mostrarFaixas ? <td>{item.faixa}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardAdmin() {
  const [de, setDe] = useState(inicioPadrao)
  const [ate, setAte] = useState(iso(new Date()))
  const [modelos, setModelos] = useState([])
  const [modelo, setModelo] = useState('CURVA_ABC')
  const [curva, setCurva] = useState(null)
  const [mostrarFaixas, setMostrarFaixas] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiJson(endpoints.modelosAnaliticos)
      .then((lista) => {
        setModelos(lista)
        if (lista[0]?.codigo) setModelo(lista[0].codigo)
      })
      .catch((falha) => setErro(falha.message))
  }, [])

  async function consultar(evento) {
    evento.preventDefault()
    setErro('')
    if (modelo !== 'CURVA_ABC') {
      setCurva(null)
      setErro('Este modelo ainda não está disponível.')
      return
    }
    try {
      setCurva(await apiJson(`${endpoints.curvaRestaurantes}?de=${de}&ate=${ate}`))
    } catch (falha) {
      setCurva(null)
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/dashboard">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Dashboard"
          descricao="Lucro bruto dos restaurantes ativos no período e a Curva ABC de lucro por restaurante."
        />
        <MensagemErro texto={erro} />
        <Periodo de={de} ate={ate} setDe={setDe} setAte={setAte} onSubmit={consultar}>
          <label htmlFor="modelo">Modelo analítico</label>
          <Select
            id="modelo"
            valor={modelo}
            onChange={setModelo}
            opcoes={(modelos.length ? modelos : [{ codigo: 'CURVA_ABC', nome: 'Curva ABC (Pareto)' }])
              .map((item) => ({ valor: item.codigo, rotulo: item.nome }))}
          />
          <label>
            <input
              type="checkbox"
              checked={mostrarFaixas}
              onChange={(evento) => setMostrarFaixas(evento.target.checked)}
            />
            {' '}Mostrar faixas A, B e C
          </label>
        </Periodo>
        {curva ? (
          <>
            <section className="pagina__painel cartao">
              <span>Lucro bruto</span>
              <strong>{formatarMoeda(curva.lucroBruto)}</strong>
            </section>
            {curva.linhasSemCusto > 0 ? (
              <p>
                {curva.linhasSemCusto} item(ns) sem custo ficaram fora do lucro e estão marcados como dado incompleto.
                {curva.foraDaCurva?.length ? ` Fora da curva: ${curva.foraDaCurva.join(', ')}.` : ''}
              </p>
            ) : null}
            <section className="pagina__painel">
              <h2>Curva ABC por restaurante</h2>
              <GraficoCurvaAbc itens={curva.itens} mostrarFaixas={mostrarFaixas} />
              <TabelaCurva curva={curva} mostrarFaixas={mostrarFaixas} />
            </section>
          </>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

function DashboardGestor() {
  const [de, setDe] = useState(inicioPadrao)
  const [ate, setAte] = useState(iso(new Date()))
  const [painel, setPainel] = useState(null)
  const [matriz, setMatriz] = useState(null)
  const [erro, setErro] = useState('')

  async function consultar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      const [corpoPainel, corpoMatriz] = await Promise.all([
        apiJson(`${endpoints.dashboard}?de=${de}&ate=${ate}`),
        apiJson(`${endpoints.analise}?de=${de}&ate=${ate}`),
      ])
      setPainel(corpoPainel)
      setMatriz(corpoMatriz)
    } catch (falha) {
      setPainel(null)
      setMatriz(null)
      setErro(falha.message)
    }
  }

  const serie = (painel?.faturamentoPorDia || []).map((ponto) => ({
    data: `${String(ponto.data).slice(8, 10)}/${String(ponto.data).slice(5, 7)}`,
    valor: Number(ponto.valor),
  }))
  const barras = CLASSES.map((classe) => ({
    classe,
    rotulo: rotuloClasse(classe),
    quantidade: Number(painel?.itensPorClasse?.[classe] ?? 0),
  }))

  return (
    <TemplateAutenticado rotaAtual="/dashboard">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Dashboard"
          descricao="Resumo do restaurante no período e a matriz de Kasavana & Smith."
        />
        <MensagemErro texto={erro} />
        <Periodo de={de} ate={ate} setDe={setDe} setAte={setAte} onSubmit={consultar} />
        {painel ? (
          <>
            <div className="cartoes">
              <section className="pagina__painel cartao">
                <span>Faturamento</span>
                <strong>{formatarMoeda(painel.faturamento)}</strong>
              </section>
              <section className="pagina__painel cartao">
                <span>Pedidos</span>
                <strong>{painel.totalPedidos}</strong>
              </section>
              <section className="pagina__painel cartao">
                <span>Ticket médio</span>
                <strong>{formatarMoeda(painel.ticketMedio)}</strong>
              </section>
            </div>
            <section className="pagina__painel">
              <h2>Faturamento por dia</h2>
              <div className="grafico">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip formatter={(valor) => formatarMoeda(valor)} />
                    <Line type="monotone" dataKey="valor" name="Faturamento" stroke="#1565c0" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="pagina__painel">
              <h2>Mais vendidos</h2>
              {painel.topItens?.length ? (
                <ol>
                  {painel.topItens.map((item) => (
                    <li key={item.produtoId}>{item.quantidade} × {item.nome}</li>
                  ))}
                </ol>
              ) : <p>Nenhuma venda no período.</p>}
            </section>
          </>
        ) : null}
        {matriz ? (
          <section className="pagina__painel">
            <h2>Kasavana & Smith</h2>
            <ul className="legenda">
              {LEGENDAS_CLASSE.map(([classe, texto]) => (
                <li key={classe}>
                  <strong>{rotuloClasse(classe)}.</strong> {texto}
                </li>
              ))}
            </ul>
            <GraficoMatriz analise={matriz} />
            <div className="grafico">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barras} margin={{ top: 16, right: 8, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rotulo" interval={0} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Itens">
                    {barras.map((barra) => (
                      <Cell key={barra.classe} fill={CORES_CLASSE[barra.classe]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Popularidade</th>
                    <th>Margem</th>
                    <th className="tabela__classe">Classe</th>
                    <th>Sugestão</th>
                  </tr>
                </thead>
                <tbody>
                  {matriz.itens.map((item) => (
                    <tr key={item.produtoId}>
                      <td>{item.nome}</td>
                      <td>{item.categoria}</td>
                      <td>{item.quantidade}</td>
                      <td>{item.popularidade}%</td>
                      <td>{formatarMoeda(item.margem)}</td>
                      <td className="tabela__classe">
                        <span className={`selo selo--${item.classe}`}>{rotuloClasse(item.classe)}</span>
                      </td>
                      <td>{item.recomendacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

function DashboardUsuario() {
  const [pedidos, setPedidos] = useState([])
  const [erro, setErro] = useState('')
  const [pagina, setPagina] = useState(0)
  const tamanho = 10

  useEffect(() => {
    apiJson(endpoints.pedidos)
      .then(setPedidos)
      .catch((falha) => setErro(falha.message))
  }, [])

  const porHorario = [...pedidos].sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))
  const grupos = Object.values(pedidos.reduce((mapa, pedido) => {
    const chave = pedido.comandaId ?? `sem-${pedido.id}`
    if (!mapa[chave]) {
      mapa[chave] = {
        chave,
        numero: pedido.comandaNumero ?? pedido.comandaId,
        pedidos: [],
      }
    }
    mapa[chave].pedidos.push(pedido)
    return mapa
  }, {})).map((grupo) => ({
    ...grupo,
    pedidos: [...grupo.pedidos].sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora))),
  })).sort((a, b) => Number(a.numero ?? 0) - Number(b.numero ?? 0))
  const totalPaginas = Math.max(1, Math.ceil(grupos.length / tamanho))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)
  const gruposPagina = grupos.slice(paginaAtual * tamanho, paginaAtual * tamanho + tamanho)

  function linha(pedido) {
    return (
      <tr key={pedido.id}>
        <td>{formatarDataHora(pedido.dataHora)}</td>
        <td>{pedido.comandaNumero != null ? `#${pedido.comandaNumero}` : pedido.comandaId ? `#${pedido.comandaId}` : '—'}</td>
        <td>{pedido.mesa}</td>
        <td>{pedido.nomeCliente}</td>
        <td>
          {pedido.itens.map((item) => (
            <div key={item.id}>{item.quantidade} × {item.produtoNome}</div>
          ))}
        </td>
        <td>{rotuloStatus(pedido.status)}</td>
      </tr>
    )
  }

  return (
    <TemplateAutenticado rotaAtual="/dashboard">
      <div className="pagina">
        <CabecalhoPagina titulo="Dashboard" descricao="Pedidos cadastrados por você, por horário e por comanda." />
        <MensagemErro texto={erro} />
        <section className="pagina__painel">
          <h2>Por horário</h2>
          <p>{porHorario.length} pedido(s)</p>
          {porHorario.length === 0 ? <p>Nenhum pedido cadastrado.</p> : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Comanda</th>
                    <th>Mesa</th>
                    <th>Cliente</th>
                    <th>Conteúdo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>{porHorario.map(linha)}</tbody>
              </table>
            </div>
          )}
        </section>
        <section className="pagina__painel">
          <h2>Por comanda</h2>
          <p>{grupos.length} comanda(s)</p>
          {gruposPagina.map((grupo) => (
            <article key={grupo.chave}>
              <h3>Comanda {grupo.numero != null ? `#${grupo.numero}` : 'sem número'} · {grupo.pedidos.length} pedido(s)</h3>
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Quando</th>
                      <th>Comanda</th>
                      <th>Mesa</th>
                      <th>Cliente</th>
                      <th>Conteúdo</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>{grupo.pedidos.map(linha)}</tbody>
                </table>
              </div>
            </article>
          ))}
          <div className="paginas-numeradas">
            {Array.from({ length: totalPaginas }, (_, indice) => (
              <Botao
                key={indice}
                texto={String(indice + 1)}
                variante={indice === paginaAtual ? 'primario' : 'fantasma'}
                onClick={() => setPagina(indice)}
              />
            ))}
          </div>
          <p>Página {paginaAtual + 1} de {totalPaginas} · até 10 comandas por página</p>
        </section>
      </div>
    </TemplateAutenticado>
  )
}

function Dashboard() {
  const sessao = lerSessao()
  if (sessao.perfil === 'USUARIO') return <DashboardUsuario />
  if (sessao.perfil === 'ADMINISTRADOR' && !emVisaoGestor()) return <DashboardAdmin />
  return <DashboardGestor />
}

export default Dashboard
