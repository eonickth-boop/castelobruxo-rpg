import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/aulas.css'

const identidadeDisciplinas = {
  'História da Magia Brasileira': {
    icone: '📖',
    classe: 'disciplina-historia',
  },
  'Herbologia Brasileira': {
    icone: '🌿',
    classe: 'disciplina-herbologia',
  },
  'Poções e Preparos Mágicos': {
    icone: '🧪',
    classe: 'disciplina-pocoes',
  },
  'Defesa Mágica': {
    icone: '🛡️',
    classe: 'disciplina-defesa',
  },
  'Magizoologia Brasileira': {
    icone: '🐾',
    classe: 'disciplina-magizoologia',
  },
}

export default function Aulas({ onVoltar, onAbrirDisciplina }) {
  const [cursos, setCursos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarCursos()
  }, [])

  async function carregarCursos() {
    setCarregando(true)
    setMensagem('')

    const { data: cursosData, error: erroCursos } = await supabase
      .from('cursos')
      .select(`
        id,
        nome,
        descricao,
        ano,
        ordem,
        disciplinas (
          id,
          nome,
          descricao,
          ordem,
          professor_id,
          ativo
        )
      `)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (erroCursos) {
      console.error('Erro ao carregar cursos:', erroCursos)
      setMensagem('Não foi possível carregar o sistema acadêmico.')
      setCursos([])
      setCarregando(false)
      return
    }

    const disciplinas = (cursosData ?? [])
      .flatMap((curso) => curso.disciplinas ?? [])
      .filter((disciplina) => disciplina.ativo !== false)

    const professoresIds = [
      ...new Set(
        disciplinas
          .map((disciplina) => disciplina.professor_id)
          .filter(Boolean),
      ),
    ]

    let perfisProfessores = []

    if (professoresIds.length > 0) {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_personagem, usuario, avatar_url')
        .in('id', professoresIds)

      if (error) {
        console.error('Erro ao carregar professores:', error)
      } else {
        perfisProfessores = data ?? []
      }
    }

    const disciplinasIds = disciplinas.map((disciplina) => disciplina.id)
    let aulas = []

    if (disciplinasIds.length > 0) {
      const { data, error } = await supabase
        .from('aulas')
        .select('id, disciplina_id, recompensa_xp')
        .in('disciplina_id', disciplinasIds)
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao carregar aulas:', error)
      } else {
        aulas = data ?? []
      }
    }

    const cursosCompletos = (cursosData ?? []).map((curso) => ({
      ...curso,
      disciplinas: (curso.disciplinas ?? [])
        .filter((disciplina) => disciplina.ativo !== false)
        .map((disciplina) => {
          const professor = perfisProfessores.find(
            (perfil) => perfil.id === disciplina.professor_id,
          )

          const aulasDaDisciplina = aulas.filter(
            (aula) => aula.disciplina_id === disciplina.id,
          )

          const xpDisponivel = aulasDaDisciplina.reduce(
            (total, aula) => total + (Number(aula.recompensa_xp) || 0),
            0,
          )

          return {
            ...disciplina,
            professor: professor ?? null,
            totalAulas: aulasDaDisciplina.length,
            xpDisponivel,
          }
        })
        .sort((a, b) => a.ordem - b.ordem),
    }))

    setCursos(cursosCompletos)
    setCarregando(false)
  }

  const totalDisciplinas = cursos.reduce(
    (total, curso) => total + (curso.disciplinas?.length ?? 0),
    0,
  )

  const totalAulas = cursos.reduce(
    (total, curso) =>
      total +
      (curso.disciplinas ?? []).reduce(
        (subtotal, disciplina) => subtotal + disciplina.totalAulas,
        0,
      ),
    0,
  )

  const disciplinasComAulas = cursos.reduce(
    (total, curso) =>
      total +
      (curso.disciplinas ?? []).filter(
        (disciplina) => disciplina.totalAulas > 0,
      ).length,
    0,
  )

  const progressoGeral =
    totalDisciplinas > 0
      ? Math.round((disciplinasComAulas / totalDisciplinas) * 100)
      : 0

  return (
    <main className="aulas">
      <button type="button" className="aulas-voltar" onClick={onVoltar}>
        ← Voltar
      </button>

      <section className="aulas-hero">
        <p className="aulas-selo">Castelobruxo</p>

        <h1>Sistema Acadêmico</h1>

        <p className="aulas-subtitulo">
          Cursos, disciplinas e aulas da Escola Brasileira de Magia.
        </p>

        <div className="aulas-resumo">
          <article>
            <small>Disciplinas</small>
            <strong>{totalDisciplinas}</strong>
          </article>

          <article>
            <small>Aulas publicadas</small>
            <strong>{totalAulas}</strong>
          </article>

          <article>
            <small>Em andamento</small>
            <strong>{disciplinasComAulas}</strong>
          </article>
        </div>

        <div className="aulas-progresso-geral">
          <div className="aulas-progresso-cabecalho">
            <span>Estrutura acadêmica disponível</span>
            <strong>{progressoGeral}%</strong>
          </div>

          <div className="aulas-barra">
            <div
              className="aulas-barra-preenchida"
              style={{ width: `${progressoGeral}%` }}
            />
          </div>
        </div>
      </section>

      {mensagem && <p className="aulas-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="aulas-estado">Carregando cursos...</p>
      ) : cursos.length === 0 ? (
        <p className="aulas-estado">Nenhum curso disponível.</p>
      ) : (
        cursos.map((curso) => (
          <section key={curso.id} className="curso-bloco">
            <header className="curso-cabecalho">
              <div>
                <p>{curso.ano}º ano</p>
                <h2>{curso.nome}</h2>
                <span>{curso.descricao}</span>
              </div>

              <div className="curso-badge">
                {curso.disciplinas?.length ?? 0}{' '}
                {(curso.disciplinas?.length ?? 0) === 1
                  ? 'disciplina'
                  : 'disciplinas'}
              </div>
            </header>

            {curso.disciplinas.length === 0 ? (
              <p className="aulas-estado">
                Nenhuma disciplina disponível neste curso.
              </p>
            ) : (
              <div className="disciplinas">
                {curso.disciplinas.map((disciplina) => {
                  const professor = disciplina.professor
                  const totalAulasDisciplina = disciplina.totalAulas ?? 0
                  const identidade =
                    identidadeDisciplinas[disciplina.nome] ?? {
                      icone: '🎓',
                      classe: 'disciplina-padrao',
                    }

                  return (
                    <article
                      className={`disciplina-card ${identidade.classe}`}
                      key={disciplina.id}
                    >
                      <div className="disciplina-topo">
                        <span className="disciplina-icone">
                          {identidade.icone}
                        </span>

                        <span className="disciplina-status">
                          {totalAulasDisciplina > 0
                            ? 'Aulas disponíveis'
                            : 'Em preparação'}
                        </span>
                      </div>

                      <div className="disciplina-conteudo">
                        <h3>{disciplina.nome}</h3>

                        <p>{disciplina.descricao}</p>
                      </div>

                      <div className="disciplina-professor">
                        {professor?.avatar_url ? (
                          <img
                            src={professor.avatar_url}
                            alt={
                              professor.nome_personagem ||
                              professor.usuario
                            }
                          />
                        ) : (
                          <div className="professor-sem-foto">👩‍🏫</div>
                        )}

                        <div>
                          <small>Professor responsável</small>
                          <strong>
                            {professor?.nome_personagem ||
                              professor?.usuario ||
                              'Não definido'}
                          </strong>
                        </div>
                      </div>

                      <div className="disciplina-metricas">
                        <span>
                          📚 {totalAulasDisciplina}{' '}
                          {totalAulasDisciplina === 1 ? 'aula' : 'aulas'}
                        </span>

                        <span>⭐ {disciplina.xpDisponivel ?? 0} XP</span>
                      </div>

                      <button
                        type="button"
                        disabled={totalAulasDisciplina === 0}
                        onClick={() =>
                          totalAulasDisciplina > 0 &&
                          onAbrirDisciplina?.(disciplina.id)
                        }
                      >
                        {totalAulasDisciplina === 0
                          ? 'Nenhuma aula publicada'
                          : 'Entrar na disciplina'}
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        ))
      )}
    </main>
  )
}