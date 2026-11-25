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
import CartaoMetrica from '../../moleculas/moleculasJSX/CartaoMetrica'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Titulo from '../../atomos/atomosJSX/Titulo'
import Checkbox from '../../atomos/atomosJSX/Checkbox'
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
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  LEGENDAS_CLASSE,
  normalizarBusca,
  rotuloClasse,
  totalPedido,
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
  const colunas = [
    { chave: 'nome', rotulo: 'Nome', largura: '34%', celula: (item) => `${item.nome}${item.dadoIncompleto ? ' (dado incompleto)' : ''}` },
    { chave: 'lucro', rotulo: 'Lucro', papel: 'numero', largura: '16%', celula: (item) => formatarMoeda(item.lucro) },
    { chave: 'custo', rotulo: 'Custo bruto', papel: 'numero', largura: '18%', celula: (item) => formatarMoeda(item.custoBruto) },
    { chave: 'participacao', rotulo: 'Participação', papel: 'numero', largura: '16%', celula: (item) => formatarPercentual(item.participacao) },
    { chave: 'acumulado', rotulo: 'Acumulado', papel: 'numero', largura: '16%', celula: (item) => formatarPercentual(item.acumulado) },
  ]
  if (mostrarFaixas) {
    colunas[0].largura = '28%'
    colunas.push({ chave: 'faixa', rotulo: 'Faixa', largura: '6%', celula: (item) => item.faixa })
  }
  return <Tabela linhas={curva?.itens || []} colunas={colunas} />
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
          <div className="formulario__linha">
            <FormFieldSelect
              id="modelo"
              rotulo="Modelo analítico"
              valor={modelo}
              onChange={setModelo}
              opcoes={(modelos.length ? modelos : [{ codigo: 'CURVA_ABC', nome: 'Curva ABC (Pareto)' }])
                .map((item) => ({ valor: item.codigo, rotulo: item.nome }))}
            />
            <Checkbox id="faixas-abc" texto="Mostrar faixas A, B e C" marcado={mostrarFaixas} onChange={setMostrarFaixas} />
          </div>
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
                <CartaoMetrica
                  key={kpi.codigo}
                  rotulo={kpi.rotulo}
                  valor={valorKpi(kpi)}
                  detalhe={kpi.complemento || ''}
                  atencao={kpi.atencao}
                  title={kpi.detalhes?.length ? `Sem venda: ${kpi.detalhes.join(', ')}` : undefined}
                >
                  <SeloVariacao variacao={kpi.variacao} tipo={kpi.tipo} />
                </CartaoMetrica>
              ))}
            </section>
            <section className="pagina__painel">
              <Titulo nivel={2} texto="Alertas" />
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
              <Titulo nivel={2} texto="Kasavana & Smith da plataforma" />
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
              <Titulo nivel={2} texto="Saúde do cardápio" />
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
                    <p>Custo bruto {formatarMoeda(restaurante.custoBruto)} · cobertura {formatarPercentual(restaurante.coberturaDeCusto)}</p>
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
            <div className="cartoes">
              <CartaoMetrica rotulo="Custo bruto" valor={formatarMoeda(curva.custoBruto)} />
              <CartaoMetrica rotulo="Lucro bruto" valor={formatarMoeda(curva.lucroBruto)} />
            </div>
            {curva.linhasSemCusto > 0 ? (
              <p>
                {curva.linhasSemCusto} item(ns) sem custo ficaram fora do lucro e estão marcados como dado incompleto.
                {curva.foraDaCurva?.length ? ` Fora da curva: ${curva.foraDaCurva.join(', ')}.` : ''}
              </p>
            ) : null}
            <section className="pagina__painel">
              <Titulo nivel={2} texto="Curva ABC por restaurante" />
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
            {painel.faturamento == null ? (
              <p>sem permissão para ver valores financeiros</p>
            ) : null}
            <div className="cartoes">
              <CartaoMetrica rotulo="Faturamento" valor={formatarMoeda(painel.faturamento)} />
              <CartaoMetrica rotulo="Custo bruto" valor={formatarMoeda(painel.custoBruto)} />
              <CartaoMetrica rotulo="Lucro bruto" valor={formatarMoeda(painel.lucroBruto)} />
              <CartaoMetrica rotulo="Margem média" valor={formatarPercentual(painel.margemMedia)} />
              <CartaoMetrica rotulo="Pedidos" valor={painel.totalPedidos} />
              <CartaoMetrica rotulo="Ticket médio" valor={formatarMoeda(painel.ticketMedio)} />
            </div>
            {painel.coberturaDeCusto != null ? (
              <p>margem calculada sobre {formatarPercentual(painel.coberturaDeCusto)} do faturamento</p>
            ) : null}
            <section className="pagina__painel">
              <Titulo nivel={2} texto="Faturamento por dia" />
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
              <Titulo nivel={2} texto="Mais vendidos" />
              {painel.topItens?.length ? (
                <ol className="mais-vendidos">
                  {painel.topItens.map((item) => (
                    <li key={item.produtoId}>
                      <strong>{item.nome}</strong>
                      <span>{item.quantidade} un.</span>
                      <span>{formatarMoeda(item.valorTotal)}</span>
                    </li>
                  ))}
                </ol>
              ) : <p>Nenhuma venda no período.</p>}
            </section>
          </>
        ) : null}
        {matriz ? (
          <section className="pagina__painel">
            <Titulo nivel={2} texto="Kasavana & Smith" />
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
            <div className="campo-curto">
              <FormFieldSelect
                id="filtro-classe"
                rotulo="Classe"
                valor={classeFiltro}
                onChange={setClasseFiltro}
                opcoes={[
                  { valor: '', rotulo: 'Todas' },
                  ...CLASSES.map((classe) => ({ valor: classe, rotulo: rotuloClasse(classe) })),
                ]}
              />
            </div>
            {itensMatriz.length === 0 ? <p>{classeFiltro ? 'Nenhum produto nessa classe.' : 'Nenhum produto no período.'}</p> : (
            <Tabela
              classe="tabela--analise"
              linhas={itensMatriz}
              colunas={[
                { chave: 'nome', rotulo: 'Produto', largura: '14%', celula: (item) => item.nome },
                { chave: 'categoria', rotulo: 'Categoria', largura: '10%', celula: (item) => item.categoria },
                { chave: 'quantidade', rotulo: 'Quantidade', papel: 'numero', largura: '7%', celula: (item) => item.quantidade },
                { chave: 'popularidade', rotulo: 'Popularidade', papel: 'numero', largura: '9%', celula: (item) => formatarPercentual(item.popularidade) },
                { chave: 'margem', rotulo: 'Lucro unitário', papel: 'numero', largura: '8%', celula: (item) => formatarMoeda(item.margem) },
                { chave: 'lucro', rotulo: 'Lucro total', papel: 'numero', largura: '8%', celula: (item) => (item.margem == null ? '—' : formatarMoeda(Number(item.margem) * Number(item.quantidade))) },
                { chave: 'custo', rotulo: 'Custo bruto', papel: 'numero', largura: '8%', celula: (item) => formatarMoeda(item.custoBruto) },
                { chave: 'margemPercentual', rotulo: 'Margem', papel: 'numero', largura: '7%', celula: (item) => formatarPercentual(item.margemPercentual) },
                { chave: 'classe', rotulo: 'Classe', papel: 'classe', largura: '11%', celula: (item) => <span className={`selo selo--${item.classe}`}>{rotuloClasse(item.classe)}</span> },
                { chave: 'recomendacao', rotulo: 'Sugestão', papel: 'texto', largura: '18%', celula: (item) => item.recomendacao },
              ]}
            />
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
          <CartaoMetrica rotulo="Pedidos" valor={pedidos.length} />
          <CartaoMetrica rotulo="Valor dos pedidos" valor={formatarMoeda(valorGeral)} />
          <CartaoMetrica rotulo="Comandas" valor={grupos.length} />
        </div>
        <section className="pagina__painel">
          <Titulo nivel={2} texto="Por horário" />
          <div className="formulario__linha">
            <FormField id="busca-horario" rotulo="Buscar" valor={busca} onChange={setBusca} placeholder="Cliente, produto, mesa ou comanda" />
            <FormFieldSelect
              id="filtro-status"
              rotulo="Status"
              valor={status}
              onChange={setStatus}
              opcoes={[
                { valor: '', rotulo: 'Todos' },
                { valor: 'ATIVO', rotulo: 'Ativo' },
                { valor: 'PAGO', rotulo: 'Pago' },
                { valor: 'ESTORNADO', rotulo: 'Estornado' },
                { valor: 'CANCELADO', rotulo: 'Cancelado' },
              ]}
            />
          </div>
          <p>{porHorario.length} pedido(s)</p>
          {porHorario.length === 0 ? <p>Nenhum pedido encontrado.</p> : (
            <div className="lista-horarios">
              {porHorario.map((pedido) => <CartaoPedido key={pedido.id} pedido={pedido} />)}
            </div>
          )}
        </section>
        <section className="pagina__painel">
          <Titulo nivel={2} texto="Por comanda" />
          <p>{grupos.length} comanda(s)</p>
          <div className="grade-comandas">
            {gruposPagina.map((grupo) => (
              <article key={grupo.chave} className="comanda-card">
                <Titulo nivel={3} texto={`Comanda ${grupo.numero != null ? `#${grupo.numero}` : 'sem número'}`} />
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
