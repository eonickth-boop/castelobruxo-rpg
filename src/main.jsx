import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SidebarGlobal from './components/layout/SidebarGlobal.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
    <SidebarGlobal />
    <App />
  </>
  </StrictMode>,
)


