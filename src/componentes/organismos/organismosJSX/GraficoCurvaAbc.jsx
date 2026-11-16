import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatarMoeda, formatarPercentual } from '../../../utils/formatacao'

const CORES_FAIXA = {
  A: '#2e7d32',
  B: '#f9a825',
  C: '#c62828',
}

function GraficoCurvaAbc({ itens, mostrarFaixas }) {
  const dados = (itens || []).map((item) => ({
    id: item.id,
    nome: item.nome,
    lucro: Number(item.lucro),
    acumulado: Number(item.acumulado),
    faixa: item.faixa,
  }))

  return (
    <div className="grafico">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 16, right: 16, bottom: 48, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="lucro" />
          <YAxis yAxisId="acumulado" orientation="right" domain={[0, 100]} unit="%" />
          <Tooltip
            formatter={(valor, nome) => (
              nome === 'acumulado' ? formatarPercentual(valor) : formatarMoeda(valor)
            )}
          />
          {mostrarFaixas ? (
            <>
              <ReferenceLine yAxisId="acumulado" y={80} stroke="#2e7d32" strokeDasharray="4 4" label="80%" />
              <ReferenceLine yAxisId="acumulado" y={95} stroke="#f9a825" strokeDasharray="4 4" label="95%" />
            </>
          ) : null}
          <Bar yAxisId="lucro" dataKey="lucro" name="Lucro">
            {dados.map((barra) => (
              <Cell
                key={barra.id}
                fill={mostrarFaixas ? (CORES_FAIXA[barra.faixa] || '#1565c0') : '#1565c0'}
              />
            ))}
          </Bar>
          <Line yAxisId="acumulado" type="monotone" dataKey="acumulado" name="acumulado" stroke="#c45c26" dot />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default GraficoCurvaAbc
