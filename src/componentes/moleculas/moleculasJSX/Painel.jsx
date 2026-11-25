import Titulo from '../../atomos/atomosJSX/Titulo'

function Painel({ titulo, children, className = '' }) {
  const classes = ['pagina__painel', className].filter(Boolean).join(' ')
  return (
    <section className={classes}>
      {titulo ? <Titulo nivel={2} texto={titulo} /> : null}
      {children}
    </section>
  )
}

export default Painel
