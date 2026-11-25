import { useEffect, useState } from 'react'
import Botao from '../../atomos/atomosJSX/Botao'
import Checkbox from '../../atomos/atomosJSX/Checkbox'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import Painel from '../../moleculas/moleculasJSX/Painel'
import ListaFuncoes from '../../moleculas/moleculasJSX/ListaFuncoes'
import Titulo from '../../atomos/atomosJSX/Titulo'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { rotuloFuncao } from '../../../utils/formatacao'

const BLOQUEADAS_GESTOR = [
  'EQUIPE_GESTOR_GERIR',
  'PLATAFORMA_TI_GERIR',
  'PLATAFORMA_ADMIN_GERIR',
]

export function podeAtribuir(minhas) {
  return Array.isArray(minhas) && minhas.includes('EQUIPE_FUNCAO_ATRIBUIR')
}

export function PainelFuncoes({ usuario, minhas, gestor, onFechar }) {
  const [atuais, setAtuais] = useState([])
  const [cargos, setCargos] = useState([])
  const [cargosMarcados, setCargosMarcados] = useState([])
  const [avulsas, setAvulsas] = useState([])
  const [erro, setErro] = useState('')
  const [avancado, setAvancado] = useState(false)

  const opcoes = (minhas || []).filter((authority) => !gestor || !BLOQUEADAS_GESTOR.includes(authority))

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

  const nomes = Object.fromEntries(cargos.map((cargo) => [cargo.id, cargo.nome]))

  return (
    <Painel titulo={`Funções de ${usuario.nome}`}>
      <p>
        Vínculo {usuario.perfil}
        {usuario.restauranteNome ? ` · ${usuario.restauranteNome}` : ''}
      </p>
      <MensagemErro texto={erro} />
      <ul>
        {atuais.filter((linha) => linha.cargoOrigemId != null).map((linha) => (
          <li key={`cargo-${linha.authority}`}>
            {rotuloFuncao(linha.authority)} · cargo {nomes[linha.cargoOrigemId] || linha.cargoOrigemId}
            {linha.atribuidoPor ? ` · por ${linha.atribuidoPor}` : ''}
            {linha.atribuidoEm ? ` · ${linha.atribuidoEm}` : ''}
          </li>
        ))}
        {atuais.filter((linha) => linha.cargoOrigemId == null).map((linha) => (
          <li key={`avulsa-${linha.authority}`}>
            {rotuloFuncao(linha.authority)} · avulsa
            {linha.atribuidoPor ? ` · por ${linha.atribuidoPor}` : ''}
            {linha.atribuidoEm ? ` · ${linha.atribuidoEm}` : ''}
          </li>
        ))}
      </ul>
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
        <div className="formulario__acoes">
          <Botao texto="Salvar funções" tipo="submit" />
          <Botao texto="Fechar" variante="fantasma" onClick={onFechar} />
        </div>
      </form>
    </Painel>
  )
}
