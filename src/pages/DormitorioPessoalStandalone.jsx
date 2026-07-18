import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import DormitorioPessoal from './DormitorioPessoal'

export default function DormitorioPessoalStandalone() {
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function iniciar() {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) { setCarregando(false); return }
      const { data: dadosPerfil } = await supabase.from('perfis').select('*').eq('id', data.session.user.id).maybeSingle()
      setPerfil(dadosPerfil); setCarregando(false)
    }
    iniciar()
  }, [])

  function abrir(pagina) { window.location.href = `/?pagina=${encodeURIComponent(pagina)}` }

  if (carregando) return <main style={{ padding: 40, color: '#eee7d7' }}>Preparando seu dormitório...</main>
  if (!perfil) return <main style={{ padding: 40, color: '#eee7d7' }}><h1>Dormitório pessoal</h1><p>Entre na sua conta para acessar este espaço.</p></main>

  return <DormitorioPessoal perfil={perfil} onVoltar={() => { window.location.href = '/' }} onAbrirInventario={() => abrir('inventario')} onAbrirPets={() => abrir('pets')} onAbrirCertificados={() => abrir('certificados')} onAbrirConquistas={() => abrir('conquistas')} />
}
