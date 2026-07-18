import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/dormitorio-pessoal.css'

const TEMAS = {
  floresta: {
    nome: 'Floresta ancestral',
    pasta: 'floresta-ancestral',
  },
  biblioteca: {
    nome: 'Biblioteca antiga',
    pasta: 'biblioteca-antiga',
  },
  luar: {
    nome: 'Noite de luar',
    pasta: 'noite-de-luar',
  },
  tribo: {
    nome: 'Cores da tribo',
    pasta: 'tribos',
  },
}

const ILUMINACOES = {
  aconchegante: 'Aconchegante',
  clara: 'Clara',
  noturna: 'Noturna',
}

function caminhoQuarto(tema, iluminacao) {
  const pasta = TEMAS[tema]?.pasta || TEMAS.floresta.pasta
  const arquivo = iluminacao === 'clara'
    ? 'quarto-claro.png'
    : iluminacao === 'noturna'
      ? 'quarto-noturno.png'
      : 'quarto.png'

  return `/assets/dormitorios/${pasta}/${arquivo}`
}

export default function DormitorioPessoal({
  perfil,
  onVoltar,
  onAbrirInventario,
  onAbrirPets,
  onAbrirCertificados,
  onAbrirConquistas,
}) {
  const [config, setConfig] = useState({
    nome: 'Meu dormitório',
    descricao: '',
    tema: 'floresta',
    iluminacao: 'aconchegante',
    mensagem_mural: '',
    pet_usuario_id: '',
    modo_visita: false,
  })
  const [pets, setPets] = useState([])
  const [editando, setEditando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [imagemFalhou, setImagemFalhou] = useState(false)

  useEffect(() => {
    carregar()
  }, [perfil.id])

  useEffect(() => {
    setImagemFalhou(false)
  }, [config.tema, config.iluminacao])

  async function carregar() {
    setCarregando(true)
    setMensagem('')

    const [dormitorio, petsUsuario] = await Promise.all([
      supabase.from('dormitorios').select('*').eq('usuario_id', perfil.id).maybeSingle(),
      supabase
        .from('pets_usuarios')
        .select('id,nome_personalizado,equipado,pets(nome,especie,imagem_url,foto_url)')
        .eq('usuario_id', perfil.id),
    ])

    if (dormitorio.error) {
      setMensagem('Não foi possível carregar as configurações do dormitório.')
    }

    if (dormitorio.data) {
      setConfig((atual) => ({
        ...atual,
        ...dormitorio.data,
        pet_usuario_id: dormitorio.data.pet_usuario_id || '',
      }))
    }

    setPets(petsUsuario.data || [])
    setCarregando(false)
  }

  async function salvarConfiguracao(evento) {
    evento.preventDefault()
    setSalvando(true)
    setMensagem('')

    const payload = {
      usuario_id: perfil.id,
      nome: config.nome.trim(),
      descricao: config.descricao.trim(),
      tema: config.tema,
      iluminacao: config.iluminacao,
      mensagem_mural: config.mensagem_mural.trim(),
      pet_usuario_id: config.pet_usuario_id || null,
      modo_visita: Boolean(config.modo_visita),
      atualizado_em: new Date().toISOString(),
    }

    const { error } = await supabase.from('dormitorios').upsert(payload)
    setSalvando(false)

    if (error) {
      setMensagem(error.message || 'Não foi possível salvar o dormitório.')
      return
    }

    setEditando(false)
    setMensagem('Dormitório atualizado.')
  }

  const pet = useMemo(
    () => pets.find((item) => item.id === config.pet_usuario_id),
    [pets, config.pet_usuario_id],
  )

  const nomeJogador = perfil.nome_personagem || perfil.usuario
  const imagemQuarto = caminhoQuarto(config.tema, config.iluminacao)

  if (carregando) {
    return <main className="dormitorio-pagina dormitorio-carregando">Carregando dormitório...</main>
  }

  return (
    <main className={`dormitorio-pagina tema-${config.tema} luz-${config.iluminacao}`}>
      <header className="dormitorio-topo">
        <button type="button" onClick={onVoltar}>← Voltar</button>
        <div>
          <small>Espaço pessoal de {nomeJogador}</small>
          <h1>{config.nome}</h1>
          <p>{config.descricao || 'Um refúgio particular dentro de Castelobruxo.'}</p>
        </div>
        <button type="button" onClick={() => setEditando((valor) => !valor)}>
          {editando ? 'Fechar personalização' : 'Personalizar ambiente'}
        </button>
      </header>

      {editando && (
        <form className="dormitorio-editor" onSubmit={salvarConfiguracao}>
          <label>
            Nome do dormitório
            <input
              required
              minLength="2"
              maxLength="60"
              value={config.nome}
              onChange={(evento) => setConfig({ ...config, nome: evento.target.value })}
            />
          </label>

          <label>
            Quarto pronto
            <select
              value={config.tema}
              onChange={(evento) => setConfig({ ...config, tema: evento.target.value })}
            >
              {Object.entries(TEMAS).map(([id, tema]) => (
                <option key={id} value={id}>{tema.nome}</option>
              ))}
            </select>
          </label>

          <label>
            Iluminação
            <select
              value={config.iluminacao}
              onChange={(evento) => setConfig({ ...config, iluminacao: evento.target.value })}
            >
              {Object.entries(ILUMINACOES).map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          </label>

          <label>
            Companheiro
            <select
              value={config.pet_usuario_id}
              onChange={(evento) => setConfig({ ...config, pet_usuario_id: evento.target.value })}
            >
              <option value="">Nenhum</option>
              {pets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome_personalizado || item.pets?.nome || 'Companheiro'}
                </option>
              ))}
            </select>
          </label>

          <label className="dormitorio-campo-largo">
            Descrição
            <textarea
              rows="3"
              maxLength="500"
              value={config.descricao}
              onChange={(evento) => setConfig({ ...config, descricao: evento.target.value })}
            />
          </label>

          <label className="dormitorio-campo-largo">
            Bilhete pessoal
            <textarea
              rows="2"
              maxLength="240"
              value={config.mensagem_mural}
              onChange={(evento) => setConfig({ ...config, mensagem_mural: evento.target.value })}
            />
          </label>

          <label className="dormitorio-toggle dormitorio-campo-largo">
            <input
              type="checkbox"
              checked={Boolean(config.modo_visita)}
              onChange={(evento) => setConfig({ ...config, modo_visita: evento.target.checked })}
            />
            <span>Permitir futura exibição no perfil público</span>
          </label>

          <button className="dormitorio-campo-largo" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar dormitório'}
          </button>
        </form>
      )}

      <section className="dormitorio-cena-pronta" aria-label={`Dormitório ${TEMAS[config.tema]?.nome}`}>
        {!imagemFalhou ? (
          <img
            className="dormitorio-imagem-principal"
            src={imagemQuarto}
            alt={`Dormitório mobiliado no tema ${TEMAS[config.tema]?.nome}`}
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <div className="dormitorio-imagem-ausente">
            <strong>Imagem deste quarto ainda não disponível</strong>
            <span>{TEMAS[config.tema]?.nome} · {ILUMINACOES[config.iluminacao]}</span>
          </div>
        )}

        <div className="dormitorio-filtro-luz" />

        {config.mensagem_mural && (
          <article className="dormitorio-bilhete">
            <small>Bilhete pessoal</small>
            <p>{config.mensagem_mural}</p>
          </article>
        )}

        {pet && (
          <article className="dormitorio-pet">
            {(pet.pets?.foto_url || pet.pets?.imagem_url) ? (
              <img
                src={pet.pets.foto_url || pet.pets.imagem_url}
                alt={pet.nome_personalizado || pet.pets?.nome || 'Companheiro'}
              />
            ) : (
              <span>🐾</span>
            )}
            <strong>{pet.nome_personalizado || pet.pets?.nome || 'Companheiro'}</strong>
          </article>
        )}
      </section>

      <section className="dormitorio-resumo">
        <article><small>Quarto</small><strong>{TEMAS[config.tema]?.nome}</strong></article>
        <article><small>Iluminação</small><strong>{ILUMINACOES[config.iluminacao]}</strong></article>
        <article><small>Companheiro</small><strong>{pet ? pet.nome_personalizado || pet.pets?.nome : 'Nenhum'}</strong></article>
      </section>

      <section className="dormitorio-atalhos">
        <button type="button" onClick={onAbrirInventario}>Inventário</button>
        <button type="button" onClick={onAbrirPets}>Companheiros</button>
        <button type="button" onClick={onAbrirCertificados}>Certificados</button>
        <button type="button" onClick={onAbrirConquistas}>Conquistas</button>
      </section>

      {mensagem && <p className="dormitorio-mensagem" role="status">{mensagem}</p>}
    </main>
  )
}
