import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import RotinaEscolar from './RotinaEscolar'

export default function RotinaEscolarStandalone() {
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function iniciar() {
      const { data: sessaoData } = await supabase.auth.getSession()
      const usuario = sessaoData.session?.user
      if (!usuario) { window.location.href = '/'; return }
      const { data } = await supabase.from('perfis').select('*').eq('id', usuario.id).maybeSingle()
      setPerfil(data || null); setCarregando(false)
    }
    iniciar()
  }, [])

  if (carregando) return <main style={{ padding: 40 }}>Carregando calendário escolar...</main>
  if (!perfil) return <main style={{ padding: 40 }}>Não foi possível carregar o perfil.</main>

  return <RotinaEscolar
    perfil={perfil}
    onVoltar={() => { window.location.href = '/' }}
    onAbrirEventos={() => { window.location.href = '/?pagina=eventos' }}
    onAbrirMissoes={() => { window.location.href = '/?pagina=missoes' }}
    onAbrirAulas={() => { window.location.href = '/?pagina=aulas' }}
  />
}