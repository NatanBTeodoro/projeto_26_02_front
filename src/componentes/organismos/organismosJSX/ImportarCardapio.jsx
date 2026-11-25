import { useRef, useState } from 'react'
import Titulo from '../../atomos/atomosJSX/Titulo'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import MensagemSucesso from '../../atomos/atomosJSX/MensagemSucesso'
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

function mensagemImportados(quantidade) {
  if (quantidade === 1) return '1 produto importado com sucesso'
  return `${quantidade} produtos importados com sucesso`
}

function ImportarCardapio({ aoConcluir }) {
  const arquivoInput = useRef(null)
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [modo, setModo] = useState('CANCELAR_TUDO')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)

  function limparImportacao() {
    setArquivo(null)
    setPrevia(null)
    setModo('CANCELAR_TUDO')
    setErro('')
    setAviso('')
    if (arquivoInput.current) arquivoInput.current.value = ''
  }

  function cancelar() {
    limparImportacao()
    setSucesso('')
  }

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
    setSucesso('')
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
    setSucesso('')
    setEnviando(true)
    try {
      const dados = new FormData()
      dados.append('arquivo', arquivo)
      dados.append('modo', modo)
      const resultado = await apiFormulario(endpoints.confirmarCardapio, dados)
      if (resultado.aplicado) {
        const quantidade = resultado.gravados || 0
        limparImportacao()
        setSucesso(mensagemImportados(quantidade))
        if (quantidade && aoConcluir) await aoConcluir()
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
      <Titulo nivel={2} texto="Importar cardápio" />
      <p>Colunas fixas: categoria, nome, preco e custo. A segunda linha do modelo é um exemplo.</p>
      <MensagemErro texto={erro} />
      <MensagemSucesso texto={sucesso} />
      {aviso ? <p>{aviso}</p> : null}
      <div className="formulario__acoes">
        <Botao texto="Baixar modelo" variante="secundario" onClick={baixarModelo} />
        <label className="botao botao--primario" htmlFor="arquivo-cardapio">Escolher arquivo</label>
        <input ref={arquivoInput} id="arquivo-cardapio" className="arquivo-cardapio" type="file" accept=".csv,.xlsx" onChange={prever} />
      </div>
      {arquivo ? (
        <div className="formulario__acoes">
          <p>{arquivo.name}</p>
          <Botao texto="Cancelar importação" variante="secundario" onClick={cancelar} desabilitado={enviando} />
        </div>
      ) : null}
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
          <Tabela
            linhas={previa.linhas.map((linha) => ({ ...linha, id: linha.numero }))}
            colunas={[
              { chave: 'numero', rotulo: 'Linha', papel: 'numero', largura: '8%' },
              { chave: 'categoria', rotulo: 'Categoria', largura: '14%' },
              { chave: 'nome', rotulo: 'Nome', largura: '16%' },
              { chave: 'situacao', rotulo: 'Situação', largura: '14%', celula: (linha) => textoSituacao(linha) },
              { chave: 'preco', rotulo: 'Preço', papel: 'numero', largura: '12%', celula: (linha) => (linha.situacao === 'ATUALIZAR' ? diferenca(linha.precoAnterior, linha.preco) : formatarMoeda(linha.preco)) },
              { chave: 'custo', rotulo: 'Custo', papel: 'numero', largura: '12%', celula: (linha) => (linha.situacao === 'ATUALIZAR' ? diferenca(linha.custoAnterior, linha.custo) : formatarMoeda(linha.custo)) },
              { chave: 'mensagens', rotulo: 'Aviso', papel: 'texto', largura: '24%', celula: (linha) => linha.mensagens.join(' ') },
            ]}
          />
          <div className="formulario__acoes">
            <Botao texto="Confirmar importação" onClick={confirmar} desabilitado={!podeConfirmar} />
            <Botao texto="Cancelar importação" variante="secundario" onClick={cancelar} desabilitado={enviando} />
          </div>
        </>
      ) : null}
    </section>
  )
}

export default ImportarCardapio
