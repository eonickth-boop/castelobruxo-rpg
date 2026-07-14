import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'

const formularioInicial = {
  id: null,
  aula_id: '',
  pergunta: '',
  alternativa_a: '',
  alternativa_b: '',
  alternativa_c: '',
  alternativa_d: '',
  resposta_correta: 'a',
  ordem: 1,
  ativo: false,
}

function obterRespostaDoAluno(respostas, atividadeId) {
  if (!respostas || typeof respostas !== 'object') {
    return null
  }

  const resposta = respostas[atividadeId]

  if (typeof resposta === 'string') {
    return resposta.toLowerCase()
  }

  if (
    resposta &&
    typeof resposta === 'object' &&
    typeof resposta.resposta === 'string'
  ) {
    return resposta.resposta.toLowerCase()
  }

  return null
}

function normalizarResposta(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .replace('alternativa_', '')
}

export default function AtividadesProfessor({
  aulas,
  disciplinas,
}) {
  const [atividades, setAtividades] = useState([])
  const [gabaritos, setGabaritos] = useState([])
  const [progresso, setProgresso] = useState([])
  const [perfis, setPerfis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [disciplinaFiltro, setDisciplinaFiltro] =
    useState('todas')
  const [aulaFiltro, setAulaFiltro] = useState('todas')
  const [somenteAtivas, setSomenteAtivas] = useState(false)
  const [editorAberto, setEditorAberto] = useState(false)
  const [formulario, setFormulario] =
    useState(formularioInicial)
  const [salvando, setSalvando] = useState(false)
  const [erroEditor, setErroEditor] = useState('')
  const [atividadeDetalhesId, setAtividadeDetalhesId] =
    useState(null)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    setMensagem('')

    const idsAulas = aulas.map((aula) => aula.id)

    const [
      respostaAtividades,
      respostaGabaritos,
      respostaProgresso,
      respostaPerfis,
    ] = await Promise.all([
      idsAulas.length > 0
        ? supabase
            .from('atividades')
            .select(`
              id,
              aula_id,
              pergunta,
              alternativa_a,
              alternativa_b,
              alternativa_c,
              alternativa_d,
              ordem,
              ativo,
              criado_em
            `)
            .in('aula_id', idsAulas)
            .order('ordem', { ascending: true })
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from('gabaritos_atividades')
        .select(`
          atividade_id,
          resposta_correta,
          criado_em
        `),

      idsAulas.length > 0
        ? supabase
            .from('progresso_aulas')
            .select(`
              id,
              usuario_id,
              aula_id,
              respostas,
              nota,
              concluida,
              status,
              concluida_em,
              atualizado_em
            `)
            .in('aula_id', idsAulas)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from('perfis')
        .select(`
          id,
          usuario,
          nome_personagem,
          cargo,
          ativo
        `)
        .eq('cargo', 'aluno')
        .eq('ativo', true),
    ])

    const erros = [
      respostaAtividades.error,
      respostaGabaritos.error,
      respostaProgresso.error,
      respostaPerfis.error,
    ].filter(Boolean)

    if (erros.length > 0) {
      console.error(
        'Erro ao carregar atividades:',
        erros,
      )
      setMensagem(
        'Alguns dados do módulo de atividades não puderam ser carregados.',
      )
    }

    setAtividades(respostaAtividades.data ?? [])
    setGabaritos(respostaGabaritos.data ?? [])
    setProgresso(respostaProgresso.data ?? [])
    setPerfis(respostaPerfis.data ?? [])
    setCarregando(false)
  }

  const aulasDisponiveis = useMemo(() => {
    if (disciplinaFiltro === 'todas') {
      return aulas
    }

    return aulas.filter(
      (aula) =>
        aula.disciplina_id === disciplinaFiltro,
    )
  }, [aulas, disciplinaFiltro])

  const atividadesComDados = useMemo(() => {
    return atividades.map((atividade) => {
      const aula = aulas.find(
        (item) => item.id === atividade.aula_id,
      )

      const disciplina = disciplinas.find(
        (item) => item.id === aula?.disciplina_id,
      )

      const gabarito = gabaritos.find(
        (item) =>
          item.atividade_id === atividade.id,
      )

      const entregas = progresso
        .map((registro) => {
          const respostaAluno = obterRespostaDoAluno(
            registro.respostas,
            atividade.id,
          )

          if (!respostaAluno) {
            return null
          }

          const aluno = perfis.find(
            (perfil) =>
              perfil.id === registro.usuario_id,
          )

          const respostaCorreta = normalizarResposta(
            gabarito?.resposta_correta,
          )

          return {
            registroId: registro.id,
            usuarioId: registro.usuario_id,
            nome:
              aluno?.nome_personagem ||
              aluno?.usuario ||
              'Aluno não encontrado',
            usuario: aluno?.usuario || '',
            resposta: normalizarResposta(
              respostaAluno,
            ),
            correta:
              Boolean(respostaCorreta) &&
              normalizarResposta(respostaAluno) ===
                respostaCorreta,
            nota: registro.nota,
            concluida:
              registro.concluida === true ||
              registro.status === 'concluida',
            data:
              registro.concluida_em ||
              registro.atualizado_em,
          }
        })
        .filter(Boolean)

      const acertos = entregas.filter(
        (entrega) => entrega.correta,
      ).length

      return {
        ...atividade,
        aula,
        disciplina,
        resposta_correta:
          gabarito?.resposta_correta || '',
        entregas,
        acertos,
        taxaAcerto:
          entregas.length > 0
            ? Math.round(
                (acertos / entregas.length) * 100,
              )
            : 0,
      }
    })
  }, [
    atividades,
    aulas,
    disciplinas,
    gabaritos,
    progresso,
    perfis,
  ])

  const atividadesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()

    return atividadesComDados.filter(
      (atividade) => {
        const correspondePesquisa =
          !termo ||
          atividade.pergunta
            ?.toLowerCase()
            .includes(termo) ||
          atividade.aula?.titulo
            ?.toLowerCase()
            .includes(termo) ||
          atividade.disciplina?.nome
            ?.toLowerCase()
            .includes(termo)

        const correspondeDisciplina =
          disciplinaFiltro === 'todas' ||
          atividade.disciplina?.id ===
            disciplinaFiltro

        const correspondeAula =
          aulaFiltro === 'todas' ||
          atividade.aula_id === aulaFiltro

        const correspondeStatus =
          !somenteAtivas || atividade.ativo

        return (
          correspondePesquisa &&
          correspondeDisciplina &&
          correspondeAula &&
          correspondeStatus
        )
      },
    )
  }, [
    atividadesComDados,
    pesquisa,
    disciplinaFiltro,
    aulaFiltro,
    somenteAtivas,
  ])

  const gruposPorAula = useMemo(() => {
    const mapa = new Map()

    atividadesFiltradas.forEach((atividade) => {
      const chave = atividade.aula_id

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          aula: atividade.aula,
          disciplina: atividade.disciplina,
          atividades: [],
        })
      }

      mapa.get(chave).atividades.push(atividade)
    })

    return [...mapa.values()].sort((grupoA, grupoB) => {
      const disciplinaComparacao = String(
        grupoA.disciplina?.nome || '',
      ).localeCompare(
        String(grupoB.disciplina?.nome || ''),
        'pt-BR',
      )

      if (disciplinaComparacao !== 0) {
        return disciplinaComparacao
      }

      return (
        Number(grupoA.aula?.ordem || 0) -
        Number(grupoB.aula?.ordem || 0)
      )
    })
  }, [atividadesFiltradas])

  const resumo = useMemo(() => {
    const total = atividadesComDados.length
    const ativas = atividadesComDados.filter(
      (atividade) => atividade.ativo,
    ).length

    const totalEntregas =
      atividadesComDados.reduce(
        (totalAtual, atividade) =>
          totalAtual + atividade.entregas.length,
        0,
      )

    const totalAcertos =
      atividadesComDados.reduce(
        (totalAtual, atividade) =>
          totalAtual + atividade.acertos,
        0,
      )

    return {
      total,
      ativas,
      rascunhos: total - ativas,
      totalEntregas,
      taxaAcerto:
        totalEntregas > 0
          ? Math.round(
              (totalAcertos / totalEntregas) * 100,
            )
          : 0,
    }
  }, [atividadesComDados])

  function abrirNovaAtividade(aulaId = '') {
    const aulaPadrao =
      aulaId ||
      (aulaFiltro !== 'todas' ? aulaFiltro : '') ||
      aulasDisponiveis[0]?.id ||
      aulas[0]?.id ||
      ''

    const proximaOrdem =
      Math.max(
        0,
        ...atividades
          .filter(
            (atividade) =>
              atividade.aula_id === aulaPadrao,
          )
          .map(
            (atividade) =>
              Number(atividade.ordem) || 0,
          ),
      ) + 1

    setFormulario({
      ...formularioInicial,
      aula_id: aulaPadrao,
      ordem: proximaOrdem,
    })
    setErroEditor('')
    setEditorAberto(true)
  }

  function abrirEdicao(atividade) {
    setFormulario({
      id: atividade.id,
      aula_id: atividade.aula_id,
      pergunta: atividade.pergunta || '',
      alternativa_a:
        atividade.alternativa_a || '',
      alternativa_b:
        atividade.alternativa_b || '',
      alternativa_c:
        atividade.alternativa_c || '',
      alternativa_d:
        atividade.alternativa_d || '',
      resposta_correta:
        normalizarResposta(
          atividade.resposta_correta,
        ) || 'a',
      ordem: atividade.ordem || 1,
      ativo: Boolean(atividade.ativo),
    })
    setErroEditor('')
    setEditorAberto(true)
  }

  function fecharEditor() {
    if (salvando) return

    setEditorAberto(false)
    setFormulario(formularioInicial)
    setErroEditor('')
  }

  function atualizarCampo(campo, valor) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }))
  }

  async function salvarAtividade(event) {
    event.preventDefault()

    const camposTexto = [
      'pergunta',
      'alternativa_a',
      'alternativa_b',
      'alternativa_c',
      'alternativa_d',
    ]

    const algumVazio = camposTexto.some(
      (campo) => !formulario[campo].trim(),
    )

    if (algumVazio) {
      setErroEditor(
        'Preencha a pergunta e todas as quatro alternativas.',
      )
      return
    }

    if (!formulario.aula_id) {
      setErroEditor('Selecione uma aula.')
      return
    }

    setSalvando(true)
    setErroEditor('')

    const dadosAtividade = {
      aula_id: formulario.aula_id,
      pergunta: formulario.pergunta.trim(),
      alternativa_a:
        formulario.alternativa_a.trim(),
      alternativa_b:
        formulario.alternativa_b.trim(),
      alternativa_c:
        formulario.alternativa_c.trim(),
      alternativa_d:
        formulario.alternativa_d.trim(),
      ordem: Number(formulario.ordem) || 1,
      ativo: Boolean(formulario.ativo),
    }

    let atividadeSalva
    let erroAtividade

    if (formulario.id) {
      const resposta = await supabase
        .from('atividades')
        .update(dadosAtividade)
        .eq('id', formulario.id)
        .select(`
          id,
          aula_id,
          pergunta,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          ordem,
          ativo,
          criado_em
        `)
        .single()

      atividadeSalva = resposta.data
      erroAtividade = resposta.error
    } else {
      const resposta = await supabase
        .from('atividades')
        .insert(dadosAtividade)
        .select(`
          id,
          aula_id,
          pergunta,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          ordem,
          ativo,
          criado_em
        `)
        .single()

      atividadeSalva = resposta.data
      erroAtividade = resposta.error
    }

    if (erroAtividade) {
      console.error(
        'Erro ao salvar atividade:',
        erroAtividade,
      )
      setErroEditor(
        'Não foi possível salvar a atividade.',
      )
      setSalvando(false)
      return
    }

    const dadosGabarito = {
      atividade_id: atividadeSalva.id,
      resposta_correta:
        formulario.resposta_correta,
    }

    const gabaritoExistente = gabaritos.some(
      (gabarito) =>
        gabarito.atividade_id === atividadeSalva.id,
    )

    const respostaGabarito = gabaritoExistente
      ? await supabase
          .from('gabaritos_atividades')
          .update({
            resposta_correta:
              formulario.resposta_correta,
          })
          .eq('atividade_id', atividadeSalva.id)
          .select(`
            atividade_id,
            resposta_correta,
            criado_em
          `)
          .single()
      : await supabase
          .from('gabaritos_atividades')
          .insert(dadosGabarito)
          .select(`
            atividade_id,
            resposta_correta,
            criado_em
          `)
          .single()

    if (respostaGabarito.error) {
      console.error(
        'Erro ao salvar gabarito:',
        respostaGabarito.error,
      )
      setErroEditor(
        'A questão foi salva, mas o gabarito não pôde ser atualizado.',
      )
      setSalvando(false)
      return
    }

    setAtividades((estadoAtual) => {
      const existe = estadoAtual.some(
        (item) => item.id === atividadeSalva.id,
      )

      if (existe) {
        return estadoAtual.map((item) =>
          item.id === atividadeSalva.id
            ? atividadeSalva
            : item,
        )
      }

      return [...estadoAtual, atividadeSalva]
    })

    setGabaritos((estadoAtual) => {
      const existe = estadoAtual.some(
        (item) =>
          item.atividade_id === atividadeSalva.id,
      )

      if (existe) {
        return estadoAtual.map((item) =>
          item.atividade_id === atividadeSalva.id
            ? respostaGabarito.data
            : item,
        )
      }

      return [
        ...estadoAtual,
        respostaGabarito.data,
      ]
    })

    setMensagem(
      formulario.id
        ? 'Atividade atualizada com sucesso.'
        : 'Atividade criada com sucesso.',
    )
    setSalvando(false)
    fecharEditor()
  }

  async function duplicarAtividade(atividade) {
    setMensagem('')

    const proximaOrdem =
      Math.max(
        0,
        ...atividades
          .filter(
            (item) =>
              item.aula_id === atividade.aula_id,
          )
          .map((item) => Number(item.ordem) || 0),
      ) + 1

    const { data, error } = await supabase
      .from('atividades')
      .insert({
        aula_id: atividade.aula_id,
        pergunta: `${atividade.pergunta} (cópia)`,
        alternativa_a: atividade.alternativa_a,
        alternativa_b: atividade.alternativa_b,
        alternativa_c: atividade.alternativa_c,
        alternativa_d: atividade.alternativa_d,
        ordem: proximaOrdem,
        ativo: false,
      })
      .select(`
        id,
        aula_id,
        pergunta,
        alternativa_a,
        alternativa_b,
        alternativa_c,
        alternativa_d,
        ordem,
        ativo,
        criado_em
      `)
      .single()

    if (error) {
      console.error(
        'Erro ao duplicar atividade:',
        error,
      )
      setMensagem(
        'Não foi possível duplicar a atividade.',
      )
      return
    }

    const { data: gabaritoNovo, error: erroGabarito } =
      await supabase
        .from('gabaritos_atividades')
        .insert({
          atividade_id: data.id,
          resposta_correta:
            atividade.resposta_correta,
        })
        .select(`
          atividade_id,
          resposta_correta,
          criado_em
        `)
        .single()

    if (erroGabarito) {
      console.error(
        'Erro ao duplicar gabarito:',
        erroGabarito,
      )
    }

    setAtividades((estadoAtual) => [
      ...estadoAtual,
      data,
    ])

    if (gabaritoNovo) {
      setGabaritos((estadoAtual) => [
        ...estadoAtual,
        gabaritoNovo,
      ])
    }

    setMensagem('Atividade duplicada como rascunho.')
  }

  async function excluirAtividade(atividade) {
    const confirmou = window.confirm(
      'Deseja realmente excluir esta atividade e o seu gabarito?',
    )

    if (!confirmou) return

    setMensagem('')

    const { error: erroGabarito } = await supabase
      .from('gabaritos_atividades')
      .delete()
      .eq('atividade_id', atividade.id)

    if (erroGabarito) {
      console.error(
        'Erro ao excluir gabarito:',
        erroGabarito,
      )
    }

    const { error } = await supabase
      .from('atividades')
      .delete()
      .eq('id', atividade.id)

    if (error) {
      console.error(
        'Erro ao excluir atividade:',
        error,
      )
      setMensagem(
        'Não foi possível excluir a atividade.',
      )
      return
    }

    setAtividades((estadoAtual) =>
      estadoAtual.filter(
        (item) => item.id !== atividade.id,
      ),
    )

    setGabaritos((estadoAtual) =>
      estadoAtual.filter(
        (item) =>
          item.atividade_id !== atividade.id,
      ),
    )

    setMensagem('Atividade excluída.')
  }

  const atividadeDetalhes = atividadesComDados.find(
    (atividade) =>
      atividade.id === atividadeDetalhesId,
  )

  if (carregando) {
    return (
      <p className="painel-professor-vazio">
        Carregando atividades...
      </p>
    )
  }

  return (
    <section className="atividades-professor">
      <div className="painel-conteudo-cabecalho">
        <div>
          <p>Avaliações e exercícios</p>
          <h2>Atividades</h2>
          <span>
            Crie questões, defina gabaritos e acompanhe
            respostas.
          </span>
        </div>

        <div className="atividades-acoes-topo">
          <button
            type="button"
            onClick={carregarDados}
          >
            Atualizar
          </button>

          <button
            type="button"
            onClick={() => abrirNovaAtividade()}
            disabled={aulas.length === 0}
          >
            ➕ Nova atividade
          </button>
        </div>
      </div>

      {mensagem && (
        <p className="painel-professor-mensagem">
          {mensagem}
        </p>
      )}

      <div className="atividades-resumo">
        <article>
          <small>Total de questões</small>
          <strong>{resumo.total}</strong>
        </article>
        <article>
          <small>Ativas</small>
          <strong>{resumo.ativas}</strong>
        </article>
        <article>
          <small>Rascunhos</small>
          <strong>{resumo.rascunhos}</strong>
        </article>
        <article>
          <small>Respostas registradas</small>
          <strong>{resumo.totalEntregas}</strong>
        </article>
        <article>
          <small>Taxa de acerto</small>
          <strong>{resumo.taxaAcerto}%</strong>
        </article>
      </div>

      <div className="atividades-filtros">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Questão, aula ou disciplina"
          />
        </label>

        <label>
          <span>Disciplina</span>
          <select
            value={disciplinaFiltro}
            onChange={(event) => {
              setDisciplinaFiltro(
                event.target.value,
              )
              setAulaFiltro('todas')
            }}
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
          <span>Aula</span>
          <select
            value={aulaFiltro}
            onChange={(event) =>
              setAulaFiltro(event.target.value)
            }
          >
            <option value="todas">
              Todas as aulas
            </option>
            {aulasDisponiveis.map((aula) => (
              <option key={aula.id} value={aula.id}>
                {aula.titulo}
              </option>
            ))}
          </select>
        </label>

        <label className="atividades-check">
          <input
            type="checkbox"
            checked={somenteAtivas}
            onChange={(event) =>
              setSomenteAtivas(event.target.checked)
            }
          />
          <span>Somente ativas</span>
        </label>
      </div>

      {gruposPorAula.length === 0 ? (
        <p className="painel-professor-vazio">
          Nenhuma atividade encontrada.
        </p>
      ) : (
        <div className="atividades-grupos">
          {gruposPorAula.map((grupo) => (
            <section
              className="atividades-grupo"
              key={grupo.aula?.id}
            >
              <header>
                <div>
                  <small>
                    {grupo.disciplina?.nome ||
                      'Disciplina não encontrada'}
                  </small>
                  <h3>
                    {grupo.aula?.titulo ||
                      'Aula não encontrada'}
                  </h3>
                  <span>
                    {grupo.atividades.length}{' '}
                    {grupo.atividades.length === 1
                      ? 'questão'
                      : 'questões'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    abrirNovaAtividade(grupo.aula?.id)
                  }
                >
                  ＋ Adicionar questão
                </button>
              </header>

              <div className="atividades-lista">
                {grupo.atividades
                  .sort(
                    (a, b) =>
                      Number(a.ordem) -
                      Number(b.ordem),
                  )
                  .map((atividade) => (
                    <article
                      className="atividade-card"
                      key={atividade.id}
                    >
                      <span className="atividade-ordem">
                        {String(
                          atividade.ordem || 0,
                        ).padStart(2, '0')}
                      </span>

                      <div className="atividade-conteudo">
                        <div>
                          <h4>
                            {atividade.pergunta}
                          </h4>
                          <span
                            className={
                              atividade.ativo
                                ? 'painel-status-publicado'
                                : 'painel-status-rascunho'
                            }
                          >
                            {atividade.ativo
                              ? 'Ativa'
                              : 'Rascunho'}
                          </span>
                        </div>

                        <p>
                          Resposta correta:{' '}
                          <strong>
                            {String(
                              atividade.resposta_correta ||
                                '—',
                            ).toUpperCase()}
                          </strong>
                        </p>

                        <small>
                          {atividade.entregas.length}{' '}
                          respostas ·{' '}
                          {atividade.taxaAcerto}% de acerto
                        </small>
                      </div>

                      <div className="atividade-acoes">
                        <button
                          type="button"
                          onClick={() =>
                            setAtividadeDetalhesId(
                              atividade.id,
                            )
                          }
                        >
                          Respostas
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(atividade)
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            duplicarAtividade(
                              atividade,
                            )
                          }
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="atividade-excluir"
                          onClick={() =>
                            excluirAtividade(
                              atividade,
                            )
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editorAberto && (
        <div
          className="atividade-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharEditor()
            }
          }}
          role="presentation"
        >
          <section
            className="atividade-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <p>Editor de atividade</p>
                <h2>
                  {formulario.id
                    ? 'Editar questão'
                    : 'Nova questão'}
                </h2>
                <span>
                  Cada aula pode conter várias questões
                  ordenadas.
                </span>
              </div>

              <button
                type="button"
                onClick={fecharEditor}
                disabled={salvando}
              >
                ✕ Fechar
              </button>
            </header>

            <form
              className="atividade-formulario"
              onSubmit={salvarAtividade}
            >
              <label>
                <span>Aula</span>
                <select
                  value={formulario.aula_id}
                  onChange={(event) =>
                    atualizarCampo(
                      'aula_id',
                      event.target.value,
                    )
                  }
                  disabled={salvando}
                >
                  <option value="">
                    Selecione uma aula
                  </option>
                  {aulas.map((aula) => {
                    const disciplina =
                      disciplinas.find(
                        (item) =>
                          item.id ===
                          aula.disciplina_id,
                      )

                    return (
                      <option
                        key={aula.id}
                        value={aula.id}
                      >
                        {disciplina?.nome
                          ? `${disciplina.nome} — `
                          : ''}
                        {aula.titulo}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label>
                <span>Pergunta</span>
                <textarea
                  value={formulario.pergunta}
                  onChange={(event) =>
                    atualizarCampo(
                      'pergunta',
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="Digite a pergunta"
                  disabled={salvando}
                />
              </label>

              <div className="atividade-alternativas">
                {['a', 'b', 'c', 'd'].map((letra) => (
                  <label key={letra}>
                    <span>
                      Alternativa {letra.toUpperCase()}
                    </span>
                    <input
                      type="text"
                      value={
                        formulario[
                          `alternativa_${letra}`
                        ]
                      }
                      onChange={(event) =>
                        atualizarCampo(
                          `alternativa_${letra}`,
                          event.target.value,
                        )
                      }
                      disabled={salvando}
                    />
                  </label>
                ))}
              </div>

              <div className="atividade-configuracoes">
                <label>
                  <span>Resposta correta</span>
                  <select
                    value={
                      formulario.resposta_correta
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'resposta_correta',
                        event.target.value,
                      )
                    }
                    disabled={salvando}
                  >
                    <option value="a">
                      Alternativa A
                    </option>
                    <option value="b">
                      Alternativa B
                    </option>
                    <option value="c">
                      Alternativa C
                    </option>
                    <option value="d">
                      Alternativa D
                    </option>
                  </select>
                </label>

                <label>
                  <span>Ordem</span>
                  <input
                    type="number"
                    min="1"
                    value={formulario.ordem}
                    onChange={(event) =>
                      atualizarCampo(
                        'ordem',
                        event.target.value,
                      )
                    }
                    disabled={salvando}
                  />
                </label>

                <label>
                  <span>Status</span>
                  <select
                    value={
                      formulario.ativo
                        ? 'ativa'
                        : 'rascunho'
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        'ativo',
                        event.target.value ===
                          'ativa',
                      )
                    }
                    disabled={salvando}
                  >
                    <option value="rascunho">
                      Rascunho
                    </option>
                    <option value="ativa">
                      Ativa
                    </option>
                  </select>
                </label>
              </div>

              {erroEditor && (
                <p className="atividade-editor-erro">
                  {erroEditor}
                </p>
              )}

              <footer>
                <button
                  type="button"
                  className="painel-editor-cancelar"
                  onClick={fecharEditor}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                >
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar atividade'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {atividadeDetalhes && (
        <div
          className="atividade-modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAtividadeDetalhesId(null)
            }
          }}
          role="presentation"
        >
          <section className="atividade-modal atividade-respostas-modal">
            <header>
              <div>
                <p>Desempenho da questão</p>
                <h2>Respostas dos alunos</h2>
                <span>
                  {atividadeDetalhes.pergunta}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAtividadeDetalhesId(null)
                }
              >
                ✕ Fechar
              </button>
            </header>

            <div className="atividade-respostas-resumo">
              <article>
                <small>Respostas</small>
                <strong>
                  {atividadeDetalhes.entregas.length}
                </strong>
              </article>
              <article>
                <small>Acertos</small>
                <strong>
                  {atividadeDetalhes.acertos}
                </strong>
              </article>
              <article>
                <small>Taxa de acerto</small>
                <strong>
                  {atividadeDetalhes.taxaAcerto}%
                </strong>
              </article>
              <article>
                <small>Gabarito</small>
                <strong>
                  {String(
                    atividadeDetalhes.resposta_correta ||
                      '—',
                  ).toUpperCase()}
                </strong>
              </article>
            </div>

            {atividadeDetalhes.entregas.length === 0 ? (
              <p className="painel-professor-vazio">
                Nenhum aluno respondeu a esta questão.
              </p>
            ) : (
              <div className="atividade-respostas-lista">
                {atividadeDetalhes.entregas.map(
                  (entrega) => (
                    <article
                      key={`${entrega.registroId}-${entrega.usuarioId}`}
                    >
                      <div>
                        <strong>{entrega.nome}</strong>
                        <small>
                          @{entrega.usuario}
                        </small>
                      </div>

                      <span>
                        Resposta:{' '}
                        {entrega.resposta.toUpperCase()}
                      </span>

                      <span
                        className={
                          entrega.correta
                            ? 'atividade-resposta-correta'
                            : 'atividade-resposta-errada'
                        }
                      >
                        {entrega.correta
                          ? 'Correta'
                          : 'Incorreta'}
                      </span>

                      <small>
                        Nota: {entrega.nota ?? '—'}
                      </small>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
