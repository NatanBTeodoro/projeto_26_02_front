import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import Badge from '../../atomos/atomosJSX/Badge'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarMoeda } from '../../../utils/formatacao'

function agrupar(produtos) {
  const mapa = new Map()
  produtos.forEach((produto) => {
    const categoria = produto.categoriaNome || 'Sem categoria'
    if (!mapa.has(categoria)) mapa.set(categoria, [])
    mapa.get(categoria).push(produto)
  })
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([categoria, itens]) => ({
      categoria,
      itens: [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    }))
}

function Cardapio() {
  const navigate = useNavigate()
  const [grupos, setGrupos] = useState([])
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    apiJson(endpoints.produtos)
      .then((lista) => setGrupos(agrupar(lista)))
      .catch((falha) => setErro(falha.message))
      .finally(() => setPronto(true))
  }, [])

  function irPara(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <TemplateAutenticado
      rotaAtual="/cardapio"
      foco={{ titulo: 'Cardápio', onVoltar: () => navigate('/pedidos') }}
    >
      <div className="pagina">
        <CabecalhoPagina
          titulo="Cardápio"
          descricao="Produtos agrupados por categoria."
        />
        <MensagemErro texto={erro} />
        {pronto && grupos.length === 0 && !erro ? <p>Nenhum produto no cardápio.</p> : null}
        {grupos.length > 0 ? (
          <nav className="chips chips--fixos" aria-label="Categorias do cardápio">
            {grupos.map((grupo, indice) => (
              <button key={grupo.categoria} type="button" className="chip" onClick={() => irPara(`categoria-${indice}`)}>
                {grupo.categoria}
              </button>
            ))}
          </nav>
        ) : null}
        {grupos.map((grupo, indice) => (
          <section key={grupo.categoria} id={`categoria-${indice}`} className="pagina__painel cardapio__secao">
            <h2>{grupo.categoria}</h2>
            <div className="cardapio__lista">
              {grupo.itens.map((produto) => (
                <article key={produto.id} className={produto.ativo ? 'cardapio__item' : 'cardapio__item cardapio__item--indisponivel'}>
                  <div>
                    <span className="cardapio__nome">{produto.nome}</span>
                    {produto.descricao ? <p>{produto.descricao}</p> : null}
                    {produto.ativo ? null : <Badge texto="Indisponível" variante="erro" />}
                  </div>
                  <span className="cardapio__preco">
                    {formatarMoeda(produto.precoAtual)}
                    {produto.custoAtual != null ? ` · custo ${formatarMoeda(produto.custoAtual)}` : ''}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TemplateAutenticado>
  )
}

export default Cardapio
