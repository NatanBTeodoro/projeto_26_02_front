import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import FormField from '../../moleculas/moleculasJSX/FormField'
import Select from '../../atomos/atomosJSX/Select'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import GraficoCurvaAbc from '../../organismos/organismosJSX/GraficoCurvaAbc'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarBooleano, formatarMoeda, formatarPercentual, rotuloPerfil } from '../../../utils/formatacao'

function iso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function rotuloRestaurante(restaurante) {
  if (restaurante.status === 'FECHADO') return `${restaurante.nome} (Fechado)`
  if (restaurante.status === 'INATIVO') return `${restaurante.nome} (Inativo)`
  return restaurante.nome
}

function Matriz() {
  const hoje = new Date()
  const [de, setDe] = useState(iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)))
  const [ate, setAte] = useState(iso(hoje))
  const [restaurantes, setRestaurantes] = useState([])
  const [restauranteId, setRestauranteId] = useState('')
  const [curva, setCurva] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [mostrarFaixas, setMostrarFaixas] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    apiJson(endpoints.restaurantes)
      .then((lista) => {
        setRestaurantes(lista)
        if (lista[0]) setRestauranteId(String(lista[0].id))
      })
      .catch((falha) => setErro(falha.message))
  }, [])

  async function consultar(evento) {
    evento.preventDefault()
    setErro('')
    if (!restauranteId) {
      setErro('Escolha o restaurante.')
      return
    }
    try {
      const [corpo, pessoas] = await Promise.all([
        apiJson(`${endpoints.curvaProdutos}?de=${de}&ate=${ate}&restauranteId=${restauranteId}`),
        apiJson(`${endpoints.usuarios}?restauranteId=${restauranteId}`),
      ])
      setCurva(corpo)
      setEquipe(pessoas)
    } catch (falha) {
      setCurva(null)
      setEquipe([])
      setErro(falha.message)
    }
  }

  const escolhido = restaurantes.find((restaurante) => String(restaurante.id) === restauranteId)

  return (
    <TemplateAutenticado rotaAtual="/matriz">
      <div className="pagina">
        <CabecalhoPagina
          titulo="Matriz"
          descricao="Curva ABC de lucro por produto do restaurante escolhido. Restaurante fechado aparece com essa indicação e não é editável."
        />
        <MensagemErro texto={erro} />
        <form className="formulario pagina__painel" onSubmit={consultar}>
          <label htmlFor="restaurante">Restaurante</label>
          <Select
            id="restaurante"
            valor={restauranteId}
            onChange={setRestauranteId}
            opcoes={[
              { valor: '', rotulo: 'Selecione' },
              ...restaurantes.map((restaurante) => ({
                valor: String(restaurante.id),
                rotulo: rotuloRestaurante(restaurante),
              })),
            ]}
          />
          <div className="formulario__linha">
            <FormField id="de" rotulo="De" tipo="date" valor={de} onChange={setDe} obrigatorio />
            <FormField id="ate" rotulo="Até" tipo="date" valor={ate} onChange={setAte} obrigatorio />
          </div>
          <label>
            <input
              type="checkbox"
              checked={mostrarFaixas}
              onChange={(evento) => setMostrarFaixas(evento.target.checked)}
            />
            {' '}Mostrar faixas A, B e C
          </label>
          <Botao texto="Calcular" tipo="submit" />
        </form>
        {escolhido?.status === 'FECHADO' ? <p>Este restaurante está fechado e não pode ser editado.</p> : null}
        {curva ? (
          <section className="pagina__painel">
            <h2>Curva ABC por produto</h2>
            <p>Lucro bruto: {formatarMoeda(curva.lucroBruto)}</p>
            {curva.linhasSemCusto > 0 ? (
              <p>
                {curva.linhasSemCusto} item(ns) sem custo ficaram fora do lucro.
                {curva.foraDaCurva?.length ? ` Fora da curva: ${curva.foraDaCurva.join(', ')}.` : ''}
              </p>
            ) : null}
            <GraficoCurvaAbc itens={curva.itens} mostrarFaixas={mostrarFaixas} />
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Lucro</th>
                    <th>Participação</th>
                    <th>Acumulado</th>
                    {mostrarFaixas ? <th>Faixa</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {curva.itens.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}{item.dadoIncompleto ? ' (dado incompleto)' : ''}</td>
                      <td>{formatarMoeda(item.lucro)}</td>
                      <td>{formatarPercentual(item.participacao)}</td>
                      <td>{formatarPercentual(item.acumulado)}</td>
                      {mostrarFaixas ? <td>{item.faixa}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {curva ? (
          <section className="pagina__painel">
            <h2>Gestores e usuários</h2>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Ativo</th>
                </tr>
              </thead>
              <tbody>
                {equipe.map((pessoa) => (
                  <tr key={pessoa.id}>
                    <td>{pessoa.nome}</td>
                    <td>{pessoa.email}</td>
                    <td>{rotuloPerfil(pessoa.perfil)}</td>
                    <td>{formatarBooleano(pessoa.ativo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {equipe.length === 0 ? <p>Ninguém cadastrado neste restaurante.</p> : null}
          </section>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

export default Matriz
