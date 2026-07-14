import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

function calcularPercentual(concluidas, total) {
  if (!total) {
    return 0
  }

  return Math.min(
    100,
    Math.round((concluidas / total) * 100),
  )
}

function obterIniciais(nome) {
  return (nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function normalizarAvatarUrl(url) {
  if (!url) {
    return ''
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

function formatarData(data) {
  if (!data) {
    return 'Ainda não concluída'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(data))
}

export default function AlunosProfessor({
  aulas,
  disciplinas,
}) {
  const [alunos, setAlunos] = useState([])
  const [progresso, setProgresso] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [filtroTribo, setFiltroTribo] = useState('todas')
  const [ordenacao, setOrdenacao] = useState('progresso')
  const [alunoSelecionadoId, setAlunoSelecionadoId] =
    useState(null)

  const aulasPublicadas = useMemo(
    () => aulas.filter((aula) => aula.ativo),
    [aulas],
  )

  const idsAulasPublicadas = useMemo(
    () => aulasPublicadas.map((aula) => aula.id),
    [aulasPublicadas],
  )

  useEffect(() => {
    carregarAlunos()
  }, [idsAulasPublicadas.join('|')])

  async function carregarAlunos() {
    setCarregando(true)
    setMensagem('')

    const { data: perfisData, error: erroPerfis } =
      await supabase
        .from('perfis')
        .select(`
          id,
          usuario,
          nome_personagem,
          cargo,
          tribo,
          ano,
          nivel,
          xp,
          avatar_url,
          ativo,
          criado_em
        `)
        .eq('cargo', 'aluno')
        .eq('ativo', true)
        .order('nome_personagem', { ascending: true })

    if (erroPerfis) {
      console.error(
        'Erro ao carregar alunos:',
        erroPerfis,
      )
      setMensagem(
        'Não foi possível carregar a lista de alunos.',
      )
      setCarregando(false)
      return
    }

    const idsAlunos = (perfisData ?? []).map(
      (aluno) => aluno.id,
    )

    let progressoData = []

    if (
      idsAlunos.length > 0 &&
      idsAulasPublicadas.length > 0
    ) {
      const { data, error } = await supabase
        .from('progresso_aulas')
        .select(`
          id,
          usuario_id,
          aula_id,
          status,
          respostas,
          nota,
          xp_recebido,
          concluida,
          iniciada_em,
          concluida_em,
          atualizado_em
        `)
        .in('usuario_id', idsAlunos)
        .in('aula_id', idsAulasPublicadas)

      if (error) {
        console.error(
          'Erro ao carregar progresso:',
          error,
        )
        setMensagem(
          'Os alunos foram carregados, mas o progresso acadêmico não.',
        )
      } else {
        progressoData = data ?? []
      }
    }

    setAlunos(perfisData ?? [])
    setProgresso(progressoData)
    setCarregando(false)
  }

  const dadosAlunos = useMemo(() => {
    return alunos.map((aluno) => {
      const registros = progresso.filter(
        (registro) => registro.usuario_id === aluno.id,
      )

      const registrosConcluidos = registros.filter(
        (registro) =>
          registro.concluida === true ||
          registro.status === 'concluida',
      )

      const aulasConcluidasUnicas = new Set(
        registrosConcluidos.map(
          (registro) => registro.aula_id,
        ),
      )

      const notasValidas = registrosConcluidos
        .map((registro) => Number(registro.nota))
        .filter((nota) => Number.isFinite(nota))

      const mediaNotas =
        notasValidas.length > 0
          ? notasValidas.reduce(
              (total, nota) => total + nota,
              0,
            ) / notasValidas.length
          : null

      const xpRecebido = registrosConcluidos.reduce(
        (total, registro) =>
          total + (Number(registro.xp_recebido) || 0),
        0,
      )

      const ultimaConclusao = registrosConcluidos
        .map((registro) => registro.concluida_em)
        .filter(Boolean)
        .sort()
        .at(-1)

      return {
        ...aluno,
        registros,
        concluidas: aulasConcluidasUnicas.size,
        totalAulas: aulasPublicadas.length,
        percentual: calcularPercentual(
          aulasConcluidasUnicas.size,
          aulasPublicadas.length,
        ),
        mediaNotas,
        xpRecebido,
        ultimaConclusao,
      }
    })
  }, [alunos, progresso, aulasPublicadas.length])

  const tribosDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          dadosAlunos
            .map((aluno) => aluno.tribo)
            .filter(Boolean),
        ),
      ].sort(),
    [dadosAlunos],
  )

  const alunosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    const filtrados = dadosAlunos.filter((aluno) => {
      const correspondePesquisa =
        !termo ||
        aluno.nome_personagem
          ?.toLowerCase()
          .includes(termo) ||
        aluno.usuario?.toLowerCase().includes(termo) ||
        aluno.tribo?.toLowerCase().includes(termo)

      const correspondeTribo =
        filtroTribo === 'todas' ||
        aluno.tribo === filtroTribo

      return correspondePesquisa && correspondeTribo
    })

    return [...filtrados].sort((a, b) => {
      if (ordenacao === 'nome') {
        return (a.nome_personagem || '').localeCompare(
          b.nome_personagem || '',
          'pt-BR',
        )
      }

      if (ordenacao === 'xp') {
        return Number(b.xp || 0) - Number(a.xp || 0)
      }

      if (ordenacao === 'nivel') {
        return (
          Number(b.nivel || 0) - Number(a.nivel || 0)
        )
      }

      return b.percentual - a.percentual
    })
  }, [
    dadosAlunos,
    pesquisa,
    filtroTribo,
    ordenacao,
  ])

  const alunoSelecionado = useMemo(
    () =>
      dadosAlunos.find(
        (aluno) => aluno.id === alunoSelecionadoId,
      ) ?? null,
    [dadosAlunos, alunoSelecionadoId],
  )

  const resumo = useMemo(() => {
    const totalAlunos = dadosAlunos.length

    const mediaProgresso =
      totalAlunos > 0
        ? Math.round(
            dadosAlunos.reduce(
              (total, aluno) =>
                total + aluno.percentual,
              0,
            ) / totalAlunos,
          )
        : 0

    const alunosConcluintes = dadosAlunos.filter(
      (aluno) =>
        aluno.totalAulas > 0 &&
        aluno.concluidas >= aluno.totalAulas,
    ).length

    const mediaXp =
      totalAlunos > 0
        ? Math.round(
            dadosAlunos.reduce(
              (total, aluno) =>
                total + (Number(aluno.xp) || 0),
              0,
            ) / totalAlunos,
          )
        : 0

    return {
      totalAlunos,
      mediaProgresso,
      alunosConcluintes,
      mediaXp,
    }
  }, [dadosAlunos])

  function obterNomeAula(aulaId) {
    return (
      aulas.find((aula) => aula.id === aulaId)?.titulo ||
      'Aula não encontrada'
    )
  }

  function obterNomeDisciplina(aulaId) {
    const aula = aulas.find(
      (item) => item.id === aulaId,
    )

    return (
      disciplinas.find(
        (disciplina) =>
          disciplina.id === aula?.disciplina_id,
      )?.nome || 'Disciplina não encontrada'
    )
  }

  if (carregando) {
    return (
      <p className="painel-professor-vazio">
        Carregando alunos...
      </p>
    )
  }

  return (
    <section className="painel-alunos">
      <div className="painel-conteudo-cabecalho">
        <div>
          <p>Acompanhamento acadêmico</p>
          <h2>Alunos</h2>
          <span>
            Visualize XP, nível e progresso nas aulas
            publicadas.
          </span>
        </div>

        <button
          type="button"
          onClick={carregarAlunos}
        >
          Atualizar dados
        </button>
      </div>

      {mensagem && (
        <p className="painel-professor-mensagem">
          {mensagem}
        </p>
      )}

      <div className="painel-alunos-resumo">
        <article>
          <small>Alunos ativos</small>
          <strong>{resumo.totalAlunos}</strong>
        </article>

        <article>
          <small>Progresso médio</small>
          <strong>{resumo.mediaProgresso}%</strong>
        </article>

        <article>
          <small>Concluintes</small>
          <strong>{resumo.alunosConcluintes}</strong>
        </article>

        <article>
          <small>XP médio</small>
          <strong>{resumo.mediaXp}</strong>
        </article>
      </div>

      <div className="painel-alunos-filtros">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Nome, usuário ou tribo"
          />
        </label>

        <label>
          <span>Tribo</span>
          <select
            value={filtroTribo}
            onChange={(event) =>
              setFiltroTribo(event.target.value)
            }
          >
            <option value="todas">Todas as tribos</option>

            {tribosDisponiveis.map((tribo) => (
              <option key={tribo} value={tribo}>
                {tribo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Ordenar por</span>
          <select
            value={ordenacao}
            onChange={(event) =>
              setOrdenacao(event.target.value)
            }
          >
            <option value="progresso">
              Maior progresso
            </option>
            <option value="xp">Maior XP</option>
            <option value="nivel">Maior nível</option>
            <option value="nome">Nome</option>
          </select>
        </label>
      </div>

      {alunosFiltrados.length === 0 ? (
        <p className="painel-professor-vazio">
          Nenhum aluno encontrado.
        </p>
      ) : (
        <div className="painel-alunos-lista">
          {alunosFiltrados.map((aluno) => {
            const avatar =
              normalizarAvatarUrl(aluno.avatar_url)

            return (
              <article
                className="painel-aluno-card"
                key={aluno.id}
              >
                <div className="painel-aluno-identidade">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={`Avatar de ${aluno.nome_personagem}`}
                    />
                  ) : (
                    <div className="painel-aluno-avatar-vazio">
                      {obterIniciais(
                        aluno.nome_personagem,
                      )}
                    </div>
                  )}

                  <div>
                    <small>@{aluno.usuario}</small>
                    <h3>{aluno.nome_personagem}</h3>
                    <p>
                      {aluno.tribo || 'Sem tribo'} ·{' '}
                      {aluno.ano || 1}º ano
                    </p>
                  </div>
                </div>

                <div className="painel-aluno-numeros">
                  <div>
                    <small>Nível</small>
                    <strong>{aluno.nivel ?? 1}</strong>
                  </div>

                  <div>
                    <small>XP total</small>
                    <strong>{aluno.xp ?? 0}</strong>
                  </div>

                  <div>
                    <small>Média</small>
                    <strong>
                      {aluno.mediaNotas === null
                        ? '—'
                        : aluno.mediaNotas.toFixed(1)}
                    </strong>
                  </div>
                </div>

                <div className="painel-aluno-progresso">
                  <div>
                    <span>Progresso nas aulas</span>
                    <strong>{aluno.percentual}%</strong>
                  </div>

                  <div className="painel-aluno-barra">
                    <span
                      style={{
                        width: `${aluno.percentual}%`,
                      }}
                    />
                  </div>

                  <small>
                    {aluno.concluidas}/{aluno.totalAulas}{' '}
                    aulas concluídas · {aluno.xpRecebido} XP
                    recebido
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAlunoSelecionadoId(aluno.id)
                  }
                >
                  Ver detalhes
                </button>
              </article>
            )
          })}
        </div>
      )}

      {alunoSelecionado && (
        <div
          className="painel-aluno-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAlunoSelecionadoId(null)
            }
          }}
          role="presentation"
        >
          <section
            className="painel-aluno-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <p>Perfil acadêmico</p>
                <h2>
                  {alunoSelecionado.nome_personagem}
                </h2>
                <span>
                  @{alunoSelecionado.usuario}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAlunoSelecionadoId(null)
                }
              >
                ✕ Fechar
              </button>
            </header>

            <div className="painel-aluno-modal-resumo">
              <article>
                <small>Tribo</small>
                <strong>
                  {alunoSelecionado.tribo || 'Sem tribo'}
                </strong>
              </article>

              <article>
                <small>Ano</small>
                <strong>
                  {alunoSelecionado.ano || 1}º
                </strong>
              </article>

              <article>
                <small>Nível</small>
                <strong>
                  {alunoSelecionado.nivel || 1}
                </strong>
              </article>

              <article>
                <small>XP</small>
                <strong>
                  {alunoSelecionado.xp || 0}
                </strong>
              </article>
            </div>

            <div className="painel-aluno-modal-progresso">
              <div>
                <span>Progresso geral</span>
                <strong>
                  {alunoSelecionado.percentual}%
                </strong>
              </div>

              <div className="painel-aluno-barra">
                <span
                  style={{
                    width: `${alunoSelecionado.percentual}%`,
                  }}
                />
              </div>

              <p>
                {alunoSelecionado.concluidas} de{' '}
                {alunoSelecionado.totalAulas} aulas
                publicadas concluídas.
              </p>
            </div>

            <div className="painel-aluno-historico">
              <h3>Histórico de aulas</h3>

              {alunoSelecionado.registros.length === 0 ? (
                <p className="painel-professor-vazio">
                  Este aluno ainda não iniciou nenhuma aula.
                </p>
              ) : (
                <div>
                  {alunoSelecionado.registros
                    .sort((a, b) =>
                      String(
                        b.atualizado_em || '',
                      ).localeCompare(
                        String(a.atualizado_em || ''),
                      ),
                    )
                    .map((registro) => {
                      const concluida =
                        registro.concluida === true ||
                        registro.status === 'concluida'

                      return (
                        <article key={registro.id}>
                          <div>
                            <small>
                              {obterNomeDisciplina(
                                registro.aula_id,
                              )}
                            </small>
                            <strong>
                              {obterNomeAula(
                                registro.aula_id,
                              )}
                            </strong>
                            <span>
                              {concluida
                                ? `Concluída em ${formatarData(
                                    registro.concluida_em,
                                  )}`
                                : 'Em andamento'}
                            </span>
                          </div>

                          <div>
                            <span
                              className={
                                concluida
                                  ? 'painel-status-publicado'
                                  : 'painel-status-rascunho'
                              }
                            >
                              {concluida
                                ? 'Concluída'
                                : 'Em andamento'}
                            </span>

                            <small>
                              Nota:{' '}
                              {registro.nota ?? '—'} · XP:{' '}
                              {registro.xp_recebido ?? 0}
                            </small>
                          </div>
                        </article>
                      )
                    })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
