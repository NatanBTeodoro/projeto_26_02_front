function CartaoMetrica({ rotulo, valor, detalhe = '', atencao = false, title, children }) {
  const classe = ['pagina__painel', 'cartao', atencao ? 'kpi--atencao' : ''].filter(Boolean).join(' ')
  return (
    <article className={classe} title={title}>
      <span>{rotulo}</span>
      <strong>{valor}</strong>
      {detalhe ? <p className="cartao__detalhe">{detalhe}</p> : null}
      {children}
    </article>
  )
}

export default CartaoMetrica
