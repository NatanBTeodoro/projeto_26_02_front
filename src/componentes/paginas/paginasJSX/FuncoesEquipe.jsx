import { useEffect, useState } from 'react'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'

const BLOQUEADAS_GESTOR = [
  'EQUIPE_GESTOR_GERIR',
  'EQUIPE_PERFIL_TROCAR',
  'REDE_VER',
  'RESTAURANTE_GERIR',
  'PLATAFORMA_TI_GERIR',
  'PLATAFORMA_ADMIN_GERIR',
]

export function podeAtribuir(minhas) {
  return Array.isArray(minhas) && minhas.includes('EQUIPE_FUNCAO_ATRIBUIR')
}

export function PainelFuncoes({ usuario, minhas, gestor, onFechar }) {
  const [atuais, setAtuais] = useState([])
  const [marcadas, setMarcadas] = useState([])
  const [erro, setErro] = useState('')

  const opcoes = (minhas || []).filter((authority) => !gestor || !BLOQUEADAS_GESTOR.includes(authority))

  useEffect(() => {
    apiJson(endpoints.funcoesUsuario(usuario.id))
      .then((linhas) => {
        setAtuais(linhas)
        setMarcadas(linhas.map((linha) => linha.authority))
      })
      .catch((falha) => setErro(falha.message))
  }, [usuario.id])

  function alternar(authority) {
    setMarcadas((lista) => (lista.includes(authority) ? lista.filter((item) => item !== authority) : [...lista, authority]))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const tinha = atuais.map((linha) => linha.authority)
    const conceder = marcadas.filter((authority) => !tinha.includes(authority))
    const revogar = tinha.filter((authority) => !marcadas.includes(authority))
    try {
      await apiJson(endpoints.funcoesUsuario(usuario.id), {
        method: 'POST',
        body: JSON.stringify({
          restauranteId: usuario.restauranteId ?? null,
          conceder,
          revogar,
        }),
      })
      onFechar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return (
    <section className="pagina__painel">
      <h2>Funções de {usuario.nome}</h2>
      <p>
        Vínculo {usuario.perfil}
        {usuario.restauranteNome ? ` · ${usuario.restauranteNome}` : ''}
      </p>
      <MensagemErro texto={erro} />
      <ul>
        {atuais.map((linha) => (
          <li key={linha.authority}>
            {linha.authority}
            {linha.atribuidoPor ? ` · atribuída por ${linha.atribuidoPor}` : ''}
            {linha.atribuidoEm ? ` · ${linha.atribuidoEm}` : ''}
          </li>
        ))}
      </ul>
      <form onSubmit={salvar}>
        {opcoes.map((authority) => (
          <label key={authority}>
            <input
              type="checkbox"
              checked={marcadas.includes(authority)}
              onChange={() => alternar(authority)}
            />
            {authority}
          </label>
        ))}
        <div className="formulario__acoes">
          <Botao texto="Salvar funções" tipo="submit" />
          <Botao texto="Fechar" variante="fantasma" onClick={onFechar} />
        </div>
      </form>
    </section>
  )
}
