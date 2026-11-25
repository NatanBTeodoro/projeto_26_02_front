import { useState } from 'react'
import { alternarTema } from '../../../utils/tema'
import '../atomosCSS/AlternarTema.css'

function AlternarTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'claro')

  return (
    <button
      className="tema-toggle"
      type="button"
      aria-pressed={tema === 'escuro'}
      onClick={() => setTema(alternarTema())}
    >
      {tema === 'escuro' ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}

export default AlternarTema
