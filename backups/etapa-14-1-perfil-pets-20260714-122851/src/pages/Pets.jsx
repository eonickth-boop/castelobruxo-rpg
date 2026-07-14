import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/pets.css'

const icones = {
  coruja: '🦉',
  sapo: '🐸',
  lagarto: '🦎',
  raposa: '🦊',
  arara: '🦜',
  tucano: '🦜',
  jabuti: '🐢',
}

function obterIcone(especie = '') {
  const chave = especie.toLowerCase()

  if (chave.includes('coruja')) return icones.coruja
  if (chave.includes('sapo')) return icones.sapo
  if (chave.includes('lagarto')) return icones.lagarto
  if (chave.includes('raposa')) return icones.raposa
  if (chave.includes('arara')) return icones.arara
  if (chave.includes('tucano')) return icones.tucano
  if (chave.includes('jabuti')) return icones.jabuti

  return '🐾'
}

function formatarData(data) {
  if (!data) return 'Data não informada'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(data))
}

export default function Pets({ perfil, onVoltar }) {
  const [catalogo, setCatalogo] = useState([])
  const [meusPets, setMeusPets] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processandoId, setProcessandoId] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    carregarDados()
  }, [perfil?.id])

  async function carregarDados() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const [respostaCatalogo, respostaUsuario] = await Promise.all([
      supabase
        .from('pets')
        .select(`
          id,
          nome,
          especie,
          descricao,
          imagem_url,
          raridade,
          nivel,
          afinidade,
          ativo,
          criado_em
        `)
        .eq('ativo', true)
        .order('nome', { ascending: true }),

      supabase
        .from('pets_usuarios')
        .select(`
          id,
          usuario_id,
          pet_id,
          nome_personalizado,
          equipado,
          nivel,
          experiencia,
          afinidade,
          fome,
          felicidade,
          adquirido_em,
          atualizado_em,
          pets (
            id,
            nome,
            especie,
            descricao,
            imagem_url,
            raridade
          )
        `)
        .eq('usuario_id', perfil.id)
        .order('equipado', { ascending: false })
        .order('adquirido_em', { ascending: true }),
    ])

    if (respostaCatalogo.error) {
      console.error(respostaCatalogo.error)
      setMensagem('Não foi possível carregar o catálogo de pets.')
    }

    if (respostaUsuario.error) {
      console.error(respostaUsuario.error)
      setMensagem('Não foi possível carregar seus companheiros.')
    }

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
    if (filtro === 'meus') {
      return catalogo.filter((pet) => idsAdotados.has(pet.id))
    }

    if (filtro === 'disponiveis') {
      return catalogo.filter((pet) => !idsAdotados.has(pet.id))
    }

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
        atualizado_em: new Date().toISOString(),
      })
      .select(`
        id,
        usuario_id,
        pet_id,
        nome_personalizado,
        equipado,
        nivel,
        experiencia,
        afinidade,
        fome,
        felicidade,
        adquirido_em,
        atualizado_em,
        pets (
          id,
          nome,
          especie,
          descricao,
          imagem_url,
          raridade
        )
      `)
      .single()

    if (error) {
      console.error(error)
      setMensagem(error.message || 'Não foi possível adotar o pet.')
      setProcessandoId(null)
      return
    }

    setMeusPets((estadoAtual) => [...estadoAtual, data])
    setMensagem(
      deveEquipar
        ? `${pet.nome} foi adotado e já é seu companheiro ativo.`
        : `${pet.nome} foi adotado com sucesso.`,
    )
    setProcessandoId(null)
  }

  async function equiparPet(registro) {
    setProcessandoId(registro.id)
    setMensagem('')

    const outrosIds = meusPets
      .filter((item) => item.equipado && item.id !== registro.id)
      .map((item) => item.id)

    if (outrosIds.length > 0) {
      const { error: erroDesativar } = await supabase
        .from('pets_usuarios')
        .update({
          equipado: false,
          atualizado_em: new Date().toISOString(),
        })
        .in('id', outrosIds)

      if (erroDesativar) {
        console.error(erroDesativar)
        setMensagem('Não foi possível trocar o companheiro ativo.')
        setProcessandoId(null)
        return
      }
    }

    const { data, error } = await supabase
      .from('pets_usuarios')
      .update({
        equipado: true,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', registro.id)
      .select(`
        id,
        usuario_id,
        pet_id,
        nome_personalizado,
        equipado,
        nivel,
        experiencia,
        afinidade,
        fome,
        felicidade,
        adquirido_em,
        atualizado_em,
        pets (
          id,
          nome,
          especie,
          descricao,
          imagem_url,
          raridade
        )
      `)
      .single()

    if (error) {
      console.error(error)
      setMensagem('Não foi possível equipar este pet.')
      setProcessandoId(null)
      return
    }

    setMeusPets((estadoAtual) =>
      estadoAtual.map((item) => {
        if (item.id === data.id) return data
        return { ...item, equipado: false }
      }),
    )

    setMensagem(
      `${data.nome_personalizado || data.pets?.nome} agora acompanha você.`,
    )
    setProcessandoId(null)
  }

  async function cuidar(registro, tipo) {
    setProcessandoId(`${tipo}-${registro.id}`)
    setMensagem('')

    const atualizacao =
      tipo === 'alimentar'
        ? {
            fome: Math.min(100, Number(registro.fome || 0) + 15),
            afinidade: Math.min(100, Number(registro.afinidade || 0) + 2),
          }
        : {
            felicidade: Math.min(
              100,
              Number(registro.felicidade || 0) + 15,
            ),
            afinidade: Math.min(100, Number(registro.afinidade || 0) + 3),
          }

    const { data, error } = await supabase
      .from('pets_usuarios')
      .update({
        ...atualizacao,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', registro.id)
      .select(`
        id,
        usuario_id,
        pet_id,
        nome_personalizado,
        equipado,
        nivel,
        experiencia,
        afinidade,
        fome,
        felicidade,
        adquirido_em,
        atualizado_em,
        pets (
          id,
          nome,
          especie,
          descricao,
          imagem_url,
          raridade
        )
      `)
      .single()

    if (error) {
      console.error(error)
      setMensagem('Não foi possível cuidar do pet.')
      setProcessandoId(null)
      return
    }

    setMeusPets((estadoAtual) =>
      estadoAtual.map((item) => (item.id === data.id ? data : item)),
    )

    setMensagem(
      tipo === 'alimentar'
        ? `${data.nome_personalizado || data.pets?.nome} foi alimentado.`
        : `${data.nome_personalizado || data.pets?.nome} brincou com você.`,
    )
    setProcessandoId(null)
  }

  function registroDoPet(petId) {
    return meusPets.find((registro) => registro.pet_id === petId)
  }

  return (
    <main className="pets-page">
      <button type="button" className="pets-voltar" onClick={onVoltar}>
        ← Voltar
      </button>

      <header className="pets-hero">
        <p>Companheiros de jornada</p>
        <h1>Meus Companheiros</h1>
        <span>
          Adote, cuide e escolha quem acompanhará seu personagem pela escola.
        </span>

        <div className="pets-resumo">
          <article>
            <small>Companheiros</small>
            <strong>{meusPets.length}</strong>
          </article>

          <article>
            <small>Catálogo</small>
            <strong>{catalogo.length}</strong>
          </article>

          <article>
            <small>Companheiro ativo</small>
            <strong className="pets-resumo-nome">
              {companheiroAtivo
                ? companheiroAtivo.nome_personalizado ||
                  companheiroAtivo.pets?.nome
                : 'Nenhum'}
            </strong>
          </article>
        </div>
      </header>

      {mensagem && <p className="pets-mensagem">{mensagem}</p>}

      {companheiroAtivo && (
        <section className="pet-ativo">
          <div className="pet-ativo-icone">
            {obterIcone(companheiroAtivo.pets?.especie)}
          </div>

          <div className="pet-ativo-dados">
            <p>Companheiro ativo</p>
            <h2>
              {companheiroAtivo.nome_personalizado ||
                companheiroAtivo.pets?.nome}
            </h2>
            <span>{companheiroAtivo.pets?.especie}</span>

            <div className="pet-barras">
              <Barra
                titulo="Afinidade"
                valor={companheiroAtivo.afinidade}
              />
              <Barra titulo="Fome" valor={companheiroAtivo.fome} />
              <Barra
                titulo="Felicidade"
                valor={companheiroAtivo.felicidade}
              />
            </div>

            <div className="pet-ativo-acoes">
              <button
                type="button"
                onClick={() => cuidar(companheiroAtivo, 'alimentar')}
                disabled={
                  processandoId === `alimentar-${companheiroAtivo.id}`
                }
              >
                🍎 Alimentar
              </button>

              <button
                type="button"
                onClick={() => cuidar(companheiroAtivo, 'brincar')}
                disabled={
                  processandoId === `brincar-${companheiroAtivo.id}`
                }
              >
                🧶 Brincar
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="pets-controles">
        <div>
          <p>Catálogo oficial</p>
          <h2>Pets de Castelobruxo</h2>
        </div>

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
                className={`pet-card ${
                  registro?.equipado ? 'pet-card-ativo' : ''
                }`}
              >
                <div className="pet-card-icone">
                  {obterIcone(pet.especie)}
                </div>

                <div className="pet-card-conteudo">
                  <small>{pet.especie}</small>
                  <h3>
                    {registro?.nome_personalizado || pet.nome}
                  </h3>
                  <p>{pet.descricao || 'Companheiro de Castelobruxo.'}</p>

                  {registro ? (
                    <div className="pet-card-estatisticas">
                      <span>Nível {registro.nivel}</span>
                      <span>Afinidade {registro.afinidade}%</span>
                      <span>
                        Adotado em {formatarData(registro.adquirido_em)}
                      </span>
                    </div>
                  ) : (
                    <div className="pet-card-estatisticas">
                      <span>Temperamento descrito no catálogo</span>
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
                  ) : registro.equipado ? (
                    <button type="button" disabled>
                      ✓ Companheiro ativo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => equiparPet(registro)}
                      disabled={processandoId === registro.id}
                    >
                      {processandoId === registro.id
                        ? 'Equipando...'
                        : 'Equipar'}
                    </button>
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
  const numero = Math.max(0, Math.min(100, Number(valor) || 0))

  return (
    <div className="pet-barra">
      <div>
        <span>{titulo}</span>
        <strong>{numero}%</strong>
      </div>

      <div className="pet-barra-trilho">
        <span style={{ width: `${numero}%` }} />
      </div>
    </div>
  )
}
