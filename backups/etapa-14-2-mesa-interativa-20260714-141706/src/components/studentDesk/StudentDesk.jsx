import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/studentDesk/mesa-interativa.css'

const hotspots = [
  ['biblioteca','Biblioteca','Abrir o acervo','hotspot-livro','📚','onBiblioteca'],
  ['diario','Diário','Abrir o diário','hotspot-diario','📔','onDiario'],
  ['academico','Sistema Acadêmico','Aulas e disciplinas','hotspot-cristal','💎','onAcademico'],
  ['mapa','Mapa Interativo','Explorar Castelobruxo','hotspot-mapa','🗺️','onMapa'],
  ['missoes','Missões','Ver missões','hotspot-pena','🪶','onMissoes'],
  ['eventos','Eventos','Programação da escola','hotspot-relogio','🕰️','onEventos'],
  ['banco','Banco','Banco da Árvore Ancestral','hotspot-bolsa','💰','onBanco'],
  ['inventario','Inventário','Abrir mochila','hotspot-mochila','🎒','onInventario'],
  ['correio','Correio Mágico','Ler correspondências','hotspot-cartas','✉️','onCorreio'],
  ['avisos','Quadro de Avisos','Ver comunicados','hotspot-tinteiro','📜','onAvisos'],
].map(([id,rotulo,dica,classe,icone,acao]) => ({id,rotulo,dica,classe,icone,acao}))

function slugPet(valor = '') {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function StudentDesk(props) {
  const {
    carregando,onBanco,onMercado,onInventario,onBiblioteca,onDiario,
    onAvisos,onPerfil,onAcademico,onPets,onMapa,onMissoes,onEventos,
    onCorreio,usuarioId,
  } = props

  const [companheiro, setCompanheiro] = useState(null)
  const [imagemFalhou, setImagemFalhou] = useState(false)
  const [modoAjuda, setModoAjuda] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregarCompanheiro() {
      if (!usuarioId) return
      const { data, error } = await supabase
        .from('pets_usuarios')
        .select(`id,nome_personalizado,equipado,pets(id,nome,especie,imagem_url)`)
        .eq('usuario_id', usuarioId)
        .eq('equipado', true)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar pet da mesa:', error)
        return
      }
      if (ativo) {
        setCompanheiro(data ?? null)
        setImagemFalhou(false)
      }
    }
    carregarCompanheiro()
    return () => { ativo = false }
  }, [usuarioId])

  const acoes = {
    onBanco,onMercado,onInventario,onBiblioteca,onDiario,onAvisos,
    onPerfil,onAcademico,onPets,onMapa,onMissoes,onEventos,onCorreio,
  }

  const pet = companheiro?.pets
  const nomePet = companheiro?.nome_personalizado || pet?.nome || 'Companheiro'
  const classePet = useMemo(
    () => `mesa-pet mesa-pet-${slugPet(pet?.especie || pet?.nome)}`,
    [pet],
  )

  function executar(nomeAcao) {
    const acao = acoes[nomeAcao]
    if (typeof acao === 'function') acao()
  }

  return (
    <section className={`mesa-interativa ${modoAjuda ? 'mesa-mostrar-ajuda' : ''}`}>
      <img className="mesa-cenario" src="/assets/interface/mesa-estudante.png" alt="Mesa mágica do estudante" />
      <div className="mesa-luz-janela" aria-hidden="true" />
      <div className="mesa-cristal-brilho" aria-hidden="true" />
      <div className="mesa-vela-brilho" aria-hidden="true" />
      <div className="mesa-particulas" aria-hidden="true"><i/><i/><i/><i/><i/></div>

      {hotspots.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mesa-hotspot ${item.classe}`}
          onClick={() => executar(item.acao)}
          disabled={carregando || typeof acoes[item.acao] !== 'function'}
          aria-label={`${item.rotulo}: ${item.dica}`}
        >
          <span className="mesa-hotspot-pulso" />
          <span className="mesa-hotspot-etiqueta">
            <b>{item.icone}</b>
            <span><strong>{item.rotulo}</strong><small>{item.dica}</small></span>
          </span>
        </button>
      ))}

      {companheiro && (
        <button type="button" className={classePet} onClick={onPets}>
          {!imagemFalhou && pet?.imagem_url ? (
            <img src={pet.imagem_url} alt={nomePet} onError={() => setImagemFalhou(true)} />
          ) : <span>🐾</span>}
          <span className="mesa-pet-nome"><strong>{nomePet}</strong><small>Ver companheiro</small></span>
        </button>
      )}

      <div className="mesa-controles">
        <button type="button" onClick={() => setModoAjuda((v) => !v)}>
          {modoAjuda ? 'Ocultar atalhos' : 'Mostrar atalhos'}
        </button>
        <button type="button" onClick={onMercado}>Mercado</button>
        <button type="button" onClick={onPerfil}>Perfil público</button>
      </div>

      <p className="mesa-instrucao">Clique nos objetos da mesa para navegar.</p>
    </section>
  )
}
