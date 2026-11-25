import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RotaPerfil } from './rotas/RotasProtegidas'
import { autenticado, destinoInicial, lerSessao } from './utils/sessao'
import { FuncoesProvider } from './utils/funcoes'
import Login from './componentes/paginas/paginasJSX/Login'
import Dashboard from './componentes/paginas/paginasJSX/Dashboard'
import Produtos from './componentes/paginas/paginasJSX/Produtos'
import Pedidos from './componentes/paginas/paginasJSX/Pedidos'
import Matriz from './componentes/paginas/paginasJSX/Matriz'
import Cadastros from './componentes/paginas/paginasJSX/Cadastros'
import Restaurantes from './componentes/paginas/paginasJSX/Restaurantes'
import Admins from './componentes/paginas/paginasJSX/Admins'
import Perfil from './componentes/paginas/paginasJSX/Perfil'
import Suporte from './componentes/paginas/paginasJSX/Suporte'
import Reclamacoes from './componentes/paginas/paginasJSX/Reclamacoes'
import Cardapio from './componentes/paginas/paginasJSX/Cardapio'
import FuncoesRede from './componentes/paginas/paginasJSX/FuncoesRede'

function proteger(pagina, perfis) {
  return <RotaPerfil perfis={perfis}>{pagina}</RotaPerfil>
}

function Inicio() {
  if (!autenticado()) return <Navigate to="/login" replace />
  return <Navigate to={destinoInicial(lerSessao().perfil)} replace />
}

function App() {
  return (
    <BrowserRouter>
      <FuncoesProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Inicio />} />
        <Route path="/dashboard" element={proteger(<Dashboard />, ['ADMINISTRADOR', 'GESTOR', 'USUARIO'])} />
        <Route path="/matriz" element={proteger(<Matriz />, ['ADMINISTRADOR'])} />
        <Route path="/restaurantes" element={proteger(<Restaurantes />, ['ADMINISTRADOR'])} />
        <Route path="/cadastros" element={proteger(<Cadastros />, ['ADMINISTRADOR', 'GESTOR'])} />
        <Route path="/funcoes" element={proteger(<FuncoesRede />, ['ADMINISTRADOR'])} />
        <Route path="/produtos" element={proteger(<Produtos />, ['ADMINISTRADOR', 'GESTOR', 'USUARIO'])} />
        <Route path="/pedidos" element={proteger(<Pedidos />, ['ADMINISTRADOR', 'GESTOR', 'USUARIO'])} />
        <Route path="/perfil" element={proteger(<Perfil />, ['TI', 'ADMINISTRADOR', 'GESTOR', 'USUARIO'])} />
        <Route path="/admins" element={proteger(<Admins />, ['TI'])} />
        <Route path="/reclamacoes" element={proteger(<Reclamacoes />, ['TI'])} />
        <Route path="/suporte" element={proteger(<Suporte />, ['ADMINISTRADOR', 'GESTOR'])} />
        <Route path="/cardapio" element={proteger(<Cardapio />, ['USUARIO', 'GESTOR', 'ADMINISTRADOR'])} />
        <Route path="/usuarios" element={<Navigate to="/cadastros" replace />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
      </FuncoesProvider>
    </BrowserRouter>
  )
}

export default App
