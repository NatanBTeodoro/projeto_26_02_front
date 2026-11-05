import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { CORES_CLASSE, formatarMoeda, rotuloClasse } from '../../../utils/formatacao'

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

function Dica({ active, payload }) {
  if (!active || !payload?.length) return null
  const ponto = payload[0].payload
  return (
    <div className="grafico__dica">
      <strong>{ponto.nome}</strong>
      <div>{rotuloClasse(ponto.classe)}</div>
      <div>Popularidade: {ponto.popularidade}%</div>
      <div>Margem: {formatarMoeda(ponto.margem)}</div>
    </div>
  )
}

function GraficoMatriz({ analise }) {
  const itens = analise?.itens || []
  const pontos = itens
    .filter((item) => item.classe !== 'DADO_INCOMPLETO' && item.margem != null)
    .map((item) => ({
      ...item,
      popularidade: numero(item.popularidade),
      margem: numero(item.margem),
    }))
  const fora = itens.length - pontos.length
  const limite = numero(analise?.limitePopularidade)
  const media = numero(analise?.margemMedia)

  return (
    <>
      <div className="grafico">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="popularidade"
              name="Popularidade"
              unit="%"
              label={{ value: 'Popularidade (%)', position: 'bottom' }}
            />
            <YAxis
              type="number"
              dataKey="margem"
              name="Margem"
              label={{ value: 'Margem (R$)', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis range={[80, 80]} />
            {limite != null ? <ReferenceLine x={limite} stroke="#888" strokeDasharray="5 5" /> : null}
            {media != null ? <ReferenceLine y={media} stroke="#888" strokeDasharray="5 5" /> : null}
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<Dica />} />
            <Scatter data={pontos}>
              {pontos.map((ponto) => (
                <Cell key={ponto.produtoId} fill={CORES_CLASSE[ponto.classe] || '#616161'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {pontos.length > 0 && pontos.length <= 2 ? (
        <p>Poucos itens para uma análise significativa.</p>
      ) : null}
      {fora > 0 ? <p>{fora} item(ns) sem custo não aparecem no gráfico.</p> : null}
    </>
  )
}

export default GraficoMatriz
