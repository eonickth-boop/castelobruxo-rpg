import { useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/pet-perfil.css'
import '../styles/companheiros-vivos.css'

function limitar(valor) {
  return Math.max(0, Math.min(100, Number(valor || 0)))
}

function Barra({ titulo, valor }) {
  const numero = limitar(valor)

  return (
    <div className="pet-perfil-barra">
      <div>
        <span>{titulo}</span>
        <strong>{numero}%</strong>
      </div>
      <div className="pet-perfil-trilho">
        <span style={{ width: `${numero}%` }} />
      </div>
    </div>
  )
}

function calcularHumor(registro) {
  if ((registro?.energia ?? 100) < 25) return 'cansado'
  if ((registro?.fome ?? 100) < 30) return 'faminto'
  if ((registro?.felicidade ?? 100) < 35) return 'triste'
  if ((registro?.afinidade ?? 0) > 75) return 'afetuoso'
  return 'curioso'
}

export default function PetPerfil({
  registroInicial,
  onVoltar,
}) {
  const [registro, setRegistro] = useState(registroInicial)
  const [processando, setProcessando] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [mostrarHistoria, setMostrarHistoria] = useState(false)
  const [fala, setFala] = useState('Que bom ver você novamente.')

  const pet = registro?.pets
  const nome =
    registro?.nome_personalizado ||
    pet?.nome ||
    'Companheiro Mágico'

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

    const atualizacao = {
      atualizado_em: new Date().toISOString(),
      ultima_interacao: new Date().toISOString(),
    }

    if (tipo === 'alimentar') {
      atualizacao.fome = limitar(Number(registro.fome || 0) + 15)
      atualizacao.afinidade = limitar(
        Number(registro.afinidade || 0) + 2,
      )
      atualizacao.experiencia = Number(registro.experiencia || 0) + 3
      setFala('Isso estava delicioso!')
    }

    if (tipo === 'brincar') {
      atualizacao.felicidade = limitar(
        Number(registro.felicidade || 0) + 15,
      )
      atualizacao.energia = limitar(
        Number(registro.energia ?? 100) - 8,
      )
      atualizacao.afinidade = limitar(
        Number(registro.afinidade || 0) + 3,
      )
      atualizacao.experiencia = Number(registro.experiencia || 0) + 5
      setFala('Vamos brincar mais uma vez!')
    }

    if (tipo === 'cuidar') {
      atualizacao.energia = limitar(
        Number(registro.energia ?? 100) + 18,
      )
      atualizacao.felicidade = limitar(
        Number(registro.felicidade || 0) + 6,
      )
      atualizacao.afinidade = limitar(
        Number(registro.afinidade || 0) + 2,
      )
      atualizacao.experiencia = Number(registro.experiencia || 0) + 4
      setFala('Agora estou me sentindo muito melhor.')
    }

    const humorCalculado = calcularHumor({
      ...registro,
      ...atualizacao,
    })
    atualizacao.humor = humorCalculado

    const { data, error } = await supabase
      .from('pets_usuarios')
      .update(atualizacao)
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
        energia,
        humor,
        idade,
        personalidade,
        historia,
        ultima_interacao,
        adquirido_em,
        atualizado_em,
        pets (
          id,
          nome,
          especie,
          descricao,
          imagem_url,
          raridade,
          historia_base,
          personalidade_base
        )
      `)
      .single()

    if (error) {
      setMensagem(
        error.message || 'Não foi possível cuidar do pet.',
      )
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

  function conversar() {
    const falas = [
      'Que bom ver você novamente.',
      'Vamos explorar alguma coisa?',
      'Eu gosto de ficar ao seu lado.',
      'Hoje parece um dia especial.',
    ]

    setFala(falas[Math.floor(Math.random() * falas.length)])
  }

  if (!registro) {
    return (
      <main className="pet-perfil-pagina">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="pet-perfil-mensagem">
          Pet não encontrado.
        </p>
      </main>
    )
  }

  return (
    <main className="pet-perfil-pagina">
      <button type="button" onClick={onVoltar}>
        ← Voltar aos pets
      </button>

      <section className="pet-perfil-hero">
        <button
          type="button"
          className="pet-perfil-imagem pet-movimento-respirar"
          onClick={conversar}
          aria-label="Interagir com o pet"
        >
          {pet?.imagem_url ? (
            <img src={pet.imagem_url} alt={nome} />
          ) : (
            <span>🐾</span>
          )}
        </button>

        <div>
          <p>Ficha de criatura</p>
          <h1>{nome}</h1>
          <strong>
            {pet?.especie || 'Criatura mágica'}
          </strong>

          <div className="pet-perfil-selos">
            <span>{pet?.raridade || 'Comum'}</span>
            <span>Nível {registro.nivel || 1}</span>
            <span>
              Humor: {registro.humor || calcularHumor(registro)}
            </span>
          </div>

          <blockquote className="pet-fala pet-fala-ficha">
            “{fala}”
          </blockquote>
        </div>
      </section>

      {mensagem && (
        <p className="pet-perfil-mensagem">{mensagem}</p>
      )}

      <section className="pet-perfil-grid">
        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">
            Registro da criatura
          </p>
          <h2>Sobre</h2>
          <p>
            {pet?.descricao ||
              'Sem descrição registrada.'}
          </p>

          <dl>
            <div>
              <dt>Idade</dt>
              <dd>
                {registro.idade
                  ? `${registro.idade} anos`
                  : 'Não informada'}
              </dd>
            </div>

            <div>
              <dt>Personalidade</dt>
              <dd>{personalidade}</dd>
            </div>

            <div>
              <dt>Data de adoção</dt>
              <dd>
                {registro.adquirido_em
                  ? new Date(
                      registro.adquirido_em,
                    ).toLocaleDateString('pt-BR')
                  : 'Não informada'}
              </dd>
            </div>
          </dl>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">
            Desenvolvimento
          </p>
          <h2>Nível e experiência</h2>

          <div className="pet-perfil-xp">
            <div>
              <span>XP</span>
              <strong>
                {xpAtual}/{xpMeta}
              </strong>
            </div>

            <div className="pet-perfil-trilho">
              <span style={{ width: `${progressoXp}%` }} />
            </div>
          </div>

          <div className="pet-perfil-barras">
            <Barra
              titulo="Afinidade"
              valor={registro.afinidade}
            />
            <Barra
              titulo="Energia"
              valor={registro.energia ?? 100}
            />
            <Barra
              titulo="Fome"
              valor={registro.fome}
            />
            <Barra
              titulo="Felicidade"
              valor={registro.felicidade}
            />
          </div>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">
            Interações
          </p>
          <h2>Cuidados</h2>

          <div className="pet-perfil-acoes">
            <button
              disabled={Boolean(processando)}
              onClick={() => interagir('alimentar')}
            >
              🍎 Alimentar
            </button>

            <button
              disabled={Boolean(processando)}
              onClick={() => interagir('brincar')}
            >
              🧶 Brincar
            </button>

            <button
              disabled={Boolean(processando)}
              onClick={() => interagir('cuidar')}
            >
              ✨ Cuidar
            </button>

            <button onClick={conversar}>
              💬 Conversar
            </button>

            <button
              onClick={() =>
                setMostrarHistoria((valor) => !valor)
              }
            >
              📖 História
            </button>
          </div>
        </article>

        <article className="pet-perfil-card">
          <p className="pet-perfil-rotulo">
            Comportamento
          </p>
          <h2>Estado atual</h2>
          <p>
            Humor: <strong>
              {registro.humor || calcularHumor(registro)}
            </strong>
          </p>
          <p>
            Última interação:{' '}
            {registro.ultima_interacao
              ? new Date(
                  registro.ultima_interacao,
                ).toLocaleString('pt-BR')
              : 'Nenhuma registrada'}
          </p>
        </article>
      </section>

      {mostrarHistoria && (
        <section className="pet-perfil-card pet-perfil-historia">
          <p className="pet-perfil-rotulo">
            Memórias do companheiro
          </p>
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
