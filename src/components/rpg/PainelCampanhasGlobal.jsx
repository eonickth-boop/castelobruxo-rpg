import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-campanhas.css'

export default function PainelCampanhasGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberto, setAberto] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [campanhas, setCampanhas] = useState([])
  const [vinculo, setVinculo] = useState(null)
  const [capitulos, setCapitulos] = useState([])
  const [eventosNarrativos, setEventosNarrativos] = useState([])
  const [eventosOficiais, setEventosOficiais] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)
  const [novaCampanha, setNovaCampanha] = useState({ titulo: '', sinopse: '', evento_oficial_id: '' })
  const [novoVinculo, setNovoVinculo] = useState({ campanha_id: '', capitulo: 1, titulo_capitulo: '', ordem: 1 })
  const [novoEvento, setNovoEvento] = useState({ titulo: '', descricao: '', tipo: 'acontecimento', status: 'ativo' })
  const [consequencias, setConsequencias] = useState({})

  useEffect(() => {
    const verificarUrl = () => setCenaId(new URLSearchParams(window.location.search).get('cena') || '')
    verificarUrl()
    const intervalo = window.setInterval(verificarUrl, 700)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!cenaId) { setAberto(false); setCena(null); return undefined }
    carregarTudo()
    const intervalo = window.setInterval(carregarTudo, 10000)
    return () => window.clearInterval(intervalo)
  }, [cenaId])

  async function carregarTudo() {
    const { data: dadosSessao } = await supabase.auth.getSession()
    const novaSessao = dadosSessao.session
    if (!novaSessao?.user || !cenaId) return
    setSessao(novaSessao)

    const [resCena, resCampanhas, resVinculo, resEventos, resOficiais] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('rpg_campanhas').select('*').order('criado_em', { ascending: false }),
      supabase.from('rpg_campanha_cenas').select('*, rpg_campanhas(*)').eq('cena_id', cenaId).maybeSingle(),
      supabase.from('rpg_eventos_narrativos').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
      supabase.from('eventos').select('id,titulo,descricao,inicio_em,fim_em,ativo').eq('ativo', true).order('inicio_em', { ascending: false }),
    ])

    if (!resCena.data) return
    setCena(resCena.data)
    setCampanhas(resCampanhas.data || [])
    setVinculo(resVinculo.data || null)
    setEventosNarrativos(resEventos.data || [])
    setEventosOficiais(resOficiais.data || [])

    if (resVinculo.data?.campanha_id) {
      const { data } = await supabase.from('rpg_campanha_cenas')
        .select('*, rpg_cenas(id,titulo,local_nome,status,criado_em)')
        .eq('campanha_id', resVinculo.data.campanha_id)
        .order('capitulo').order('ordem')
      setCapitulos(data || [])
    } else setCapitulos([])
  }

  const podeNarrar = cena?.criador_id === sessao?.user?.id
  const campanhaAtual = vinculo?.rpg_campanhas || campanhas.find((item) => item.id === vinculo?.campanha_id)
  const ativos = useMemo(() => eventosNarrativos.filter((item) => item.status === 'ativo'), [eventosNarrativos])

  async function criarCampanha(evento) {
    evento.preventDefault(); setProcessando(true); setMensagem('')
    const { data, error } = await supabase.rpc('rpg_criar_campanha', {
      p_titulo: novaCampanha.titulo.trim(), p_sinopse: novaCampanha.sinopse.trim(), p_evento_oficial_id: novaCampanha.evento_oficial_id || null,
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível criar a campanha.'); return }
    setNovaCampanha({ titulo: '', sinopse: '', evento_oficial_id: '' })
    setNovoVinculo((atual) => ({ ...atual, campanha_id: data }))
    setMensagem('Campanha criada. Agora vincule esta cena como capítulo.')
    await carregarTudo()
  }

  async function vincularCena(evento) {
    evento.preventDefault(); setProcessando(true); setMensagem('')
    const { error } = await supabase.rpc('rpg_vincular_cena_campanha', {
      p_cena_id: cenaId, p_campanha_id: novoVinculo.campanha_id, p_capitulo: Number(novoVinculo.capitulo),
      p_titulo_capitulo: novoVinculo.titulo_capitulo.trim(), p_ordem: Number(novoVinculo.ordem),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível vincular a cena.'); return }
    setMensagem('Cena vinculada à campanha.')
    await carregarTudo()
  }

  async function criarEventoNarrativo(evento) {
    evento.preventDefault(); setProcessando(true); setMensagem('')
    const { error } = await supabase.rpc('rpg_criar_evento_narrativo', {
      p_cena_id: cenaId, p_titulo: novoEvento.titulo.trim(), p_descricao: novoEvento.descricao.trim(), p_tipo: novoEvento.tipo, p_status: novoEvento.status,
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível criar o evento narrativo.'); return }
    setNovoEvento({ titulo: '', descricao: '', tipo: 'acontecimento', status: 'ativo' })
    setMensagem('Evento narrativo criado.')
    await carregarTudo()
  }

  async function atualizarEvento(item, status) {
    const { error } = await supabase.rpc('rpg_atualizar_evento_narrativo', {
      p_evento_id: item.id, p_status: status, p_consequencia: (consequencias[item.id] || '').trim(),
    })
    if (error) { setMensagem(error.message || 'Não foi possível atualizar o evento.'); return }
    await carregarTudo()
  }

  async function atualizarCampanha(status) {
    const { error } = await supabase.rpc('rpg_atualizar_campanha_status', { p_campanha_id: campanhaAtual.id, p_status: status })
    if (error) { setMensagem(error.message || 'Não foi possível atualizar a campanha.'); return }
    await carregarTudo()
  }

  if (!cenaId || !cena || !sessao) return null

  return <div className="rpg-campanhas-global">
    <button className="rpg-campanhas-atalho" onClick={() => setAberto((v) => !v)}>📜 Campanha {ativos.length > 0 && <strong>{ativos.length}</strong>}</button>
    {aberto && <button className="rpg-campanhas-overlay" aria-label="Fechar painel" onClick={() => setAberto(false)} />}
    <aside className={`rpg-campanhas-painel ${aberto ? 'aberto' : ''}`}>
      <header><div><small>Histórias conectadas</small><h2>Campanhas e eventos</h2></div><button onClick={() => setAberto(false)}>×</button></header>

      {campanhaAtual ? <section className="rpg-campanha-atual">
        <small>Campanha atual · {campanhaAtual.status}</small><h3>{campanhaAtual.titulo}</h3><p>{campanhaAtual.sinopse || 'Sem sinopse.'}</p>
        <div className="rpg-capitulo-atual"><strong>Capítulo {vinculo.capitulo}</strong><span>{vinculo.titulo_capitulo || cena.titulo}</span></div>
        {podeNarrar && <div className="rpg-acoes-campanha">
          {campanhaAtual.status !== 'ativa' && <button onClick={() => atualizarCampanha('ativa')}>Ativar</button>}
          {campanhaAtual.status === 'ativa' && <button onClick={() => atualizarCampanha('pausada')}>Pausar</button>}
          {campanhaAtual.status !== 'concluida' && <button onClick={() => atualizarCampanha('concluida')}>Concluir campanha</button>}
        </div>}
      </section> : <section className="rpg-sem-campanha"><h3>Cena independente</h3><p>Esta cena ainda não pertence a uma campanha.</p></section>}

      {capitulos.length > 0 && <section><h3>Capítulos</h3><div className="rpg-lista-capitulos">{capitulos.map((item) => <article key={item.id}><strong>Cap. {item.capitulo}</strong><div><span>{item.titulo_capitulo || item.rpg_cenas?.titulo}</span><small>{item.rpg_cenas?.local_nome} · {item.rpg_cenas?.status}</small></div></article>)}</div></section>}

      <section><h3>Eventos narrativos</h3>{eventosNarrativos.length === 0 ? <p>Nenhum acontecimento registrado.</p> : <div className="rpg-lista-eventos-narrativos">{eventosNarrativos.map((item) => <article key={item.id} className={`status-${item.status}`}><div><small>{item.tipo} · {item.status}</small><strong>{item.titulo}</strong><p>{item.descricao}</p>{item.consequencia && <blockquote>{item.consequencia}</blockquote>}</div>{podeNarrar && item.status !== 'resolvido' && item.status !== 'cancelado' && <div><textarea rows="2" placeholder="Consequência opcional" value={consequencias[item.id] || ''} onChange={(e) => setConsequencias({ ...consequencias, [item.id]: e.target.value })} /><button onClick={() => atualizarEvento(item, 'resolvido')}>Resolver</button><button className="secundario" onClick={() => atualizarEvento(item, 'cancelado')}>Cancelar</button></div>}</article>)}</div>}</section>

      {podeNarrar && <>
        <section><h3>Novo evento narrativo</h3><form onSubmit={criarEventoNarrativo}>
          <input required minLength="3" maxLength="120" placeholder="Título do acontecimento" value={novoEvento.titulo} onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })} />
          <textarea rows="4" maxLength="3000" placeholder="O que acontece na história?" value={novoEvento.descricao} onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })} />
          <div><select value={novoEvento.tipo} onChange={(e) => setNovoEvento({ ...novoEvento, tipo: e.target.value })}><option value="acontecimento">Acontecimento</option><option value="pista">Pista</option><option value="perigo">Perigo</option><option value="mudanca">Mudança</option><option value="objetivo">Objetivo</option><option value="consequencia">Consequência</option></select><select value={novoEvento.status} onChange={(e) => setNovoEvento({ ...novoEvento, status: e.target.value })}><option value="ativo">Publicar agora</option><option value="planejado">Guardar como planejado</option></select></div>
          <button disabled={processando}>Criar evento</button>
        </form></section>

        {!campanhaAtual && <section><h3>Vincular a campanha</h3><form onSubmit={vincularCena}>
          <select required value={novoVinculo.campanha_id} onChange={(e) => setNovoVinculo({ ...novoVinculo, campanha_id: e.target.value })}><option value="">Selecione uma campanha</option>{campanhas.filter((item) => item.criador_id === sessao.user.id).map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select>
          <div><input type="number" min="1" value={novoVinculo.capitulo} onChange={(e) => setNovoVinculo({ ...novoVinculo, capitulo: e.target.value })} /><input type="number" min="1" value={novoVinculo.ordem} onChange={(e) => setNovoVinculo({ ...novoVinculo, ordem: e.target.value })} /></div>
          <input maxLength="160" placeholder="Título do capítulo" value={novoVinculo.titulo_capitulo} onChange={(e) => setNovoVinculo({ ...novoVinculo, titulo_capitulo: e.target.value })} />
          <button disabled={processando || !novoVinculo.campanha_id}>Vincular esta cena</button>
        </form></section>}

        <section><h3>Criar campanha</h3><form onSubmit={criarCampanha}>
          <input required minLength="3" maxLength="120" placeholder="Nome da campanha" value={novaCampanha.titulo} onChange={(e) => setNovaCampanha({ ...novaCampanha, titulo: e.target.value })} />
          <textarea rows="4" maxLength="3000" placeholder="Sinopse geral" value={novaCampanha.sinopse} onChange={(e) => setNovaCampanha({ ...novaCampanha, sinopse: e.target.value })} />
          <select value={novaCampanha.evento_oficial_id} onChange={(e) => setNovaCampanha({ ...novaCampanha, evento_oficial_id: e.target.value })}><option value="">Sem evento oficial vinculado</option>{eventosOficiais.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select>
          <button disabled={processando}>Criar campanha</button>
        </form></section>
      </>}

      {mensagem && <p className="rpg-campanhas-mensagem">{mensagem}</p>}
    </aside>
  </div>
}