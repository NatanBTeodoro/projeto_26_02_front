// paginas/paginasJSX/Login.jsx

import { useState } from 'react'
import TemplatePublico from '../../templates/templatesJSX/TemplatePublico'
import FormLogin from '../../organismos/organismosJSX/FormLogin'
import { apiJson } from '../../../services/api'
import { endpoints } from '../../../services/endpoints'
import { gravarSessao } from '../../../utils/sessao'
import '../paginasCSS/Login.css'

function Login() {
  const [erroApi, setErroApi] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleLogin(dados) {
    setErroApi('')
    setEnviando(true)
    try {
      const usuario = await apiJson(endpoints.login, {
        method: 'POST',
        body: JSON.stringify(dados),
      })
      gravarSessao(usuario)
      window.location.href = '/produtos'
    } catch (falha) {
      setErroApi(falha.message || 'Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TemplatePublico>
      <div className="login">
        <FormLogin
          onSubmit={handleLogin}
          erroExterno={erroApi}
          enviando={enviando}
        />
      </div>
    </TemplatePublico>
  )
}

export default Login
