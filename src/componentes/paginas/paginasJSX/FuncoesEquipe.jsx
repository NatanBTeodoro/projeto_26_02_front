import { useEffect, useState } from 'react'
import Botao from '../../atomos/atomosJSX/Botao'
import Checkbox from '../../atomos/atomosJSX/Checkbox'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import Painel from '../../moleculas/moleculasJSX/Painel'
import ListaFuncoes from '../../moleculas/moleculasJSX/ListaFuncoes'
import Titulo from '../../atomos/atomosJSX/Titulo'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { agruparFuncoes, rotuloFuncao } from '../../../utils/formatacao'

const BLOQUEADAS_GESTOR = [
  'EQUIPE_GESTOR_GERIR',
  'PLATAFORMA_TI_GERIR',
  'PLATAFORMA_ADMIN_GERIR',
]

export function podeAtribuir(minhas) {
  return Array.isArray(minhas) && minhas.includes('EQUIPE_FUNCAO_ATRIBUIR')
}

export function unirFuncoes(...listas) {
  return [...new Set(listas.flat().filter(Boolean))]
}

export function funcoesAtribuiveis(minhas, gestor) {
  return (minhas || []).filter((authority) => !gestor || !BLOQUEADAS_GESTOR.includes(authority))
}

function ResumoFuncoes({ titulo, authorities, vazio }) {
  const grupos = agruparFuncoes(unirFuncoes(authorities))
  return (
    <div>
      <Titulo nivel={3} texto={titulo} />
      {grupos.length === 0 ? <p>{vazio}</p> : grupos.map(([grupo, itens]) => (
        <div key={grupo}>
          <p className="lista-funcoes__grupo">{grupo}</p>
          <ul>
            {itens.map((authority) => <li key={authority}>{rotuloFuncao(authority)}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function EscolhaFuncoes({ cargos, cargosMarcados, onCargo, funcoes, funcoesMarcadas, onFuncao }) {
  const escolhidas = unirFuncoes(
    (cargos || []).filter((cargo) => cargosMarcados.includes(cargo.id)).flatMap((cargo) => cargo.authorities || []),
    funcoesMarcadas,
  )
  return (
    <div>
      <Titulo nivel={3} texto="Funções" />
      {(cargos || []).map((cargo) => (
        <Checkbox
          key={cargo.id}
          id={`novo-cargo-${cargo.id}`}
          texto={cargo.nome}
          marcado={cargosMarcados.includes(cargo.id)}
          onChange={() => onCargo(cargo.id)}
        />
      ))}
      <ListaFuncoes authorities={funcoes} marcadas={funcoesMarcadas} onAlternar={onFuncao} idPrefixo="novo-cadastro" />
      <ResumoFuncoes titulo="Funções desta conta" authorities={escolhidas} vazio="Nenhuma função selecionada. A conta entra sem funções." />
    </div>
  )
}

export function PainelFuncoes({ usuario, minhas, gestor, onFechar }) {
  const [atuais, setAtuais] = useState([])
  const [cargos, setCargos] = useState([])
  const [cargosMarcados, setCargosMarcados] = useState([])
  const [avulsas, setAvulsas] = useState([])
  const [erro, setErro] = useState('')
  const [avancado, setAvancado] = useState(false)

  const opcoes = funcoesAtribuiveis(minhas, gestor)
  const liberadas = unirFuncoes(atuais.map((linha) => linha.authority))
  const escolhidas = unirFuncoes(
    cargos.filter((cargo) => cargosMarcados.includes(cargo.id)).flatMap((cargo) => cargo.authorities || []),
    avulsas,
  )
  const novas = escolhidas.filter((authority) => !liberadas.includes(authority))

  useEffect(() => {
    Promise.all([
      apiJson(endpoints.funcoesUsuario(usuario.id)),
      apiJson(endpoints.cargosAtribuiveis),
    ])
      .then(([linhas, lista]) => {
        setAtuais(linhas)
        setCargos(lista)
        setCargosMarcados([...new Set(linhas.map((linha) => linha.cargoOrigemId).filter(Boolean))])
        setAvulsas(linhas.filter((linha) => linha.cargoOrigemId == null).map((linha) => linha.authority))
      })
      .catch((falha) => setErro(falha.message))
  }, [usuario.id])

  function alternarCargo(id) {
    setCargosMarcados((lista) => (lista.includes(id) ? lista.filter((item) => item !== id) : [...lista, id]))
  }

  function alternarAvulsa(authority) {
    setAvulsas((lista) => (lista.includes(authority) ? lista.filter((item) => item !== authority) : [...lista, authority]))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const cargosAtuais = [...new Set(atuais.map((linha) => linha.cargoOrigemId).filter(Boolean))]
    const avulsasAtuais = atuais.filter((linha) => linha.cargoOrigemId == null).map((linha) => linha.authority)
    try {
      await apiJson(endpoints.funcoesUsuario(usuario.id), {
        method: 'POST',
        body: JSON.stringify({
          restauranteId: usuario.restauranteId ?? null,
          conceder: [],
          revogar: [],
          cargos: cargosMarcados.filter((id) => !cargosAtuais.includes(id)),
          revogarCargos: cargosAtuais.filter((id) => !cargosMarcados.includes(id)),
          authorities: avulsas.filter((authority) => !avulsasAtuais.includes(authority)),
          revogarAuthorities: avulsasAtuais.filter((authority) => !avulsas.includes(authority)),
        }),
      })
      onFechar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <Painel titulo={`Funções de ${usuario.nome}`}>
      <p>
        Vínculo {usuario.perfil}
        {usuario.restauranteNome ? ` · ${usuario.restauranteNome}` : ''}
      </p>
      <MensagemErro texto={erro} />
      <ResumoFuncoes titulo="Já liberadas" authorities={liberadas} vazio="Nenhuma função liberada nesta conta." />
      <form onSubmit={salvar}>
        <Titulo nivel={3} texto="Cargos" />
        {cargos.length === 0 ? <p>Nenhum cargo que você possa atribuir.</p> : null}
        {cargos.map((cargo) => (
          <Checkbox
            key={cargo.id}
            id={`cargo-${cargo.id}`}
            texto={cargo.nome}
            marcado={cargosMarcados.includes(cargo.id)}
            onChange={() => alternarCargo(cargo.id)}
          />
        ))}
        <Botao texto={avancado ? 'Ocultar funções avulsas' : 'Funções avulsas'} variante="fantasma" onClick={() => setAvancado((valor) => !valor)} />
        {avancado ? (
          <ListaFuncoes authorities={opcoes} marcadas={avulsas} onAlternar={alternarAvulsa} idPrefixo={`equipe-${usuario.id}`} />
        ) : null}
        <ResumoFuncoes
          titulo="Novas funções"
          authorities={novas}
          vazio="Nenhuma função nova na seleção."
        />
        <div className="formulario__acoes">
          <Botao texto="Salvar funções" tipo="submit" />
          <Botao texto="Fechar" variante="fantasma" onClick={onFechar} />
        </div>
      </form>
    </Painel>
  )
}
