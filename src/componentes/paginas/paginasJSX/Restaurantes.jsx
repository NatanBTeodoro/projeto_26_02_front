import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { gravarVisao, limparVisao } from '../../../utils/sessao'
import { rotuloStatus } from '../../../utils/formatacao'

function Restaurantes() {
  const [restaurantes, setRestaurantes] = useState([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (localStorage.getItem('restauranteId')) {
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
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Situação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {restaurantes.map((restaurante) => (
              <tr key={restaurante.id}>
                <td>
                  {restaurante.nome}
                  {restaurante.status === 'FECHADO' ? ' (Fechado)' : ''}
                </td>
                <td>{rotuloStatus(restaurante.status)}</td>
                <td>
                  <Botao texto="Ver como gestor" onClick={() => abrir(restaurante)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {restaurantes.length === 0 ? <p>Nenhum restaurante cadastrado.</p> : null}
      </div>
    </TemplateAutenticado>
  )
}

export default Restaurantes
