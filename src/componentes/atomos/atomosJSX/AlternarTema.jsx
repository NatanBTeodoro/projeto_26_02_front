import { useEffect, useState } from 'react'
import { alternarTema, temaDoSistema, temaSalvo } from '../../../utils/tema'
import '../atomosCSS/AlternarTema.css'

function AlternarTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'escuro')

  useEffect(() => {
    if (temaSalvo()) return undefined
    const midia = window.matchMedia('(prefers-color-scheme: light)')
    function aoMudar() {
      if (temaSalvo()) return
      const proximo = temaDoSistema()
      document.documentElement.dataset.tema = proximo
      setTema(proximo)
    }
    midia.addEventListener('change', aoMudar)
    return () => midia.removeEventListener('change', aoMudar)
  }, [])

  return (
    <button
      className="tema-toggle"
      type="button"
      aria-pressed={tema === 'claro'}
      onClick={() => setTema(alternarTema())}
    >
      {tema === 'escuro' ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}

export default AlternarTema
