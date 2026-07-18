import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root'))

function mostrarErro(error) {
  console.error('Falha ao iniciar Castelobruxo:', error)

  root.render(
    <main
      style={{
        maxWidth: '760px',
        margin: '60px auto',
        padding: '28px',
        color: '#eee7d7',
        background: 'rgba(17, 25, 20, .96)',
        border: '1px solid rgba(201, 164, 92, .45)',
        borderRadius: '18px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ color: '#e5c16b' }}>Castelobruxo não conseguiu iniciar</h1>
      <p>
        A publicação foi concluída, mas ocorreu um erro ao carregar o aplicativo.
      </p>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          padding: '16px',
          background: '#090e0b',
          borderRadius: '10px',
        }}
      >
        {error?.message || String(error)}
      </pre>
      <button type="button" onClick={() => window.location.reload()}>
        Tentar novamente
      </button>
    </main>,
  )
}

async function iniciar() {
  try {
    const paginaRpg = window.location.pathname.startsWith('/rpg')

    if (paginaRpg) {
      const { default: RpgCenas } = await import('./pages/RpgCenas.jsx')
      root.render(
        <StrictMode>
          <RpgCenas />
        </StrictMode>,
      )
      return
    }

    const [{ default: App }, { default: SidebarGlobal }] = await Promise.all([
      import('./App.jsx'),
      import('./components/layout/SidebarGlobal.jsx'),
    ])

    root.render(
      <StrictMode>
        <SidebarGlobal />
        <App />
      </StrictMode>,
    )
  } catch (error) {
    mostrarErro(error)
  }
}

iniciar()
