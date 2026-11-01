import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/painel-aluno-vivo.css'

function dataCurta(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function PainelAlunoVivo({ perfil, saldo = 0, navegar }) {
  const [dados, setDados] = useState({
    convites: [], cenas: [], missoes: [], recompensas: [], eventos: [], avisos: [],
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      const usuarioId = perfil.id

      const resultados = await Promise.allSettled([
        supabase.from('rpg_convites')
          .select('id,cena_id,status,mensagem,criado_em,rpg_cenas(id,titulo,local_nome,status)')
          .eq('convidado_id', usuarioId).eq('status', 'pendente')
          .order('criado_em', { ascending: false }).limit(4),
        supabase.from('rpg_participantes')
          .select('cena_id,papel,entrou_em,rpg_cenas(id,titulo,local_nome,status,atualizado_em)')
          .eq('usuario_id', usuarioId).order('entrou_em', { ascending: false }).limit(8),
        supabase.from('missoes_usuarios')
          .select('id,status,progresso,atualizado_em,missoes(id,titulo,meta,icone,prazo_em)')
          .eq('usuario_id', usuarioId).eq('status', 'ativa')
          .order('atualizado_em', { ascending: false }).limit(4),
        supabase.from('rpg_recompensas')
          .select('id,xp,ipes,item_codigo,quantidade_item,descricao,criado_em,rpg_cenas(titulo)')
          .eq('usuario_id', usuarioId).order('criado_em', { ascending: false }).limit(3),
        supabase.from('eventos').select('id,titulo,icone,inicio_em,fim_em,local_evento')
          .eq('ativo', true).gte('fim_em', new Date().toISOString())
          .order('inicio_em', { ascending: true }).limit(3),
        supabase.from('avisos_escola').select('*').order('criado_em', { ascending: false }).limit(3),
      ])

      if (!ativo) return
      const valor = (indice) => resultados[indice].status === 'fulfilled'
        ? (resultados[indice].value.data || []) : []

      const cenasUnicas = []
      const vistos = new Set()
      for (const item of valor(1)) {
        const cena = item.rpg_cenas
        if (!cena || cena.status === 'encerrada' || vistos.has(cena.id)) continue
        vistos.add(cena.id)
        cenasUnicas.push(cena)
      }

      setDados({
        convites: valor(0), cenas: cenasUnicas.slice(0, 4), missoes: valor(2),
        recompensas: valor(3), eventos: valor(4), avisos: valor(5),
      })
      setCarregando(false)
    }

    carregar()
    const intervalo = window.setInterval(carregar, 60000)
    return () => { ativo = false; window.clearInterval(intervalo) }
  }, [perfil.id])

  const prioridade = useMemo(() => {
    if (dados.convites.length) return { titulo: 'Você recebeu um convite', texto: dados.convites[0].rpg_cenas?.titulo || 'Cena privada', acao: 'Ver convite', executar: () => { window.location.href = '/rpg' } }
    if (dados.cenas.length) return { titulo: 'Continue sua história', texto: dados.cenas[0].titulo, acao: 'Voltar à cena', executar: () => { window.location.href = `/rpg?cena=${dados.cenas[0].id}` } }
    if (dados.missoes.length) return { titulo: 'Missão em andamento', texto: dados.missoes[0].missoes?.titulo || 'Objetivo ativo', acao: 'Ver missões', executar: () => navegar('missoes') }
    return { titulo: 'Seu próximo passo', texto: 'Explore o mapa e encontre uma nova história.', acao: 'Abrir mapa', executar: () => navegar('mapa-interativo') }
  }, [dados, navegar])

  const xp = Number(perfil.xp || 0)
  const nivel = Number(perfil.nivel || 1)
  const xpMeta = Math.max(100, nivel * 100)
  const xpProgresso = Math.min(100, Math.round((xp % xpMeta) / xpMeta * 100))

  return (
    <section className="pav-shell" aria-label="Painel vivo do aluno">
      <header className="pav-topo">
        <div><small>Visão do dia</small><h2>Seu mundo agora</h2></div>
        <button type="button" onClick={() => { window.location.href = '/rpg' }}>Abrir RPG textual</button>
      </header>

      <div className="pav-resumo">
        <article><small>Nível</small><strong>{nivel}</strong><span>{xp} XP</span></article>
        <article><small>Saldo</small><strong>{Number(saldo || 0)}</strong><span>Ipês</span></article>
        <article><small>Missões</small><strong>{dados.missoes.length}</strong><span>ativas</span></article>
        <article><small>Convites</small><strong>{dados.convites.length}</strong><span>pendentes</span></article>
      </div>

      <div className="pav-xp"><div><span>Progresso de experiência</span><strong>{xpProgresso}%</strong></div><i><b style={{ width: `${xpProgresso}%` }} /></i></div>

      <article className="pav-prioridade">
        <div><small>Recomendado agora</small><h3>{prioridade.titulo}</h3><p>{prioridade.texto}</p></div>
        <button type="button" onClick={prioridade.executar}>{prioridade.acao}</button>
      </article>

      <div className="pav-grade">
        <section className="pav-card">
          <header><div><small>Interpretação</small><h3>Cenas em andamento</h3></div><button onClick={() => { window.location.href = '/rpg' }}>Ver todas</button></header>
          {carregando ? <p>Atualizando...</p> : dados.cenas.length ? dados.cenas.map((cena) => <button className="pav-linha" key={cena.id} onClick={() => { window.location.href = `/rpg?cena=${cena.id}` }}><span><strong>{cena.titulo}</strong><small>{cena.local_nome}</small></span><b>Continuar</b></button>) : <p>Nenhuma cena aberta no momento.</p>}
        </section>

        <section className="pav-card">
          <header><div><small>Objetivos</small><h3>Missões ativas</h3></div><button onClick={() => navegar('missoes')}>Ver missões</button></header>
          {dados.missoes.length ? dados.missoes.map((registro) => { const missao = registro.missoes || {}; const meta = Math.max(1, Number(missao.meta || 1)); const progresso = Math.min(100, Math.round(Number(registro.progresso || 0) / meta * 100)); return <article className="pav-missao" key={registro.id}><div><strong>{missao.icone || '✦'} {missao.titulo || 'Missão'}</strong><small>{registro.progresso || 0} de {meta}</small></div><i><b style={{ width: `${progresso}%` }} /></i></article> }) : <p>Nenhuma missão ativa.</p>}
        </section>

        <section className="pav-card">
          <header><div><small>Calendário</small><h3>Próximos eventos</h3></div><button onClick={() => navegar('eventos')}>Ver agenda</button></header>
          {dados.eventos.length ? dados.eventos.map((evento) => <article className="pav-evento" key={evento.id}><span>{evento.icone || '✦'}</span><div><strong>{evento.titulo}</strong><small>{dataCurta(evento.inicio_em)} · {evento.local_evento || 'Castelobruxo'}</small></div></article>) : <p>Nenhum evento próximo anunciado.</p>}
        </section>

        <section className="pav-card">
          <header><div><small>Histórico recente</small><h3>Últimas recompensas</h3></div></header>
          {dados.recompensas.length ? dados.recompensas.map((item) => <article className="pav-recompensa" key={item.id}><strong>{item.rpg_cenas?.titulo || 'Cena concluída'}</strong><small>{item.xp ? `+${item.xp} XP ` : ''}{item.ipes ? `+${item.ipes} Ipês ` : ''}{item.item_codigo ? `· ${item.quantidade_item || 1}x ${item.item_codigo}` : ''}</small></article>) : <p>Suas próximas conquistas aparecerão aqui.</p>}
        </section>
      </div>
    </section>
  )
}
