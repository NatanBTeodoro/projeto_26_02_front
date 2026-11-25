const PAPEIS = {
  numero: 'tabela__numero',
  acoes: 'tabela__acoes',
  texto: 'tabela__texto',
  classe: 'tabela__classe',
}

function classesDaColuna(coluna) {
  return [PAPEIS[coluna.papel] || '', coluna.classe || ''].filter(Boolean).join(' ')
}

function Tabela({ colunas, linhas, classe = '', vazio = 'Nenhum registro.' }) {
  return (
    <div className="tabela-rolagem">
      <table className={classe ? `tabela ${classe}` : 'tabela'}>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th
                key={coluna.chave}
                className={classesDaColuna(coluna)}
                style={coluna.largura ? { width: coluna.largura } : undefined}
                aria-label={coluna.rotulo ? undefined : (coluna.papel === 'acoes' ? 'Ações' : undefined)}
              >
                {coluna.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td className="tabela__vazio" colSpan={colunas.length}>{vazio}</td>
            </tr>
          ) : linhas.map((linha, indice) => (
            <tr key={linha.id ?? linha.produtoId ?? indice}>
              {colunas.map((coluna) => {
                const conteudo = coluna.celula ? coluna.celula(linha) : linha[coluna.chave]
                return (
                  <td
                    key={coluna.chave}
                    className={classesDaColuna(coluna)}
                    style={coluna.largura ? { width: coluna.largura } : undefined}
                  >
                    {coluna.papel === 'acoes' ? <div className="tabela__acoes-lista">{conteudo}</div> : conteudo}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Tabela
