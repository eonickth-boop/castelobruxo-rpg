import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { iniciarPontePerfilSocial } from './socialProfileBridge.jsx'

const root = createRoot(document.getElementById('root'))

function mostrarErro(error) {
  console.error('Falha ao iniciar Castelobruxo:', error)
  root.render(
    <main style={{ maxWidth: '760px', margin: '60px auto', padding: '28px', color: '#eee7d7', background: 'rgba(17,25,20,.96)', border: '1px solid rgba(201,164,92,.45)', borderRadius: '18px', fontFamily: 'system-ui,sans-serif' }}>
      <h1 style={{ color: '#e5c16b' }}>Castelobruxo não conseguiu iniciar</h1>
      <p>A publicação foi concluída, mas ocorreu um erro ao carregar o aplicativo.</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '16px', background: '#090e0b', borderRadius: '10px' }}>{error?.message || String(error)}</pre>
      <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
    </main>,
  )
}

async function renderizarPagina(Pagina, SidebarGlobal) {
  root.render(<StrictMode><SidebarGlobal /><Pagina /></StrictMode>)
}

async function iniciar() {
  try {
    const path = window.location.pathname
    const { default: SidebarGlobal } = await import('./components/layout/SidebarGlobal.jsx')

    if (path.startsWith('/rpg')) {
      const [
        { default: RpgCenas },
        { default: PainelTestesGlobal },
        { default: PainelItensGlobal },
        { default: PainelRecompensasGlobal },
        { default: PainelNpcsGlobal },
        { default: PainelCampanhasGlobal },
        { default: CentralNarradorGlobal },
      ] = await Promise.all([
        import('./pages/RpgCenas.jsx'),
        import('./components/rpg/PainelTestesGlobal.jsx'),
        import('./components/rpg/PainelItensGlobal.jsx'),
        import('./components/rpg/PainelRecompensasGlobal.jsx'),
        import('./components/rpg/PainelNpcsGlobal.jsx'),
        import('./components/rpg/PainelCampanhasGlobal.jsx'),
        import('./components/rpg/CentralNarradorGlobal.jsx'),
      ])
      root.render(<StrictMode><SidebarGlobal /><RpgCenas /><PainelTestesGlobal /><PainelItensGlobal /><PainelRecompensasGlobal /><PainelNpcsGlobal /><PainelCampanhasGlobal /><CentralNarradorGlobal /></StrictMode>)
      return
    }

    if (path.startsWith('/rotina')) {
      const { default: Pagina } = await import('./pages/RotinaEscolarStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/tribos')) {
      const { default: Pagina } = await import('./pages/TribosCompletasStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/chat')) {
      const { default: Pagina } = await import('./pages/ChatPrivadoStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/mural')) {
      const { default: Pagina } = await import('./pages/MuralComunidadeStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/servidores')) {
      const { default: Pagina } = await import('./pages/ServidoresStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/notificacoes')) {
      const { default: Pagina } = await import('./pages/NotificacoesPresencaStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/moderacao-social')) {
      const { default: Pagina } = await import('./pages/ModeracaoSocialStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }
    if (path.startsWith('/comunidade')) {
      const { default: Pagina } = await import('./pages/ComunidadeSocialStandalone.jsx')
      await renderizarPagina(Pagina, SidebarGlobal)
      return
    }

    if (path.startsWith('/dormitorio')) {
      window.location.replace('/')
      return
    }

    const { default: App } = await import('./App.jsx')
    root.render(<StrictMode><SidebarGlobal /><App /></StrictMode>)
    iniciarPontePerfilSocial()

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
