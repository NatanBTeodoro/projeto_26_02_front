import { useState } from 'react'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiArquivo, apiFormulario } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarMoeda } from '../../../utils/formatacao'

function textoSituacao(linha) {
  if (linha.situacao === 'ERRO') return 'Erro'
  if (linha.situacao === 'ATUALIZAR') return 'Atualizar'
  if (linha.categoriaNova) return 'Criar, com categoria nova'
  return 'Criar'
}

function diferenca(anterior, novo) {
  if (anterior == null && novo == null) return '—'
  if (anterior != null && novo != null && Number(anterior) === Number(novo)) return formatarMoeda(novo)
  return `${formatarMoeda(anterior)} → ${formatarMoeda(novo)}`
}

function ImportarCardapio({ aoConcluir }) {
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [modo, setModo] = useState('CANCELAR_TUDO')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function baixarModelo() {
    setErro('')
    try {
      const blob = await apiArquivo(endpoints.modeloCardapio)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'modelo-cardapio.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function prever(evento) {
    const escolhido = evento.target.files?.[0]
    setArquivo(escolhido || null)
    setPrevia(null)
    setAviso('')
    setErro('')
    if (!escolhido) return
    setEnviando(true)
    try {
      const dados = new FormData()
      dados.append('arquivo', escolhido)
      setPrevia(await apiFormulario(endpoints.preverCardapio, dados))
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  async function confirmar() {
    if (!arquivo) return
    setErro('')
    setAviso('')
    setEnviando(true)
    try {
      const dados = new FormData()
      dados.append('arquivo', arquivo)
      dados.append('modo', modo)
      const resultado = await apiFormulario(endpoints.confirmarCardapio, dados)
      setPrevia(resultado)
      if (resultado.aplicado) {
        setAviso(resultado.gravados
          ? `${resultado.gravados} produto(s) gravados.`
          : 'Nenhum produto válido para gravar.')
        setArquivo(null)
        if (resultado.gravados && aoConcluir) await aoConcluir()
      } else {
        setAviso('Nada foi gravado. Há erros e a opção escolhida é cancelar tudo.')
      }
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  const resumo = previa?.resumo
  const podeConfirmar = Boolean(previa) && !enviando && (
    modo === 'SOMENTE_VALIDAS'
      ? (resumo.criar + resumo.atualizar) > 0
      : resumo.erros === 0 && (resumo.criar + resumo.atualizar) > 0
  )

  return (
    <section className="pagina__painel">
      <h2>Importar cardápio</h2>
      <p>Colunas fixas: categoria, nome, preco e custo. A segunda linha do modelo é um exemplo.</p>
      <MensagemErro texto={erro} />
      {aviso ? <p>{aviso}</p> : null}
      <div className="formulario__acoes">
        <Botao texto="Baixar modelo" variante="secundario" onClick={baixarModelo} />
        <label className="botao botao--primario" htmlFor="arquivo-cardapio">Escolher arquivo</label>
        <input id="arquivo-cardapio" className="arquivo-cardapio" type="file" accept=".csv,.xlsx" onChange={prever} />
      </div>
      {arquivo ? <p>{arquivo.name}</p> : null}
      {resumo ? (
        <>
          <p>
            {resumo.criar} a criar · {resumo.atualizar} a atualizar · {resumo.categoriasNovas} categoria(s) nova(s) · {resumo.erros} com erro
          </p>
          {resumo.categoriasNovas > 0 ? (
            <p>Categorias que ainda não existem serão criadas se você confirmar.</p>
          ) : null}
          {resumo.semCusto > 0 ? (
            <p>{resumo.semCusto} item(ns) ficarão sem custo e fora da classificação da matriz.</p>
          ) : null}
          <div className="formulario">
            <label>
              <input
                type="radio"
                name="modo-importacao"
                checked={modo === 'CANCELAR_TUDO'}
                onChange={() => setModo('CANCELAR_TUDO')}
              />
              {' '}Cancelar tudo se houver erro
            </label>
            <label>
              <input
                type="radio"
                name="modo-importacao"
                checked={modo === 'SOMENTE_VALIDAS'}
                onChange={() => setModo('SOMENTE_VALIDAS')}
              />
              {' '}Importar só as linhas válidas
            </label>
          </div>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>Categoria</th>
                  <th>Nome</th>
                  <th>Situação</th>
                  <th>Preço</th>
                  <th>Custo</th>
                  <th>Aviso</th>
                </tr>
              </thead>
              <tbody>
                {previa.linhas.map((linha) => (
                  <tr key={linha.numero}>
                    <td>{linha.numero}</td>
                    <td>{linha.categoria}</td>
                    <td>{linha.nome}</td>
                    <td>{textoSituacao(linha)}</td>
                    <td>{linha.situacao === 'ATUALIZAR' ? diferenca(linha.precoAnterior, linha.preco) : formatarMoeda(linha.preco)}</td>
                    <td>{linha.situacao === 'ATUALIZAR' ? diferenca(linha.custoAnterior, linha.custo) : formatarMoeda(linha.custo)}</td>
                    <td>{linha.mensagens.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Botao texto="Confirmar importação" onClick={confirmar} desabilitado={!podeConfirmar} />
        </>
      ) : null}
    </section>
  )
}

export default ImportarCardapio
