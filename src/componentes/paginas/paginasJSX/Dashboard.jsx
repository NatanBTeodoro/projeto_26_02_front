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
import Badge from '../../atomos/atomosJSX/Badge'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import CartaoPedido from '../../moleculas/moleculasJSX/CartaoPedido'
import GraficoMatriz from '../../organismos/organismosJSX/GraficoMatriz'
import GraficoCurvaAbc from '../../organismos/organismosJSX/GraficoCurvaAbc'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao } from '../../../utils/sessao'
import {
  CORES_CLASSE,
  formatarHora,
  formatarMoeda,
  formatarPercentual,
  LEGENDAS_CLASSE,
  normalizarBusca,
  rotuloClasse,
  rotuloStatus,
  totalPedido,
  varianteStatus,
} from '../../../utils/formatacao'
import '../paginasCSS/DashboardAdmin.css'

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

function dataCurta(valor) {
  if (!valor) return ''
  const [ano, mes, dia] = String(valor).split('-')
  return `${dia}/${mes}/${ano}`
}

function textoVariacao(variacao) {
  if (!variacao) return '—'
  if (variacao.texto) return variacao.texto
  if (variacao.percentual != null) {
    const numero = Number(variacao.percentual)
    const sinal = numero > 0 ? '+' : ''
    return `${sinal}${numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }
  if (variacao.pontos != null) {
    const numero = Number(variacao.pontos)
    const sinal = numero > 0 ? '+' : ''
    return `${sinal}${numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.`
  }
  return '—'
}

function anteriorFormatado(variacao, tipo) {
  if (!variacao || variacao.anterior == null) return ''
  if (tipo === 'MOEDA') return formatarMoeda(variacao.anterior)
  if (tipo === 'PERCENTUAL') return formatarPercentual(variacao.anterior)
  return formatarNumero(variacao.anterior, tipo === 'INTEIRO' ? 0 : 2)
}

function valorKpi(kpi) {
  if (kpi.tipo === 'TEXTO') return kpi.texto || '—'
  if (kpi.valor == null) return '—'
  if (kpi.tipo === 'MOEDA') return formatarMoeda(kpi.valor)
  if (kpi.tipo === 'PERCENTUAL') return formatarPercentual(kpi.valor)
  return formatarNumero(kpi.valor, 0)
}

function tomQualidade(valor) {
  if (valor == null) return 'neutro'
  const numero = Number(valor)
  if (numero <= 10) return 'ok'
  if (numero <= 30) return 'alerta'
  return 'ruim'
}

function SeloVariacao({ variacao, tipo }) {
  const sentido = variacao?.sentido === 'SOBE' ? 'sobe' : variacao?.sentido === 'DESCE' ? 'desce' : 'neutro'
  const seta = sentido === 'sobe' ? '▲' : sentido === 'desce' ? '▼' : '●'
  const anterior = anteriorFormatado(variacao, tipo)
  return (
    <span
      className={`kpi__variacao kpi__variacao--${sentido}`}
      title={anterior ? `Período anterior: ${anterior}` : undefined}
    >
      {seta} {textoVariacao(variacao)}
    </span>
  )
}

function DashboardAdmin() {
  const [de, setDe] = useState(inicioPadrao)
  const [ate, setAte] = useState(iso(new Date()))
  const [modelos, setModelos] = useState([])
  const [modelo, setModelo] = useState('CURVA_ABC')
  const [curva, setCurva] = useState(null)
  const [painel, setPainel] = useState(null)
  const [verAlertas, setVerAlertas] = useState(false)
  const [mostrarFaixas, setMostrarFaixas] = useState(false)
  const [erro, setErro] = useState('')

  async function consultar(evento) {
    if (evento) evento.preventDefault()
    setErro('')
    setVerAlertas(false)
    try {
      const corpo = await apiJson(`${endpoints.painelAdmin}?de=${de}&ate=${ate}`)
      setPainel(corpo)
    } catch (falha) {
      setPainel(null)
      setErro(falha.message)
    }
    if (modelo !== 'CURVA_ABC') {
      setCurva(null)
      setErro((atual) => atual || 'Este modelo ainda não está disponível.')
      return
    }
    try {
      setCurva(await apiJson(`${endpoints.curvaRestaurantes}?de=${de}&ate=${ate}`))
    } catch (falha) {
      setCurva(null)
      setErro(falha.message)
    }
  }

  useEffect(() => {
    apiJson(endpoints.modelosAnaliticos)
      .then((lista) => {
        setModelos(lista)
        if (lista[0]?.codigo) setModelo(lista[0].codigo)
      })
      .catch((falha) => setErro(falha.message))
    consultar()
  }, [])

  return (
    <TemplateAutenticado rotaAtual="/dashboard">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Dashboard"
          descricao="Faturamento, lucro e cardápio dos restaurantes ativos, comparados com o período anterior do mesmo tamanho."
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
        {painel ? (
          <>
            <p className="painel-admin__periodo">
              {painel.semPeriodoAnterior
                ? 'Sem período anterior: a plataforma ainda não tinha vendas antes deste intervalo.'
                : `Comparado com ${dataCurta(painel.deAnterior)} a ${dataCurta(painel.ateAnterior)}.`}
            </p>
            <section className="kpis">
              {painel.kpis.map((kpi) => (
                <article
                  key={kpi.codigo}
                  className={kpi.atencao ? 'kpi kpi--atencao' : 'kpi'}
                  title={kpi.detalhes?.length ? `Sem venda: ${kpi.detalhes.join(', ')}` : undefined}
                >
                  <strong>{valorKpi(kpi)}</strong>
                  <span>{kpi.rotulo}</span>
                  <SeloVariacao variacao={kpi.variacao} tipo={kpi.tipo} />
                  {kpi.complemento ? <small>{kpi.complemento}</small> : null}
                </article>
              ))}
            </section>
            <section className="pagina__painel">
              <h2>Alertas</h2>
              <p className="painel-admin__nota">
                Restaurantes sem venda recente olham os últimos 7 dias, independente do período escolhido.
              </p>
              {painel.alertas.length === 0 ? <p>Nenhum alerta no período ✓</p> : null}
              <ul className="alertas">
                {(verAlertas ? painel.alertas : painel.alertas.slice(0, 5)).map((alerta) => (
                  <li key={alerta.texto}>
                    <Badge
                      texto={alerta.severidade === 'CRITICO' ? 'Crítico' : alerta.severidade === 'ATENCAO' ? 'Atenção' : 'Info'}
                      variante={alerta.severidade === 'CRITICO' ? 'erro' : alerta.severidade === 'ATENCAO' ? 'incompleto' : 'neutro'}
                    />
                    <span>{alerta.texto}</span>
                  </li>
                ))}
              </ul>
              {painel.alertas.length > 5 ? (
                <Botao
                  texto={verAlertas ? 'Mostrar menos' : 'Ver todos'}
                  variante="fantasma"
                  onClick={() => setVerAlertas((atual) => !atual)}
                />
              ) : null}
            </section>
            <section className="pagina__painel">
              <h2>Kasavana & Smith da plataforma</h2>
              <p className="painel-admin__nota">
                Cada restaurante é classificado no próprio cardápio. Os percentuais somam só quem tem pelo menos 5 produtos distintos e 10 pedidos.
                {painel.restaurantesNaConsolidacao === 0
                  ? ' Nenhum restaurante chegou nessa amostra.'
                  : ` ${painel.restaurantesNaConsolidacao} restaurante(s) entram na conta.`}
              </p>
              <div className="distribuicao">
                {painel.distribuicao.map((fatia) => (
                  <div key={fatia.classe} className="distribuicao__linha">
                    <span>{rotuloClasse(fatia.classe)}</span>
                    <div className="distribuicao__trilho" title="Percentual dos produtos">
                      <i style={{ width: `${Number(fatia.percentualProdutos) || 0}%`, background: CORES_CLASSE[fatia.classe] }} />
                    </div>
                    <span>{formatarPercentual(fatia.percentualProdutos)} produtos</span>
                    <div className="distribuicao__trilho" title="Percentual do lucro">
                      <i style={{ width: `${Number(fatia.percentualLucro) || 0}%`, background: CORES_CLASSE[fatia.classe] }} />
                    </div>
                    <span>{fatia.percentualLucro == null ? '— do lucro' : `${formatarPercentual(fatia.percentualLucro)} do lucro`}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="pagina__painel">
              <h2>Saúde do cardápio</h2>
              <p className="painel-admin__nota">Ordenado pela parcela de Estrelas. Verde até 10% sem custo, amarelo até 30%, vermelho acima disso.</p>
              <div className="saude-lista">
                {painel.restaurantes.map((restaurante) => (
                  <article key={restaurante.id} className="saude">
                    <header>
                      <strong>{restaurante.nome}</strong>
                      {restaurante.amostraPequena ? <Badge texto="Amostra pequena" variante="incompleto" /> : null}
                    </header>
                    <div className="barra-empilhada" aria-label={`Classes de ${restaurante.nome}`}>
                      {restaurante.classes.filter((parte) => Number(parte.percentual) > 0).map((parte) => (
                        <i
                          key={parte.classe}
                          title={`${rotuloClasse(parte.classe)}: ${formatarPercentual(parte.percentual)}`}
                          style={{ width: `${Number(parte.percentual)}%`, background: CORES_CLASSE[parte.classe] }}
                        />
                      ))}
                    </div>
                    <p>{formatarPercentual(restaurante.percentualEstrelas)} estrelas · {restaurante.pedidos} pedidos · {restaurante.produtosDistintos} produtos</p>
                    <p>
                      Vendidos sem custo <strong className={`qualidade qualidade--${tomQualidade(restaurante.vendidosSemCusto)}`}>{formatarPercentual(restaurante.vendidosSemCusto)}</strong>
                      {' · '}
                      Cardápio sem custo <strong className={`qualidade qualidade--${tomQualidade(restaurante.cardapioSemCusto)}`}>{formatarPercentual(restaurante.cardapioSemCusto)}</strong>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
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
  const [classeFiltro, setClasseFiltro] = useState('')
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
  const itensMatriz = [...(matriz?.itens || [])]
    .filter((item) => !classeFiltro || item.classe === classeFiltro)
    .sort((a, b) => Number(b.popularidade) - Number(a.popularidade)
      || String(a.nome).localeCompare(String(b.nome), 'pt-BR'))

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
                    <Line type="monotone" dataKey="valor" name="Faturamento" stroke="var(--cor-marca)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="pagina__painel">
              <h2>Mais vendidos</h2>
              {painel.topItens?.length ? (
                <div className="tabela-rolagem">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Qtd. vendida</th>
                        <th>Valor unitário</th>
                        <th>Valor total vendido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {painel.topItens.map((item) => (
                        <tr key={item.produtoId}>
                          <td>{item.nome}</td>
                          <td>{item.quantidade}</td>
                          <td>{formatarMoeda(item.valorUnitario)}</td>
                          <td>{formatarMoeda(item.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <div>
              <label htmlFor="filtro-classe">Classe</label>
              <Select
                id="filtro-classe"
                valor={classeFiltro}
                onChange={setClasseFiltro}
                opcoes={[
                  { valor: '', rotulo: 'Todas' },
                  ...CLASSES.map((classe) => ({ valor: classe, rotulo: rotuloClasse(classe) })),
                ]}
              />
            </div>
            {itensMatriz.length === 0 ? <p>{classeFiltro ? 'Nenhum produto nessa classe.' : 'Nenhum produto no período.'}</p> : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Popularidade</th>
                    <th>Margem unitária</th>
                    <th>Margem total</th>
                    <th className="tabela__classe">Classe</th>
                    <th>Sugestão</th>
                  </tr>
                </thead>
                <tbody>
                  {itensMatriz.map((item) => (
                    <tr key={item.produtoId}>
                      <td>{item.nome}</td>
                      <td>{item.categoria}</td>
                      <td>{item.quantidade}</td>
                      <td>{item.popularidade}%</td>
                      <td>{formatarMoeda(item.margem)}</td>
                      <td>{item.margem == null ? '—' : formatarMoeda(Number(item.margem) * Number(item.quantidade))}</td>
                      <td className="tabela__classe">
                        <span className={`selo selo--${item.classe}`}>{rotuloClasse(item.classe)}</span>
                      </td>
                      <td>{item.recomendacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
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
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const tamanho = 10

  useEffect(() => {
    apiJson(endpoints.pedidos)
      .then(setPedidos)
      .catch((falha) => setErro(falha.message))
  }, [])

  const termo = normalizarBusca(busca.trim())
  const porHorario = [...pedidos]
    .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))
    .filter((pedido) => {
      if (status && pedido.status !== status) return false
      if (!termo) return true
      const texto = normalizarBusca([
        pedido.nomeCliente,
        pedido.mesa,
        pedido.comandaNumero,
        pedido.comandaId,
        ...(pedido.itens || []).map((item) => item.produtoNome),
      ].join(' '))
      return texto.includes(termo)
    })
  const valorGeral = pedidos.reduce((soma, pedido) => soma + totalPedido(pedido), 0)
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

  return (
    <TemplateAutenticado rotaAtual="/dashboard">
      <div className="pagina">
        <CabecalhoPagina titulo="Dashboard" descricao="Pedidos cadastrados por você, por horário e por comanda." />
        <MensagemErro texto={erro} />
        <div className="cartoes">
          <section className="pagina__painel cartao">
            <span>Pedidos</span>
            <strong>{pedidos.length}</strong>
          </section>
          <section className="pagina__painel cartao">
            <span>Valor dos pedidos</span>
            <strong>{formatarMoeda(valorGeral)}</strong>
          </section>
          <section className="pagina__painel cartao">
            <span>Comandas</span>
            <strong>{grupos.length}</strong>
          </section>
        </div>
        <section className="pagina__painel">
          <h2>Por horário</h2>
          <div className="formulario__linha">
            <FormField id="busca-horario" rotulo="Buscar" valor={busca} onChange={setBusca} placeholder="Cliente, produto, mesa ou comanda" />
            <div>
              <label htmlFor="filtro-status">Status</label>
              <Select
                id="filtro-status"
                valor={status}
                onChange={setStatus}
                opcoes={[
                  { valor: '', rotulo: 'Todos' },
                  { valor: 'ATIVO', rotulo: 'Ativo' },
                  { valor: 'ESTORNADO', rotulo: 'Estornado' },
                  { valor: 'CANCELADO', rotulo: 'Cancelado' },
                ]}
              />
            </div>
          </div>
          <p>{porHorario.length} pedido(s)</p>
          {porHorario.length === 0 ? <p>Nenhum pedido encontrado.</p> : (
            <div className="lista-horarios">
              {porHorario.map((pedido) => (
                <article key={pedido.id} className="linha-horario">
                  <time dateTime={pedido.dataHora}>{formatarHora(pedido.dataHora)}</time>
                  <span className="pilula">
                    #{pedido.comandaNumero ?? pedido.comandaId ?? '—'} · Mesa {pedido.mesa}
                  </span>
                  <div>
                    <ul className="linha-horario__itens">
                      <li className="linha-horario__legenda">
                        <span />
                        <span>Item</span>
                        <span>Unitário</span>
                        <span>Total do item</span>
                      </li>
                      {(pedido.itens || []).map((item) => (
                        <li key={item.id}>
                          <strong>{item.quantidade}×</strong>
                          <span>{item.produtoNome}</span>
                          <span>{formatarMoeda(item.precoUnitario)}</span>
                          <span>{formatarMoeda(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}</span>
                        </li>
                      ))}
                    </ul>
                    <p>{pedido.nomeCliente}</p>
                  </div>
                  <strong className="linha-horario__pedido">{formatarMoeda(totalPedido(pedido))}</strong>
                  <Badge texto={rotuloStatus(pedido.status)} variante={varianteStatus(pedido.status)} />
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="pagina__painel">
          <h2>Por comanda</h2>
          <p>{grupos.length} comanda(s)</p>
          <div className="grade-comandas">
            {gruposPagina.map((grupo) => (
              <article key={grupo.chave} className="comanda-card">
                <h3>Comanda {grupo.numero != null ? `#${grupo.numero}` : 'sem número'}</h3>
                <p>{grupo.pedidos.length} pedido(s)</p>
                {grupo.pedidos.map((pedido) => <CartaoPedido key={pedido.id} pedido={pedido} />)}
              </article>
            ))}
          </div>
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
