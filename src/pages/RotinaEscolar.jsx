import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/rotina-escolar.css'

const TIPOS = {
  aula: 'Aula', tarefa: 'Tarefa', estudo: 'Estudo', tribo: 'Tribo',
  pessoal: 'Pessoal', prova: 'Prova', reuniao: 'Reunião',
  evento: 'Evento', missao: 'Missão',
}

function inicioDoMes(data) { return new Date(data.getFullYear(), data.getMonth(), 1) }
function fimDoMes(data) { return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59) }
function chaveDia(data) { return new Date(data).toISOString().slice(0, 10) }

export default function RotinaEscolar({ perfil, onVoltar, onAbrirEventos, onAbrirMissoes, onAbrirAulas }) {
  const [mes, setMes] = useState(inicioDoMes(new Date()))
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [formAberto, setFormAberto] = useState(false)
  const [novo, setNovo] = useState({ titulo: '', descricao: '', tipo: 'estudo', inicio_em: '', fim_em: '', local_nome: '' })

  useEffect(() => { carregar() }, [perfil.id, mes.getTime()])

  async function carregar() {
    setCarregando(true); setMensagem('')
    const inicio = inicioDoMes(mes).toISOString()
    const fim = fimDoMes(mes).toISOString()
    const [rotina, eventos, missoes] = await Promise.all([
      supabase.from('rotina_compromissos').select('*').eq('usuario_id', perfil.id).gte('inicio_em', inicio).lte('inicio_em', fim).order('inicio_em'),
      supabase.from('eventos').select('id,titulo,descricao,local_evento,inicio_em,fim_em').eq('ativo', true).gte('inicio_em', inicio).lte('inicio_em', fim).order('inicio_em'),
      supabase.from('missoes_usuarios').select('id,status,progresso,missoes(id,titulo,descricao,prazo_em,meta)').eq('usuario_id', perfil.id).eq('status', 'ativa'),
    ])

    const pessoais = (rotina.data || []).map((item) => ({ ...item, origem: 'rotina' }))
    const agendaEventos = (eventos.data || []).map((item) => ({ ...item, tipo: 'evento', origem: 'evento', local_nome: item.local_evento }))
    const agendaMissoes = (missoes.data || []).filter((item) => item.missoes?.prazo_em && new Date(item.missoes.prazo_em) >= new Date(inicio) && new Date(item.missoes.prazo_em) <= new Date(fim)).map((item) => ({ id: item.id, titulo: item.missoes.titulo, descricao: item.missoes.descricao, inicio_em: item.missoes.prazo_em, tipo: 'missao', origem: 'missao', progresso: item.progresso, meta: item.missoes.meta }))
    setItens([...pessoais, ...agendaEventos, ...agendaMissoes].sort((a, b) => new Date(a.inicio_em) - new Date(b.inicio_em)))
    setCarregando(false)
  }

  async function criar(evento) {
    evento.preventDefault(); setMensagem('')
    const { error } = await supabase.from('rotina_compromissos').insert({
      usuario_id: perfil.id, titulo: novo.titulo.trim(), descricao: novo.descricao.trim(), tipo: novo.tipo,
      inicio_em: new Date(novo.inicio_em).toISOString(), fim_em: novo.fim_em ? new Date(novo.fim_em).toISOString() : null,
      local_nome: novo.local_nome.trim() || null,
    })
    if (error) { setMensagem(error.message || 'Não foi possível salvar o compromisso.'); return }
    setNovo({ titulo: '', descricao: '', tipo: 'estudo', inicio_em: '', fim_em: '', local_nome: '' })
    setFormAberto(false); setMensagem('Compromisso adicionado à rotina.'); await carregar()
  }

  async function alternarConcluido(item) {
    if (item.origem !== 'rotina') return
    const { error } = await supabase.from('rotina_compromissos').update({ concluido: !item.concluido, atualizado_em: new Date().toISOString() }).eq('id', item.id)
    if (error) { setMensagem('Não foi possível atualizar o compromisso.'); return }
    await carregar()
  }

  async function excluir(item) {
    if (item.origem !== 'rotina' || !window.confirm('Remover este compromisso?')) return
    const { error } = await supabase.from('rotina_compromissos').delete().eq('id', item.id)
    if (error) { setMensagem('Não foi possível remover o compromisso.'); return }
    await carregar()
  }

  const dias = useMemo(() => {
    const primeiro = inicioDoMes(mes)
    const inicioGrade = new Date(primeiro); inicioGrade.setDate(1 - primeiro.getDay())
    return Array.from({ length: 42 }, (_, indice) => { const dia = new Date(inicioGrade); dia.setDate(inicioGrade.getDate() + indice); return dia })
  }, [mes])

  const porDia = useMemo(() => itens.reduce((mapa, item) => { const chave = chaveDia(item.inicio_em); (mapa[chave] ||= []).push(item); return mapa }, {}), [itens])
  const proximos = itens.filter((item) => new Date(item.inicio_em) >= new Date()).slice(0, 6)

  return <main className="rotina-pagina">
    <header className="rotina-topo"><button onClick={onVoltar}>← Voltar</button><div><small>Vida escolar</small><h1>Rotina e calendário</h1><p>Organize aulas, estudos, eventos, missões e compromissos pessoais.</p></div><button onClick={() => setFormAberto((v) => !v)}>Novo compromisso</button></header>

    <section className="rotina-resumo">
      <article><small>Próximos compromissos</small><strong>{proximos.length}</strong></article>
      <article><small>Missões com prazo</small><strong>{itens.filter((i) => i.tipo === 'missao').length}</strong></article>
      <article><small>Eventos do mês</small><strong>{itens.filter((i) => i.tipo === 'evento').length}</strong></article>
      <article><small>Concluídos</small><strong>{itens.filter((i) => i.concluido).length}</strong></article>
    </section>

    {formAberto && <form className="rotina-form" onSubmit={criar}>
      <input required minLength="2" maxLength="120" placeholder="Título" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
      <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>{Object.entries(TIPOS).filter(([chave]) => !['evento','missao'].includes(chave)).map(([chave, nome]) => <option key={chave} value={chave}>{nome}</option>)}</select>
      <input required type="datetime-local" value={novo.inicio_em} onChange={(e) => setNovo({ ...novo, inicio_em: e.target.value })} />
      <input type="datetime-local" value={novo.fim_em} onChange={(e) => setNovo({ ...novo, fim_em: e.target.value })} />
      <input placeholder="Local" value={novo.local_nome} onChange={(e) => setNovo({ ...novo, local_nome: e.target.value })} />
      <textarea rows="3" maxLength="500" placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
      <button type="submit">Salvar na agenda</button>
    </form>}

    <div className="rotina-layout">
      <section className="rotina-calendario">
        <header><button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button><h2>{mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2><button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button></header>
        <div className="rotina-semana"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div>
        <div className="rotina-dias">{dias.map((dia) => { const lista = porDia[chaveDia(dia)] || []; const fora = dia.getMonth() !== mes.getMonth(); return <article key={dia.toISOString()} className={fora ? 'fora' : ''}><strong>{dia.getDate()}</strong>{lista.slice(0, 3).map((item) => <button key={`${item.origem}-${item.id}`} className={`tipo-${item.tipo} ${item.concluido ? 'concluido' : ''}`} onClick={() => alternarConcluido(item)} title={item.titulo}>{item.titulo}</button>)}{lista.length > 3 && <small>+{lista.length - 3}</small>}</article> })}</div>
      </section>

      <aside className="rotina-proximos"><h2>Próximos</h2>{carregando ? <p>Carregando agenda...</p> : proximos.length === 0 ? <p>Nenhum compromisso próximo.</p> : proximos.map((item) => <article key={`${item.origem}-${item.id}`}><span>{TIPOS[item.tipo] || item.tipo}</span><h3>{item.titulo}</h3><time>{new Date(item.inicio_em).toLocaleString('pt-BR')}</time>{item.local_nome && <small>{item.local_nome}</small>}{item.descricao && <p>{item.descricao}</p>}<div>{item.origem === 'rotina' && <><button onClick={() => alternarConcluido(item)}>{item.concluido ? 'Reabrir' : 'Concluir'}</button><button onClick={() => excluir(item)}>Excluir</button></>}{item.origem === 'evento' && <button onClick={onAbrirEventos}>Abrir eventos</button>}{item.origem === 'missao' && <button onClick={onAbrirMissoes}>Abrir missão</button>}</div></article>)}</aside>
    </div>

    <section className="rotina-atalhos"><button onClick={onAbrirAulas}>Sistema Acadêmico</button><button onClick={onAbrirEventos}>Eventos</button><button onClick={onAbrirMissoes}>Missões</button></section>
    {mensagem && <p className="rotina-mensagem">{mensagem}</p>}
  </main>
}