import { useEffect, useState } from 'react'
import TemplateAutenticado from '../../templates/templatesJSX/TemplateAutenticado'
import CabecalhoPagina from '../../moleculas/moleculasJSX/CabecalhoPagina'
import CartaoMetrica from '../../moleculas/moleculasJSX/CartaoMetrica'
import FormField from '../../moleculas/moleculasJSX/FormField'
import FormFieldSelect from '../../moleculas/moleculasJSX/FormFieldSelect'
import Tabela from '../../moleculas/moleculasJSX/Tabela'
import Titulo from '../../atomos/atomosJSX/Titulo'
import Checkbox from '../../atomos/atomosJSX/Checkbox'
import Botao from '../../atomos/atomosJSX/Botao'
import MensagemErro from '../../atomos/atomosJSX/MensagemErro'
import GraficoCurvaAbc from '../../organismos/organismosJSX/GraficoCurvaAbc'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { formatarBooleano, formatarMoeda, formatarPercentual, rotuloClasse, rotuloPerfil } from '../../../utils/formatacao'

function iso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function textoVariacao(item) {
  if (item.variacaoTexto) return item.variacaoTexto
  if (item.variacaoLucro == null) return '—'
  const numero = Number(item.variacaoLucro)
  const sinal = numero > 0 ? '+' : ''
  return `${sinal}${formatarPercentual(numero)}`
}

function contarFaixa(itens, faixa) {
  return itens.filter((item) => item.faixa === faixa).length
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
          descricao="Quais produtos sustentam o restaurante e de que tipo são: a faixa ABC mostra o peso no lucro e a classe Kasavana & Smith mostra o tipo do produto."
        />
        <MensagemErro texto={erro} />
        <form className="formulario pagina__painel" onSubmit={consultar}>
          <FormFieldSelect
            id="restaurante"
            rotulo="Restaurante"
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
          <div className="formulario__acoes">
            <Checkbox id="faixas-matriz" texto="Colorir o gráfico por faixa" marcado={mostrarFaixas} onChange={setMostrarFaixas} />
            <Botao texto="Calcular" tipo="submit" />
          </div>
        </form>
        {escolhido?.status === 'FECHADO' ? <p>Este restaurante está fechado e não pode ser editado.</p> : null}
        {curva ? (
          <>
            <div className="cartoes">
              <CartaoMetrica rotulo="Faturamento" valor={formatarMoeda(curva.faturamento)} />
              <CartaoMetrica rotulo="Custo bruto" valor={formatarMoeda(curva.custoBruto)} />
              <CartaoMetrica rotulo="Lucro bruto" valor={formatarMoeda(curva.lucroBruto)} />
              <CartaoMetrica rotulo="Margem" valor={formatarPercentual(curva.margemPercentual)} />
              <CartaoMetrica rotulo="Produtos por faixa" valor={`A ${contarFaixa(curva.itens, 'A')} · B ${contarFaixa(curva.itens, 'B')} · C ${contarFaixa(curva.itens, 'C')}`} />
            </div>
            <section className="pagina__painel">
              <Titulo nivel={2} texto="Curva ABC por produto" />
              <p>A faixa diz quanto o produto pesa no lucro. A classe diz que tipo de produto ele é.</p>
              {curva.coberturaDeCusto != null ? (
                <p>margem calculada sobre {formatarPercentual(curva.coberturaDeCusto)} do faturamento</p>
              ) : null}
              {curva.linhasSemCusto > 0 ? (
                <p>
                  {curva.linhasSemCusto} item(ns) sem custo ficaram fora do lucro.
                  {curva.foraDaCurva?.length ? ` Fora da curva: ${curva.foraDaCurva.join(', ')}.` : ''}
                </p>
              ) : null}
              <GraficoCurvaAbc itens={curva.itens} mostrarFaixas={mostrarFaixas} />
              <Tabela
                classe="tabela--analise"
                linhas={curva.itens}
                colunas={[
                  { chave: 'nome', rotulo: 'Produto', largura: '16%', celula: (item) => `${item.nome}${item.dadoIncompleto ? ' (dado incompleto)' : ''}` },
                  { chave: 'quantidade', rotulo: 'Qtd. vendida', papel: 'numero', largura: '8%', celula: (item) => item.quantidade ?? '—' },
                  { chave: 'lucro', rotulo: 'Lucro', papel: 'numero', largura: '9%', celula: (item) => formatarMoeda(item.lucro) },
                  { chave: 'custo', rotulo: 'Custo bruto', papel: 'numero', largura: '10%', celula: (item) => formatarMoeda(item.custoBruto) },
                  { chave: 'participacao', rotulo: 'Participação', papel: 'numero', largura: '9%', celula: (item) => formatarPercentual(item.participacao) },
                  { chave: 'acumulado', rotulo: 'Acumulado', papel: 'numero', largura: '9%', celula: (item) => formatarPercentual(item.acumulado) },
                  { chave: 'margem', rotulo: 'Margem', papel: 'numero', largura: '8%', celula: (item) => formatarPercentual(item.margemPercentual) },
                  { chave: 'faixa', rotulo: 'Faixa', largura: '6%', celula: (item) => item.faixa },
                  { chave: 'classe', rotulo: 'Classe K&S', papel: 'classe', largura: '10%', celula: (item) => (item.classe ? <span className={`selo selo--${item.classe}`}>{rotuloClasse(item.classe)}</span> : '—') },
                  { chave: 'variacao', rotulo: 'Variação do lucro', papel: 'texto', largura: '15%', celula: (item) => textoVariacao(item) },
                ]}
              />
            </section>
          </>
        ) : null}
        {curva ? (
          <section className="pagina__painel">
            <Titulo nivel={2} texto="Gestores e usuários" />
            <Tabela
              linhas={equipe}
              vazio="Ninguém cadastrado neste restaurante."
              colunas={[
                { chave: 'nome', rotulo: 'Nome' },
                { chave: 'email', rotulo: 'E-mail' },
                { chave: 'perfil', rotulo: 'Perfil', celula: (pessoa) => rotuloPerfil(pessoa.perfil) },
                { chave: 'ativo', rotulo: 'Ativo', celula: (pessoa) => formatarBooleano(pessoa.ativo) },
              ]}
            />
          </section>
        ) : null}
      </div>
    </TemplateAutenticado>
  )
}

export default Matriz
