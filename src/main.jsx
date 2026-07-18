import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))

function mostrarErro(error) {
  console.error('Falha ao iniciar Castelobruxo:', error)

  root.render(
    <main style={{ maxWidth: '760px', margin: '60px auto', padding: '28px', color: '#eee7d7', background: 'rgba(17, 25, 20, .96)', border: '1px solid rgba(201, 164, 92, .45)', borderRadius: '18px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#e5c16b' }}>Castelobruxo não conseguiu iniciar</h1>
      <p>A publicação foi concluída, mas ocorreu um erro ao carregar o aplicativo.</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '16px', background: '#090e0b', borderRadius: '10px' }}>{error?.message || String(error)}</pre>
      <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
    </main>,
  )
}

async function iniciar() {
  try {
    const paginaRpg = window.location.pathname.startsWith('/rpg')
    const paginaRotina = window.location.pathname.startsWith('/rotina')
    const paginaTribos = window.location.pathname.startsWith('/tribos')
    const paginaComunidade = window.location.pathname.startsWith('/comunidade')
    const paginaChat = window.location.pathname.startsWith('/chat')
    const { default: SidebarGlobal } = await import('./components/layout/SidebarGlobal.jsx')

    if (paginaRpg) {
      const [{ default: RpgCenas }, { default: PainelTestesGlobal }, { default: PainelItensGlobal }, { default: PainelRecompensasGlobal }, { default: PainelNpcsGlobal }, { default: PainelCampanhasGlobal }, { default: CentralNarradorGlobal }] = await Promise.all([
        import('./pages/RpgCenas.jsx'), import('./components/rpg/PainelTestesGlobal.jsx'), import('./components/rpg/PainelItensGlobal.jsx'), import('./components/rpg/PainelRecompensasGlobal.jsx'), import('./components/rpg/PainelNpcsGlobal.jsx'), import('./components/rpg/PainelCampanhasGlobal.jsx'), import('./components/rpg/CentralNarradorGlobal.jsx'),
      ])
      root.render(<StrictMode><SidebarGlobal /><RpgCenas /><PainelTestesGlobal /><PainelItensGlobal /><PainelRecompensasGlobal /><PainelNpcsGlobal /><PainelCampanhasGlobal /><CentralNarradorGlobal /></StrictMode>)
      return
    }

    if (paginaRotina) {
      const { default: RotinaEscolarStandalone } = await import('./pages/RotinaEscolarStandalone.jsx')
      root.render(<StrictMode><SidebarGlobal /><RotinaEscolarStandalone /></StrictMode>)
      return
    }

    if (paginaTribos) {
      const { default: TribosCompletasStandalone } = await import('./pages/TribosCompletasStandalone.jsx')
      root.render(<StrictMode><SidebarGlobal /><TribosCompletasStandalone /></StrictMode>)
      return
    }

    if (paginaChat) {
      const { default: ChatPrivadoStandalone } = await import('./pages/ChatPrivadoStandalone.jsx')
      root.render(<StrictMode><SidebarGlobal /><ChatPrivadoStandalone /></StrictMode>)
      return
    }

    if (paginaComunidade) {
      const { default: ComunidadeSocialStandalone } = await import('./pages/ComunidadeSocialStandalone.jsx')
      root.render(<StrictMode><SidebarGlobal /><ComunidadeSocialStandalone /></StrictMode>)
      return
    }

    if (window.location.pathname.startsWith('/dormitorio')) {
      window.location.replace('/')
      return
    }

    const { default: App } = await import('./App.jsx')
    root.render(<StrictMode><SidebarGlobal /><App /></StrictMode>)

    const destino = new URLSearchParams(window.location.search).get('pagina')
    if (destino) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('castelobruxo:navegar', { detail: { pagina: destino } }))
        window.history.replaceState({}, '', '/')
      }, 250)
    }
  } catch (error) {
    mostrarErro(error)
  }
}

iniciar()
