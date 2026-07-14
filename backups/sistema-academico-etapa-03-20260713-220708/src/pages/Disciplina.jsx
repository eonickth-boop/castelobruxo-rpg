import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/painelProfessor/disciplinas.css'

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

    const { data: disciplinaData, error: erroDisciplina } = await supabase
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
      setMensagem('A disciplina foi carregada, mas as aulas não puderam ser exibidas.')
    }

    let progressoData = []

    if ((aulasData ?? []).length > 0) {
      const idsAulas = (aulasData ?? []).map((aula) => aula.id)

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

      if (error) {
        console.error('Erro ao carregar curso:', error)
      } else {
        cursoData = data
      }
    }

    let professorData = null
    if (disciplinaData.professor_id) {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_personagem, usuario, avatar_url')
        .eq('id', disciplinaData.professor_id)
        .single()

      if (error) {
        console.error('Erro ao carregar professor:', error)
      } else {
        professorData = data
      }
    }

    setDisciplina(disciplinaData)
    setCurso(cursoData)
    setProfessor(professorData)
    setAulas(aulasData ?? [])
    setProgressoAulas(progressoData)
    setCarregando(false)
  }

  if (carregando) {
    return (
      <main className="disciplina">
        <p>Carregando disciplina...</p>
      </main>
    )
  }

  if (!disciplina) {
    return (
      <main className="disciplina">
        <button type="button" className="voltar" onClick={onVoltar}>
          ← Voltar
        </button>

        <p>{mensagem || 'Disciplina não encontrada.'}</p>
      </main>
    )
  }

  const nomeProfessor =
    professor?.nome_personagem ||
    professor?.usuario ||
    'Professor não definido'

  const totalAulas = aulas.length
  const aulasConcluidas = progressoAulas.filter(
    (progresso) => progresso.concluida === true,
  ).length
  const progresso =
    totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0

  return (
    <main className="disciplina">
      <button type="button" className="voltar" onClick={onVoltar}>
        ← Voltar
      </button>

      <header className="disciplina-header">
        <p>{curso?.nome || 'Sistema Acadêmico'}</p>

        <h1>{disciplina.nome}</h1>

        <span>{nomeProfessor}</span>
      </header>

      {disciplina.descricao && (
        <section
          style={{
            maxWidth: '760px',
            margin: '0 auto 30px',
            textAlign: 'center',
            color: '#c7cec8',
            lineHeight: '1.7',
          }}
        >
          {disciplina.descricao}
        </section>
      )}

      <section className="progresso">
        <div className="barra">
          <div
            className="barra-preenchida"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <small>
          {aulasConcluidas} de {totalAulas}{' '}
          {totalAulas === 1 ? 'aula concluída' : 'aulas concluídas'}
        </small>
      </section>

      {mensagem && <p>{mensagem}</p>}

      <section className="lista-aulas">
        {aulas.length === 0 ? (
          <p>Nenhuma aula publicada nesta disciplina.</p>
        ) : (
          aulas.map((aula, indice) => {
            const progressoDaAula = progressoAulas.find(
              (progresso) => progresso.aula_id === aula.id,
            )
            const concluida = progressoDaAula?.concluida === true

            return (
              <article
                className={`aula-card ${
                  concluida ? 'aula-card-concluida' : ''
                }`}
                key={aula.id}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h2>
                      {concluida ? '✓ ' : ''}
                      Aula {String(indice + 1).padStart(2, '0')}
                    </h2>

                    {concluida && (
                      <span
                        style={{
                          padding: '5px 9px',
                          borderRadius: '999px',
                          color: '#9dd6a3',
                          background: 'rgba(106,170,113,.1)',
                          border: '1px solid rgba(106,170,113,.3)',
                          fontSize: '.78rem',
                        }}
                      >
                        Concluída
                      </span>
                    )}
                  </div>

                  <p>{aula.titulo}</p>

                  <small>
                    {aula.pagina_inicial
                      ? `📖 Páginas ${aula.pagina_inicial}${
                          aula.pagina_final &&
                          aula.pagina_final !== aula.pagina_inicial
                            ? `–${aula.pagina_final}`
                            : ''
                        }`
                      : '📖 Sem leitura obrigatória'}

                    {' • '}

                    ⭐ {aula.recompensa_xp ?? 0} XP

                    {concluida &&
                      ` • Nota ${Number(
                        progressoDaAula?.nota ?? 0,
                      ).toFixed(0)}%`}
                  </small>
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