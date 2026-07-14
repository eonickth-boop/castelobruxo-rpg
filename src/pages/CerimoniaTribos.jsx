import { useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/cerimonia-tribos.css'

const tribos = {
  araye: {
    nome: 'Arayê',
    significado: 'Filhos da Floresta',
    fundador: 'Aruanã, o Guardião da Terra',
    elemento: 'Terra',
    animal: 'Onça-pintada',
    cor: 'Verde-esmeralda',
    lema: 'Quem protege a terra, preserva a magia.',
    valores: 'Proteção, paciência, lealdade e equilíbrio.',
    ritual: 'Plantar uma muda de árvore mágica.',
    classe: 'tribo-araye',
    simbolo: '🌿',
  },
  caora: {
    nome: 'Caorá',
    significado: 'Coração da Chama',
    fundador: 'Caetê, o Guardião da Coragem',
    elemento: 'Fogo',
    animal: 'Harpia',
    cor: 'Vermelho-rubi',
    lema: 'O fogo revela os verdadeiros.',
    valores: 'Coragem, liderança, determinação e honra.',
    ritual: 'Acender a Chama Ancestral.',
    classe: 'tribo-caora',
    simbolo: '🔥',
  },
  yandara: {
    nome: 'Yandara',
    significado: 'Guardiões das Águas',
    fundador: 'Iandé, a Guardiã da Sabedoria',
    elemento: 'Água',
    animal: 'Ariranha',
    cor: 'Azul-turquesa',
    lema: 'Como a água, o saber nunca deixa de fluir.',
    valores: 'Sabedoria, empatia, serenidade e conhecimento.',
    ritual: 'Depositar uma gota de água na fonte sagrada.',
    classe: 'tribo-yandara',
    simbolo: '🌊',
  },
  anayru: {
    nome: 'Anayru',
    significado: 'Espírito dos Ventos',
    fundador: 'Tupinã, o Guardião dos Caminhos',
    elemento: 'Ar',
    animal: 'Lobo-guará',
    cor: 'Branco-prateado',
    lema: 'Nenhum caminho é impossível para quem segue o vento.',
    valores: 'Liberdade, criatividade, curiosidade e adaptabilidade.',
    ritual: 'Soltar uma pena encantada ao nascer do sol.',
    classe: 'tribo-anayru',
    simbolo: '🌬️',
  },
  arata: {
    nome: 'Aratã',
    significado: 'Mistério Ancestral',
    fundador: 'Jaciara, a Guardiã que se tornou traidora',
    elemento: 'Sombra',
    animal: 'Coruja-preta',
    cor: 'Roxo profundo',
    lema: 'Toda verdade nasce das sombras.',
    valores: 'Inteligência, estratégia, ambição e transformação.',
    ritual: 'Fazer o juramento diante do Espelho das Verdades.',
    classe: 'tribo-arata',
    simbolo: '🌙',
  },
}

const perguntas = [
  {
    texto: 'Você encontra uma criatura ferida em uma trilha proibida. O que faz primeiro?',
    respostas: [
      ['Protejo a criatura e procuro um lugar seguro.', 'araye'],
      ['Enfrento imediatamente quem a atacou.', 'caora'],
      ['Analiso os ferimentos antes de agir.', 'yandara'],
      ['Procuro outra rota e observo o que aconteceu.', 'anayru'],
      ['Investigo quem realmente está por trás da situação.', 'arata'],
    ],
  },
  {
    texto: 'Uma passagem antiga se abre durante a noite. O que mais chama sua atenção?',
    respostas: [
      ['As raízes vivas ao redor da entrada.', 'araye'],
      ['O risco de descobrir algo perigoso.', 'caora'],
      ['As inscrições e registros esquecidos.', 'yandara'],
      ['A possibilidade de chegar a um lugar desconhecido.', 'anayru'],
      ['O segredo que alguém tentou esconder.', 'arata'],
    ],
  },
  {
    texto: 'Durante uma discussão entre colegas, qual papel você assume?',
    respostas: [
      ['Tento restaurar o equilíbrio entre todos.', 'araye'],
      ['Defendo com firmeza quem considero correto.', 'caora'],
      ['Escuto cada lado antes de responder.', 'yandara'],
      ['Busco uma solução diferente que ninguém considerou.', 'anayru'],
      ['Observo as intenções por trás de cada argumento.', 'arata'],
    ],
  },
  {
    texto: 'Qual destes conhecimentos você mais gostaria de dominar?',
    respostas: [
      ['Cuidado de criaturas e equilíbrio natural.', 'araye'],
      ['Proteção, liderança e enfrentamento de ameaças.', 'caora'],
      ['História, cura e preservação do saber.', 'yandara'],
      ['Exploração, invenção e caminhos mágicos.', 'anayru'],
      ['Mistérios, estratégias e conhecimentos ocultos.', 'arata'],
    ],
  },
  {
    texto: 'Uma missão parece impossível. O que faz você continuar?',
    respostas: [
      ['A responsabilidade de proteger o que importa.', 'araye'],
      ['A certeza de que o medo não pode vencer.', 'caora'],
      ['A vontade de compreender e encontrar a resposta.', 'yandara'],
      ['A possibilidade de criar um caminho novo.', 'anayru'],
      ['A convicção de que existe algo além do que mostram.', 'arata'],
    ],
  },
  {
    texto: 'Você recebe um artefato de função desconhecida. Qual é sua primeira atitude?',
    respostas: [
      ['Verifico se ele pode afetar o ambiente ao redor.', 'araye'],
      ['Testo cuidadosamente sua capacidade de proteção.', 'caora'],
      ['Pesquiso sua origem nos registros da escola.', 'yandara'],
      ['Experimento maneiras diferentes de ativá-lo.', 'anayru'],
      ['Procuro marcas escondidas e funções não reveladas.', 'arata'],
    ],
  },
  {
    texto: 'Qual frase mais combina com a forma como você enxerga a magia?',
    respostas: [
      ['A magia existe para preservar a vida.', 'araye'],
      ['A magia revela quem tem coragem para agir.', 'caora'],
      ['A magia é um conhecimento que nunca para de fluir.', 'yandara'],
      ['A magia abre caminhos onde antes não havia nenhum.', 'anayru'],
      ['A magia transforma quem aceita olhar além da superfície.', 'arata'],
    ],
  },
]

export default function CerimoniaTribos({ perfil, onConcluido, sair }) {
  const [fase, setFase] = useState('inicio')
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState([])
  const [resultado, setResultado] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const pontuacao = useMemo(() => {
    const base = { araye: 0, caora: 0, yandara: 0, anayru: 0, arata: 0 }
    respostas.forEach((item) => {
      base[item.tribo] += 1
    })
    return base
  }, [respostas])

  function responder(tribo, textoResposta) {
    const novas = [
      ...respostas,
      {
        pergunta: indice + 1,
        resposta: textoResposta,
        tribo,
      },
    ]

    setRespostas(novas)

    if (indice < perguntas.length - 1) {
      setIndice((valor) => valor + 1)
      return
    }

    const totais = { araye: 0, caora: 0, yandara: 0, anayru: 0, arata: 0 }
    novas.forEach((item) => {
      totais[item.tribo] += 1
    })

    const maior = Math.max(...Object.values(totais))
    const empatadas = Object.keys(totais).filter((chave) => totais[chave] === maior)

    const escolha = empatadas.length === 1
      ? empatadas[0]
      : empatadas[Math.floor(Math.random() * empatadas.length)]

    setResultado(escolha)
    setFase('revelacao')
  }

  async function confirmarTribo() {
    if (!resultado) return

    setSalvando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'concluir_selecao_tribo',
      {
        p_tribo: tribos[resultado].nome,
        p_respostas: respostas,
        p_pontuacao: pontuacao,
      },
    )

    if (error) {
      console.error(error)
      setMensagem(error.message || 'Não foi possível concluir a cerimônia.')
      setSalvando(false)
      return
    }

    setFase('ritual')
    setSalvando(false)

    setTimeout(() => {
      onConcluido?.(data)
    }, 2200)
  }

  const perguntaAtual = perguntas[indice]
  const triboResultado = resultado ? tribos[resultado] : null

  return (
    <main className={`cerimonia-tribos ${triboResultado?.classe || ''}`}>
      <div className="cerimonia-nevoa" />
      <div className="cerimonia-particulas">
        {Array.from({ length: 18 }).map((_, item) => <i key={item} />)}
      </div>

      <button type="button" className="cerimonia-sair" onClick={sair}>
        Sair da conta
      </button>

      {fase === 'inicio' && (
        <section className="cerimonia-painel cerimonia-inicio">
          <p>O caminho da floresta</p>
          <h1>Cerimônia dos Guardiões</h1>
          <blockquote>
            “Cinco antigas tradições observam seus passos.
            Suas escolhas revelarão o caminho que mais se aproxima de quem você é.”
          </blockquote>
          <span>{perfil.nome_personagem || perfil.usuario}, atravesse a floresta e responda com sinceridade.</span>
          <button type="button" onClick={() => setFase('perguntas')}>
            Iniciar cerimônia
          </button>
        </section>
      )}

      {fase === 'perguntas' && (
        <section className="cerimonia-painel">
          <header className="cerimonia-progresso">
            <div>
              <span
                style={{
                  width: `${((indice + 1) / perguntas.length) * 100}%`,
                }}
              />
            </div>
            <small>Pergunta {indice + 1} de {perguntas.length}</small>
          </header>

          <div className="cerimonia-pergunta">
            <p>A floresta pergunta</p>
            <h2>{perguntaAtual.texto}</h2>
          </div>

          <div className="cerimonia-respostas">
            {perguntaAtual.respostas.map(([texto, tribo]) => (
              <button
                key={texto}
                type="button"
                onClick={() => responder(tribo, texto)}
              >
                {texto}
              </button>
            ))}
          </div>
        </section>
      )}

      {fase === 'revelacao' && triboResultado && (
        <section className="cerimonia-painel cerimonia-revelacao">
          <div className="cerimonia-simbolo">{triboResultado.simbolo}</div>
          <p>{triboResultado.significado}</p>
          <h1>{triboResultado.nome}</h1>
          <strong>{triboResultado.fundador}</strong>
          <blockquote>“{triboResultado.lema}”</blockquote>

          <div className="cerimonia-detalhes">
            <span>Elemento: {triboResultado.elemento}</span>
            <span>Animal: {triboResultado.animal}</span>
            <span>Cor: {triboResultado.cor}</span>
          </div>

          <p className="cerimonia-valores">{triboResultado.valores}</p>

          {mensagem && <p className="cerimonia-mensagem">{mensagem}</p>}

          <button type="button" onClick={confirmarTribo} disabled={salvando}>
            {salvando ? 'Confirmando...' : `Confirmar ${triboResultado.nome}`}
          </button>
        </section>
      )}

      {fase === 'ritual' && triboResultado && (
        <section className="cerimonia-painel cerimonia-ritual">
          <div className="cerimonia-simbolo">{triboResultado.simbolo}</div>
          <p>Ritual de entrada</p>
          <h1>{triboResultado.nome}</h1>
          <blockquote>{triboResultado.ritual}</blockquote>
          <span>Sua jornada em Castelobruxo começa agora.</span>
        </section>
      )}
    </main>
  )
}
