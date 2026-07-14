import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'

export default function CompanheiroPublico({ usuarioId, onAbrirPet }) {
  const [registro, setRegistro] = useState(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!usuarioId) return

      const { data, error } = await supabase
        .from('pets_usuarios')
        .select(`
          id, usuario_id, nome_personalizado, equipado, nivel, experiencia,
          afinidade, fome, felicidade, energia, idade, personalidade, historia,
          pets (
            id, nome, especie, descricao, imagem_url, raridade,
            historia_base, personalidade_base
          )
        `)
        .eq('usuario_id', usuarioId)
        .eq('equipado', true)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar companheiro público:', error)
        return
      }

      if (ativo) setRegistro(data ?? null)
    }

    carregar()
    return () => { ativo = false }
  }, [usuarioId])

  if (!registro) {
    return (
      <article>
        <span>🐾</span>
        <h3>Companheiro Mágico</h3>
        <p>Nenhum companheiro foi vinculado a este personagem.</p>
        <button type="button" disabled>Nenhum companheiro ativo</button>
      </article>
    )
  }

  const nome = registro.nome_personalizado || registro.pets?.nome || 'Companheiro'

  return (
    <article className="perfil-companheiro-card">
      <div className="perfil-companheiro-imagem">
        {registro.pets?.imagem_url ? (
          <img src={registro.pets.imagem_url} alt={nome} />
        ) : (
          <span>🐾</span>
        )}
      </div>

      <h3>{nome}</h3>
      <p>
        {registro.pets?.especie || 'Criatura mágica'} · Nível {registro.nivel || 1}
      </p>
      <strong>Afinidade {registro.afinidade || 0}%</strong>

      <button type="button" onClick={() => onAbrirPet?.(registro)}>
        Ver companheiro
      </button>
    </article>
  )
}
