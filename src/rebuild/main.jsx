import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RebuildApp } from './RebuildApp'
import './rebuild.css'

const root = createRoot(document.getElementById('rebuild-root'))

root.render(
  <StrictMode>
    <RebuildApp />
  </StrictMode>,
)
