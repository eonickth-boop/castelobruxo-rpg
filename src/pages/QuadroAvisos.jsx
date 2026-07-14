import { useMemo, useState } from 'react'
import '../styles/quadroAvisosConteudo.css'

const avisosIniciais = [
  {
    id: 'boas-vindas',
    categoria: 'Institucional',
    prioridade: 'destaque',
    titulo: 'Bem-vindos a Castelobruxo',
    resumo:
      'As portas da Escola Brasileira de Magia estão abertas para um novo ciclo de aprendizado, descobertas e convivência.',
    conteudo:
      'Todos os estudantes devem manter seus perfis atualizados, acompanhar o Quadro de Avisos e consultar regularmente o Sistema Acadêmico. As primeiras atividades serão liberadas gradualmente durante o período de preparação da escola.',
    autor: 'Direção de Castelobruxo',
    data: '13 de julho de 2026',
    icone: '🏰',
    fixado: true,
  },
  {
    id: 'periodo-testes',
    categoria: 'Sistema',
    prioridade: 'importante',
    titulo: 'Período de testes da plataforma',
    resumo:
      'O site ainda está em fase de revisão e algumas funções podem receber ajustes.',
    conteudo:
      'Ao encontrar erros, informações incorretas ou dificuldades no celular, registre o problema para a administração. Banco, mercado, inventário, biblioteca, aulas, perfis, diário e companheiros estão sendo revisados antes da publicação oficial.',
    autor: 'Equipe de Desenvolvimento',
    data: '13 de julho de 2026',
    icone: '⌛',
    fixado: true,
  },
  {
    id: 'primeiras-aulas',
    categoria: 'Acadêmico',
    prioridade: 'normal',
    titulo: 'Preparação para as primeiras aulas',
    resumo:
      'Os estudantes já podem consultar disciplinas e acompanhar a abertura das aulas.',
    conteudo:
      'Antes de iniciar uma atividade, confira o conteúdo completo da aula. A conclusão correta poderá conceder XP e registrar progresso acadêmico. Novos conteúdos serão adicionados conforme o calendário da escola.',
    autor: 'Coordenação Acadêmica',
    data: '13 de julho de 2026',
    icone: '📚',
    fixado: false,
  },
  {
    id: 'convivencia',
    categoria: 'Comunidade',
    prioridade: 'normal',
    titulo: 'Orientações de convivência',
    resumo:
      'Castelobruxo deve ser um espaço seguro, respeitoso e colaborativo para todos.',
    conteudo:
      'Respeite os limites dos outros jogadores, diferencie ações do personagem das relações fora do RPG e procure a administração diante de conflitos. Conteúdos ofensivos, perseguições e exposição de informações pessoais não serão tolerados.',
    autor: 'Administração',
    data: '13 de julho de 2026',
    icone: '🌿',
    fixado: false,
  },
  {
    id: 'companheiros',
    categoria: 'Novidade',
    prioridade: 'normal',
    titulo: 'Sistema de Companheiros em desenvolvimento',
    resumo:
      'Os primeiros pets já começaram a chegar à escola.',
    conteudo:
      'O catálogo inicial inclui espécies como Tucano Amazônico, Coruja-das-Matas, Arara Azul, Raposa-do-Mato, Sapo Encantado, Lagarto Esmeralda e Jabuti Ancestral. O sistema continuará recebendo melhorias visuais e interações.',
    autor: 'Setor de Criaturas e Companheiros',
    data: '13 de julho de 2026',
    icone: '🐾',
    fixado: false,
  },
]

const categorias = [
  'Todos',
  'Institucional',
  'Sistema',
  'Acadêmico',
  'Comunidade',
  'Novidade',
]

export default function QuadroAvisos({ perfil, onVoltar }) {
  const [categoria, setCategoria] = useState('Todos')
  const [avisoAberto, setAvisoAberto] = useState(null)

  const avisosFiltrados = useMemo(() => {
    const filtrados =
      categoria === 'Todos'
        ? avisosIniciais
        : avisosIniciais.filter(
            (aviso) => aviso.categoria === categoria,
          )

    return [...filtrados].sort((a, b) => {
      if (a.fixado && !b.fixado) return -1
      if (!a.fixado && b.fixado) return 1
      return 0
    })
  }, [categoria])

  const nome =
    perfil?.nome_personagem ||
    perfil?.usuario ||
    'Estudante'

  return (
    <main className="quadro-conteudo-page">
      <button
        type="button"
        className="quadro-conteudo-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="quadro-conteudo-hero">
        <p>Comunicação oficial</p>
        <h1>Quadro de Avisos</h1>
        <span>
          Olá, {nome}. Acompanhe comunicados, novidades e
          orientações da escola.
        </span>
      </header>

      <section className="quadro-conteudo-filtros">
        {categorias.map((item) => (
          <button
            key={item}
            type="button"
            className={
              categoria === item
                ? 'quadro-filtro-ativo'
                : ''
            }
            onClick={() => setCategoria(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="quadro-conteudo-mural">
        {avisosFiltrados.map((aviso, indice) => (
          <article
            key={aviso.id}
            className={[
              'quadro-conteudo-aviso',
              aviso.fixado ? 'quadro-aviso-fixado' : '',
              aviso.prioridade === 'destaque'
                ? 'quadro-aviso-destaque'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              '--aviso-rotacao':
                indice % 2 === 0 ? '-0.45deg' : '0.45deg',
            }}
          >
            <span className="quadro-aviso-prego" />

            <div className="quadro-aviso-topo">
              <span>{aviso.icone}</span>

              <div>
                <small>{aviso.categoria}</small>
                {aviso.fixado && <b>Fixado</b>}
              </div>
            </div>

            <h2>{aviso.titulo}</h2>
            <p>{aviso.resumo}</p>

            <footer>
              <div>
                <strong>{aviso.autor}</strong>
                <small>{aviso.data}</small>
              </div>

              <button
                type="button"
                onClick={() => setAvisoAberto(aviso)}
              >
                Ler comunicado
              </button>
            </footer>
          </article>
        ))}
      </section>

      {avisoAberto && (
        <div
          className="quadro-modal-fundo"
          role="presentation"
          onClick={() => setAvisoAberto(null)}
        >
          <article
            className="quadro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quadro-modal-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button
              type="button"
              className="quadro-modal-fechar"
              onClick={() => setAvisoAberto(null)}
              aria-label="Fechar comunicado"
            >
              ×
            </button>

            <span className="quadro-modal-icone">
              {avisoAberto.icone}
            </span>

            <small>{avisoAberto.categoria}</small>

            <h2 id="quadro-modal-titulo">
              {avisoAberto.titulo}
            </h2>

            <p>{avisoAberto.conteudo}</p>

            <footer>
              <strong>{avisoAberto.autor}</strong>
              <span>{avisoAberto.data}</span>
            </footer>
          </article>
        </div>
      )}
    </main>
  )
}
