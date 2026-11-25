import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldTextarea from '../../moleculas/moleculasJSX/FormFieldTextarea'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Botao from '../../atomos/atomosJSX/Botao'
import Titulo from '../../atomos/atomosJSX/Titulo'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import MensagemSucesso from '../../atomos/atomosJSX/MensagemSucesso'
import { apiBlob, apiFormulario, apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarDataHora, rotuloStatus, textoResposta } from '../../../utils/formatacao'
import { lerSessao } from '../../../utils/sessao'

const ASSUNTOS_GESTOR = [
  { valor: '', rotulo: 'Selecione' },
  { valor: 'PROBLEMA_NO_SISTEMA', rotulo: 'Problema no Sistema' },
  { valor: 'CARDAPIO', rotulo: 'Cardápio' },
  { valor: 'PEDIDOS', rotulo: 'Pedidos' },
  { valor: 'EQUIPE', rotulo: 'Equipe' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const ANEXOS_PERMITIDOS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'pdf']
const LIMITE_ANEXO = 5 * 1024 * 1024

const STATUS = [
  { valor: 'ABERTA', rotulo: 'Aberta' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'RESOLVIDA', rotulo: 'Resolvida' },
]

function destinoTexto(destino) {
  return destino === 'ADMINISTRADOR' ? 'Enviada ao administrador' : 'Enviada ao TI'
}

function erroAnexo(arquivo) {
  if (!arquivo) return ''
  if (arquivo.size > LIMITE_ANEXO) return 'O anexo passa de 5 MB.'
  const nome = arquivo.name || ''
  const ponto = nome.lastIndexOf('.')
  const extensao = ponto >= 0 ? nome.slice(ponto + 1).toLowerCase() : ''
  if (!ANEXOS_PERMITIDOS.includes(extensao)) {
    return 'Envie uma imagem JPG, PNG, WEBP ou um PDF.'
  }
  return ''
}

function Suporte() {
  const gestor = lerSessao().perfil === 'GESTOR'
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState(null)
  const [anexoChave, setAnexoChave] = useState(0)
  const [historico, setHistorico] = useState([])
  const [recebidas, setRecebidas] = useState([])
  const [rascunhos, setRascunhos] = useState({})
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregar() {
    const enviadas = await apiJson(endpoints.reclamacoes)
    setHistorico(enviadas)
    if (gestor) return
    const caixa = await apiJson(`${endpoints.reclamacoes}?caixa=recebidas`)
    const mapa = {}
    caixa.forEach((item) => {
      mapa[item.id] = { status: item.status, resposta: item.resposta || '' }
    })
    setRecebidas(caixa)
    setRascunhos(mapa)
  }

  useEffect(() => {
    carregar().catch((falha) => setErro(falha.message))
  }, [])

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')
    if (gestor && !assunto) {
      setErro('Escolha o assunto.')
      return
    }
    const falhaAnexo = erroAnexo(arquivo)
    if (falhaAnexo) {
      setErro(falhaAnexo)
      return
    }
    try {
      const dados = new FormData()
      dados.append('assunto', gestor ? assunto : assunto.trim())
      dados.append('descricao', descricao.trim())
      if (arquivo) dados.append('arquivo', arquivo)
      await apiFormulario(endpoints.reclamacoes, dados)
      setAssunto('')
      setDescricao('')
      setArquivo(null)
      setAnexoChave((atual) => atual + 1)
      setSucesso('Reclamação enviada.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  function alterar(id, campo, valor) {
    setRascunhos((atual) => ({ ...atual, [id]: { ...atual[id], [campo]: valor } }))
  }

  async function salvar(item) {
    const rascunho = rascunhos[item.id]
    setErro('')
    setSucesso('')
    try {
      await apiJson(endpoints.reclamacao(item.id), {
        method: 'PUT',
        body: JSON.stringify({ status: rascunho.status, resposta: rascunho.resposta }),
      })
      setSucesso('Reclamação atualizada.')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function baixar(item) {
    setErro('')
    try {
      const { blob, nome } = await apiBlob(endpoints.anexoReclamacao(item.id))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nome || item.anexoNome || 'anexo'
      link.click()
      URL.revokeObjectURL(url)
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/suporte">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Suporte / Reclamações"
          descricao={gestor
            ? 'Problema no Sistema segue para o TI. Os outros assuntos seguem para o administrador do restaurante.'
            : 'Envie uma reclamação ao TI e acompanhe as reclamações dos gestores.'}
        />
        <MensagemErro texto={erro} />
        <MensagemSucesso texto={sucesso} />
        <form className="formulario pagina__painel" onSubmit={enviar}>
          {gestor ? (
            <FormFieldSelect id="assunto" rotulo="Assunto" valor={assunto} onChange={setAssunto} opcoes={ASSUNTOS_GESTOR} />
          ) : (
            <FormField id="assunto" rotulo="Assunto" valor={assunto} onChange={setAssunto} obrigatorio />
          )}
          <FormFieldTextarea id="descricao" rotulo="Descrição" valor={descricao} onChange={setDescricao} obrigatorio />
          <FormField
            key={anexoChave}
            id="anexo"
            rotulo="Anexo"
            tipo="file"
            aceitar=".jpg,.jpeg,.jfif,.png,.webp,.pdf"
            dica="Uma imagem JPG, PNG, WEBP ou um PDF. O JFIF entra como JPEG. Só um arquivo, até 5 MB."
            onChange={setArquivo}
          />
          <Botao texto="Enviar reclamação" tipo="submit" />
        </form>
        <section className="pagina__painel">
          <Titulo nivel={2} texto="Minhas reclamações" />
          {historico.length === 0 ? <p>Nenhuma reclamação enviada.</p> : null}
          {historico.map((item) => (
            <article key={item.id} className="cardapio__item">
              <div>
                <strong>{item.assunto}</strong>
                <p className="reclamacao__meta">
                  <span>{formatarDataHora(item.criadoEm)}</span>
                  <span>{rotuloStatus(item.status)}</span>
                  <span>{destinoTexto(item.destino)}</span>
                </p>
                <p>{item.descricao}</p>
                <p>{textoResposta(item)}</p>
                {item.anexoNome ? (
                  <Botao texto={item.anexoNome} variante="fantasma" onClick={() => baixar(item)} />
                ) : null}
              </div>
            </article>
          ))}
        </section>
        {gestor ? null : (
          <section className="pagina__painel">
            <Titulo nivel={2} texto="Reclamações dos gestores" />
            {recebidas.length === 0 ? <p>Nenhuma reclamação recebida.</p> : null}
            {recebidas.map((item) => {
              const rascunho = rascunhos[item.id] || { status: item.status, resposta: item.resposta || '' }
              return (
                <article key={item.id} className="cardapio__item">
                  <strong>{item.assunto}</strong>
                  <p className="reclamacao__meta">
                    <span>{item.autorNome}</span>
                    <span>{item.autorEmail}</span>
                    {item.restauranteNome ? <span>{item.restauranteNome}</span> : null}
                    <span>{formatarDataHora(item.criadoEm)}</span>
                    <span>{rotuloStatus(item.status)}</span>
                  </p>
                  <p>{item.descricao}</p>
                  {item.anexoNome ? (
                    <Botao texto={item.anexoNome} variante="fantasma" onClick={() => baixar(item)} />
                  ) : null}
                  <FormFieldSelect
                    id={`status-${item.id}`}
                    rotulo="Status"
                    valor={rascunho.status}
                    onChange={(valor) => alterar(item.id, 'status', valor)}
                    opcoes={STATUS}
                  />
                  <FormFieldTextarea
                    id={`resposta-${item.id}`}
                    rotulo="Resposta ou observação"
                    valor={rascunho.resposta}
                    onChange={(valor) => alterar(item.id, 'resposta', valor)}
                  />
                  <Botao texto="Salvar" onClick={() => salvar(item)} />
                </article>
              )
            })}
          </section>
        )}
      </div>
    </TemplateAutenticado>
  )
}

export default Suporte
