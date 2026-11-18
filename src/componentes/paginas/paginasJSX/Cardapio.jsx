import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarMoeda } from '../../../utils/formatacao'

function agrupar(produtos) {
  const mapa = new Map()
  produtos.filter((produto) => produto.ativo).forEach((produto) => {
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

  return (
    <TemplateAutenticado
      rotaAtual="/cardapio"
      foco={{ titulo: 'Cardápio', onVoltar: () => navigate('/pedidos') }}
    >
      <div className="pagina">
        <CabecalhoPagina
          titulo="Cardápio"
          descricao="Produtos ativos, agrupados por categoria."
        />
        <MensagemErro texto={erro} />
        {pronto && grupos.length === 0 && !erro ? <p>Nenhum produto ativo.</p> : null}
        {grupos.map((grupo) => (
          <section key={grupo.categoria} className="pagina__painel">
            <h2>{grupo.categoria}</h2>
            {grupo.itens.map((produto) => (
              <article key={produto.id} className="cardapio__item">
                <div>
                  <strong>{produto.nome}</strong>
                  {produto.descricao ? <p>{produto.descricao}</p> : null}
                </div>
                <span>{formatarMoeda(produto.precoAtual)}</span>
              </article>
            ))}
          </section>
        ))}
      </div>
    </TemplateAutenticado>
  )
}

export default Cardapio
