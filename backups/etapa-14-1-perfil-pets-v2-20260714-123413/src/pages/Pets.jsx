import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/pets.css'

function formatarData(data) {
  if (!data) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(data))
}

const selecaoPetUsuario = `
  id, usuario_id, pet_id, nome_personalizado, equipado, nivel, experiencia,
  afinidade, fome, felicidade, energia, idade, personalidade, historia,
  adquirido_em, atualizado_em,
  pets (
    id, nome, especie, descricao, imagem_url, raridade,
    historia_base, personalidade_base
  )
`

export default function Pets({ perfil, onVoltar, onAbrirPet }) {
  const [catalogo, setCatalogo] = useState([])
  const [meusPets, setMeusPets] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processandoId, setProcessandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { carregarDados() }, [perfil?.id])

  async function carregarDados() {
    if (!perfil?.id) return
    setCarregando(true)
    setMensagem('')

    const [respostaCatalogo, respostaUsuario] = await Promise.all([
      supabase
        .from('pets')
        .select(`
          id, nome, especie, descricao, imagem_url, raridade, nivel,
          afinidade, ativo, historia_base, personalidade_base, criado_em
        `)
        .eq('ativo', true)
        .order('nome', { ascending: true }),
      supabase
        .from('pets_usuarios')
        .select(selecaoPetUsuario)
        .eq('usuario_id', perfil.id)
        .order('equipado', { ascending: false })
        .order('adquirido_em', { ascending: true }),
    ])

    if (respostaCatalogo.error) setMensagem('Não foi possível carregar o catálogo de pets.')
    if (respostaUsuario.error) setMensagem('Não foi possível carregar seus companheiros.')

    setCatalogo(respostaCatalogo.data ?? [])
    setMeusPets(respostaUsuario.data ?? [])
    setCarregando(false)
  }

  const idsAdotados = useMemo(
    () => new Set(meusPets.map((registro) => registro.pet_id)),
    [meusPets],
  )

  const companheiroAtivo = useMemo(
    () => meusPets.find((registro) => registro.equipado) ?? null,
    [meusPets],
  )

  const petsExibidos = useMemo(() => {
    if (filtro === 'meus') return catalogo.filter((pet) => idsAdotados.has(pet.id))
    if (filtro === 'disponiveis') return catalogo.filter((pet) => !idsAdotados.has(pet.id))
    return catalogo
  }, [catalogo, filtro, idsAdotados])

  async function adotarPet(pet) {
    setProcessandoId(pet.id)
    setMensagem('')
    const deveEquipar = meusPets.length === 0

    const { data, error } = await supabase
      .from('pets_usuarios')
      .insert({
        usuario_id: perfil.id,
        pet_id: pet.id,
        nome_personalizado: pet.nome,
        equipado: deveEquipar,
        nivel: 1,
        experiencia: 0,
        afinidade: 0,
        fome: 100,
        felicidade: 100,
        energia: 100,
        atualizado_em: new Date().toISOString(),
      })
      .select(selecaoPetUsuario)
      .single()

    if (error) {
      setMensagem(error.message || 'Não foi possível adotar o pet.')
      setProcessandoId(null)
      return
    }

    setMeusPets((estadoAtual) => [...estadoAtual, data])
    setMensagem(`${pet.nome} foi adotado com sucesso.`)
    setProcessandoId(null)
  }

  async function equiparPet(registro) {
    setProcessandoId(registro.id)
    setMensagem('')

    const idsAtivos = meusPets
      .filter((item) => item.equipado && item.id !== registro.id)
      .map((item) => item.id)

    if (idsAtivos.length > 0) {
      const { error } = await supabase
        .from('pets_usuarios')
        .update({ equipado: false })
        .in('id', idsAtivos)

      if (error) {
        setMensagem('Não foi possível trocar o companheiro ativo.')
        setProcessandoId(null)
        return
      }
    }

    const { data, error } = await supabase
      .from('pets_usuarios')
      .update({ equipado: true, atualizado_em: new Date().toISOString() })
      .eq('id', registro.id)
      .select(selecaoPetUsuario)
      .single()

    if (error) {
      setMensagem('Não foi possível equipar este pet.')
      setProcessandoId(null)
      return
    }

    setMeusPets((estadoAtual) =>
      estadoAtual.map((item) =>
        item.id === data.id ? data : { ...item, equipado: false },
      ),
    )
    setMensagem(`${data.nome_personalizado || data.pets?.nome} agora acompanha você.`)
    setProcessandoId(null)
  }

  function registroDoPet(petId) {
    return meusPets.find((registro) => registro.pet_id === petId)
  }

  return (
    <main className="pets-page">
      <button type="button" className="pets-voltar" onClick={onVoltar}>← Voltar</button>

      <header className="pets-hero">
        <p>Companheiros de jornada</p>
        <h1>Meus Companheiros</h1>
        <span>Adote, cuide e acompanhe a evolução das criaturas ligadas ao seu personagem.</span>

        <div className="pets-resumo">
          <article><small>Companheiros</small><strong>{meusPets.length}</strong></article>
          <article><small>Catálogo</small><strong>{catalogo.length}</strong></article>
          <article>
            <small>Companheiro ativo</small>
            <strong className="pets-resumo-nome">
              {companheiroAtivo
                ? companheiroAtivo.nome_personalizado || companheiroAtivo.pets?.nome
                : 'Nenhum'}
            </strong>
          </article>
        </div>
      </header>

      {mensagem && <p className="pets-mensagem">{mensagem}</p>}

      {companheiroAtivo && (
        <section className="pet-ativo pet-ativo-ficha">
          <div className="pet-ativo-icone pet-ativo-imagem">
            {companheiroAtivo.pets?.imagem_url ? (
              <img
                src={companheiroAtivo.pets.imagem_url}
                alt={companheiroAtivo.nome_personalizado || companheiroAtivo.pets?.nome}
              />
            ) : <span>🐾</span>}
          </div>

          <div className="pet-ativo-dados">
            <p>Companheiro ativo</p>
            <h2>{companheiroAtivo.nome_personalizado || companheiroAtivo.pets?.nome}</h2>
            <span>
              {companheiroAtivo.pets?.especie} · {companheiroAtivo.pets?.raridade || 'Comum'}
            </span>

            <div className="pet-barras">
              <Barra titulo="Afinidade" valor={companheiroAtivo.afinidade} />
              <Barra titulo="Energia" valor={companheiroAtivo.energia ?? 100} />
              <Barra titulo="Fome" valor={companheiroAtivo.fome} />
              <Barra titulo="Felicidade" valor={companheiroAtivo.felicidade} />
            </div>

            <div className="pet-ativo-acoes">
              <button type="button" onClick={() => onAbrirPet(companheiroAtivo)}>
                Abrir ficha completa
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="pets-controles">
        <div><p>Catálogo oficial</p><h2>Pets de Castelobruxo</h2></div>
        <div className="pets-filtros">
          {[
            ['todos', 'Todos'],
            ['meus', 'Meus pets'],
            ['disponiveis', 'Disponíveis'],
          ].map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              className={filtro === id ? 'pets-filtro-ativo' : ''}
              onClick={() => setFiltro(id)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </section>

      {carregando ? (
        <p className="pets-vazio">Carregando companheiros...</p>
      ) : petsExibidos.length === 0 ? (
        <p className="pets-vazio">Nenhum pet encontrado neste filtro.</p>
      ) : (
        <section className="pets-grade">
          {petsExibidos.map((pet) => {
            const registro = registroDoPet(pet.id)

            return (
              <article
                key={pet.id}
                className={`pet-card ${registro?.equipado ? 'pet-card-ativo' : ''}`}
              >
                <div className="pet-card-icone pet-card-imagem">
                  {pet.imagem_url ? <img src={pet.imagem_url} alt={pet.nome} /> : <span>🐾</span>}
                </div>

                <div className="pet-card-conteudo">
                  <small>{pet.especie}</small>
                  <h3>{registro?.nome_personalizado || pet.nome}</h3>
                  <p>{pet.descricao || 'Companheiro de Castelobruxo.'}</p>

                  {registro ? (
                    <div className="pet-card-estatisticas">
                      <span>Nível {registro.nivel}</span>
                      <span>Afinidade {registro.afinidade}%</span>
                      <span>Adotado em {formatarData(registro.adquirido_em)}</span>
                    </div>
                  ) : (
                    <div className="pet-card-estatisticas">
                      <span>{pet.raridade || 'Comum'}</span>
                      <span>Disponível para adoção</span>
                    </div>
                  )}
                </div>

                <div className="pet-card-acoes">
                  {!registro ? (
                    <button
                      type="button"
                      onClick={() => adotarPet(pet)}
                      disabled={processandoId === pet.id}
                    >
                      {processandoId === pet.id ? 'Adotando...' : 'Adotar'}
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => onAbrirPet(registro)}>Ver ficha</button>
                      {!registro.equipado && (
                        <button
                          type="button"
                          onClick={() => equiparPet(registro)}
                          disabled={processandoId === registro.id}
                        >
                          Equipar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

function Barra({ titulo, valor }) {
  const numero = Math.max(0, Math.min(100, Number(valor || 0)))

  return (
    <div className="pet-barra">
      <div><span>{titulo}</span><strong>{numero}%</strong></div>
      <div className="pet-barra-trilho"><span style={{ width: `${numero}%` }} /></div>
    </div>
  )
}
