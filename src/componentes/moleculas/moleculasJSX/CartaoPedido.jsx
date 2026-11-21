import Badge from '../../atomos/atomosJSX/Badge'
import { formatarHora, formatarMoeda, rotuloStatus, totalPedido, varianteStatus } from '../../../utils/formatacao'

function numero(pedido) {
  if (pedido.comandaNumero != null) return pedido.comandaNumero
  if (pedido.comandaId != null) return pedido.comandaId
  return '—'
}

function CartaoPedido({ pedido }) {
  return (
    <article className="pedido-card">
      <header className="pedido-card__topo">
        <time dateTime={pedido.dataHora}>{formatarHora(pedido.dataHora)}</time>
        <span className="pilula">#{numero(pedido)} · Mesa {pedido.mesa}</span>
        <Badge texto={rotuloStatus(pedido.status)} variante={varianteStatus(pedido.status)} />
      </header>
      <p className="pedido-card__cliente">{pedido.nomeCliente}</p>
      <ul className="pedido-card__itens">
        {(pedido.itens || []).map((item) => (
          <li key={item.id || `${item.produtoId}-${item.produtoNome}`}>
            <strong>{item.quantidade}×</strong>
            <span>{item.produtoNome}</span>
            <span className="pedido-card__precos">
              <span>Unitário {formatarMoeda(item.precoUnitario)}</span>
              <strong>Total {formatarMoeda(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}</strong>
            </span>
          </li>
        ))}
      </ul>
      <p className="pedido-card__total">Total {formatarMoeda(totalPedido(pedido))}</p>
    </article>
  )
}

export default CartaoPedido
