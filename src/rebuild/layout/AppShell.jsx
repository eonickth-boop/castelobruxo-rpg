import { navegar } from '../lib/router'
import { useAuth } from '../auth/AuthProvider'

const links = [
  ['/inicio', 'Início'],
  ['/personagem', 'Personagem'],
  ['/disciplinas', 'Disciplinas'],
  ['/mapa', 'Mapa'],
  ['/inventario', 'Inventário'],
  ['/mercado', 'Mercado'],
  ['/comunidade', 'Comunidade'],
]

export function AppShell({ children, path }) {
  const { profile, logout } = useAuth()

  return (
    <div className="cb-app-shell">
      <aside className="cb-sidebar">
        <div className="cb-brand">
          <span className="cb-brand-mark">C</span>
          <div>
            <strong>Castelobruxo</strong>
            <small>Escola de magia brasileira</small>
          </div>
        </div>

        <nav aria-label="Navegação principal">
          {links.map(([href, label]) => (
            <button
              key={href}
              className={path === href ? 'is-active' : ''}
              onClick={() => navegar(href)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="cb-sidebar-footer">
          <span>{profile?.nome_personagem || profile?.usuario || 'Estudante'}</span>
          <button type="button" onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="cb-main">{children}</main>
    </div>
  )
}
