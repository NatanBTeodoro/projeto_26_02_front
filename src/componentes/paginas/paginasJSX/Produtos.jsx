import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarBooleano, formatarMoeda, normalizarBusca } from '../../../utils/formatacao'
import { emVisaoGestor, lerSessao, visaoBloqueada } from '../../../utils/sessao'
import { useFuncoes } from '../../../utils/funcoes'
import ImportarCardapio from '../../organismos/organismosJSX/ImportarCardapio'

const produtoVazio = {
  categoriaId: '',
  nome: '',
  precoAtual: '',
  custoAtual: '',
}

function Produtos() {
  const [categorias, setCategorias] = useState([])
  const [produtos, setProdutos] = useState([])
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [form, setForm] = useState(produtoVazio)
  const [editando, setEditando] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const bloqueado = visaoBloqueada()
  const { tem, pronto } = useFuncoes()
  const podeEscrever = pronto && tem('CARDAPIO_ESCREVER') && !bloqueado
  const verCusto = pronto && tem('CUSTO_LER')
  const tamanho = 10

  async function carregar() {
    const [listaCategorias, listaProdutos] = await Promise.all([
      apiJson(endpoints.categorias),
      apiJson(endpoints.produtos),
    ])
    setCategorias(listaCategorias)
    setProdutos(listaProdutos)
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function criarCategoria(evento) {
    evento.preventDefault()
    setErro('')
    try {
      await apiJson(endpoints.categorias, {
        method: 'POST',
        body: JSON.stringify({ nome: nomeCategoria.trim() }),
      })
      setNomeCategoria('')
      setAviso('Categoria salva.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function alternarCategoria(categoria) {
    setErro('')
    try {
      await apiJson(endpoints.categoria(categoria.id), {
        method: 'PUT',
        body: JSON.stringify({ nome: categoria.nome, ativa: !categoria.ativa }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function salvarProduto(evento) {
    evento.preventDefault()
    setErro('')
    const corpo = {
      categoriaId: Number(form.categoriaId),
      nome: form.nome.trim(),
      precoAtual: form.precoAtual,
      custoAtual: form.custoAtual === '' ? null : form.custoAtual,
    }
    try {
      if (editando) {
        corpo.ativo = editando.ativo
        await apiJson(endpoints.produto(editando.id), { method: 'PUT', body: JSON.stringify(corpo) })
      } else {
        await apiJson(endpoints.produtos, { method: 'POST', body: JSON.stringify(corpo) })
      }
      setForm(produtoVazio)
      setEditando(null)
      setAviso(editando ? 'Produto atualizado.' : 'Produto cadastrado.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function editar(produto) {
    setEditando(produto)
    setForm({
      categoriaId: String(produto.categoriaId),
      nome: produto.nome,
      precoAtual: String(produto.precoAtual),
      custoAtual: produto.custoAtual == null ? '' : String(produto.custoAtual),
    })
  }

  async function alternarProduto(produto) {
    setErro('')
    try {
      await apiJson(endpoints.produto(produto.id), {
        method: 'PUT',
        body: JSON.stringify({
          categoriaId: produto.categoriaId,
          nome: produto.nome,
          precoAtual: produto.precoAtual,
          custoAtual: produto.custoAtual,
          ativo: !produto.ativo,
        }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  const categoriasOrdenadas = [...categorias].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
  const termo = normalizarBusca(busca.trim())
  const sugestoes = categoriaFiltro || !termo
    ? []
    : categoriasOrdenadas
      .filter((categoria) => normalizarBusca(categoria.nome).includes(termo))
      .slice(0, 8)
  const produtosFiltrados = produtos.filter((produto) => {
    if (categoriaFiltro) return String(produto.categoriaId) === String(categoriaFiltro.id)
    if (!termo) return true
    return normalizarBusca(produto.nome).includes(termo)
      || normalizarBusca(produto.categoriaNome || '').includes(termo)
  })
  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / tamanho))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)
  const produtosPagina = produtosFiltrados.slice(paginaAtual * tamanho, paginaAtual * tamanho + tamanho)

  const opcoesCategoria = [
    { valor: '', rotulo: 'Selecione' },
    ...categoriasOrdenadas.filter((categoria) => categoria.ativa).map((categoria) => ({
      valor: String(categoria.id),
      rotulo: categoria.nome,
    })),
  ]

  if (lerSessao().perfil === 'ADMINISTRADOR' && !emVisaoGestor()) {
    return <Navigate to="/restaurantes" replace />
  }

  return (
    <TemplateAutenticado rotaAtual="/produtos">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Produtos"
          descricao="Categorias e cardápio, com até 10 produtos por página. O custo digitado aqui entra nos pedidos novos."
        />
        <MensagemErro texto={erro} />
        {aviso ? <p>{aviso}</p> : null}
        {bloqueado ? <p>Restaurante fechado ou inativo: o cardápio pode ser consultado, mas não alterado.</p> : null}
        {podeEscrever ? <ImportarCardapio aoConcluir={carregar} /> : null}
        <div className="pagina__grade pagina__grade--lateral">
          <section className="pagina__painel">
            {podeEscrever ? (
            <form className="formulario" onSubmit={criarCategoria}>
              <FormField id="categoria" rotulo="Nova categoria" valor={nomeCategoria} onChange={setNomeCategoria} obrigatorio />
              <Botao texto="Salvar categoria" tipo="submit" />
            </form>
            ) : null}
            <ul>
              {categoriasOrdenadas.map((categoria) => (
                <li key={categoria.id}>
                  {categoria.nome} ({formatarBooleano(categoria.ativa)}){' '}
                  {podeEscrever ? (
                  <Botao
                    texto={categoria.ativa ? 'Inativar' : 'Reativar'}
                    variante="fantasma"
                    onClick={() => alternarCategoria(categoria)}
                  />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <section className="pagina__painel">
            {podeEscrever ? (
            <form className="formulario" onSubmit={salvarProduto}>
              <FormFieldSelect id="categoria-produto" rotulo="Categoria" valor={form.categoriaId} onChange={(valor) => alterar('categoriaId', valor)} opcoes={opcoesCategoria} />
              <FormField id="nome" rotulo="Nome" valor={form.nome} onChange={(valor) => alterar('nome', valor)} obrigatorio />
              <div className="formulario__linha">
                <FormField id="preco" rotulo="Preço" tipo="number" valor={form.precoAtual} onChange={(valor) => alterar('precoAtual', valor)} obrigatorio />
                {verCusto ? <FormField id="custo" rotulo="Custo" tipo="number" valor={form.custoAtual} onChange={(valor) => alterar('custoAtual', valor)} /> : null}
              </div>
              <div className="formulario__acoes">
                <Botao texto={editando ? 'Atualizar produto' : 'Cadastrar produto'} tipo="submit" />
                {editando ? (
                  <Botao texto="Cancelar" variante="fantasma" onClick={() => { setEditando(null); setForm(produtoVazio) }} />
                ) : null}
              </div>
            </form>
            ) : null}
            <div className="busca-categoria">
              <FormField
                id="busca-produto"
                rotulo="Buscar"
                valor={busca}
                onChange={(valor) => {
                  setBusca(valor)
                  setCategoriaFiltro(null)
                  setPagina(0)
                }}
                placeholder="Nome ou categoria"
              />
              {categoriaFiltro ? (
                <Botao
                  texto={`Limpar categoria: ${categoriaFiltro.nome}`}
                  variante="fantasma"
                  onClick={() => { setCategoriaFiltro(null); setBusca(''); setPagina(0) }}
                />
              ) : null}
              {sugestoes.length > 0 ? (
                <ul className="sugestoes" role="listbox" aria-label="Categorias">
                  {sugestoes.map((categoria) => (
                    <li key={categoria.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoriaFiltro(categoria)
                          setBusca(categoria.nome)
                          setPagina(0)
                        }}
                      >
                        {categoria.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Tabela
              linhas={produtosPagina}
              colunas={[
                { chave: 'nome', rotulo: 'Nome' },
                { chave: 'categoriaNome', rotulo: 'Categoria' },
                { chave: 'precoAtual', rotulo: 'Preço', papel: 'numero', celula: (produto) => formatarMoeda(produto.precoAtual) },
                ...(verCusto ? [{ chave: 'custoAtual', rotulo: 'Custo', papel: 'numero', celula: (produto) => formatarMoeda(produto.custoAtual) }] : []),
                { chave: 'ativo', rotulo: 'Ativo', celula: (produto) => formatarBooleano(produto.ativo) },
                {
                  chave: 'acao',
                  rotulo: '',
                  papel: 'acoes',
                  celula: (produto) => (podeEscrever ? (
                    <>
                      <Botao texto="Editar" variante="secundario" onClick={() => editar(produto)} />
                      <Botao texto={produto.ativo ? 'Inativar' : 'Reativar'} variante="fantasma" onClick={() => alternarProduto(produto)} />
                    </>
                  ) : null),
                },
              ]}
            />
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
            <p>Página {paginaAtual + 1} de {totalPaginas} · até 10 produtos por página</p>
          </section>
        </div>
      </div>
    </TemplateAutenticado>
  )
}

export default Produtos
