import Checkbox from '../../atomos/atomosJSX/Checkbox'
import { agruparFuncoes, rotuloFuncao } from '../../../utils/formatacao'

function ListaFuncoes({ authorities, marcadas, onAlternar, idPrefixo = 'funcao' }) {
  return (
    <div className="lista-funcoes">
      {agruparFuncoes(authorities).map(([titulo, itens]) => (
        <div key={titulo}>
          <p className="lista-funcoes__grupo">{titulo}</p>
          <ul>
            {itens.map((authority) => (
              <li key={authority}>
                <Checkbox
                  id={`${idPrefixo}-${authority}`}
                  texto={rotuloFuncao(authority)}
                  marcado={marcadas.includes(authority)}
                  onChange={() => onAlternar(authority)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default ListaFuncoes
