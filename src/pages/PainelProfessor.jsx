import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

import DashboardProfessor from '../components/painelProfessor/DashboardProfessor'
import MenuLateral, {
  abasPainel,
} from '../components/painelProfessor/MenuLateral'
import ListaDisciplinas from '../components/painelProfessor/ListaDisciplinas'
import EditorAula from '../components/painelProfessor/EditorAula'
import ModalNovaAula from '../components/painelProfessor/ModalNovaAula'
import AlunosProfessor from '../components/painelProfessor/AlunosProfessor'
import EstatisticasProfessor from '../components/painelProfessor/EstatisticasProfessor'
import AtividadesProfessor from '../components/painelProfessor/AtividadesProfessor'
import LivrosProfessor from '../components/painelProfessor/LivrosProfessor'

import '../styles/painelProfessor/painel.css'
import '../styles/painelProfessor/dashboard.css'
import '../styles/painelProfessor/menu.css'
import '../styles/painelProfessor/disciplinas.css'
import '../styles/painelProfessor/editor.css'
import '../styles/painelProfessor/blocos.css'
import '../styles/painelProfessor/nova-aula.css'
import '../styles/painelProfessor/alunos.css'
import '../styles/painelProfessor/estatisticas.css'
import '../styles/painelProfessor/atividades.css'
import '../styles/painelProfessor/livros.css'

export default function PainelProfessor({ onVoltar }) {
  const [abaAtual, setAbaAtual] = useState('disciplinas')
  const [disciplinas, setDisciplinas] = useState([])
  const [aulas, setAulas] = useState([])
  const [disciplinaAbertaId, setDisciplinaAbertaId] =
    useState(null)

  const [aulaEmEdicao, setAulaEmEdicao] = useState(null)
  const [modalNovaAulaAberto, setModalNovaAulaAberto] =
    useState(false)
  const [disciplinaInicialNovaAula, setDisciplinaInicialNovaAula] =
    useState(null)

  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarPainel()
  }, [])

  async function carregarPainel() {
    setCarregando(true)
    setMensagem('')

    const {
      data: { user },
      error: erroUsuario,
    } = await supabase.auth.getUser()

    if (erroUsuario || !user) {
      console.error(
        'Erro ao identificar professor:',
        erroUsuario,
      )

      setMensagem(
        'Não foi possível identificar a conta do professor.',
      )

      setCarregando(false)
      return
    }

    const {
      data: disciplinasData,
      error: erroDisciplinas,
    } = await supabase
      .from('disciplinas')
      .select(`
        id,
        nome,
        descricao,
        ordem,
        ativo,
        curso_id,
        cursos (
          id,
          nome,
          ano
        )
      `)
      .eq('professor_id', user.id)
      .order('ordem', { ascending: true })

    if (erroDisciplinas) {
      console.error(
        'Erro ao carregar disciplinas:',
        erroDisciplinas,
      )

      setMensagem(
        'Não foi possível carregar suas disciplinas.',
      )

      setCarregando(false)
      return
    }

    const idsDisciplinas = (disciplinasData ?? []).map(
      (disciplina) => disciplina.id,
    )

    let aulasData = []

    if (idsDisciplinas.length > 0) {
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          id,
          titulo,
          descricao,
          disciplina_id,
          recompensa_xp,
          ordem,
          ativo,
          criado_em,
          atualizado_em
        `)
        .in('disciplina_id', idsDisciplinas)
        .order('ordem', { ascending: true })

      if (error) {
        console.error('Erro ao carregar aulas:', error)

        setMensagem(
          'As disciplinas foram carregadas, mas as aulas não.',
        )
      } else {
        aulasData = data ?? []
      }
    }

    setDisciplinas(disciplinasData ?? [])
    setAulas(aulasData)

    if ((disciplinasData ?? []).length > 0) {
      setDisciplinaAbertaId(disciplinasData[0].id)
    }

    setCarregando(false)
  }

  const totalPublicadas = useMemo(
    () => aulas.filter((aula) => aula.ativo).length,
    [aulas],
  )

  const totalRascunhos = useMemo(
    () => aulas.filter((aula) => !aula.ativo).length,
    [aulas],
  )

  const xpDisponivel = useMemo(
    () =>
      aulas
        .filter((aula) => aula.ativo)
        .reduce(
          (total, aula) =>
            total + (Number(aula.recompensa_xp) || 0),
          0,
        ),
    [aulas],
  )

  function abrirEdicaoAula(aula) {
    setMensagem('')

    setAulaEmEdicao({
      id: aula.id,
      disciplina_id: aula.disciplina_id,
      titulo: aula.titulo ?? '',
      descricao: aula.descricao ?? '',
      recompensa_xp: aula.recompensa_xp ?? 0,
      ordem: aula.ordem ?? 1,
      ativo: Boolean(aula.ativo),
    })
  }

  function fecharEditorAula() {
    setAulaEmEdicao(null)
  }

  function abrirModalNovaAula(disciplinaId = null) {
    const disciplinaPadrao =
      disciplinaId ??
      disciplinaAbertaId ??
      disciplinas[0]?.id ??
      null

    setDisciplinaInicialNovaAula(disciplinaPadrao)
    setMensagem('')
    setModalNovaAulaAberto(true)
  }

  function fecharModalNovaAula() {
    setModalNovaAulaAberto(false)
    setDisciplinaInicialNovaAula(null)
  }

  function registrarNovaAula(aulaCriada) {
    setAulas((aulasAtuais) =>
      [...aulasAtuais, aulaCriada].sort(
        (aulaA, aulaB) => {
          if (
            aulaA.disciplina_id !==
            aulaB.disciplina_id
          ) {
            return 0
          }

          return (
            Number(aulaA.ordem) -
            Number(aulaB.ordem)
          )
        },
      ),
    )

    setDisciplinaAbertaId(aulaCriada.disciplina_id)
    setModalNovaAulaAberto(false)
    setDisciplinaInicialNovaAula(null)
    setMensagem('Aula criada com sucesso.')

    abrirEdicaoAula(aulaCriada)
  }

  function atualizarAulaNaLista(aulaAtualizada) {
    setAulas((aulasAtuais) =>
      aulasAtuais
        .map((aula) =>
          aula.id === aulaAtualizada.id
            ? aulaAtualizada
            : aula,
        )
        .sort((aulaA, aulaB) => {
          if (
            aulaA.disciplina_id !==
            aulaB.disciplina_id
          ) {
            return 0
          }

          return (
            Number(aulaA.ordem) -
            Number(aulaB.ordem)
          )
        }),
    )

    setMensagem('Aula atualizada com sucesso.')
    setAulaEmEdicao(null)
  }

  function trocarAba(idAba) {
    setAbaAtual(idAba)
    setAulaEmEdicao(null)
    setModalNovaAulaAberto(false)
  }

  function renderizarConteudo() {
    if (aulaEmEdicao) {
      return (
        <EditorAula
          aula={aulaEmEdicao}
          disciplinas={disciplinas}
          onCancelar={fecharEditorAula}
          onSalvo={atualizarAulaNaLista}
        />
      )
    }

    if (abaAtual === 'disciplinas') {
      return (
        <>
          <div className="painel-conteudo-cabecalho">
            <div>
              <p>Organização acadêmica</p>
              <h2>Minhas disciplinas</h2>
              <span>
                Abra uma disciplina para visualizar suas aulas.
              </span>
            </div>

            <button
              type="button"
              onClick={() => abrirModalNovaAula()}
              disabled={disciplinas.length === 0}
            >
              ➕ Criar aula
            </button>
          </div>

          <ListaDisciplinas
            disciplinas={disciplinas}
            aulas={aulas}
            disciplinaAbertaId={disciplinaAbertaId}
            onAlternarDisciplina={setDisciplinaAbertaId}
            onCriarAula={abrirModalNovaAula}
            onEditarAula={abrirEdicaoAula}
          />
        </>
      )
    }

    if (abaAtual === 'alunos') {
      return (
        <AlunosProfessor
          aulas={aulas}
          disciplinas={disciplinas}
        />
      )
    }

    if (abaAtual === 'estatisticas') {
      return (
        <EstatisticasProfessor
          aulas={aulas}
          disciplinas={disciplinas}
        />
      )
    }

    if (abaAtual === 'atividades') {
      return (
        <AtividadesProfessor
          aulas={aulas}
          disciplinas={disciplinas}
        />
      )
    }

    if (abaAtual === 'livros') {
      return <LivrosProfessor />
    }

    const aba = abasPainel.find(
      (item) => item.id === abaAtual,
    )

    return (
      <section className="painel-professor-em-breve">
        <span>{aba?.icone}</span>
        <h2>{aba?.titulo}</h2>
        <p>
          Esta área será construída na próxima etapa do painel.
        </p>
      </section>
    )
  }

  if (carregando) {
    return (
      <main className="painel-professor">
        <p>Carregando painel do professor...</p>
      </main>
    )
  }

  return (
    <main className="painel-professor">
      <button
        type="button"
        className="painel-professor-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <DashboardProfessor
        disciplinas={disciplinas.length}
        totalPublicadas={totalPublicadas}
        totalRascunhos={totalRascunhos}
        xpDisponivel={xpDisponivel}
      />

      {mensagem && (
        <p className="painel-professor-mensagem">
          {mensagem}
        </p>
      )}

      <section className="painel-professor-app">
        <MenuLateral
          abaAtual={abaAtual}
          onTrocarAba={trocarAba}
        />

        <section className="painel-professor-conteudo">
          {renderizarConteudo()}
        </section>
      </section>

      {modalNovaAulaAberto && (
        <ModalNovaAula
          disciplinas={disciplinas}
          aulas={aulas}
          disciplinaInicialId={
            disciplinaInicialNovaAula
          }
          onFechar={fecharModalNovaAula}
          onCriada={registrarNovaAula}
        />
      )}
    </main>
  )
}
