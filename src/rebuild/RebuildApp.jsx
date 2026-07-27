import { AuthProvider, useAuth } from './auth/AuthProvider'
import { AppShell } from './layout/AppShell'
import { useRota } from './lib/router'
import { HomePage, LoginPage, NotFoundPage, PlaceholderPage } from './pages'

const routes = {
  '/inicio': <HomePage />,
  '/personagem': <PlaceholderPage title="Personagem" description="Perfil, ficha, aprovação e progresso do estudante." />,
  '/disciplinas': <PlaceholderPage title="Disciplinas" description="Catálogo de disciplinas, aulas e progresso acadêmico." />,
  '/mapa': <PlaceholderPage title="Mapa" description="Locais, exploração e páginas de ambiente." />,
  '/inventario': <PlaceholderPage title="Inventário" description="Itens, quantidades, equipamentos e histórico." />,
  '/mercado': <PlaceholderPage title="Mercado" description="Catálogo, compras seguras e carteira do usuário." />,
  '/comunidade': <PlaceholderPage title="Comunidade" description="Mural, interações e comunicação entre participantes." />,
}

function ProtectedApp() {
  const { path } = useRota()
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <div className="cb-loading">Carregando Castelobruxo…</div>
  if (!isAuthenticated) return <LoginPage />

  return <AppShell path={path}>{routes[path] ?? <NotFoundPage />}</AppShell>
}

export function RebuildApp() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  )
}
