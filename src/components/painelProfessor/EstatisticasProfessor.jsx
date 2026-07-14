import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

function percentual(parte, total) {
  if (!total) return 0
  return Math.min(100, Math.round((parte / total) * 100))
}

function media(valores) {
  const validos = valores
    .map(Number)
    .filter((valor) => Number.isFinite(valor))

  if (validos.length === 0) return null

  return (
    validos.reduce((total, valor) => total + valor, 0) /
    validos.length
  )
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(
    Number(valor) || 0,
  )
}

function formatarDataCurta(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(data))
}

function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

export default function EstatisticasProfessor({
  aulas,
  disciplinas,
}) {
  const [perfis, setPerfis] = useState([])
  const [progresso, setProgresso] = useState([])
  const [blocos, setBlocos] = useState([])
  const [atividades, setAtividades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [disciplinaFiltro, setDisciplinaFiltro] =
    useState('todas')
  const [periodoDias, setPeriodoDias] = useState(30)

  useEffect(() => {
    carregarDados()

    const canal = supabase
      .channel('estatisticas-professor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progresso_aulas',
        },
        carregarDados,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aulas',
        },
        carregarDados,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfis',
        },
        carregarDados,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  async function carregarDados() {
    setCarregando(true)
    setMensagem('')

    const idsAulas = aulas.map((aula) => aula.id)

    const [
      respostaPerfis,
      respostaProgresso,
      respostaBlocos,
      respostaAtividades,
    ] = await Promise.all([
      supabase
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
          ativo,
          criado_em
        `)
        .eq('cargo', 'aluno')
        .eq('ativo', true),

      idsAulas.length > 0
        ? supabase
            .from('progresso_aulas')
            .select(`
              id,
              usuario_id,
              aula_id,
              status,
              nota,
              xp_recebido,
              concluida,
              iniciada_em,
              concluida_em,
              atualizado_em
            `)
            .in('aula_id', idsAulas)
        : Promise.resolve({ data: [], error: null }),

      idsAulas.length > 0
        ? supabase
            .from('aula_blocos')
            .select('id, aula_id, tipo, ordem')
            .in('aula_id', idsAulas)
        : Promise.resolve({ data: [], error: null }),

      supabase.from('atividades').select('id, criado_em'),
    ])

    const erros = [
      respostaPerfis.error,
      respostaProgresso.error,
      respostaBlocos.error,
    ].filter(Boolean)

    if (erros.length > 0) {
      console.error(
        'Erro ao carregar estatísticas:',
        erros,
      )
      setMensagem(
        'Alguns dados das estatísticas não puderam ser carregados.',
      )
    }

    if (respostaAtividades.error) {
      console.warn(
        'Atividades não puderam ser contadas:',
        respostaAtividades.error,
      )
    }

    setPerfis(respostaPerfis.data ?? [])
    setProgresso(respostaProgresso.data ?? [])
    setBlocos(respostaBlocos.data ?? [])
    setAtividades(respostaAtividades.data ?? [])
    setCarregando(false)
  }

  const aulasConsideradas = useMemo(() => {
    if (disciplinaFiltro === 'todas') {
      return aulas
    }

    return aulas.filter(
      (aula) =>
        aula.disciplina_id === disciplinaFiltro,
    )
  }, [aulas, disciplinaFiltro])

  const idsAulasConsideradas = useMemo(
    () => new Set(aulasConsideradas.map((aula) => aula.id)),
    [aulasConsideradas],
  )

  const progressoConsiderado = useMemo(
    () =>
      progresso.filter((registro) =>
        idsAulasConsideradas.has(registro.aula_id),
      ),
    [progresso, idsAulasConsideradas],
  )

  const blocosConsiderados = useMemo(
    () =>
      blocos.filter((bloco) =>
        idsAulasConsideradas.has(bloco.aula_id),
      ),
    [blocos, idsAulasConsideradas],
  )

  const agora = Date.now()
  const inicioPeriodo =
    agora - Number(periodoDias) * 24 * 60 * 60 * 1000

  const progressoPeriodo = useMemo(
    () =>
      progressoConsiderado.filter((registro) => {
        const data =
          registro.concluida_em ||
          registro.atualizado_em ||
          registro.iniciada_em

        return data && new Date(data).getTime() >= inicioPeriodo
      }),
    [progressoConsiderado, inicioPeriodo],
  )

  const concluido = (registro) =>
    registro.concluida === true ||
    registro.status === 'concluida'

  const registrosConcluidos = useMemo(
    () => progressoConsiderado.filter(concluido),
    [progressoConsiderado],
  )

  const alunosDetalhados = useMemo(() => {
    return perfis.map((aluno) => {
      const registros = progressoConsiderado.filter(
        (registro) => registro.usuario_id === aluno.id,
      )

      const concluidos = registros.filter(concluido)
      const idsConcluidos = new Set(
        concluidos.map((registro) => registro.aula_id),
      )

      const notas = concluidos
        .map((registro) => registro.nota)
        .filter(
          (nota) =>
            nota !== null && nota !== undefined,
        )

      return {
        ...aluno,
        concluidas: idsConcluidos.size,
        totalAulas: aulasConsideradas.filter(
          (aula) => aula.ativo,
        ).length,
        progresso: percentual(
          idsConcluidos.size,
          aulasConsideradas.filter(
            (aula) => aula.ativo,
          ).length,
        ),
        mediaNota: media(notas),
        xpAulas: concluidos.reduce(
          (total, registro) =>
            total + (Number(registro.xp_recebido) || 0),
          0,
        ),
      }
    })
  }, [
    perfis,
    progressoConsiderado,
    aulasConsideradas,
  ])

  const resumo = useMemo(() => {
    const publicadas = aulasConsideradas.filter(
      (aula) => aula.ativo,
    )
    const rascunhos = aulasConsideradas.filter(
      (aula) => !aula.ativo,
    )

    const xpDistribuido = registrosConcluidos.reduce(
      (total, registro) =>
        total + (Number(registro.xp_recebido) || 0),
      0,
    )

    const progressoMedio =
      alunosDetalhados.length > 0
        ? Math.round(
            alunosDetalhados.reduce(
              (total, aluno) =>
                total + aluno.progresso,
              0,
            ) / alunosDetalhados.length,
          )
        : 0

    const mediaNotas = media(
      registrosConcluidos
        .map((registro) => registro.nota)
        .filter(
          (nota) =>
            nota !== null && nota !== undefined,
        ),
    )

    return {
      alunosAtivos: perfis.length,
      disciplinas:
        disciplinaFiltro === 'todas'
          ? disciplinas.length
          : 1,
      publicadas: publicadas.length,
      rascunhos: rascunhos.length,
      atividades: atividades.length,
      xpDistribuido,
      progressoMedio,
      mediaNotas,
      blocos: blocosConsiderados.length,
    }
  }, [
    aulasConsideradas,
    registrosConcluidos,
    alunosDetalhados,
    perfis.length,
    disciplinas.length,
    disciplinaFiltro,
    atividades.length,
    blocosConsiderados.length,
  ])

  const rankingXp = useMemo(
    () =>
      [...alunosDetalhados]
        .sort(
          (a, b) =>
            Number(b.xp || 0) - Number(a.xp || 0),
        )
        .slice(0, 10),
    [alunosDetalhados],
  )

  const rankingProgresso = useMemo(
    () =>
      [...alunosDetalhados]
        .sort((a, b) => b.progresso - a.progresso)
        .slice(0, 10),
    [alunosDetalhados],
  )

  const rankingNotas = useMemo(
    () =>
      alunosDetalhados
        .filter((aluno) => aluno.mediaNota !== null)
        .sort(
          (a, b) =>
            Number(b.mediaNota) - Number(a.mediaNota),
        )
        .slice(0, 10),
    [alunosDetalhados],
  )

  const distribuicaoTribo = useMemo(() => {
    const mapa = new Map()

    perfis.forEach((aluno) => {
      const chave = aluno.tribo || 'Sem tribo'
      mapa.set(chave, (mapa.get(chave) || 0) + 1)
    })

    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [perfis])

  const distribuicaoAno = useMemo(() => {
    const mapa = new Map()

    perfis.forEach((aluno) => {
      const chave = `${aluno.ano || 1}º ano`
      mapa.set(chave, (mapa.get(chave) || 0) + 1)
    })

    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [perfis])

  const distribuicaoNivel = useMemo(() => {
    const mapa = new Map()

    perfis.forEach((aluno) => {
      const chave = `Nível ${aluno.nivel || 1}`
      mapa.set(chave, (mapa.get(chave) || 0) + 1)
    })

    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [perfis])

  const evolucao = useMemo(() => {
    const mapa = new Map()

    progressoPeriodo
      .filter(concluido)
      .forEach((registro) => {
        const data = new Date(
          registro.concluida_em ||
            registro.atualizado_em,
        )
        const chave = data.toISOString().slice(0, 10)

        const atual = mapa.get(chave) || {
          data: chave,
          conclusoes: 0,
          xp: 0,
        }

        atual.conclusoes += 1
        atual.xp += Number(registro.xp_recebido) || 0

        mapa.set(chave, atual)
      })

    return [...mapa.values()]
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-14)
  }, [progressoPeriodo])

  const estatisticasDisciplinas = useMemo(() => {
    return disciplinas.map((disciplina) => {
      const aulasDisciplina = aulas.filter(
        (aula) =>
          aula.disciplina_id === disciplina.id,
      )

      const ids = new Set(
        aulasDisciplina.map((aula) => aula.id),
      )

      const registros = progresso.filter((registro) =>
        ids.has(registro.aula_id),
      )

      const concluidos = registros.filter(concluido)
      const totalPossivel =
        perfis.length *
        aulasDisciplina.filter((aula) => aula.ativo)
          .length

      return {
        id: disciplina.id,
        nome: disciplina.nome,
        aulas: aulasDisciplina.length,
        publicadas: aulasDisciplina.filter(
          (aula) => aula.ativo,
        ).length,
        conclusoes: concluidos.length,
        taxaConclusao: percentual(
          concluidos.length,
          totalPossivel,
        ),
        mediaNotas: media(
          concluidos
            .map((registro) => registro.nota)
            .filter(
              (nota) =>
                nota !== null && nota !== undefined,
            ),
        ),
        xp: concluidos.reduce(
          (total, registro) =>
            total + (Number(registro.xp_recebido) || 0),
          0,
        ),
      }
    })
  }, [disciplinas, aulas, progresso, perfis.length])

  const alertas = useMemo(() => {
    const lista = []

    const idsComBlocos = new Set(
      blocos.map((bloco) => bloco.aula_id),
    )

    const semConteudo = aulas.filter(
      (aula) => !idsComBlocos.has(aula.id),
    )

    if (semConteudo.length > 0) {
      lista.push({
        tipo: 'aviso',
        titulo: `${semConteudo.length} ${
          semConteudo.length === 1 ? 'aula está' : 'aulas estão'
        } sem blocos de conteúdo`,
      })
    }

    const disciplinasSemPublicadas =
      estatisticasDisciplinas.filter(
        (disciplina) => disciplina.publicadas === 0,
      )

    if (disciplinasSemPublicadas.length > 0) {
      lista.push({
        tipo: 'aviso',
        titulo: `${disciplinasSemPublicadas.length} ${
          disciplinasSemPublicadas.length === 1
            ? 'disciplina não possui'
            : 'disciplinas não possuem'
        } aulas publicadas`,
      })
    }

    const semProgresso = alunosDetalhados.filter(
      (aluno) => aluno.progresso === 0,
    )

    if (semProgresso.length > 0) {
      lista.push({
        tipo: 'atencao',
        titulo: `${semProgresso.length} ${
          semProgresso.length === 1
            ? 'aluno ainda não iniciou'
            : 'alunos ainda não iniciaram'
        } nenhuma aula`,
      })
    }

    if (resumo.rascunhos > 0) {
      lista.push({
        tipo: 'informacao',
        titulo: `${resumo.rascunhos} ${
          resumo.rascunhos === 1
            ? 'aula permanece'
            : 'aulas permanecem'
        } em rascunho`,
      })
    }

    if (lista.length === 0) {
      lista.push({
        tipo: 'sucesso',
        titulo:
          'Nenhum alerta acadêmico importante foi encontrado.',
      })
    }

    return lista
  }, [
    blocos,
    aulas,
    estatisticasDisciplinas,
    alunosDetalhados,
    resumo.rascunhos,
  ])

  function exportarCsv() {
    const cabecalho = [
      'Aluno',
      'Usuário',
      'Tribo',
      'Ano',
      'Nível',
      'XP total',
      'Progresso',
      'Aulas concluídas',
      'Média',
    ]

    const linhas = alunosDetalhados.map((aluno) => [
      aluno.nome_personagem,
      aluno.usuario,
      aluno.tribo || '',
      aluno.ano || 1,
      aluno.nivel || 1,
      aluno.xp || 0,
      `${aluno.progresso}%`,
      aluno.concluidas,
      aluno.mediaNota === null
        ? ''
        : aluno.mediaNota.toFixed(2),
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((valor) =>
            `"${String(valor).replaceAll('"', '""')}"`,
          )
          .join(';'),
      )
      .join('\n')

    baixarArquivo(
      `estatisticas-castelobruxo-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      `\ufeff${csv}`,
      'text/csv;charset=utf-8',
    )
  }

  function renderizarBarras(dados) {
    const maior = Math.max(
      1,
      ...dados.map((item) => item.valor),
    )

    return (
      <div className="estatisticas-barras">
        {dados.length === 0 ? (
          <p className="painel-professor-vazio">
            Sem dados disponíveis.
          </p>
        ) : (
          dados.map((item) => (
            <article key={item.nome}>
              <div>
                <span>{item.nome}</span>
                <strong>{item.valor}</strong>
              </div>
              <div className="estatisticas-barra">
                <span
                  style={{
                    width: `${percentual(
                      item.valor,
                      maior,
                    )}%`,
                  }}
                />
              </div>
            </article>
          ))
        )}
      </div>
    )
  }

  function renderizarRanking(titulo, dados, campo) {
    return (
      <section className="estatisticas-ranking">
        <h3>{titulo}</h3>

        {dados.length === 0 ? (
          <p className="painel-professor-vazio">
            Sem dados para o ranking.
          </p>
        ) : (
          <div>
            {dados.map((aluno, indice) => (
              <article key={aluno.id}>
                <span className="estatisticas-posicao">
                  {indice + 1}
                </span>

                <div>
                  <strong>
                    {aluno.nome_personagem}
                  </strong>
                  <small>@{aluno.usuario}</small>
                </div>

                <b>
                  {campo === 'xp' &&
                    `${formatarNumero(aluno.xp)} XP`}
                  {campo === 'progresso' &&
                    `${aluno.progresso}%`}
                  {campo === 'nota' &&
                    aluno.mediaNota?.toFixed(1)}
                </b>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  if (carregando) {
    return (
      <p className="painel-professor-vazio">
        Carregando estatísticas...
      </p>
    )
  }

  return (
    <section className="estatisticas-professor">
      <div className="painel-conteudo-cabecalho">
        <div>
          <p>Centro de inteligência acadêmica</p>
          <h2>Estatísticas</h2>
          <span>
            Indicadores, rankings, alertas e evolução dos
            alunos.
          </span>
        </div>

        <div className="estatisticas-acoes-topo">
          <button type="button" onClick={carregarDados}>
            Atualizar
          </button>
          <button type="button" onClick={exportarCsv}>
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
          >
            Imprimir
          </button>
        </div>
      </div>

      {mensagem && (
        <p className="painel-professor-mensagem">
          {mensagem}
        </p>
      )}

      <div className="estatisticas-filtros">
        <label>
          <span>Disciplina</span>
          <select
            value={disciplinaFiltro}
            onChange={(event) =>
              setDisciplinaFiltro(event.target.value)
            }
          >
            <option value="todas">
              Todas as disciplinas
            </option>
            {disciplinas.map((disciplina) => (
              <option
                key={disciplina.id}
                value={disciplina.id}
              >
                {disciplina.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Período da evolução</span>
          <select
            value={periodoDias}
            onChange={(event) =>
              setPeriodoDias(
                Number(event.target.value),
              )
            }
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={365}>Último ano</option>
          </select>
        </label>
      </div>

      <div className="estatisticas-cards">
        <article>
          <small>Alunos ativos</small>
          <strong>{resumo.alunosAtivos}</strong>
        </article>
        <article>
          <small>Disciplinas</small>
          <strong>{resumo.disciplinas}</strong>
        </article>
        <article>
          <small>Aulas publicadas</small>
          <strong>{resumo.publicadas}</strong>
        </article>
        <article>
          <small>Rascunhos</small>
          <strong>{resumo.rascunhos}</strong>
        </article>
        <article>
          <small>Atividades</small>
          <strong>{resumo.atividades}</strong>
        </article>
        <article>
          <small>XP distribuído</small>
          <strong>
            {formatarNumero(resumo.xpDistribuido)}
          </strong>
        </article>
        <article>
          <small>Progresso médio</small>
          <strong>{resumo.progressoMedio}%</strong>
        </article>
        <article>
          <small>Média das notas</small>
          <strong>
            {resumo.mediaNotas === null
              ? '—'
              : resumo.mediaNotas.toFixed(1)}
          </strong>
        </article>
      </div>

      <section className="estatisticas-secao">
        <div className="estatisticas-secao-cabecalho">
          <div>
            <small>Monitoramento</small>
            <h3>Alertas automáticos</h3>
          </div>
        </div>

        <div className="estatisticas-alertas">
          {alertas.map((alerta, indice) => (
            <article
              key={`${alerta.tipo}-${indice}`}
              className={`estatisticas-alerta estatisticas-alerta-${alerta.tipo}`}
            >
              <span>
                {alerta.tipo === 'sucesso'
                  ? '✓'
                  : alerta.tipo === 'informacao'
                    ? 'i'
                    : '!'}
              </span>
              <p>{alerta.titulo}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="estatisticas-secao">
        <div className="estatisticas-secao-cabecalho">
          <div>
            <small>Período selecionado</small>
            <h3>Evolução acadêmica</h3>
          </div>
        </div>

        <div className="estatisticas-evolucao">
          {evolucao.length === 0 ? (
            <p className="painel-professor-vazio">
              Ainda não há conclusões no período.
            </p>
          ) : (
            evolucao.map((dia) => {
              const maiorConclusoes = Math.max(
                1,
                ...evolucao.map(
                  (item) => item.conclusoes,
                ),
              )

              return (
                <article key={dia.data}>
                  <div
                    className="estatisticas-coluna"
                    title={`${dia.conclusoes} conclusões e ${dia.xp} XP`}
                  >
                    <span
                      style={{
                        height: `${Math.max(
                          8,
                          percentual(
                            dia.conclusoes,
                            maiorConclusoes,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <small>
                    {formatarDataCurta(dia.data)}
                  </small>
                  <strong>{dia.conclusoes}</strong>
                </article>
              )
            })
          )}
        </div>
      </section>

      <div className="estatisticas-grade-tripla">
        <section className="estatisticas-secao">
          <h3>Alunos por tribo</h3>
          {renderizarBarras(distribuicaoTribo)}
        </section>

        <section className="estatisticas-secao">
          <h3>Alunos por ano</h3>
          {renderizarBarras(distribuicaoAno)}
        </section>

        <section className="estatisticas-secao">
          <h3>Alunos por nível</h3>
          {renderizarBarras(distribuicaoNivel)}
        </section>
      </div>

      <div className="estatisticas-grade-tripla">
        {renderizarRanking(
          'Ranking por XP',
          rankingXp,
          'xp',
        )}
        {renderizarRanking(
          'Ranking por progresso',
          rankingProgresso,
          'progresso',
        )}
        {renderizarRanking(
          'Ranking por notas',
          rankingNotas,
          'nota',
        )}
      </div>

      <section className="estatisticas-secao">
        <div className="estatisticas-secao-cabecalho">
          <div>
            <small>Comparativo</small>
            <h3>Desempenho por disciplina</h3>
          </div>
        </div>

        <div className="estatisticas-tabela-wrapper">
          <table className="estatisticas-tabela">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Aulas</th>
                <th>Publicadas</th>
                <th>Conclusão</th>
                <th>Média</th>
                <th>XP distribuído</th>
              </tr>
            </thead>
            <tbody>
              {estatisticasDisciplinas.map(
                (disciplina) => (
                  <tr key={disciplina.id}>
                    <td>{disciplina.nome}</td>
                    <td>{disciplina.aulas}</td>
                    <td>{disciplina.publicadas}</td>
                    <td>
                      {disciplina.taxaConclusao}%
                    </td>
                    <td>
                      {disciplina.mediaNotas === null
                        ? '—'
                        : disciplina.mediaNotas.toFixed(
                            1,
                          )}
                    </td>
                    <td>
                      {formatarNumero(disciplina.xp)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
