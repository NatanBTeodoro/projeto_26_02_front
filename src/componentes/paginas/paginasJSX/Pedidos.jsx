import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import Badge from '../../atomos/atomosJSX/Badge'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import CartaoPedido from '../../moleculas/moleculasJSX/CartaoPedido'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { formatarDataHora, formatarMoeda, normalizarBusca, rotuloStatus, varianteStatus } from '../../../utils/formatacao'

function rotuloComanda(comanda) {
  return `Comanda #${comanda.numero ?? comanda.id}`
}

function numeroComanda(pedido) {
  if (pedido.comandaNumero != null) return `#${pedido.comandaNumero}`
  if (pedido.comandaId) return `#${pedido.comandaId}`
  return '—'
}

function conteudo(pedido) {
  return pedido.itens.map((item) => `${item.quantidade} × ${item.produtoNome}`).join(', ')
}

function rotuloUsuario(pedido) {
  const nome = pedido.usuarioNome || 'Usuário removido'
  if (!pedido.lancadoPor) return nome
  return `${nome} (${pedido.lancadoPor})`
}

function Passo({ valor, onChange, rotulo }) {
  const numero = Math.max(1, Number(valor) || 1)
  return (
    <div className="passo" role="group" aria-label={rotulo}>
      <button type="button" aria-label={`Diminuir ${rotulo}`} onClick={() => onChange(String(Math.max(1, numero - 1)))}>−</button>
      <strong>{numero}</strong>
      <button type="button" aria-label={`Aumentar ${rotulo}`} onClick={() => onChange(String(numero + 1))}>+</button>
    </div>
  )
}

function SeletorItens({ categorias, produtos, itens, setItens, prefixo = 'item', comValores = false }) {
  const [categoriaId, setCategoriaId] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [busca, setBusca] = useState('')
  const [erroLocal, setErroLocal] = useState('')
  const categoriasOrdenadas = [...categorias].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  const daCategoria = categoriaId
    ? produtos.filter((produto) => String(produto.categoriaId) === categoriaId)
    : produtos
  const termo = normalizarBusca(busca.trim())
  const produtosVisiveis = comValores && termo
    ? daCategoria.filter((produto) => normalizarBusca(produto.nome).includes(termo))
    : daCategoria
  const total = itens.reduce((soma, item) => soma + Number(item.preco || 0) * Number(item.quantidade || 0), 0)

  function acrescentar(produto, qtd) {
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
    if (comValores) setQuantidade('1')
  }

  function incluir() {
    const produto = produtos.find((item) => String(item.id) === produtoId)
    acrescentar(produto, Number(quantidade))
  }

  function alterarQuantidade(id, valor) {
    const qtd = Number(valor)
    if (!Number.isInteger(qtd) || qtd < 1) return
    setItens((atual) => atual.map((item) => (item.produtoId === id ? { ...item, quantidade: qtd } : item)))
  }

  return (
    <div className="formulario">
      <MensagemErro texto={erroLocal} />
      {comValores ? (
        <div className="chips" role="tablist" aria-label="Categoria">
          <button type="button" className={categoriaId === '' ? 'chip chip--ativo' : 'chip'} onClick={() => setCategoriaId('')}>Todas</button>
          {categoriasOrdenadas.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              className={categoriaId === String(categoria.id) ? 'chip chip--ativo' : 'chip'}
              onClick={() => setCategoriaId(String(categoria.id))}
            >
              {categoria.nome}
            </button>
          ))}
        </div>
      ) : (
        <>
          <label htmlFor={`${prefixo}-categoria`}>Categoria</label>
          <Select
            id={`${prefixo}-categoria`}
            valor={categoriaId}
            onChange={(valor) => { setCategoriaId(valor); setProdutoId('') }}
            opcoes={[
              { valor: '', rotulo: 'Todas' },
              ...categoriasOrdenadas.map((categoria) => ({ valor: String(categoria.id), rotulo: categoria.nome })),
            ]}
          />
        </>
      )}
      {comValores ? (
        <FormField
          id={`${prefixo}-busca`}
          rotulo="Buscar produto"
          valor={busca}
          onChange={setBusca}
          placeholder="Nome do produto"
        />
      ) : null}
      {comValores ? (
        <>
          <div className="pedido__resumo-comanda">
            <span>Quantidade</span>
            <Passo valor={quantidade} onChange={setQuantidade} rotulo="quantidade do próximo item" />
          </div>
          {produtosVisiveis.length === 0 ? <p>Nenhum produto encontrado</p> : (
            <div className="grade-produtos" id={`${prefixo}-produto`}>
              {produtosVisiveis.map((produto) => (
                <button
                  key={produto.id}
                  type="button"
                  className="produto-card"
                  onClick={() => acrescentar(produto, Math.max(1, Number(quantidade) || 1))}
                >
                  <strong>{produto.nome}</strong>
                  <span>{formatarMoeda(produto.precoAtual)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="formulario__linha">
          <div>
            <label htmlFor={`${prefixo}-produto`}>Produto</label>
            <Select
              id={`${prefixo}-produto`}
              valor={produtoId}
              onChange={setProdutoId}
              opcoes={[
                { valor: '', rotulo: 'Selecione' },
                ...produtosVisiveis.map((produto) => ({ valor: String(produto.id), rotulo: produto.nome })),
              ]}
            />
          </div>
          <FormField id={`${prefixo}-quantidade`} rotulo="Quantidade" tipo="number" valor={quantidade} onChange={setQuantidade} />
        </div>
      )}
      {comValores ? null : <Botao texto="Adicionar item" variante="secundario" onClick={incluir} />}
      <h3>Itens do pedido</h3>
      {itens.length === 0 ? <p>Nenhum item adicionado.</p> : null}
      <ul className="rascunho">
        {itens.map((item) => (
          <li key={item.produtoId}>
            {comValores ? (
              <>
                <span>{item.nome}</span>
                <span>{formatarMoeda(item.preco)}</span>
                <Passo
                  valor={item.quantidade}
                  rotulo={`quantidade de ${item.nome}`}
                  onChange={(valor) => alterarQuantidade(item.produtoId, valor)}
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
      {comValores ? (
        <div className="pedido__rodape">
          <div>
            <span>{itens.length === 1 ? '1 item' : `${itens.length} itens`}</span>
            <strong>{formatarMoeda(total)}</strong>
          </div>
          <Botao texto="Lançar pedido" tipo="submit" desabilitado={itens.length === 0} />
        </div>
      ) : null}
    </div>
  )
}

function agruparMesas(pedidos) {
  const mapa = new Map()
  pedidos.forEach((pedido) => {
    const mesa = pedido.mesa ?? '—'
    const chave = String(mesa)
    if (!mapa.has(chave)) mapa.set(chave, { chave, mesa, pedidos: [] })
    mapa.get(chave).pedidos.push(pedido)
  })
  return [...mapa.values()].sort((a, b) => Number(a.mesa) - Number(b.mesa))
}

function GradeMesas({ pedidos }) {
  const [pagina, setPagina] = useState(0)
  const tamanho = 25
  const mesas = agruparMesas(pedidos)
  const totalPaginas = Math.max(1, Math.ceil(mesas.length / tamanho))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)
  const visiveis = mesas.slice(paginaAtual * tamanho, paginaAtual * tamanho + tamanho)

  return (
    <section className="pagina__painel">
      <h2>Mesas</h2>
      {mesas.length === 0 ? <p>Nenhuma mesa com pedido.</p> : null}
      <div className="grade-mesas">
        {visiveis.map((mesa) => {
          const recente = [...mesa.pedidos].sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))[0]
          return (
            <article key={mesa.chave} className="mesa-card">
              <strong>Mesa {mesa.mesa}</strong>
              <span className="pilula">#{recente?.comandaNumero ?? recente?.comandaId ?? '—'} · {mesa.pedidos.length} pedido(s)</span>
              <span>{recente?.nomeCliente}</span>
              {recente ? <Badge texto={rotuloStatus(recente.status)} variante={varianteStatus(recente.status)} /> : null}
            </article>
          )
        })}
      </div>
      {mesas.length > tamanho ? (
        <>
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
          <p>Página {paginaAtual + 1} de {totalPaginas} · até 25 mesas por página</p>
        </>
      ) : null}
    </section>
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
  const [outroNome, setOutroNome] = useState(false)
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
    setComandaId((atual) => {
      if (atual) return atual
      const primeira = listaComandas[0]
      if (!primeira) return ''
      setMesa(primeira.mesa != null ? String(primeira.mesa) : '')
      setNomeCliente(primeira.nomeCliente || '')
      return String(primeira.id)
    })
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  async function abrirComanda() {
    setErro('')
    try {
      const criada = await apiJson(endpoints.comandas, { method: 'POST', body: JSON.stringify({}) })
      setComandaId(String(criada.id))
      setMesa('')
      setNomeCliente('')
      setOutroNome(false)
      setAviso(`Comanda #${criada.numero ?? criada.id} aberta.`)
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
  const comandaAtual = comandas.find((comanda) => String(comanda.id) === comandaId)
  const comandaPronta = comandaAtual?.mesa != null && Boolean(comandaAtual?.nomeCliente)

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
            onChange={(valor) => {
              setComandaId(valor)
              setOutroNome(false)
              const escolhida = comandas.find((comanda) => String(comanda.id) === valor)
              setMesa(escolhida?.mesa != null ? String(escolhida.mesa) : '')
              setNomeCliente(escolhida?.nomeCliente || '')
            }}
            opcoes={[
              { valor: '', rotulo: 'Selecione' },
              ...comandas.map((comanda) => ({ valor: String(comanda.id), rotulo: rotuloComanda(comanda) })),
            ]}
          />
        </section>
        <form className="formulario pagina__painel" onSubmit={salvar}>
          {comandaPronta && !outroNome ? (
            <div className="pedido__resumo-comanda">
              <span className="pilula">#{comandaAtual.numero ?? comandaAtual.id} · Mesa {mesa}</span>
              <span>{nomeCliente}</span>
              <Botao texto="Outro nome" variante="fantasma" onClick={() => setOutroNome(true)} />
            </div>
          ) : (
            <>
              {comandaAtual?.mesa == null ? (
                <FormField id="mesa" rotulo="Mesa" tipo="number" valor={mesa} onChange={setMesa} obrigatorio />
              ) : null}
              <FormField id="cliente" rotulo="Nome do cliente" valor={nomeCliente} onChange={setNomeCliente} obrigatorio />
            </>
          )}
          <SeletorItens categorias={categorias} produtos={produtos} itens={itens} setItens={setItens} comValores />
        </form>
        <section className="pagina__painel">
          <h2>Pedidos desta comanda</h2>
          {daComanda.length === 0 ? <p>Nenhum pedido nesta comanda.</p> : null}
          {daComanda.map((pedido) => <CartaoPedido key={pedido.id} pedido={pedido} />)}
        </section>
        <GradeMesas pedidos={pedidos} />
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
  const [acoes, setAcoes] = useState({})
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

  function acaoDe(id) {
    return acoes[id] || { tipo: '', motivo: '' }
  }

  async function estornar(pedido) {
    const motivo = (acaoDe(pedido.id).motivo || '').trim()
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
    const motivo = (acaoDe(pedido.id).motivo || '').trim()
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
              onChange={(valor) => {
                setComandaId(valor)
                const escolhida = comandas.find((comanda) => String(comanda.id) === valor)
                setMesa(escolhida?.mesa != null ? String(escolhida.mesa) : '')
                setNomeCliente(escolhida?.nomeCliente || '')
              }}
              opcoes={[
                { valor: '', rotulo: 'Abrir comanda nova' },
                ...comandas.map((comanda) => ({ valor: String(comanda.id), rotulo: rotuloComanda(comanda) })),
              ]}
            />
            <FormField id="mesa" rotulo="Mesa" tipo="number" valor={mesa} onChange={setMesa} obrigatorio />
            <FormField id="cliente" rotulo="Nome do cliente" valor={nomeCliente} onChange={setNomeCliente} obrigatorio />
            <SeletorItens categorias={categorias} produtos={produtos} itens={itens} setItens={setItens} />
            <Botao texto="Registrar pedido" tipo="submit" desabilitado={itens.length === 0 || !usuarioId} />
          </form>
        ) : null}
        <GradeMesas pedidos={pedidos} />
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
                  <td>{rotuloUsuario(pedido)}</td>
                  <td>{numeroComanda(pedido)}</td>
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
                      <div className="pedido__acao">
                        <div className="escolha" role="radiogroup" aria-label={`Ação do pedido ${pedido.id}`}>
                          <button
                            type="button"
                            className={acaoDe(pedido.id).tipo === 'estorno' ? 'chip chip--ativo' : 'chip'}
                            onClick={() => setAcoes((atual) => ({ ...atual, [pedido.id]: { ...acaoDe(pedido.id), tipo: 'estorno' } }))}
                          >
                            Estornar
                          </button>
                          <button
                            type="button"
                            className={acaoDe(pedido.id).tipo === 'cancelamento' ? 'chip chip--ativo' : 'chip'}
                            onClick={() => setAcoes((atual) => ({ ...atual, [pedido.id]: { ...acaoDe(pedido.id), tipo: 'cancelamento' } }))}
                          >
                            Cancelar
                          </button>
                        </div>
                        {acaoDe(pedido.id).tipo ? (
                          <>
                            <FormField
                              id={`motivo-${pedido.id}`}
                              rotulo={acaoDe(pedido.id).tipo === 'estorno' ? 'Motivo do estorno' : 'Motivo do cancelamento'}
                              valor={acaoDe(pedido.id).motivo}
                              onChange={(valor) => setAcoes((atual) => ({
                                ...atual,
                                [pedido.id]: { ...acaoDe(pedido.id), motivo: valor },
                              }))}
                            />
                            <Botao
                              texto={acaoDe(pedido.id).tipo === 'estorno' ? 'Confirmar estorno' : 'Confirmar cancelamento'}
                              variante={acaoDe(pedido.id).tipo === 'estorno' ? 'perigo' : 'secundario'}
                              onClick={() => (acaoDe(pedido.id).tipo === 'estorno' ? estornar(pedido) : cancelar(pedido))}
                            />
                          </>
                        ) : null}
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
