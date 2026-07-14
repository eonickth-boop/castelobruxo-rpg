import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/cms-conteudo.css'

function formatarData(valor) {
  if (!valor) return '—'

  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function CmsConteudo({ perfil, onVoltar }) {
  const [aba, setAba] = useState('midias')
  const [midias, setMidias] = useState([])
  const [pets, setPets] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const administrador = ['administrador', 'admin'].includes(
    String(perfil?.cargo || '').toLowerCase(),
  )

  useEffect(() => {
    if (!administrador) {
      setCarregando(false)
      return
    }

    carregarDados()
  }, [administrador])

  async function carregarDados() {
    setCarregando(true)
    setMensagem('')

    const [resultadoMidias, resultadoPets] = await Promise.all([
      supabase.rpc('listar_midias_pendentes_administracao'),
      supabase.rpc('listar_pets_administracao'),
    ])

    if (resultadoMidias.error) {
      console.error(resultadoMidias.error)
      setMensagem(
        resultadoMidias.error.message ||
          'Não foi possível carregar as mídias.',
      )
      setMidias([])
    } else {
      setMidias(resultadoMidias.data ?? [])
    }

    if (resultadoPets.error) {
      console.error(resultadoPets.error)
      setMensagem(
        resultadoPets.error.message ||
          'Não foi possível carregar os pets.',
      )
      setPets([])
    } else {
      setPets(resultadoPets.data ?? [])
    }

    setCarregando(false)
  }

  const midiasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return midias

    return midias.filter((item) =>
      [
        item.usuario,
        item.nome_personagem,
        item.tipo,
        item.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [midias, busca])

  const petsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return pets

    return pets.filter((pet) =>
      [
        pet.nome,
        pet.especie,
        pet.usuario,
        pet.nome_personagem,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [pets, busca])

  async function moderarMidia(item, novoStatus) {
    setProcessando(item.id)
    setMensagem('')

    const confirmar = window.confirm(
      `${novoStatus === 'aprovado' ? 'Aprovar' : 'Rejeitar'} esta mídia?`,
    )

    if (!confirmar) {
      setProcessando(null)
      return
    }

    const { error } = await supabase.rpc(
      'moderar_midia_perfil_administracao',
      {
        midia_alvo: item.id,
        novo_status: novoStatus,
      },
    )

    if (error) {
      setMensagem(error.message || 'Não foi possível moderar a mídia.')
      setProcessando(null)
      return
    }

    setMensagem('Mídia atualizada com sucesso.')
    setProcessando(null)
    await carregarDados()
  }

  async function alterarStatusPet(pet, ativo) {
    setProcessando(pet.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'alterar_status_pet_administracao',
      {
        pet_alvo: pet.id,
        novo_ativo: ativo,
      },
    )

    if (error) {
      setMensagem(error.message || 'Não foi possível atualizar o pet.')
      setProcessando(null)
      return
    }

    setMensagem('Pet atualizado com sucesso.')
    setProcessando(null)
    await carregarDados()
  }

  if (!administrador) {
    return (
      <main className="cms-pagina">
        <button type="button" onClick={onVoltar}>← Voltar</button>

        <section className="cms-sem-acesso">
          <span>🔒</span>
          <h1>Acesso restrito</h1>
          <p>Este módulo é exclusivo da administração.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="cms-pagina">
      <button type="button" className="cms-voltar" onClick={onVoltar}>
        ← Voltar
      </button>

      <header className="cms-hero">
        <p>Expansão de conteúdo</p>
        <h1>CMS de Castelobruxo</h1>
        <span>Administração de mídias, perfis e pets</span>
      </header>

      <nav className="cms-abas">
        <button
          type="button"
          className={aba === 'midias' ? 'ativo' : ''}
          onClick={() => setAba('midias')}
        >
          🖼️ Mídias de perfil
        </button>

        <button
          type="button"
          className={aba === 'pets' ? 'ativo' : ''}
          onClick={() => setAba('pets')}
        >
          🐾 Pets
        </button>

        <button
          type="button"
          className={aba === 'futuros' ? 'ativo' : ''}
          onClick={() => setAba('futuros')}
        >
          🧰 Próximos módulos
        </button>
      </nav>

      {mensagem && <p className="cms-mensagem">{mensagem}</p>}

      <section className="cms-busca">
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Pesquisar"
        />
      </section>

      {carregando ? (
        <p className="cms-estado">Carregando conteúdo...</p>
      ) : aba === 'midias' ? (
        <section className="cms-grade">
          {midiasFiltradas.length === 0 ? (
            <article className="cms-vazio">
              <span>🖼️</span>
              <h2>Nenhuma mídia encontrada</h2>
              <p>Uploads enviados pelos jogadores aparecerão aqui.</p>
            </article>
          ) : (
            midiasFiltradas.map((item) => (
              <article key={item.id} className="cms-card">
                <div className="cms-imagem">
                  <img src={item.url_arquivo} alt={item.tipo} />
                </div>

                <div className="cms-card-corpo">
                  <small>{item.tipo}</small>
                  <h2>{item.nome_personagem || item.usuario}</h2>
                  <p>@{item.usuario}</p>

                  <div className="cms-meta">
                    <span>Status: {item.status}</span>
                    <span>{formatarData(item.criado_em)}</span>
                  </div>

                  <div className="cms-acoes">
                    {item.status !== 'aprovado' && (
                      <button
                        type="button"
                        disabled={processando === item.id}
                        onClick={() => moderarMidia(item, 'aprovado')}
                      >
                        Aprovar
                      </button>
                    )}

                    {item.status !== 'rejeitado' && (
                      <button
                        type="button"
                        disabled={processando === item.id}
                        onClick={() => moderarMidia(item, 'rejeitado')}
                      >
                        Rejeitar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : aba === 'pets' ? (
        <section className="cms-grade">
          {petsFiltrados.length === 0 ? (
            <article className="cms-vazio">
              <span>🐾</span>
              <h2>Nenhum pet encontrado</h2>
              <p>Pets cadastrados aparecerão aqui.</p>
            </article>
          ) : (
            petsFiltrados.map((pet) => (
              <article key={pet.id} className="cms-card">
                <div className="cms-imagem">
                  {pet.foto_url ? (
                    <img src={pet.foto_url} alt={pet.nome} />
                  ) : (
                    <span>🐾</span>
                  )}
                </div>

                <div className="cms-card-corpo">
                  <small>{pet.especie || 'Espécie não definida'}</small>
                  <h2>{pet.nome}</h2>
                  <p>Tutor: {pet.nome_personagem || pet.usuario}</p>

                  <div className="cms-meta">
                    <span>Nível {pet.nivel || 1}</span>
                    <span>{pet.ativo ? 'Ativo' : 'Oculto'}</span>
                  </div>

                  <button
                    type="button"
                    disabled={processando === pet.id}
                    onClick={() => alterarStatusPet(pet, !pet.ativo)}
                  >
                    {pet.ativo ? 'Ocultar pet' : 'Reativar pet'}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className="cms-futuros">
          {[
            'Livros e páginas da biblioteca',
            'Cursos, disciplinas e aulas',
            'Atividades acadêmicas',
            'Itens e categorias do mercado',
            'Missões e recompensas',
            'Eventos e inscrições',
            'Locais do mapa',
            'NPCs',
            'Notícias e quadro de avisos',
            'Certificados e conquistas',
          ].map((item) => (
            <article key={item}>
              <span>○</span>
              <strong>{item}</strong>
              <small>Próximo módulo</small>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
