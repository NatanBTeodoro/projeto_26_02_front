import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import Label from '../../atomos/atomosJSX/Label'
import Badge from '../../atomos/atomosJSX/Badge'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import CartaoPedido from '../../moleculas/moleculasJSX/CartaoPedido'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { formatarDataHora, formatarHora, formatarMoeda, normalizarBusca, rotuloStatus, totalPedido, varianteStatus } from '../../../utils/formatacao'
import '../paginasCSS/PedidosGestor.css'

function rotuloComanda(comanda) {
  return `Comanda #${comanda.numero ?? comanda.id}`
}

function numeroComanda(pedido) {
  if (pedido.comandaNumero != null) return `#${pedido.comandaNumero}`
  if (pedido.comandaId) return `#${pedido.comandaId}`
  return '—'
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

function statusMesa(mesa, comandas) {
  if (mesa.pedidos.some((pedido) => pedido.status === 'ATIVO')) {
    return { texto: 'Ativo', variante: 'sucesso' }
  }
  const aberta = (comandas || []).some((comanda) => comanda.aberta && String(comanda.mesa) === String(mesa.mesa))
  if (aberta) return { texto: 'Aguardando', variante: 'incompleto' }
  return { texto: 'Finalizado', variante: 'neutro' }
}

function GradeMesas({ pedidos, comandas = [], mesaSelecionada = '', onSelecionar }) {
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
          const numero = recente?.comandaNumero ?? recente?.comandaId ?? '—'
          const clientes = [...new Set(mesa.pedidos.map((pedido) => pedido.nomeCliente).filter(Boolean))].join(', ')
          const selo = onSelecionar
            ? statusMesa(mesa, comandas)
            : { texto: rotuloStatus(recente?.status), variante: varianteStatus(recente?.status) }
          const ativa = mesaSelecionada !== '' && String(mesa.mesa) === String(mesaSelecionada)
          const conteudo = (
            <>
              <strong>Mesa {mesa.mesa}</strong>
              <span className="pilula">#{numero} · {mesa.pedidos.length} {mesa.pedidos.length === 1 ? 'pedido' : 'pedidos'}</span>
              <span>{clientes}</span>
              {recente ? <Badge texto={selo.texto} variante={selo.variante} /> : null}
            </>
          )
          if (!onSelecionar) {
            return <article key={mesa.chave} className="mesa-card">{conteudo}</article>
          }
          return (
            <button
              key={mesa.chave}
              type="button"
              className={ativa ? 'mesa-card mesa-card--ativa' : 'mesa-card'}
              aria-pressed={ativa}
              onClick={() => onSelecionar(mesa.mesa)}
            >
              {conteudo}
            </button>
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
          <p>Página {paginaAtual + 1} de {totalPaginas}</p>
        </>
      ) : null}
    </section>
  )
}

function diaChave(valor) {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(data)
}

function rotuloDia(chave) {
  if (!chave) return 'Sem data'
  if (chave === diaChave(new Date())) return 'Hoje'
  const [ano, mes, dia] = chave.split('-')
  return `${dia}/${mes}/${ano}`
}

function seloPedido(pedido) {
  if (pedido.status === 'CANCELADO') return { texto: 'Cancelado', variante: 'erro' }
  if (pedido.status === 'ESTORNADO') return { texto: 'Estornado', variante: 'incompleto' }
  if (pedido.status === 'PAGO') return { texto: 'Pago', variante: 'sucesso' }
  if (pedido.alteracoes?.length) return { texto: 'Editado', variante: 'marca' }
  return { texto: 'Ativo', variante: 'sucesso' }
}

function MenuAcoes({ onEditar, onEstornar, onCancelar, somenteEstorno = false }) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined
    function fechar(evento) {
      if (!caixa.current?.contains(evento.target)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto])

  function escolher(acao) {
    setAberto(false)
    acao()
  }

  return (
    <div className="menu-acoes" ref={caixa}>
      <button
        className="menu-acoes__abrir"
        type="button"
        aria-label="Ações"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        ⋯
      </button>
      {aberto ? (
        <div className="menu-acoes__lista" role="menu">
          {somenteEstorno ? null : <button type="button" role="menuitem" onClick={() => escolher(onEditar)}>Editar</button>}
          <button type="button" role="menuitem" onClick={() => escolher(onEstornar)}>Estornar</button>
          {somenteEstorno ? null : <button type="button" role="menuitem" onClick={() => escolher(onCancelar)}>Cancelar</button>}
        </div>
      ) : null}
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
              ...comandas.filter((comanda) => comanda.aberta).map((comanda) => ({ valor: String(comanda.id), rotulo: rotuloComanda(comanda) })),
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
  const [todasComandas, setTodasComandas] = useState(null)
  const [busca, setBusca] = useState('')
  const [mesaFiltro, setMesaFiltro] = useState('')
  const [comandaFiltro, setComandaFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [modal, setModal] = useState(null)
  const [fechando, setFechando] = useState(null)
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
    const operadores = listaUsuarios.filter((usuario) => usuario.perfil === 'USUARIO')
    setUsuarios(operadores.filter((usuario) => usuario.ativo))
    setCategorias(listaCategorias.filter((categoria) => categoria.ativa))
    setProdutos(listaProdutos.filter((produto) => produto.ativo))
    const listas = await Promise.all(
      operadores.map((usuario) => apiJson(`${endpoints.comandas}?usuarioId=${usuario.id}`).catch(() => null)),
    )
    const carregadas = listas.filter((lista) => Array.isArray(lista))
    setTodasComandas(carregadas.length ? carregadas.flat() : null)
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

  useEffect(() => {
    if (!modal && !editando) return undefined
    function tecla(evento) {
      if (evento.key !== 'Escape') return
      setModal(null)
      setEditando(null)
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [modal, editando])

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

  function abrirAcao(pedido, tipo) {
    setEditando(null)
    setModal({ id: pedido.id, tipo, motivo: '' })
  }

  async function confirmarModal(evento) {
    evento.preventDefault()
    const motivo = (modal?.motivo || '').trim()
    if (!modal || !motivo) return
    setErro('')
    const caminho = modal.tipo === 'estorno' ? endpoints.estorno(modal.id) : endpoints.cancelamento(modal.id)
    try {
      await apiJson(caminho, { method: 'POST', body: JSON.stringify({ motivo }) })
      setModal(null)
      setAviso(modal.tipo === 'estorno' ? 'Pedido estornado.' : 'Pedido cancelado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function iniciarEdicao(pedido) {
    setModal(null)
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

  async function confirmarFechamento(evento) {
    evento.preventDefault()
    if (!fechando) return
    setErro('')
    try {
      await apiJson(endpoints.fecharComanda(fechando.id), { method: 'POST' })
      setFechando(null)
      setAviso(`Comanda #${fechando.numero ?? fechando.id} fechada. Os pedidos ativos passaram a pagos e entram nas análises.`)
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  const abertas = (todasComandas || []).filter((comanda) => comanda.aberta)
  const ativos = pedidos.filter((pedido) => pedido.status === 'ATIVO')
  const pagos = pedidos.filter((pedido) => pedido.status === 'PAGO')
  const comandasAbertas = todasComandas
    ? abertas.length
    : new Set(ativos.map((pedido) => pedido.comandaId).filter(Boolean)).size
  const mesasOcupadas = todasComandas
    ? new Set(abertas.map((comanda) => comanda.mesa).filter((valor) => valor != null)).size
    : new Set(ativos.map((pedido) => pedido.mesa).filter((valor) => valor != null)).size
  const itensVendidos = pagos.reduce(
    (soma, pedido) => soma + (pedido.itens || []).reduce((parcial, item) => parcial + Number(item.quantidade || 0), 0),
    0,
  )
  const termo = normalizarBusca(busca)
  const visiveis = [...pedidos]
    .filter((pedido) => {
      if (mesaFiltro && String(pedido.mesa) !== String(mesaFiltro)) return false
      if (comandaFiltro && String(pedido.comandaId) !== comandaFiltro) return false
      if (usuarioFiltro && String(pedido.usuarioId) !== usuarioFiltro) return false
      if (statusFiltro === 'EDITADO' && !(pedido.status === 'ATIVO' && pedido.alteracoes?.length)) return false
      if (statusFiltro && statusFiltro !== 'EDITADO' && pedido.status !== statusFiltro) return false
      if (!termo) return true
      const texto = normalizarBusca(`${pedido.nomeCliente || ''} ${(pedido.itens || []).map((item) => item.produtoNome).join(' ')}`)
      return texto.includes(termo)
    })
    .sort((a, b) => String(b.dataHora).localeCompare(String(a.dataHora)))
  const grupos = []
  visiveis.forEach((pedido) => {
    const chave = diaChave(pedido.dataHora)
    const grupo = grupos.find((item) => item.chave === chave)
    if (grupo) grupo.pedidos.push(pedido)
    else grupos.push({ chave, pedidos: [pedido] })
  })
  const mesasOpcoes = [...new Set(pedidos.map((pedido) => pedido.mesa).filter((valor) => valor != null))]
    .sort((a, b) => Number(a) - Number(b))
  const comandasOpcoes = [...new Map(
    pedidos.filter((pedido) => pedido.comandaId).map((pedido) => [pedido.comandaId, `#${pedido.comandaNumero ?? pedido.comandaId}`]),
  ).entries()]
  const usuariosOpcoes = [...new Map(
    pedidos.filter((pedido) => pedido.usuarioId).map((pedido) => [pedido.usuarioId, pedido.usuarioNome || 'Usuário removido']),
  ).entries()]
  const pedidoModal = modal ? pedidos.find((pedido) => pedido.id === modal.id) : null

  function limparFiltros() {
    setBusca('')
    setMesaFiltro('')
    setComandaFiltro('')
    setStatusFiltro('')
    setUsuarioFiltro('')
  }

  return (
    <TemplateAutenticado rotaAtual="/pedidos">
      <div className="pagina pedidos-gestor">
        <div className="pedidos-topo">
          <CabecalhoPagina
            titulo="Pedidos"
            descricao="Cada item mostra o valor unitário e o total da linha. Fechar a comanda marca os pedidos ativos como pagos; só os pagos entram nas análises."
          />
          {!bloqueado ? (
            <Botao
              texto={mostrarFormulario ? 'Fechar lançamento' : 'Registrar pedido como usuário'}
              onClick={() => setMostrarFormulario((atual) => !atual)}
            />
          ) : null}
        </div>
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        {bloqueado ? <p>Restaurante fechado ou inativo: os pedidos podem ser consultados, mas não alterados.</p> : null}
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
                ...comandas.filter((comanda) => comanda.aberta).map((comanda) => ({ valor: String(comanda.id), rotulo: rotuloComanda(comanda) })),
              ]}
            />
            <FormField id="mesa" rotulo="Mesa" tipo="number" valor={mesa} onChange={setMesa} obrigatorio />
            <FormField id="cliente" rotulo="Nome do cliente" valor={nomeCliente} onChange={setNomeCliente} obrigatorio />
            <SeletorItens categorias={categorias} produtos={produtos} itens={itens} setItens={setItens} />
            <Botao texto="Registrar pedido" tipo="submit" desabilitado={itens.length === 0 || !usuarioId} />
          </form>
        ) : null}
        <section className="cartoes pedidos-metricas">
          <article className="pagina__painel metrica">
            <strong>{pedidos.length}</strong>
            <span>Total de pedidos</span>
          </article>
          <article className="pagina__painel metrica">
            <strong>{comandasAbertas}</strong>
            <span>Comandas abertas</span>
          </article>
          <article className="pagina__painel metrica">
            <strong>{mesasOcupadas}</strong>
            <span>Mesas ocupadas</span>
          </article>
          <article className="pagina__painel metrica">
            <strong>{itensVendidos}</strong>
            <span>Itens vendidos (pagos)</span>
          </article>
        </section>
        {abertas.length ? (
          <section className="pagina__painel comandas-fechar">
            <h2>Comandas abertas</h2>
            <p>Fechar a comanda marca os pedidos ativos como pagos. Pedidos ainda abertos não entram nas análises.</p>
            <ul>
              {abertas.map((comanda) => (
                <li key={comanda.id}>
                  <span>
                    #{comanda.numero ?? comanda.id}
                    {' · Mesa '}
                    {comanda.mesa ?? '—'}
                    {' · '}
                    {comanda.nomeCliente || 'Sem cliente'}
                  </span>
                  <Botao texto="Fechar" variante="secundario" desabilitado={bloqueado} onClick={() => setFechando(comanda)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <GradeMesas
          pedidos={pedidos}
          comandas={todasComandas || []}
          mesaSelecionada={mesaFiltro}
          onSelecionar={(mesaEscolhida) => setMesaFiltro((atual) => (
            String(atual) === String(mesaEscolhida) ? '' : String(mesaEscolhida)
          ))}
        />
        <section className="pagina__painel lista-pedidos">
          <div className="filtros-pedidos">
            <FormField id="busca-pedido" rotulo="Busca" valor={busca} onChange={setBusca} placeholder="Cliente ou item" />
            <div className="form-field">
              <Label htmlFor="filtro-mesa" texto="Mesa" />
              <Select
                id="filtro-mesa"
                valor={mesaFiltro}
                onChange={setMesaFiltro}
                opcoes={[{ valor: '', rotulo: 'Todas' }, ...mesasOpcoes.map((valor) => ({ valor: String(valor), rotulo: `Mesa ${valor}` }))]}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="filtro-comanda" texto="Comanda" />
              <Select
                id="filtro-comanda"
                valor={comandaFiltro}
                onChange={setComandaFiltro}
                opcoes={[{ valor: '', rotulo: 'Todas' }, ...comandasOpcoes.map(([id, rotulo]) => ({ valor: String(id), rotulo }))]}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="filtro-status" texto="Status" />
              <Select
                id="filtro-status"
                valor={statusFiltro}
                onChange={setStatusFiltro}
                opcoes={[
                  { valor: '', rotulo: 'Todos' },
                  { valor: 'ATIVO', rotulo: 'Ativo' },
                  { valor: 'PAGO', rotulo: 'Pago' },
                  { valor: 'EDITADO', rotulo: 'Editado' },
                  { valor: 'ESTORNADO', rotulo: 'Estornado' },
                  { valor: 'CANCELADO', rotulo: 'Cancelado' },
                ]}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="filtro-usuario" texto="Usuário" />
              <Select
                id="filtro-usuario"
                valor={usuarioFiltro}
                onChange={setUsuarioFiltro}
                opcoes={[{ valor: '', rotulo: 'Todos' }, ...usuariosOpcoes.map(([id, rotulo]) => ({ valor: String(id), rotulo }))]}
              />
            </div>
            <Botao texto="Limpar filtros" variante="fantasma" onClick={limparFiltros} />
          </div>
          {visiveis.length === 0 ? <p>{pedidos.length === 0 ? 'Nenhum pedido registrado.' : 'Nenhum pedido com esses filtros.'}</p> : null}
          {grupos.map((grupo) => (
            <div key={grupo.chave || 'sem-data'}>
              <h3 className="pedido-dia">{rotuloDia(grupo.chave)}</h3>
              {grupo.pedidos.map((pedido) => {
                const selo = seloPedido(pedido)
                const encerrado = pedido.status === 'ESTORNADO' || pedido.status === 'CANCELADO'
                return (
                  <article key={pedido.id} className={encerrado ? 'pedido-linha pedido-linha--encerrado' : 'pedido-linha'}>
                    <div className="pedido-linha__quando">
                      <time className="pedido-linha__hora" dateTime={pedido.dataHora}>{formatarHora(pedido.dataHora)}</time>
                    </div>
                    <div>
                      <div className="pedido-card__topo">
                        <span className="pilula">{numeroComanda(pedido)} · Mesa {pedido.mesa ?? '—'}</span>
                        <strong>{pedido.nomeCliente}</strong>
                        <Badge texto={selo.texto} variante={selo.variante} />
                      </div>
                      <p className="pedido-linha__quem">por {rotuloUsuario(pedido)}</p>
                      <ul className="pedido-linha__itens">
                        {(pedido.itens || []).map((item) => (
                          <li key={item.id}>
                            <strong className="pedido-linha__qtd">{item.quantidade}×</strong>
                            <span className="pedido-linha__nome">{item.produtoNome}</span>
                            <span className="pedido-linha__precos">
                              <span>Unitário {formatarMoeda(item.precoUnitario)}</span>
                              <strong>Total {formatarMoeda(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}</strong>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="pedido-linha__total">Total {formatarMoeda(totalPedido(pedido))}</p>
                      {pedido.status === 'ESTORNADO' ? (
                        <p className="pedido-linha__nota">
                          Estorno: {pedido.motivoEstorno} · {pedido.autorEstorno || '—'} · {formatarDataHora(pedido.dataHoraEstorno)}
                        </p>
                      ) : null}
                      {pedido.status === 'CANCELADO' ? (
                        <p className="pedido-linha__nota">
                          Cancelamento: {pedido.motivoCancelamento} · {pedido.autorCancelamento || '—'} · {formatarDataHora(pedido.dataHoraCancelamento)}
                        </p>
                      ) : null}
                      {pedido.alteracoes?.map((alteracao) => (
                        <p key={alteracao.id} className="pedido-linha__nota">
                          {formatarDataHora(alteracao.dataHora)} · {alteracao.autor}: {alteracao.descricao} ({alteracao.motivo})
                        </p>
                      ))}
                    </div>
                    {(pedido.status === 'ATIVO' || pedido.status === 'PAGO') && !bloqueado ? (
                      <MenuAcoes
                        somenteEstorno={pedido.status === 'PAGO'}
                        onEditar={() => iniciarEdicao(pedido)}
                        onEstornar={() => abrirAcao(pedido, 'estorno')}
                        onCancelar={() => abrirAcao(pedido, 'cancelamento')}
                      />
                    ) : <span />}
                  </article>
                )
              })}
            </div>
          ))}
        </section>
        {modal && pedidoModal ? (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
            <button className="modal__velo" type="button" aria-label="Voltar" onClick={() => setModal(null)} />
            <form className="modal__caixa" onSubmit={confirmarModal}>
              <h2 id="modal-titulo">{modal.tipo === 'estorno' ? 'Estornar pedido' : 'Cancelar pedido'}</h2>
              <p>{numeroComanda(pedidoModal)} · Mesa {pedidoModal.mesa ?? '—'} · {pedidoModal.nomeCliente}</p>
              <FormField
                id="motivo-acao"
                rotulo={modal.tipo === 'estorno' ? 'Motivo do estorno' : 'Motivo do cancelamento'}
                valor={modal.motivo}
                onChange={(valor) => setModal((atual) => (atual ? { ...atual, motivo: valor } : atual))}
                obrigatorio
              />
              <div className="formulario__acoes">
                <Botao texto="Confirmar" tipo="submit" desabilitado={!modal.motivo.trim()} />
                <Botao texto="Voltar" variante="fantasma" onClick={() => setModal(null)} />
              </div>
            </form>
          </div>
        ) : null}
        {editando && !bloqueado ? (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-edicao">
            <button className="modal__velo" type="button" aria-label="Voltar" onClick={() => setEditando(null)} />
            <form className="modal__caixa modal__caixa--larga" onSubmit={salvarEdicao}>
              <h2 id="modal-edicao">Editar pedido</h2>
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
                <Botao
                  texto="Confirmar"
                  tipo="submit"
                  desabilitado={!motivoEdicao.trim() || itensEdicao.length === 0 || !String(mesaEdicao).trim() || !clienteEdicao.trim()}
                />
                <Botao texto="Voltar" variante="fantasma" onClick={() => setEditando(null)} />
              </div>
            </form>
          </div>
        ) : null}
        {fechando ? (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-fechar">
            <button className="modal__velo" type="button" aria-label="Voltar" onClick={() => setFechando(null)} />
            <form className="modal__caixa" onSubmit={confirmarFechamento}>
              <h2 id="modal-fechar">Fechar a comanda #{fechando.numero ?? fechando.id}?</h2>
              <p>Os pedidos ativos passam a pagos e entram nas análises. A comanda deixa de receber lançamentos.</p>
              <div className="formulario__acoes">
                <Botao texto="Confirmar" tipo="submit" />
                <Botao texto="Voltar" variante="fantasma" onClick={() => setFechando(null)} />
              </div>
            </form>
          </div>
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
