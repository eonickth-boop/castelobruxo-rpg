import { useEffect, useMemo, useState } from 'react'

const normalizar = (path) => {
  if (!path || path === '/') return '/inicio'
  return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
}

export function navegar(path) {
  const destino = normalizar(path)
  window.history.pushState({}, '', destino)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useRota() {
  const [path, setPath] = useState(() => normalizar(window.location.pathname))

  useEffect(() => {
    const atualizar = () => setPath(normalizar(window.location.pathname))
    window.addEventListener('popstate', atualizar)
    return () => window.removeEventListener('popstate', atualizar)
  }, [])

  return useMemo(() => ({ path, navegar }), [path])
}
