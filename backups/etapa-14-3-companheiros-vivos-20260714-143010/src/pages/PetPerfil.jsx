import { useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/pet-perfil.css'

function limitar(valor) {
  return Math.max(0, Math.min(100, Number(valor || 0)))
}

function Barra({ titulo, valor }) {
  const numero = limitar(valor)

  return (
    <div className="pet-perfil-barra">
      <div><span>{titulo}</span><strong>{numero}%</strong></div>
      <div className="pet-perfil-trilho">
        <span style={{ width: `${numero}%` }} />
      </div>
    </div>
  )
}

export default function PetPerfil({ registroInicial, onVoltar }) {
  const [registro, setRegistro] = useState(registroInicial)
  const [processando, setProcessando] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [mostrarHistoria, setMostrarHistoria] = useState(false)

  const pet = registro?.pets
  const nome = registro?.nome_personalizado || pet?.nome || 'Companheiro Mágico'
  const xpAtual = Number(registro?.experiencia || 0)
  const xpMeta = 100
  const progressoXp = Math.min(100, (xpAtual / xpMeta) * 100)

  const personalidade = useMemo(
    () =>
      registro?.personalidade ||
      pet?.personalidade_base ||
      'Personalidade ainda não registrada.',
    [registro, pet],
  )

  async function interagir(tipo) {
    if (!registro?.id) return

    setProcessando(tipo)
    setMensagem('')

    const atualizacao = { atualizado_em: new Date().toISOString() }

    if (tipo === 'alimentar') {
      atualizacao.fome = limitar(Number(registro.fome || 0) + 15)
      atualizacao.afinidade = limitar(Number(registro.afinidade || 0) + 2)
    }

    if (tipo === 'brincar') {
      atualizacao.felicidade = limitar(Number(registro.felicidade || 0) + 15)
      atualizacao.energia = limitar(Number(registro.energia ?? 100) - 8)
      atualizacao.afinidade = limitar(Number(registro.afinidade || 0) + 3)
    }

    if (tipo === 'cuidar') {
      atualizacao.energia = limitar(Number(registro.energia ?? 100) + 18)
      atualizacao.felicidade = limitar(Number(registro.felicidade || 0) + 6)
      atualizacao.afinidade = limitar(Number(registro.afinidade || 0) + 2)
    }

    const { data, error } = await supabase
      .from('pets_usuarios')
      .update(atualizacao)
      .eq('id', registro.id)
      .select(`
        id, usuario_id, pet_id, nome_personalizado, equipado, nivel,
        experiencia, afinidade, fome, felicidade, energia, idade,
        personalidade, historia, adquirido_em, atualizado_em,
        pets (
          id, nome, especie, descricao, imagem_url, raridade,
          historia_base, personalidade_base
        )
      `)
      .single()

    if (error) {
      setMensagem(error.message || 'Não foi possível cuidar do pet.')
      setProcessando('')
      return
    }

    await supabase.from('pets_historico').insert({
      pet_usuario_id: registro.id,
      usuario_id: registro.usuario_id,
      tipo,
      descricao:
        tipo === 'alimentar'
          ? `${nome} foi alimentado.`
          : tipo === 'brincar'
            ? `${nome} brincou com seu tutor.`
            : `${nome} recebeu cuidados.`,
    })

    setRegistro(data)
    setMensagem(
      tipo === 'alimentar'
        ? `${nome} foi alimentado.`
        : tipo === 'brincar'
          ? `${nome} brincou com você.`
          : `${nome} recebeu cuidados.`,
    )
    setProcessando('')
  }

  if (!registro) {
    return (
      <main className="pet-perfil-pagina">
        <button type="button" onClick={onVoltar}>← Voltar</button>
        <p className="pet-perfil-mensagem">Pet não encontrado.</p>
      </main>
    )
  }

  return (
    <main className="pet-perfil-pagina">
      <button type="button" onClick={onVoltar}>← Voltar aos pets</button>

      <section className="pet-perfil-hero">
        <div className="pet-perfil-imagem">
          {pet?.imagem_url ? <img src={pet.imagem_url} alt={nome} /> : <span>🐾</span>}
        </div>

        <div>
          <p>Ficha de criatura</p>
          <h1>{nome}</h1>
          <strong>{pet?.especie || 'Criatura mágica'}</strong>

          <div className="pet-perfil-selos">
            <span>{pet?.raridade || 'Comum'}</span>
            <span>Nível {registro.nivel || 1}</span>
            <span>{registro.equipado ? 'Companheiro ativo' : 'Companheiro'}</span>
          </div>
        </div>
      </section>

      {mensagem && <p className="pet-perfil-mensagem">{mensagem}</p>}

      <section className="pet-perfil-grid">
        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">Registro da criatura</p>
          <h2>Sobre</h2>
          <p>{pet?.descricao || 'Sem descrição registrada.'}</p>

          <dl>
            <div>
              <dt>Idade</dt>
              <dd>{registro.idade ? `${registro.idade} anos` : 'Não informada'}</dd>
            </div>
            <div>
              <dt>Personalidade</dt>
              <dd>{personalidade}</dd>
            </div>
            <div>
              <dt>Data de adoção</dt>
              <dd>
                {registro.adquirido_em
                  ? new Date(registro.adquirido_em).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">Desenvolvimento</p>
          <h2>Nível e experiência</h2>

          <div className="pet-perfil-xp">
            <div><span>XP</span><strong>{xpAtual}/{xpMeta}</strong></div>
            <div className="pet-perfil-trilho">
              <span style={{ width: `${progressoXp}%` }} />
            </div>
          </div>

          <div className="pet-perfil-barras">
            <Barra titulo="Afinidade" valor={registro.afinidade} />
            <Barra titulo="Energia" valor={registro.energia ?? 100} />
            <Barra titulo="Fome" valor={registro.fome} />
            <Barra titulo="Felicidade" valor={registro.felicidade} />
          </div>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">Interações</p>
          <h2>Cuidados</h2>

          <div className="pet-perfil-acoes">
            <button disabled={Boolean(processando)} onClick={() => interagir('alimentar')}>
              🍎 Alimentar
            </button>
            <button disabled={Boolean(processando)} onClick={() => interagir('brincar')}>
              🧶 Brincar
            </button>
            <button disabled={Boolean(processando)} onClick={() => interagir('cuidar')}>
              ✨ Cuidar
            </button>
            <button onClick={() => setMostrarHistoria((valor) => !valor)}>
              📖 História
            </button>
          </div>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">Preparação futura</p>
          <h2>Habilidades e evolução</h2>
          <p>
            Esta ficha já está preparada para habilidades, evolução,
            missões de companheiro e conquistas próprias.
          </p>
        </article>
      </section>

      {mostrarHistoria && (
        <section className="pet-perfil-card pet-perfil-historia">
          <p className="pet-perfil-rotulo">Memórias do companheiro</p>
          <h2>História</h2>
          <p>
            {registro.historia ||
              pet?.historia_base ||
              'A história deste companheiro ainda será escrita.'}
          </p>
        </section>
      )}
    </main>
  )
}
