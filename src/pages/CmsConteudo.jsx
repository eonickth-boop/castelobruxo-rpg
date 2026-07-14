import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/cms-conteudo.css'

export default function CmsConteudo({ perfil, onVoltar }) {
  const [aba, setAba] = useState('midias')
  const [midias, setMidias] = useState([])
  const [pets, setPets] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [editandoPet, setEditandoPet] = useState(null)

  const administrador = ['administrador', 'admin'].includes(
    String(perfil?.cargo || '').toLowerCase(),
  )

  useEffect(() => {
    if (administrador) carregarDados()
    else setCarregando(false)
  }, [administrador])

  async function carregarDados() {
    setCarregando(true)
    setMensagem('')

    const [resultadoMidias, resultadoPets] = await Promise.all([
      supabase.rpc('listar_midias_pendentes_administracao'),
      supabase.rpc('listar_pets_administracao'),
    ])

    if (resultadoMidias.error) {
      setMensagem(resultadoMidias.error.message)
      setMidias([])
    } else {
      setMidias(resultadoMidias.data ?? [])
    }

    if (resultadoPets.error) {
      setMensagem(resultadoPets.error.message)
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
      [pet.nome, pet.especie, pet.raridade, pet.descricao]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [pets, busca])

  async function moderarMidia(item, novoStatus) {
    setProcessando(item.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'moderar_midia_perfil_administracao',
      {
        midia_alvo: item.id,
        novo_status: novoStatus,
      },
    )

    if (error) {
      setMensagem(error.message)
      setProcessando(null)
      return
    }

    setMensagem('Mídia atualizada com sucesso.')
    setProcessando(null)
    await carregarDados()
  }

  async function salvarPet(evento) {
    evento.preventDefault()
    if (!editandoPet) return

    setProcessando(editandoPet.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'salvar_pet_administracao',
      {
        pet_alvo: editandoPet.id,
        novo_nome: editandoPet.nome,
        nova_especie: editandoPet.especie,
        nova_descricao: editandoPet.descricao,
        nova_imagem_url: editandoPet.imagem_url,
        nova_raridade: editandoPet.raridade,
        nova_personalidade: editandoPet.personalidade_base,
        nova_historia: editandoPet.historia_base,
        novo_ativo: Boolean(editandoPet.ativo),
      },
    )

    if (error) {
      setMensagem(error.message)
      setProcessando(null)
      return
    }

    setMensagem('Pet salvo com sucesso.')
    setEditandoPet(null)
    setProcessando(null)
    await carregarDados()
  }

  if (!administrador) {
    return (
      <main className="cms-pagina">
        <button type="button" onClick={onVoltar}>← Voltar</button>
        <section className="cms-sem-acesso">
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
        <span>Administração de mídias e catálogo de pets</span>
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
          🐾 Catálogo de pets
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
          {midiasFiltradas.map((item) => (
            <article key={item.id} className="cms-card">
              <div className="cms-imagem">
                <img src={item.url_arquivo} alt={item.tipo} />
              </div>

              <div className="cms-card-corpo">
                <small>{item.tipo}</small>
                <h2>{item.nome_personagem || item.usuario}</h2>
                <p>@{item.usuario}</p>
                <p>Status: {item.status}</p>

                <div className="cms-acoes">
                  <button
                    type="button"
                    disabled={processando === item.id}
                    onClick={() => moderarMidia(item, 'aprovado')}
                  >
                    Aprovar
                  </button>

                  <button
                    type="button"
                    disabled={processando === item.id}
                    onClick={() => moderarMidia(item, 'rejeitado')}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <>
          {editandoPet && (
            <section className="cms-card" style={{ marginBottom: 18 }}>
              <form className="cms-card-corpo" onSubmit={salvarPet}>
                <h2>Editar pet</h2>

                <label>
                  Nome
                  <input
                    value={editandoPet.nome || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        nome: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Espécie
                  <input
                    value={editandoPet.especie || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        especie: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  URL da imagem
                  <input
                    value={editandoPet.imagem_url || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        imagem_url: e.target.value,
                      })
                    }
                    placeholder="/assets/pets/tucano.png ou URL pública"
                  />
                </label>

                <label>
                  Raridade
                  <input
                    value={editandoPet.raridade || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        raridade: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    rows={4}
                    value={editandoPet.descricao || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        descricao: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Personalidade
                  <textarea
                    rows={3}
                    value={editandoPet.personalidade_base || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        personalidade_base: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  História
                  <textarea
                    rows={5}
                    value={editandoPet.historia_base || ''}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        historia_base: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(editandoPet.ativo)}
                    onChange={(e) =>
                      setEditandoPet({
                        ...editandoPet,
                        ativo: e.target.checked,
                      })
                    }
                  />
                  Pet ativo no catálogo
                </label>

                <div className="cms-acoes">
                  <button type="submit">Salvar pet</button>
                  <button
                    type="button"
                    onClick={() => setEditandoPet(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="cms-grade">
            {petsFiltrados.map((pet) => (
              <article key={pet.id} className="cms-card">
                <div className="cms-imagem">
                  {pet.imagem_url ? (
                    <img src={pet.imagem_url} alt={pet.nome} />
                  ) : (
                    <span>🐾</span>
                  )}
                </div>

                <div className="cms-card-corpo">
                  <small>{pet.especie || 'Sem espécie'}</small>
                  <h2>{pet.nome}</h2>
                  <p>{pet.descricao || 'Descrição ainda não cadastrada.'}</p>
                  <p>Adoções: {pet.total_adocoes || 0}</p>

                  <button
                    type="button"
                    onClick={() => setEditandoPet({ ...pet })}
                  >
                    Editar pet
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}
