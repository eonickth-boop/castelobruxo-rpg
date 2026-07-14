import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'

export default function AlbumPersonagem({ usuarioId }) {
  const [imagens, setImagens] = useState([])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!usuarioId) return

      const { data, error } = await supabase
        .from('midias_perfil')
        .select('id, url_arquivo, criado_em')
        .eq('usuario_id', usuarioId)
        .eq('tipo', 'galeria')
        .eq('status', 'aprovado')
        .order('criado_em', { ascending: false })

      if (error) {
        console.error('Erro ao carregar álbum:', error)
        return
      }

      if (ativo) setImagens(data ?? [])
    }

    carregar()
    return () => { ativo = false }
  }, [usuarioId])

  if (imagens.length === 0) return null

  return (
    <section className="perfil-album">
      <header className="perfil-secao-cabecalho">
        <div>
          <p>Memórias visuais</p>
          <h2>Álbum do Personagem</h2>
        </div>
        <span>{imagens.length} imagens</span>
      </header>

      <div className="perfil-album-grade">
        {imagens.map((imagem) => (
          <img
            key={imagem.id}
            src={imagem.url_arquivo}
            alt="Registro do personagem"
          />
        ))}
      </div>
    </section>
  )
}
