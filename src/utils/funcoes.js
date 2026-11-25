import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { apiJson } from '../services/api'
import { endpoints } from '../services/endpoints'
import { gravarVisaoFuncao, lerSessao, lerVisaoFuncao } from './sessao'
import { visaoInicial } from './cargos'

const FuncoesContexto = createContext({
  lista: [],
  cargos: [],
  visao: 'Atendente',
  pronto: false,
  tem: () => false,
  escolherVisao: () => {},
})

export function FuncoesProvider({ children }) {
  const token = lerSessao().token
  const [lista, setLista] = useState([])
  const [cargos, setCargos] = useState([])
  const [visao, setVisao] = useState(() => lerVisaoFuncao() || 'Atendente')
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!token) {
      setLista([])
      setCargos([])
      setPronto(true)
      return undefined
    }
    let vivo = true
    setPronto(false)
    Promise.all([
      apiJson(endpoints.funcoesMinhas).catch(() => []),
      apiJson(endpoints.meusCargos).catch(() => []),
    ])
      .then(([funcoes, nomes]) => {
        if (!vivo) return
        const cargosRecebidos = Array.isArray(nomes) ? nomes : []
        setLista(Array.isArray(funcoes) ? funcoes : [])
        setCargos(cargosRecebidos)
        const escolhida = visaoInicial(cargosRecebidos, lerVisaoFuncao())
        gravarVisaoFuncao(escolhida)
        setVisao(escolhida)
      })
      .finally(() => {
        if (vivo) setPronto(true)
      })
    return () => {
      vivo = false
    }
  }, [token])

  const valor = useMemo(() => ({
    lista,
    cargos,
    visao,
    pronto,
    tem: (...codigos) => codigos.some((codigo) => lista.includes(codigo)),
    escolherVisao: (nome) => {
      gravarVisaoFuncao(nome)
      setVisao(nome)
    },
  }), [lista, cargos, visao, pronto])

  return createElement(FuncoesContexto.Provider, { value: valor }, children)
}

export function useFuncoes() {
  return useContext(FuncoesContexto)
}
