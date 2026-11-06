import { useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import GraficoMatriz from '../../organismos/organismosJSX/GraficoMatriz'
import { apiArquivo, apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarMoeda, LEGENDAS_CLASSE, rotuloClasse } from '../../../utils/formatacao'

function iso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function Matriz() {
  const hoje = new Date()
  const [de, setDe] = useState(iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)))
  const [ate, setAte] = useState(iso(hoje))
  const [resultado, setResultado] = useState(null)
  const [classeFiltro, setClasseFiltro] = useState('')
  const [erro, setErro] = useState('')

  async function consultar(evento) {
    evento.preventDefault()
    setErro('')
    try {
      const corpo = await apiJson(`${endpoints.analise}?de=${de}&ate=${ate}`)
      setResultado(corpo)
    } catch (falha) {
      setResultado(null)
      setErro(falha.message)
    }
  }

  async function exportar() {
    setErro('')
    try {
      const blob = await apiArquivo(`${endpoints.analiseCsv}?de=${de}&ate=${ate}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `matriz-${de}_a_${ate}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/matriz">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Matriz"
          descricao="Popularidade, margem e classe são calculadas no servidor para o período."
        />
        <MensagemErro texto={erro} />
        <section className="pagina__painel">
          <h2>O que cada classe significa</h2>
          <ul className="legenda">
            {LEGENDAS_CLASSE.map(([classe, texto]) => (
              <li key={classe}>
                <strong>{rotuloClasse(classe)}.</strong> {texto}
              </li>
            ))}
          </ul>
        </section>
        <form className="formulario pagina__painel" onSubmit={consultar}>
          <div className="formulario__linha">
            <FormField id="de" rotulo="De" tipo="date" valor={de} onChange={setDe} obrigatorio />
            <FormField id="ate" rotulo="Até" tipo="date" valor={ate} onChange={setAte} obrigatorio />
          </div>
          <div className="formulario__acoes">
            <Botao texto="Calcular" tipo="submit" />
            <Botao texto="Baixar CSV" variante="secundario" onClick={exportar} />
          </div>
        </form>
        {resultado ? (
          <>
            <section className="pagina__painel">
              <h2>Gráfico</h2>
              <GraficoMatriz analise={resultado} />
            </section>
            <section className="pagina__painel">
              <p>
                {resultado.quantidadePedidos} pedidos · receita {formatarMoeda(resultado.receita)} · ticket médio {formatarMoeda(resultado.ticketMedio)}
              </p>
              <p>A sugestão depende só da classe. É uma orientação do método, não uma garantia de resultado.</p>
              <div>
                <label htmlFor="classe">Mostrar</label>
                <Select
                  id="classe"
                  valor={classeFiltro}
                  onChange={setClasseFiltro}
                  opcoes={[
                    { valor: '', rotulo: 'Todas as classes' },
                    ...LEGENDAS_CLASSE.map(([classe]) => ({ valor: classe, rotulo: rotuloClasse(classe) })),
                  ]}
                />
              </div>
              <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Popularidade</th>
                    <th>Margem</th>
                    <th className="tabela__classe">Classe</th>
                    <th>Sugestão</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.itens
                    .filter((item) => !classeFiltro || item.classe === classeFiltro)
                    .map((item) => (
                      <tr key={item.produtoId}>
                        <td>{item.nome}</td>
                        <td>{item.categoria}</td>
                        <td>{item.quantidade}</td>
                        <td>{item.popularidade}%</td>
                        <td>{formatarMoeda(item.margem)}</td>
                        <td className="tabela__classe"><span className={`selo selo--${item.classe}`}>{rotuloClasse(item.classe)}</span></td>
                        <td>{item.recomendacao}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

export default Matriz
