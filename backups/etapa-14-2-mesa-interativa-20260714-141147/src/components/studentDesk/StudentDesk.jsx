import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import './StudentDesk.css'
import Tucano from '../pets/Tucano'

const objetos = [
  {
    id: 'biblioteca',
    classe: 'desk-livros',
    titulo: 'Biblioteca Central',
    icone: '📚',
    acao: 'onBiblioteca',
  },
  {
    id: 'diario',
    classe: 'desk-diario',
    titulo: 'Diário do Personagem',
    icone: '📖',
    acao: 'onDiario',
  },
  {
    id: 'banco',
    classe: 'desk-bau',
    titulo: 'Banco da Árvore Ancestral',
    icone: '🏦',
    acao: 'onBanco',
  },
  {
    id: 'mercado',
    classe: 'desk-caneca',
    titulo: 'Mercado das Cinco Trilhas',
    icone: '🛒',
    acao: 'onMercado',
  },
  {
    id: 'inventario',
    classe: 'desk-mochila',
    titulo: 'Inventário',
    icone: '🎒',
    acao: 'onInventario',
  },
  {
    id: 'avisos',
    classe: 'desk-pergaminho',
    titulo: 'Quadro de Avisos',
    icone: '📜',
    acao: 'onAvisos',
  },
  {
    id: 'perfil',
    classe: 'desk-cristal',
    titulo: 'Perfil Público',
    icone: '🌐',
    acao: 'onPerfil',
  },
  {
    id: 'academico',
    classe: 'desk-mapa',
    titulo: 'Sistema Acadêmico',
    icone: '🎓',
    acao: 'onAcademico',
  },
  {
    id: 'pets',
    classe: 'desk-pet-area',
    titulo: 'Meus Companheiros',
    icone: '🐾',
    acao: 'onPets',
  },
]

export default function StudentDesk({
  carregando = false,
  onBanco,
  onMercado,
  onInventario,
  onBiblioteca,
  onDiario,
  onAvisos,
  onPerfil,
  onAcademico,
  onPets,
  usuarioId,
}) {
  const [petAtivo, setPetAtivo] = useState(null)

  useEffect(() => {
    async function carregarPetAtivo() {
      if (!usuarioId) {
        setPetAtivo(null)
        return
      }

      const { data, error } = await supabase
        .from('pets_usuarios')
        .select(`
          id,
          nome_personalizado,
          equipado,
          pets (
            nome,
            especie
          )
        `)
        .eq('usuario_id', usuarioId)
        .eq('equipado', true)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar pet ativo:', error)
        return
      }

      setPetAtivo(data ?? null)
    }

    carregarPetAtivo()
  }, [usuarioId])
  const acoes = {
    onBanco,
    onMercado,
    onInventario,
    onBiblioteca,
    onDiario,
    onAvisos,
    onPerfil,
    onAcademico,
    onPets,
  }


  function iconeDoPet(especie = '') {
    const valor = especie.toLowerCase()

    if (valor.includes('coruja')) return '🦉'
    if (valor.includes('sapo')) return '🐸'
    if (valor.includes('lagarto')) return '🦎'
    if (valor.includes('raposa')) return '🦊'
    if (valor.includes('arara')) return '🦜'
    if (valor.includes('tucano')) return '🦜'
    if (valor.includes('jabuti')) return '🐢'

    return '🐾'
  }

  return (
    <section className="student-desk-section">
      <div className="student-desk">
        <img
          src="/assets/interface/mesa-estudante.png"
          alt="Mesa de estudos mágica do aluno de Castelobruxo"
          className="student-desk-image"
        />

        {objetos.map((objeto) => (
          <button
            key={objeto.id}
            type="button"
            className={`student-desk-hotspot ${objeto.classe}`}
            onClick={acoes[objeto.acao]}
            disabled={carregando || !acoes[objeto.acao]}
            aria-label={objeto.titulo}
          >
            <span className="student-desk-tooltip">
              <b>{objeto.icone}</b>
              {objeto.titulo}
            </span>
          </button>
        ))}

        {petAtivo && (
  <div className="student-desk-pet-vivo">
    {petAtivo.pets?.especie
      ?.toLowerCase()
      .includes('tucano') ? (
      <Tucano onClick={onPets} />
    ) : (
      <button
        type="button"
        className="student-desk-pet-placeholder"
        onClick={onPets}
        title={
          petAtivo.nome_personalizado ||
          petAtivo.pets?.nome ||
          'Companheiro ativo'
        }
      >
        {iconeDoPet(petAtivo.pets?.especie)}
      </button>
    )}
  </div>
)}
      </div>
    </section>
  )
}
