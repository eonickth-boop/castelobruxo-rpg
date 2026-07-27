import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await login(username, password)
    setLoading(false)
    if (error) setMessage('Nome de usuário ou senha incorretos.')
  }

  return (
    <main className="cb-auth-page">
      <section className="cb-auth-card">
        <span className="cb-eyebrow">Bem-vindo de volta</span>
        <h1>Entre em Castelobruxo</h1>
        <p>Continue sua jornada pela escola de magia brasileira.</p>
        <form onSubmit={submit}>
          <label>Nome de usuário<input value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
        {message && <p className="cb-feedback">{message}</p>}
      </section>
    </main>
  )
}

export function HomePage() {
  return (
    <div className="cb-page">
      <header className="cb-hero">
        <span className="cb-eyebrow">Ano letivo</span>
        <h1>Seu painel em Castelobruxo</h1>
        <p>Aulas, avisos, eventos e progresso reunidos em um único lugar.</p>
      </header>
      <section className="cb-grid cb-grid-3">
        {['Próxima aula', 'Pontos da tribo', 'Missões disponíveis'].map((title) => (
          <article className="cb-card" key={title}><small>Resumo</small><h2>{title}</h2><p>Conteúdo será conectado ao Supabase durante a migração.</p></article>
        ))}
      </section>
      <section className="cb-card"><h2>Avisos recentes</h2><p>Nenhum aviso carregado nesta base.</p></section>
    </div>
  )
}

export function PlaceholderPage({ title, description }) {
  return (
    <div className="cb-page">
      <header className="cb-page-header"><span className="cb-eyebrow">Módulo</span><h1>{title}</h1><p>{description}</p></header>
      <section className="cb-card"><h2>Base pronta</h2><p>Este módulo será migrado do sistema atual sem misturar sua lógica com o restante da aplicação.</p></section>
    </div>
  )
}

export function NotFoundPage() {
  return <PlaceholderPage title="Página não encontrada" description="A rota informada ainda não existe na nova base." />
}
