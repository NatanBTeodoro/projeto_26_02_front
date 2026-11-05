import { useState } from 'react'
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
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { CORES_CLASSE, formatarMoeda, rotuloClasse } from '../../../utils/formatacao'

const CLASSES = ['ESTRELA', 'VACA_LEITEIRA', 'ENIGMA', 'CAO', 'DADO_INCOMPLETO']

function iso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function inicioPadrao() {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29)
  return iso(inicio)
}

function Dashboard() {
  const [de, setDe] = useState(inicioPadrao)
  const [ate, setAte] = useState(iso(new Date()))
  const [painel, setPainel] = useState(null)
  const [erro, setErro] = useState('')

  async function consultar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      const corpo = await apiJson(`${endpoints.dashboard}?de=${de}&ate=${ate}`)
      setPainel(corpo)
    } catch (falha) {
      setPainel(null)
      setErro(falha.message)
    }
  }

  const serie = (painel?.faturamentoPorDia || []).map((ponto) => ({
    data: String(ponto.data).slice(8, 10) + '/' + String(ponto.data).slice(5, 7),
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
          titulo="Painel"
          descricao="Resumo dos pedidos ativos no período. A classe vem do mesmo cálculo da matriz."
        />
        <MensagemErro texto={erro} />
        <form className="formulario pagina__painel" onSubmit={consultar}>
          <div className="formulario__linha">
            <FormField id="de" rotulo="De" tipo="date" valor={de} onChange={setDe} obrigatorio />
            <FormField id="ate" rotulo="Até" tipo="date" valor={ate} onChange={setAte} obrigatorio />
          </div>
          <Botao texto="Atualizar" tipo="submit" />
        </form>
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
            <div className="pagina__duas-colunas">
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
              <section className="pagina__painel">
                <h2>Itens por classe</h2>
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
              </section>
            </div>
          </>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

export default Dashboard
