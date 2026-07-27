import { useMemo, useState } from 'react'
import './vida-escolar-v2.css'

const materias = [
  { nome: 'Encantamentos', professor: 'Prof. Amara Vale', nota: 92, frequencia: 96, proxima: 'Prática de selos defensivos' },
  { nome: 'Herbologia Amazônica', professor: 'Prof. Caio Aruã', nota: 84, frequencia: 91, proxima: 'Catálogo de plantas lunares' },
  { nome: 'História da Magia Sul-Americana', professor: 'Prof. Helena Sombra', nota: 88, frequencia: 94, proxima: 'Arquivo das expedições antigas' },
  { nome: 'Defesa Mágica', professor: 'Prof. Bento Iara', nota: 79, frequencia: 89, proxima: 'Simulação de contenção' },
]

const rotina = [
  { hora: '08h00', titulo: 'Herbologia Amazônica', local: 'Estufa III', dia: 'Hoje' },
  { hora: '10h20', titulo: 'História da Magia', local: 'Arquivo Norte', dia: 'Hoje' },
  { hora: '19h30', titulo: 'Encantamentos', local: 'Torre das Águas', dia: 'Hoje' },
  { hora: '14h00', titulo: 'Defesa Mágica', local: 'Pátio de Pedra', dia: 'Amanhã' },
]

const tarefasIniciais = [
  { id: 1, titulo: 'Relatório de plantas lunares', materia: 'Herbologia Amazônica', prazo: 'Hoje, 23h59', concluida: false },
  { id: 2, titulo: 'Resumo do capítulo 7', materia: 'História da Magia', prazo: 'Amanhã', concluida: false },
  { id: 3, titulo: 'Prática: selo de contenção', materia: 'Encantamentos', prazo: 'Qua, 19h', concluida: true },
]

export default function VidaEscolarV2({ onVoltar }) {
  const [aba, setAba] = useState('visao')
  const [tarefas, setTarefas] = useState(tarefasIniciais)
  const [mensagem, setMensagem] = useState('')

  const media = useMemo(() => Math.round(materias.reduce((soma, item) => soma + item.nota, 0) / materias.length), [])
  const frequencia = useMemo(() => Math.round(materias.reduce((soma, item) => soma + item.frequencia, 0) / materias.length), [])
  const pendentes = tarefas.filter((item) => !item.concluida).length

  function alternarTarefa(id) {
    setTarefas((atuais) => atuais.map((item) => item.id === id ? { ...item, concluida: !item.concluida } : item))
    setMensagem('Progresso atualizado nesta prévia visual.')
  }

  return (
    <section className="escola-v2">
      <header className="escola-v2-topo">
        <div>
          <button type="button" onClick={onVoltar}>← Voltar ao painel</button>
          <small>VIDA ESCOLAR · 3º ANO</small>
          <h1>Seu arquivo acadêmico</h1>
          <p>Rotina, matérias, tarefas e desempenho reunidos em um único registro.</p>
        </div>
        <span className="escola-v2-carimbo">CICLO 2026</span>
      </header>

      {mensagem && <div className="escola-v2-mensagem" role="status"><span>{mensagem}</span><button type="button" onClick={() => setMensagem('')}>×</button></div>}

      <nav className="escola-v2-abas" aria-label="Seções da vida escolar">
        {[['visao','Visão geral'],['materias','Matérias'],['tarefas','Tarefas'],['rotina','Rotina']].map(([id, nome]) => (
          <button key={id} type="button" className={aba === id ? 'ativo' : ''} onClick={() => setAba(id)}>{nome}</button>
        ))}
      </nav>

      {aba === 'visao' && (
        <>
          <section className="escola-v2-resumo">
            <article><small>MÉDIA GERAL</small><strong>{media}</strong><span>Desempenho muito bom</span></article>
            <article><small>FREQUÊNCIA</small><strong>{frequencia}%</strong><span>Presença regular</span></article>
            <article><small>TAREFAS</small><strong>{pendentes}</strong><span>pendentes nesta semana</span></article>
            <article><small>PROGRESSO DO ANO</small><strong>72%</strong><span>ciclo acadêmico concluído</span></article>
          </section>

          <div className="escola-v2-grade">
            <section className="escola-v2-bloco">
              <header><div><small>HOJE</small><h2>Próximas aulas</h2></div><button type="button" onClick={() => setAba('rotina')}>Abrir rotina</button></header>
              <div className="escola-v2-lista-rotina">
                {rotina.filter((item) => item.dia === 'Hoje').map((item) => <article key={`${item.hora}-${item.titulo}`}><time>{item.hora}</time><div><strong>{item.titulo}</strong><span>{item.local}</span></div><em>Confirmada</em></article>)}
              </div>
            </section>

            <section className="escola-v2-bloco">
              <header><div><small>PENDÊNCIAS</small><h2>Tarefas próximas</h2></div><button type="button" onClick={() => setAba('tarefas')}>Ver todas</button></header>
              <div className="escola-v2-lista-tarefas compacta">
                {tarefas.filter((item) => !item.concluida).map((item) => <article key={item.id}><button type="button" aria-label={`Concluir ${item.titulo}`} onClick={() => alternarTarefa(item.id)} /><div><strong>{item.titulo}</strong><span>{item.materia} · {item.prazo}</span></div></article>)}
              </div>
            </section>
          </div>

          <section className="escola-v2-bloco escola-v2-destaques">
            <header><div><small>DESEMPENHO</small><h2>Matérias em destaque</h2></div><button type="button" onClick={() => setAba('materias')}>Abrir boletim</button></header>
            <div>{materias.slice(0,3).map((item) => <article key={item.nome}><span>{item.nota}</span><div><strong>{item.nome}</strong><small>{item.professor}</small><div><i style={{ width: `${item.nota}%` }} /></div></div></article>)}</div>
          </section>
        </>
      )}

      {aba === 'materias' && <section className="escola-v2-materias">{materias.map((item) => <article key={item.nome}><header><div><small>DISCIPLINA</small><h2>{item.nome}</h2><span>{item.professor}</span></div><strong>{item.nota}</strong></header><div className="escola-v2-indicadores"><div><span>Nota</span><div><i style={{ width: `${item.nota}%` }} /></div></div><div><span>Frequência · {item.frequencia}%</span><div><i style={{ width: `${item.frequencia}%` }} /></div></div></div><footer><small>PRÓXIMO CONTEÚDO</small><p>{item.proxima}</p><button type="button" onClick={() => setMensagem(`A página de ${item.nome} será conectada aos materiais reais depois.`)}>Abrir matéria</button></footer></article>)}</section>}

      {aba === 'tarefas' && <section className="escola-v2-bloco"><header><div><small>ORGANIZAÇÃO</small><h2>Minhas tarefas</h2></div><span>{pendentes} pendentes</span></header><div className="escola-v2-lista-tarefas">{tarefas.map((item) => <article key={item.id} className={item.concluida ? 'concluida' : ''}><button type="button" aria-label={`Alternar ${item.titulo}`} onClick={() => alternarTarefa(item.id)}>{item.concluida ? '✓' : ''}</button><div><strong>{item.titulo}</strong><span>{item.materia}</span></div><time>{item.prazo}</time></article>)}</div></section>}

      {aba === 'rotina' && <section className="escola-v2-bloco"><header><div><small>CALENDÁRIO</small><h2>Rotina acadêmica</h2></div><button type="button" onClick={() => setMensagem('A visualização semanal será conectada ao calendário real depois.')}>Semana completa</button></header><div className="escola-v2-lista-rotina completa">{rotina.map((item) => <article key={`${item.dia}-${item.hora}-${item.titulo}`}><span>{item.dia}</span><time>{item.hora}</time><div><strong>{item.titulo}</strong><small>{item.local}</small></div><button type="button" onClick={() => setMensagem(`${item.titulo} foi destacado na sua rotina.`)}>Detalhes</button></article>)}</div></section>}
    </section>
  )
}
