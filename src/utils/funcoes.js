import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import { apiJson } from '../services/api'
import { endpoints } from '../services/endpoints'
import { lerSessao } from './sessao'

const FuncoesContexto = createContext({
  lista: [],
  pronto: false,
  tem: () => false,
})

export function FuncoesProvider({ children }) {
  const token = lerSessao().token
  const [lista, setLista] = useState([])
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!token) {
      setLista([])
      setPronto(true)
      return undefined
    }
    let vivo = true
    setPronto(false)
    apiJson(endpoints.funcoesMinhas)
      .then((funcoes) => {
        if (vivo) setLista(Array.isArray(funcoes) ? funcoes : [])
      })
      .catch(() => {
        if (vivo) setLista([])
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
    pronto,
    tem: (...codigos) => codigos.some((codigo) => lista.includes(codigo)),
  }), [lista, pronto])

  return createElement(FuncoesContexto.Provider, { value: valor }, children)
}

export function useFuncoes() {
  return useContext(FuncoesContexto)
}
