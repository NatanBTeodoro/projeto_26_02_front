import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import ListaFuncoes from '../../moleculas/moleculasJSX/ListaFuncoes'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Titulo from '../../atomos/atomosJSX/Titulo'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { rotuloFuncao, agruparFuncoes } from '../../../utils/formatacao'
import { useFuncoes } from '../../../utils/funcoes'

function FuncoesRede() {
  const { tem, pronto } = useFuncoes()
  const gerir = pronto && tem('CATALOGO_FUNCOES_GERIR')
  const verAuditoria = pronto && tem('AUDITORIA_VER')
  const [catalogo, setCatalogo] = useState([])
  const [minhas, setMinhas] = useState([])
  const [rotulo, setRotulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [marcadas, setMarcadas] = useState([])
  const [auditoria, setAuditoria] = useState([])
  const [cargos, setCargos] = useState([])
  const [nomeCargo, setNomeCargo] = useState('')
  const [erro, setErro] = useState('')
  const [criandoCargo, setCriandoCargo] = useState(false)
  const [cargoFuncoesId, setCargoFuncoesId] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [marcadasEdicao, setMarcadasEdicao] = useState([])
  const [auditoriaAberta, setAuditoriaAberta] = useState(false)

  async function carregar() {
    if (verAuditoria) {
      apiJson(endpoints.auditoriaPermissoes).then(setAuditoria).catch((falha) => setErro(falha.message))
    } else {
      setAuditoria([])
      setAuditoriaAberta(false)
    }
    if (!gerir) return
    const [itens, funcoes, listaCargos] = await Promise.all([
      apiJson(endpoints.funcoesRede),
      apiJson(endpoints.funcoesMinhas),
      apiJson(endpoints.cargosRede),
    ])
    setCatalogo(itens)
    setMinhas(funcoes.filter((authority) => !authority.startsWith('PLATAFORMA_')))
    setCargos(listaCargos)
  }

  useEffect(() => {
    if (!pronto) return
    carregar().catch((falha) => setErro(falha.message))
  }, [pronto, gerir, verAuditoria])

  function alternar(authority) {
    setMarcadas((lista) => (lista.includes(authority) ? lista.filter((item) => item !== authority) : [...lista, authority]))
  }

  function alternarEdicao(authority) {
    setMarcadasEdicao((lista) => (lista.includes(authority) ? lista.filter((item) => item !== authority) : [...lista, authority]))
  }

  function abrirEdicao(cargo) {
    setCriandoCargo(false)
    setEditandoId(cargo.id)
    setNomeEdicao(cargo.nome)
    setMarcadasEdicao([...(cargo.authorities || [])])
    setErro('')
  }

  async function criar(evento) {
    evento.preventDefault()
    try {
      await apiJson(endpoints.funcoesRede, {
        method: 'POST',
        body: JSON.stringify({ rotulo, descricao, authorities: marcadas }),
      })
      setRotulo('')
      setDescricao('')
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function criarCargo(evento) {
    evento.preventDefault()
    try {
      await apiJson(endpoints.cargosRede, {
        method: 'POST',
        body: JSON.stringify({ nome: nomeCargo, descricao: '', authorities: marcadas }),
      })
      setNomeCargo('')
      setMarcadas([])
      setCriandoCargo(false)
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function salvarEdicao(evento) {
    evento.preventDefault()
    try {
      await apiJson(endpoints.cargoRede(editandoId), {
        method: 'PUT',
        body: JSON.stringify({ nome: nomeEdicao, authorities: marcadasEdicao }),
      })
      setEditandoId(null)
      setNomeEdicao('')
      setMarcadasEdicao([])
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  async function desativarCargo(cargo) {
    try {
      await apiJson(endpoints.cargoRede(cargo.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }
  async function desativar(item) {
    try {
      await apiJson(endpoints.funcaoRede(item.id), {
        method: 'PUT',
        body: JSON.stringify({ ativo: false }),
      })
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <TemplateAutenticado rotaAtual="/funcoes">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Funções da rede"
          descricao="O catálogo só oferece funções que a sua conta já possui."
        />
        <MensagemErro texto={erro} />
        {gerir && criandoCargo ? (
          <section className="pagina__painel">
            <Titulo nivel={2} texto="Criar cargo" />
            <form className="formulario" onSubmit={criar}>
              <Titulo nivel={3} texto="Funções" />
              <FormField id="rotulo-funcao" rotulo="Rótulo" valor={rotulo} onChange={setRotulo} obrigatorio />
              <FormField id="descricao-funcao" rotulo="Descrição" valor={descricao} onChange={setDescricao} />
              <ListaFuncoes authorities={minhas} marcadas={marcadas} onAlternar={alternar} idPrefixo="catalogo" />
              <Botao texto="Criar função" tipo="submit" />
            </form>
            <form className="formulario" onSubmit={criarCargo}>
              <FormField id="nome-cargo" rotulo="Nome do cargo" valor={nomeCargo} onChange={setNomeCargo} obrigatorio />
              <p>As funções marcadas entram no cargo.</p>
              <div className="formulario__acoes">
                <Botao texto="Criar cargo" tipo="submit" />
                <Botao texto="Cancelar" variante="fantasma" onClick={() => setCriandoCargo(false)} />
              </div>
            </form>
          </section>
        ) : (
          gerir ? <Botao texto="Criar cargo" onClick={() => { setEditandoId(null); setCriandoCargo(true) }} /> : null
        )}
        <Titulo nivel={2} texto="Cargos da rede" />
        <Tabela
          linhas={cargos}
          vazio="Nenhum cargo cadastrado."
          colunas={[
            { chave: 'nome', rotulo: 'Cargo' },
            { chave: 'ativo', rotulo: 'Ativo', celula: (cargo) => (cargo.ativo ? 'sim' : 'não') },
            {
              chave: 'acao',
              rotulo: '',
              papel: 'acoes',
              celula: (cargo) => (
                <>
                  <Botao
                    texto={cargoFuncoesId === cargo.id ? 'Ocultar funções' : 'Ver funções'}
                    variante="secundario"
                    onClick={() => setCargoFuncoesId((atual) => (atual === cargo.id ? null : cargo.id))}
                  />
                  {gerir ? (
                    <Botao
                      texto={editandoId === cargo.id ? 'Editando' : 'Editar'}
                      variante="secundario"
                      onClick={() => (editandoId === cargo.id ? setEditandoId(null) : abrirEdicao(cargo))}
                    />
                  ) : null}
                  {gerir && cargo.ativo ? <Botao texto="Desativar" variante="fantasma" onClick={() => desativarCargo(cargo)} /> : null}
                </>
              ),
            },
          ]}
        />
        {cargos.filter((cargo) => cargo.id === editandoId).map((cargo) => (
          <form key={cargo.id} className="formulario pagina__painel" onSubmit={salvarEdicao}>
            <Titulo nivel={3} texto={`Editar ${cargo.nome}`} />
            <FormField id="nome-cargo-edicao" rotulo="Nome do cargo" valor={nomeEdicao} onChange={setNomeEdicao} obrigatorio />
            <ListaFuncoes
              authorities={[...new Set([...minhas, ...(cargo.authorities || [])])]}
              marcadas={marcadasEdicao}
              onAlternar={alternarEdicao}
              idPrefixo={`editar-cargo-${cargo.id}`}
            />
            <p>Quem já tem este cargo recebe a mesma alteração.</p>
            <div className="formulario__acoes">
              <Botao texto="Salvar cargo" tipo="submit" />
              <Botao texto="Cancelar" variante="fantasma" onClick={() => setEditandoId(null)} />
            </div>
          </form>
        ))}
        {cargos.filter((cargo) => cargo.id === cargoFuncoesId).map((cargo) => (
          <section key={cargo.id} className="pagina__painel">
            <Titulo nivel={3} texto={`Funções de ${cargo.nome}`} />
            {(cargo.authorities || []).length === 0 ? <p>Este cargo não tem funções.</p> : (
              <div className="lista-funcoes">
                {agruparFuncoes(cargo.authorities).map(([titulo, itens]) => (
                  <div key={titulo}>
                    <p className="lista-funcoes__grupo">{titulo}</p>
                    <ul>
                      {itens.map((authority) => (
                        <li key={authority}><span>{rotuloFuncao(authority)}</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        <Tabela
          linhas={catalogo}
          vazio="Nenhuma função no catálogo."
          colunas={[
            { chave: 'rotulo', rotulo: 'Rótulo' },
            { chave: 'authority', rotulo: 'Função', celula: (item) => rotuloFuncao(item.authority) },
            { chave: 'descricao', rotulo: 'Descrição', papel: 'texto' },
            { chave: 'acao', rotulo: '', papel: 'acoes', celula: (item) => (gerir ? <Botao texto="Desativar" variante="fantasma" onClick={() => desativar(item)} /> : null) },
          ]}
        />
        {auditoriaAberta ? (
          <>
            <Titulo nivel={2} texto="Auditoria de permissão" />
            <Tabela
              linhas={auditoria}
              vazio="Nenhum registro de auditoria."
              colunas={[
                { chave: 'dataHora', rotulo: 'Quando' },
                { chave: 'autorId', rotulo: 'Quem' },
                { chave: 'alvoId', rotulo: 'Para quem' },
                { chave: 'restauranteId', rotulo: 'Restaurante' },
                { chave: 'authority', rotulo: 'Função', celula: (item) => rotuloFuncao(item.authority) },
                { chave: 'acao', rotulo: 'Ação' },
              ]}
            />
            <Botao texto="Ocultar auditoria" variante="fantasma" onClick={() => setAuditoriaAberta(false)} />
          </>
        ) : verAuditoria ? (
          <Botao texto="Auditoria de permissão" onClick={() => setAuditoriaAberta(true)} />
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

export default FuncoesRede
