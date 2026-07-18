import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import RpgCenas from './pages/RpgCenas.jsx'
import SidebarGlobal from './components/layout/SidebarGlobal.jsx'

const paginaRpg = window.location.pathname.startsWith('/rpg')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {paginaRpg ? (
      <RpgCenas />
    ) : (
      <>
        <SidebarGlobal />
        <App />
      </>
    )}
  </StrictMode>,
)
