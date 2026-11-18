import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { formatarDataHora, formatarMoeda, normalizarBusca, rotuloStatus } from '../../../utils/formatacao'

function conteudo(pedido) {
  return pedido.itens.map((item) => `${item.quantidade} × ${item.produtoNome}`).join(', ')
}

function SeletorItens({ categorias, produtos, itens, setItens, prefixo = 'item', comValores = false }) {
  const [categoriaId, setCategoriaId] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [busca, setBusca] = useState('')
  const [erroLocal, setErroLocal] = useState('')
  const daCategoria = categoriaId
    ? produtos.filter((produto) => String(produto.categoriaId) === categoriaId)
    : produtos
  const termo = normalizarBusca(busca.trim())
  const produtosVisiveis = comValores && termo
    ? daCategoria.filter((produto) => normalizarBusca(produto.nome).includes(termo))
    : daCategoria
  const total = itens.reduce((soma, item) => soma + Number(item.preco || 0) * Number(item.quantidade || 0), 0)

  function incluir() {
    const produto = produtos.find((item) => String(item.id) === produtoId)
    const qtd = Number(quantidade)
    if (!produto || qtd < 1) {
      setErroLocal('Escolha um produto e uma quantidade maior que zero.')
      return
    }
    setErroLocal('')
    setItens((atual) => {
      const indice = atual.findIndex((item) => item.produtoId === produto.id)
      if (indice >= 0) {
        return atual.map((item, i) => (i === indice
          ? { ...item, quantidade: item.quantidade + qtd, preco: produto.precoAtual }
          : item))
      }
      return [...atual, { produtoId: produto.id, nome: produto.nome, quantidade: qtd, preco: produto.precoAtual }]
    })
  }

  function alterarQuantidade(id, valor) {
    const qtd = Number(valor)
    if (!Number.isInteger(qtd) || qtd < 1) return
    setItens((atual) => atual.map((item) => (item.produtoId === id ? { ...item, quantidade: qtd } : item)))
  }

  return (
    <div className="formulario">
      <MensagemErro texto={erroLocal} />
      <label htmlFor={`${prefixo}-categoria`}>Categoria</label>
      <Select
        id={`${prefixo}-categoria`}
        valor={categoriaId}
        onChange={(valor) => { setCategoriaId(valor); setProdutoId('') }}
        opcoes={[
          { valor: '', rotulo: 'Todas' },
          ...categorias.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome })),
        ]}
      />
      {comValores ? (
        <FormField
          id={`${prefixo}-busca`}
          rotulo="Buscar produto"
          valor={busca}
          onChange={setBusca}
          placeholder="Nome do produto"
        />
      ) : null}
      <div className="formulario__linha">
        <div>
          <label htmlFor={`${prefixo}-produto`}>Produto</label>
          {comValores ? (
            termo && produtosVisiveis.length === 0 ? (
              <p>Nenhum produto encontrado</p>
            ) : (
              <ul className="lista-produtos" id={`${prefixo}-produto`}>
                {produtosVisiveis.map((produto) => (
                  <li key={produto.id} aria-selected={String(produto.id) === produtoId}>
                    <button type="button" onClick={() => setProdutoId(String(produto.id))}>{produto.nome}</button>
                    <span>{formatarMoeda(produto.precoAtual)}</span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <Select
              id={`${prefixo}-produto`}
              valor={produtoId}
              onChange={setProdutoId}
              opcoes={[
                { valor: '', rotulo: 'Selecione' },
                ...produtosVisiveis.map((produto) => ({ valor: String(produto.id), rotulo: produto.nome })),
              ]}
            />
          )}
        </div>
        <FormField id={`${prefixo}-quantidade`} rotulo="Quantidade" tipo="number" valor={quantidade} onChange={setQuantidade} />
      </div>
      <Botao texto="Adicionar item" variante="secundario" onClick={incluir} />
      <ul className="rascunho">
        {itens.map((item) => (
          <li key={item.produtoId}>
            {comValores ? (
              <>
                <span>{item.nome}</span>
                <span>{formatarMoeda(item.preco)}</span>
                <input
                  className="input input--quantidade"
                  type="number"
                  min="1"
                  step="1"
                  aria-label={`Quantidade de ${item.nome}`}
                  value={item.quantidade}
                  onChange={(evento) => alterarQuantidade(item.produtoId, evento.target.value)}
                />
                <span>{formatarMoeda(Number(item.preco || 0) * Number(item.quantidade || 0))}</span>
              </>
            ) : (
              <span>{item.quantidade} × {item.nome}</span>
            )}
            <Botao
              texto="Remover"
              variante="fantasma"
              onClick={() => setItens((atual) => atual.filter((linha) => linha.produtoId !== item.produtoId))}
            />
          </li>
        ))}
      </ul>
      {comValores ? <p className="pedido__total">Total {formatarMoeda(total)}</p> : null}
    </div>
  )
}

function PedidosUsuario() {
  const [comandas, setComandas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [comandaId, setComandaId] = useState('')
  const [mesa, setMesa] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [itens, setItens] = useState([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function carregar() {
    const [listaComandas, listaPedidos, listaCategorias, listaProdutos] = await Promise.all([
      apiJson(endpoints.comandas),
      apiJson(endpoints.pedidos),
      apiJson(endpoints.categorias),
      apiJson(endpoints.produtos),
    ])
    setComandas(listaComandas)
    setPedidos(listaPedidos)
    setCategorias(listaCategorias.filter((categoria) => categoria.ativa))
    setProdutos(listaProdutos.filter((produto) => produto.ativo))
    setComandaId((atual) => atual || (listaComandas[0] ? String(listaComandas[0].id) : ''))
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  async function abrirComanda() {
    setErro('')
    try {
      const criada = await apiJson(endpoints.comandas, { method: 'POST', body: JSON.stringify({}) })
      setComandaId(String(criada.id))
      setAviso(`Comanda #${criada.id} aberta.`)
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    if (!comandaId) {
      setErro('Abra uma comanda antes de lançar o pedido.')
      return
    }
    try {
      await apiJson(endpoints.pedidos, {
        method: 'POST',
        body: JSON.stringify({
          comandaId: Number(comandaId),
          mesa: Number(mesa),
          nomeCliente: nomeCliente.trim(),
          itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        }),
      })
      setItens([])
      setAviso('Pedido lançado nesta comanda.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  const daComanda = pedidos.filter((pedido) => String(pedido.comandaId) === comandaId)

  return (
    <TemplateAutenticado rotaAtual="/pedidos">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Pedidos"
          descricao="Abra uma comanda e lance nela os pedidos dos clientes. Cada lançamento vira um pedido novo na mesma comanda."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        <section className="pagina__painel">
          <div className="formulario__acoes">
            <Botao texto="Abrir comanda" onClick={abrirComanda} />
          </div>
          <label htmlFor="comanda">Comanda</label>
          <Select
            id="comanda"
            valor={comandaId}
            onChange={setComandaId}
            opcoes={[
              { valor: '', rotulo: 'Selecione' },
              ...comandas.map((comanda) => ({ valor: String(comanda.id), rotulo: `Comanda #${comanda.id}` })),
            ]}
          />
        </section>
        <form className="formulario pagina__painel" onSubmit={salvar}>
          <FormField id="mesa" rotulo="Mesa" tipo="number" valor={mesa} onChange={setMesa} obrigatorio />
          <FormField id="cliente" rotulo="Nome do cliente" valor={nomeCliente} onChange={setNomeCliente} obrigatorio />
          <SeletorItens categorias={categorias} produtos={produtos} itens={itens} setItens={setItens} comValores />
          <Botao texto="Lançar pedido na comanda" tipo="submit" desabilitado={itens.length === 0} />
        </form>
        <section className="pagina__painel">
          <h2>Pedidos desta comanda</h2>
          {daComanda.length === 0 ? <p>Nenhum pedido nesta comanda.</p> : null}
          {daComanda.map((pedido) => (
            <p key={pedido.id}>
              {formatarDataHora(pedido.dataHora)} · mesa {pedido.mesa} · {pedido.nomeCliente} · {conteudo(pedido)} · {rotuloStatus(pedido.status)}
            </p>
          ))}
        </section>
      </div>
    </TemplateAutenticado>
  )
}

function PedidosGestor() {
  const bloqueado = visaoBloqueada()
  const [pedidos, setPedidos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [comandas, setComandas] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [usuarioId, setUsuarioId] = useState('')
  const [comandaId, setComandaId] = useState('')
  const [mesa, setMesa] = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [itens, setItens] = useState([])
  const [editando, setEditando] = useState(null)
  const [motivoEdicao, setMotivoEdicao] = useState('')
  const [itensEdicao, setItensEdicao] = useState([])
  const [mesaEdicao, setMesaEdicao] = useState('')
  const [clienteEdicao, setClienteEdicao] = useState('')
  const [motivos, setMotivos] = useState({})
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function carregar() {
    const [listaPedidos, listaUsuarios, listaCategorias, listaProdutos] = await Promise.all([
      apiJson(endpoints.pedidos),
      apiJson(endpoints.usuarios),
      apiJson(endpoints.categorias),
      apiJson(endpoints.produtos),
    ])
    setPedidos(listaPedidos)
    setUsuarios(listaUsuarios.filter((usuario) => usuario.perfil === 'USUARIO' && usuario.ativo))
    setCategorias(listaCategorias.filter((categoria) => categoria.ativa))
    setProdutos(listaProdutos.filter((produto) => produto.ativo))
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  useEffect(() => {
    if (!usuarioId) {
      setComandas([])
      return
    }
    apiJson(`${endpoints.comandas}?usuarioId=${usuarioId}`)
      .then(setComandas)
      .catch((falha) => setErro(falha.message))
  }, [usuarioId])

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      await apiJson(endpoints.pedidos, {
        method: 'POST',
        body: JSON.stringify({
          usuarioId: Number(usuarioId),
          comandaId: comandaId ? Number(comandaId) : null,
          mesa: Number(mesa),
          nomeCliente: nomeCliente.trim(),
          itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        }),
      })
      setItens([])
      setMostrarFormulario(false)
      setAviso('Pedido registrado em nome do usuário.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function estornar(pedido) {
    const motivo = (motivos[`e-${pedido.id}`] || '').trim()
    if (!motivo) {
      setErro('Informe o motivo do estorno.')
      return
    }
    setErro('')
    try {
      await apiJson(endpoints.estorno(pedido.id), { method: 'POST', body: JSON.stringify({ motivo }) })
      setAviso('Pedido estornado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function cancelar(pedido) {
    const motivo = (motivos[`c-${pedido.id}`] || '').trim()
    if (!motivo) {
      setErro('Informe o motivo do cancelamento.')
      return
    }
    setErro('')
    try {
      await apiJson(endpoints.cancelamento(pedido.id), { method: 'POST', body: JSON.stringify({ motivo }) })
      setAviso('Pedido cancelado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function iniciarEdicao(pedido) {
    setEditando(pedido.id)
    setMesaEdicao(String(pedido.mesa ?? ''))
    setClienteEdicao(pedido.nomeCliente || '')
    setMotivoEdicao('')
    setItensEdicao(pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.produtoNome,
      quantidade: item.quantidade,
    })))
  }

  async function salvarEdicao(evento) {
    evento.preventDefault()
    setErro('')
    try {
      await apiJson(endpoints.pedido(editando), {
        method: 'PUT',
        body: JSON.stringify({
          motivo: motivoEdicao.trim(),
          mesa: Number(mesaEdicao),
          nomeCliente: clienteEdicao.trim(),
          itens: itensEdicao.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        }),
      })
      setEditando(null)
      setAviso('Pedido editado. O horário, a alteração e o motivo foram registrados.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/pedidos">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Pedidos"
          descricao="Lista com o usuário, a mesa e o conteúdo. Estorno, cancelamento e edição pedem motivo. O horário fica registrado."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        {!bloqueado ? (
          <Botao
            texto={mostrarFormulario ? 'Fechar lançamento' : 'Registrar pedido como usuário'}
            variante="secundario"
            onClick={() => setMostrarFormulario((atual) => !atual)}
          />
        ) : <p>Restaurante fechado ou inativo: os pedidos podem ser consultados, mas não alterados.</p>}
        {mostrarFormulario && !bloqueado ? (
          <form className="formulario pagina__painel" onSubmit={salvar}>
            <label htmlFor="usuario">Usuário</label>
            <Select
              id="usuario"
              valor={usuarioId}
              onChange={setUsuarioId}
              opcoes={[
                { valor: '', rotulo: 'Selecione' },
                ...usuarios.map((usuario) => ({ valor: String(usuario.id), rotulo: usuario.nome })),
              ]}
            />
            <label htmlFor="comanda-usuario">Comanda</label>
            <Select
              id="comanda-usuario"
              valor={comandaId}
              onChange={setComandaId}
              opcoes={[
                { valor: '', rotulo: 'Abrir comanda nova' },
                ...comandas.map((comanda) => ({ valor: String(comanda.id), rotulo: `Comanda #${comanda.id}` })),
              ]}
            />
            <FormField id="mesa" rotulo="Mesa" tipo="number" valor={mesa} onChange={setMesa} obrigatorio />
            <FormField id="cliente" rotulo="Nome do cliente" valor={nomeCliente} onChange={setNomeCliente} obrigatorio />
            <SeletorItens categorias={categorias} produtos={produtos} itens={itens} setItens={setItens} />
            <Botao texto="Registrar pedido" tipo="submit" desabilitado={itens.length === 0 || !usuarioId} />
          </form>
        ) : null}
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Comanda</th>
                <th>Mesa</th>
                <th>Cliente</th>
                <th>Conteúdo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{formatarDataHora(pedido.dataHora)}</td>
                  <td>{pedido.usuarioNome || 'Usuário removido'}</td>
                  <td>{pedido.comandaId ? `#${pedido.comandaId}` : '—'}</td>
                  <td>{pedido.mesa}</td>
                  <td>{pedido.nomeCliente}</td>
                  <td>{conteudo(pedido)}</td>
                  <td>
                    {rotuloStatus(pedido.status)}
                    {pedido.status === 'ESTORNADO' ? ` · ${pedido.motivoEstorno} · ${pedido.autorEstorno || ''} · ${formatarDataHora(pedido.dataHoraEstorno)}` : ''}
                    {pedido.status === 'CANCELADO' ? ` · ${pedido.motivoCancelamento} · ${pedido.autorCancelamento || ''} · ${formatarDataHora(pedido.dataHoraCancelamento)}` : ''}
                    {pedido.alteracoes?.map((alteracao) => (
                      <div key={alteracao.id}>
                        {formatarDataHora(alteracao.dataHora)} · {alteracao.autor}: {alteracao.descricao} ({alteracao.motivo})
                      </div>
                    ))}
                  </td>
                  <td>
                    {pedido.status === 'ATIVO' && !bloqueado ? (
                      <div className="formulario">
                        <FormField
                          id={`estorno-${pedido.id}`}
                          rotulo="Motivo do estorno"
                          valor={motivos[`e-${pedido.id}`] || ''}
                          onChange={(valor) => setMotivos((atual) => ({ ...atual, [`e-${pedido.id}`]: valor }))}
                        />
                        <Botao texto="Estornar" variante="perigo" onClick={() => estornar(pedido)} />
                        <FormField
                          id={`cancelar-${pedido.id}`}
                          rotulo="Motivo do cancelamento"
                          valor={motivos[`c-${pedido.id}`] || ''}
                          onChange={(valor) => setMotivos((atual) => ({ ...atual, [`c-${pedido.id}`]: valor }))}
                        />
                        <Botao texto="Cancelar" variante="secundario" onClick={() => cancelar(pedido)} />
                        <Botao texto="Editar" variante="fantasma" onClick={() => iniciarEdicao(pedido)} />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editando && !bloqueado ? (
          <form className="formulario pagina__painel" onSubmit={salvarEdicao}>
            <h2>Editar pedido</h2>
            <FormField id="mesa-edicao" rotulo="Mesa" tipo="number" valor={mesaEdicao} onChange={setMesaEdicao} obrigatorio />
            <FormField id="cliente-edicao" rotulo="Nome do cliente" valor={clienteEdicao} onChange={setClienteEdicao} obrigatorio />
            <SeletorItens
              prefixo="edicao"
              categorias={categorias}
              produtos={produtos}
              itens={itensEdicao}
              setItens={setItensEdicao}
            />
            <FormField id="motivo-edicao" rotulo="Motivo da edição" valor={motivoEdicao} onChange={setMotivoEdicao} obrigatorio />
            <div className="formulario__acoes">
              <Botao texto="Salvar edição" tipo="submit" />
              <Botao texto="Fechar" variante="fantasma" onClick={() => setEditando(null)} />
            </div>
          </form>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

function Pedidos() {
  const sessao = lerSessao()
  if (sessao.perfil === 'USUARIO') return <PedidosUsuario />
  if (sessao.perfil === 'ADMINISTRADOR' && !emVisaoGestor()) return <Navigate to="/restaurantes" replace />
  return <PedidosGestor />
}

export default Pedidos
