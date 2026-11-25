import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { gravarVisao, lerVisao, limparVisao } from '../../../utils/sessao'
import { rotuloStatus } from '../../../utils/formatacao'

function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (lerVisao().restauranteId) {
      limparVisao()
      window.location.reload()
      return
    }
    apiJson(endpoints.restaurantes)
      .then(setRestaurantes)
      .catch((falha) => setErro(falha.message))
  }, [])

  function abrir(restaurante) {
    gravarVisao(restaurante)
    window.location.href = '/dashboard'
  }

  return (
    <TemplateAutenticado rotaAtual="/restaurantes">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Restaurantes"
          descricao="Abra um restaurante para ver o sistema com a visão de gestor, inclusive a matriz de Kasavana & Smith."
        />
        <MensagemErro texto={erro} />
        <Tabela
          linhas={restaurantes}
          vazio="Nenhum restaurante cadastrado."
          colunas={[
            { chave: 'nome', rotulo: 'Nome', celula: (restaurante) => `${restaurante.nome}${restaurante.status === 'FECHADO' ? ' (Fechado)' : ''}` },
            { chave: 'status', rotulo: 'Situação', celula: (restaurante) => rotuloStatus(restaurante.status) },
            { chave: 'acao', rotulo: '', papel: 'acoes', celula: (restaurante) => <Botao texto="Ver como gestor" onClick={() => abrir(restaurante)} /> },
          ]}
        />
      </div>
    </TemplateAutenticado>
  )
}

export default Restaurantes
