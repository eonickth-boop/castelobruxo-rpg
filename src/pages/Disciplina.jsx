import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/disciplina.css'

export default function Disciplina({
  disciplinaId,
  onVoltar,
  onAbrirAula,
}) {
  const [disciplina, setDisciplina] = useState(null)
  const [curso, setCurso] = useState(null)
  const [professor, setProfessor] = useState(null)
  const [aulas, setAulas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [progressoAulas, setProgressoAulas] = useState([])

  useEffect(() => {
    carregarDisciplina()
  }, [disciplinaId])

  async function carregarDisciplina() {
    if (!disciplinaId) {
      setMensagem('Disciplina não informada.')
      setCarregando(false)
      return
    }

    setCarregando(true)
    setMensagem('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: disciplinaData, error: erroDisciplina } =
      await supabase
        .from('disciplinas')
        .select(`
          id,
          nome,
          descricao,
          professor_id,
          curso_id,
          livro_principal_id,
          ordem,
          ativo
        `)
        .eq('id', disciplinaId)
        .single()

    if (erroDisciplina) {
      console.error('Erro ao carregar disciplina:', erroDisciplina)
      setMensagem('Não foi possível carregar a disciplina.')
      setDisciplina(null)
      setCarregando(false)
      return
    }

    const { data: aulasData, error: erroAulas } = await supabase
      .from('aulas')
      .select(`
        id,
        titulo,
        descricao,
        conteudo,
        livro_id,
        pagina_inicial,
        pagina_final,
        recompensa_xp,
        certificado_nome,
        ordem,
        ativo
      `)
      .eq('disciplina_id', disciplinaId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (erroAulas) {
      console.error('Erro ao carregar aulas:', erroAulas)
      setMensagem(
        'A disciplina foi carregada, mas as aulas não puderam ser exibidas.',
      )
    }

    let progressoData = []
    const idsAulas = (aulasData ?? []).map((aula) => aula.id)

    if (user && idsAulas.length > 0) {
      const { data, error } = await supabase
        .from('progresso_aulas')
        .select(`
          aula_id,
          status,
          nota,
          xp_recebido,
          concluida,
          concluida_em
        `)
        .eq('usuario_id', user.id)
        .in('aula_id', idsAulas)

      if (error) {
        console.error('Erro ao carregar progresso:', error)
      } else {
        progressoData = data ?? []
      }
    }

    let cursoData = null
    if (disciplinaData.curso_id) {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome, ano')
        .eq('id', disciplinaData.curso_id)
        .single()

      if (!error) cursoData = data
    }

    let professorData = null
    if (disciplinaData.professor_id) {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_personagem, usuario, avatar_url')
        .eq('id', disciplinaData.professor_id)
        .single()

      if (!error) professorData = data
    }

    setDisciplina(disciplinaData)
    setCurso(cursoData)
    setProfessor(professorData)
    setAulas(aulasData ?? [])
    setProgressoAulas(progressoData)
    setCarregando(false)
  }

  const resumo = useMemo(() => {
    const total = aulas.length
    const concluidas = progressoAulas.filter(
      (item) => item.concluida === true,
    ).length

    return {
      total,
      concluidas,
      progresso:
        total > 0 ? Math.round((concluidas / total) * 100) : 0,
    }
  }, [aulas, progressoAulas])

  if (carregando) {
    return (
      <main className="disciplina-pagina">
        <p className="disciplina-estado">
          Carregando disciplina...
        </p>
      </main>
    )
  }

  if (!disciplina) {
    return (
      <main className="disciplina-pagina">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="disciplina-estado">
          {mensagem || 'Disciplina não encontrada.'}
        </p>
      </main>
    )
  }

  const nomeProfessor =
    professor?.nome_personagem ||
    professor?.usuario ||
    'Professor não definido'

  return (
    <main className="disciplina-pagina">
      <button
        type="button"
        className="disciplina-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="disciplina-header">
        <div className="disciplina-header-professor">
          {professor?.avatar_url ? (
            <img src={professor.avatar_url} alt={nomeProfessor} />
          ) : (
            <span>👩‍🏫</span>
          )}
        </div>

        <p>
          {curso?.nome || 'Sistema Acadêmico'}
          {curso?.ano ? ` · ${curso.ano}º ano` : ''}
        </p>

        <h1>{disciplina.nome}</h1>
        <strong>{nomeProfessor}</strong>

        {disciplina.descricao && (
          <span>{disciplina.descricao}</span>
        )}
      </header>

      <section className="disciplina-progresso">
        <div>
          <span>Progresso da disciplina</span>
          <strong>{resumo.progresso}%</strong>
        </div>

        <div className="disciplina-barra">
          <span style={{ width: `${resumo.progresso}%` }} />
        </div>

        <small>
          {resumo.concluidas} de {resumo.total}{' '}
          {resumo.total === 1
            ? 'aula concluída'
            : 'aulas concluídas'}
        </small>
      </section>

      {mensagem && (
        <p className="disciplina-mensagem">{mensagem}</p>
      )}

      <section className="lista-aulas">
        {aulas.length === 0 ? (
          <p className="disciplina-estado">
            Nenhuma aula publicada nesta disciplina.
          </p>
        ) : (
          aulas.map((aula, indice) => {
            const progressoDaAula = progressoAulas.find(
              (item) => item.aula_id === aula.id,
            )
            const concluida =
              progressoDaAula?.concluida === true

            return (
              <article
                className={`aula-card ${
                  concluida ? 'aula-card-concluida' : ''
                }`}
                key={aula.id}
              >
                <div className="aula-card-numero">
                  {concluida
                    ? '✓'
                    : String(indice + 1).padStart(2, '0')}
                </div>

                <div className="aula-card-conteudo">
                  <div className="aula-card-topo">
                    <small>
                      Aula {String(indice + 1).padStart(2, '0')}
                    </small>

                    <span>
                      {concluida ? 'Concluída' : 'Disponível'}
                    </span>
                  </div>

                  <h2>{aula.titulo}</h2>
                  <p>{aula.descricao}</p>

                  <div className="aula-card-dados">
                    <span>
                      {aula.pagina_inicial
                        ? `📖 Páginas ${aula.pagina_inicial}${
                            aula.pagina_final &&
                            aula.pagina_final !==
                              aula.pagina_inicial
                              ? `–${aula.pagina_final}`
                              : ''
                          }`
                        : '📖 Sem leitura obrigatória'}
                    </span>

                    <span>
                      ⭐ {aula.recompensa_xp ?? 0} XP
                    </span>

                    {concluida && (
                      <span>
                        Nota{' '}
                        {Number(
                          progressoDaAula?.nota ?? 0,
                        ).toFixed(0)}
                        %
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAbrirAula?.(aula)}
                >
                  {concluida ? 'Revisar aula' : 'Entrar'}
                </button>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}
