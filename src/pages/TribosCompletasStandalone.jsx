import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/tribos-completas.css'

export default function TribosCompletasStandalone() {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [tribos, setTribos] = useState([])
  const [ranking, setRanking] = useState([])
  const [membros, setMembros] = useState([])
  const [pontos, setPontos] = useState([])
  const [mural, setMural] = useState([])
  const [selecionada, setSelecionada] = useState('araye')
  const [aba, setAba] = useState('visao')
  const [novoRecado, setNovoRecado] = useState('')
  const [gestao, setGestao] = useState({ pontos: 10, motivo: '' })
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { iniciar() }, [])

  async function iniciar() {
    setCarregando(true)
    const { data: dadosSessao } = await supabase.auth.getSession()
    const novaSessao = dadosSessao.session
    setSessao(novaSessao)
    if (!novaSessao?.user) { setCarregando(false); return }

    const [resPerfil, resTribos, resRanking, resMembros, resPontos, resMural] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', novaSessao.user.id).single(),
      supabase.from('tribos_catalogo').select('*').eq('ativo', true).order('nome'),
      supabase.rpc('tribos_ranking'),
      supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,tribo,nivel,cargo').eq('ativo', true),
      supabase.from('tribos_pontos').select('*').order('criado_em', { ascending: false }).limit(100),
      supabase.from('tribos_mural').select('*,perfis(usuario,nome_personagem,avatar_url,cargo)').order('fixado', { ascending: false }).order('criado_em', { ascending: false }).limit(100),
    ])

    setPerfil(resPerfil.data)
    setTribos(resTribos.data || [])
    setRanking(resRanking.data || [])
    setMembros(resMembros.data || [])
    setPontos(resPontos.data || [])
    setMural(resMural.data || [])

    const propria = (resTribos.data || []).find((t) => normalizar(t.nome) === normalizar(resPerfil.data?.tribo))
    if (propria) setSelecionada(propria.codigo)
    setCarregando(false)
  }

  function normalizar(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  }

  const tribo = useMemo(() => tribos.find((t) => t.codigo === selecionada) || tribos[0], [tribos, selecionada])
  const membrosDaTribo = useMemo(() => membros.filter((m) => normalizar(m.tribo) === normalizar(tribo?.nome)).sort((a,b) => (b.nivel || 1) - (a.nivel || 1)), [membros, tribo])
  const pontosDaTribo = useMemo(() => pontos.filter((p) => p.tribo_codigo === tribo?.codigo), [pontos, tribo])
  const muralDaTribo = useMemo(() => mural.filter((p) => p.tribo_codigo === tribo?.codigo), [mural, tribo])
  const rankingAtual = ranking.find((r) => r.codigo === tribo?.codigo)
  const pertence = normalizar(perfil?.tribo) === normalizar(tribo?.nome)
  const podeGerir = ['professor', 'administrador'].includes(perfil?.cargo)

  async function publicarRecado(evento) {
    evento.preventDefault()
    const texto = novoRecado.trim()
    if (!texto || !pertence) return
    const { error } = await supabase.from('tribos_mural').insert({ tribo_codigo: tribo.codigo, autor_id: perfil.id, conteudo: texto })
    if (error) { setMensagem(error.message || 'Não foi possível publicar.'); return }
    setNovoRecado(''); setMensagem('Recado publicado.'); await iniciar()
  }

  async function registrarPontos(evento) {
    evento.preventDefault()
    const valor = Number(gestao.pontos)
    if (!Number.isFinite(valor) || !gestao.motivo.trim()) return
    const { error } = await supabase.rpc('tribo_registrar_pontos', {
      p_tribo_codigo: tribo.codigo,
      p_pontos: valor,
      p_motivo: gestao.motivo.trim(),
      p_origem: 'manual',
      p_referencia_id: null,
    })
    if (error) { setMensagem(error.message || 'Não foi possível registrar pontos.'); return }
    setGestao({ pontos: 10, motivo: '' }); setMensagem('Pontuação registrada.'); await iniciar()
  }

  if (carregando) return <main className="tribos-shell"><p>Preparando o Conselho das Tribos...</p></main>
  if (!sessao) return <main className="tribos-shell tribos-central"><h1>Tribos de Castelobruxo</h1><p>Entre na sua conta para acessar.</p><button onClick={() => { window.location.href = '/' }}>Ir para o portal</button></main>
  if (!tribo) return <main className="tribos-shell"><p>As tribos ainda não foram configuradas.</p></main>

  return <main className="tribos-shell" style={{ '--tribo-cor': tribo.cor_hex }}>
    <header className="tribos-topo">
      <button onClick={() => { window.location.href = '/' }}>← Portal</button>
      <div><small>Conselho das Tribos</small><h1>Tribos de Castelobruxo</h1><p>História, membros, pontuação e vida coletiva das cinco tradições da escola.</p></div>
      <div className="tribos-minha"><span>Minha tribo</span><strong>{perfil?.tribo || 'Não definida'}</strong></div>
    </header>

    <section className="tribos-ranking">
      {ranking.map((item) => <button key={item.codigo} className={selecionada === item.codigo ? 'ativo' : ''} onClick={() => { setSelecionada(item.codigo); setAba('visao') }} style={{ '--cor': item.cor_hex }}>
        <span className="posicao">#{item.posicao}</span>
        <img src={item.icone_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div><strong>{item.nome}</strong><small>{item.membros} membros</small></div>
        <b>{item.pontos} pts</b>
      </button>)}
    </section>

    <section className="tribo-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,10,8,.94), rgba(5,10,8,.55), rgba(5,10,8,.18)), url('${tribo.banner_url}')` }}>
      <img className="tribo-brasao" src={tribo.brasao_url} alt={`Brasão da tribo ${tribo.nome}`} />
      <div><small>{tribo.significado}</small><h2>{tribo.nome}</h2><p>“{tribo.lema}”</p><div className="tribo-chips"><span>{tribo.elemento}</span><span>{tribo.animal}</span><span>{tribo.cor_nome}</span></div></div>
      <aside><span>Posição</span><strong>#{rankingAtual?.posicao || '—'}</strong><small>{rankingAtual?.pontos || 0} pontos</small></aside>
    </section>

    <nav className="tribos-abas">
      {[['visao','Visão geral'],['membros','Membros'],['pontos','Pontuação'],['mural','Mural'],['gestao','Gestão']].filter(([id]) => id !== 'gestao' || podeGerir).map(([id, rotulo]) => <button key={id} className={aba === id ? 'ativo' : ''} onClick={() => setAba(id)}>{rotulo}</button>)}
    </nav>

    {aba === 'visao' && <section className="tribo-conteudo tribo-visao" style={{ backgroundImage: `linear-gradient(rgba(8,12,10,.88), rgba(8,12,10,.96)), url('${tribo.fundo_url}')` }}>
      <article className="tribo-historia"><small>Origem</small><h3>{tribo.fundador}</h3><p>{tribo.historia}</p></article>
      <div className="tribo-grade-info">
        <article><span>Inspiração</span><strong>{tribo.inspiracao}</strong></article>
        <article><span>Brasão</span><strong>{tribo.brasao_descricao}</strong></article>
        <article><span>Símbolo</span><strong>{tribo.simbolo_descricao}</strong></article>
        <article><span>Uniforme</span><strong>{tribo.uniforme}</strong></article>
        <article><span>Salão</span><strong>{tribo.salao}</strong></article>
        <article><span>Dormitório</span><strong>{tribo.dormitorio}</strong></article>
      </div>
      <div className="tribo-duas-colunas"><article><h3>Valores</h3>{tribo.valores.map((v) => <span key={v}>✦ {v}</span>)}</article><article><h3>Sombras a superar</h3>{tribo.defeitos.map((v) => <span key={v}>◇ {v}</span>)}</article></div>
      <article className="tribo-ritual"><img src={tribo.simbolo_url} alt="" /><div><small>Ritual da tribo</small><h3>{tribo.nome}</h3><p>{tribo.ritual}</p></div></article>
    </section>}

    {aba === 'membros' && <section className="tribo-conteudo"><header className="secao-titulo"><div><small>Comunidade</small><h3>{membrosDaTribo.length} integrantes</h3></div></header><div className="membros-grade">{membrosDaTribo.map((m) => <article key={m.id}>{m.avatar_url ? <img src={m.avatar_url} alt="" /> : <span>{(m.nome_personagem || m.usuario || '?')[0]}</span>}<div><strong>{m.nome_personagem || m.usuario}</strong><small>@{m.usuario} · nível {m.nivel || 1}</small></div>{m.cargo !== 'aluno' && <b>{m.cargo}</b>}</article>)}</div></section>}

    {aba === 'pontos' && <section className="tribo-conteudo"><header className="secao-titulo"><div><small>Histórico</small><h3>{rankingAtual?.pontos || 0} pontos acumulados</h3></div></header><div className="pontos-lista">{pontosDaTribo.length === 0 ? <p>Nenhum registro de pontuação ainda.</p> : pontosDaTribo.map((p) => <article key={p.id} className={p.pontos >= 0 ? 'positivo' : 'negativo'}><strong>{p.pontos >= 0 ? '+' : ''}{p.pontos}</strong><div><h4>{p.motivo}</h4><small>{p.origem} · {new Date(p.criado_em).toLocaleString('pt-BR')}</small></div></article>)}</div></section>}

    {aba === 'mural' && <section className="tribo-conteudo"><header className="secao-titulo"><div><small>Vozes da tribo</small><h3>Mural de {tribo.nome}</h3></div></header>{pertence && <form className="mural-form" onSubmit={publicarRecado}><textarea rows={4} maxLength={1200} value={novoRecado} onChange={(e) => setNovoRecado(e.target.value)} placeholder="Compartilhe um recado com sua tribo..." /><button>Publicar recado</button></form>}<div className="mural-lista">{muralDaTribo.length === 0 ? <p>O mural ainda está vazio.</p> : muralDaTribo.map((post) => <article key={post.id}><div>{post.perfis?.avatar_url ? <img src={post.perfis.avatar_url} alt="" /> : <span>{(post.perfis?.nome_personagem || post.perfis?.usuario || '?')[0]}</span>}</div><section><header><strong>{post.perfis?.nome_personagem || post.perfis?.usuario}</strong><time>{new Date(post.criado_em).toLocaleString('pt-BR')}</time></header><p>{post.conteudo}</p></section></article>)}</div></section>}

    {aba === 'gestao' && podeGerir && <section className="tribo-conteudo"><header className="secao-titulo"><div><small>Painel autorizado</small><h3>Gerenciar pontuação</h3></div></header><form className="gestao-form" onSubmit={registrarPontos}><label>Pontos<input type="number" min="-100000" max="100000" required value={gestao.pontos} onChange={(e) => setGestao({ ...gestao, pontos: e.target.value })} /></label><label>Motivo<input minLength="2" maxLength="240" required value={gestao.motivo} onChange={(e) => setGestao({ ...gestao, motivo: e.target.value })} placeholder="Ex.: Vitória no Torneio de Poções" /></label><button>Registrar alteração</button></form></section>}

    {mensagem && <p className="tribos-mensagem" role="status">{mensagem}</p>}
  </main>
}
