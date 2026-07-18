import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-npcs.css'

const npcVazio = { nome: '', titulo: '', descricao: '', avatar_url: '', categoria: 'personagem' }

export default function PainelNpcsGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberto, setAberto] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [npcs, setNpcs] = useState([])
  const [postagens, setPostagens] = useState([])
  const [novoNpc, setNovoNpc] = useState(npcVazio)
  const [selecionadoId, setSelecionadoId] = useState('')
  const [tipo, setTipo] = useState('fala')
  const [conteudo, setConteudo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const verificar = () => setCenaId(new URLSearchParams(window.location.search).get('cena') || '')
    verificar()
    const intervalo = window.setInterval(verificar, 700)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!cenaId) { setAberto(false); setCena(null); return undefined }
    carregar()
    const intervalo = window.setInterval(carregar, 8000)
    return () => window.clearInterval(intervalo)
  }, [cenaId])

  async function carregar() {
    const { data: dadosSessao } = await supabase.auth.getSession()
    const novaSessao = dadosSessao.session
    if (!novaSessao?.user || !cenaId) return
    setSessao(novaSessao)

    const [resCena, resNpcs, resPosts] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('rpg_npcs').select('*').eq('cena_id', cenaId).order('criado_em'),
      supabase.from('rpg_npc_postagens').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
    ])
    if (resCena.error || !resCena.data) return
    setCena(resCena.data)
    setNpcs(resNpcs.data || [])
    setPostagens(resPosts.data || [])
    if (!selecionadoId && resNpcs.data?.length) setSelecionadoId(resNpcs.data.find((npc) => npc.ativo)?.id || '')
  }

  const podeNarrar = cena?.criador_id === sessao?.user?.id
  const selecionado = useMemo(() => npcs.find((npc) => npc.id === selecionadoId), [npcs, selecionadoId])
  const nomeNpc = (id) => npcs.find((npc) => npc.id === id)?.nome || 'NPC'

  async function criarNpc(evento) {
    evento.preventDefault()
    setMensagem('')
    setProcessando(true)
    const { data, error } = await supabase.rpc('rpg_criar_npc', {
      p_cena_id: cenaId,
      p_nome: novoNpc.nome,
      p_titulo: novoNpc.titulo,
      p_descricao: novoNpc.descricao,
      p_avatar_url: novoNpc.avatar_url,
      p_categoria: novoNpc.categoria,
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível criar o NPC.'); return }
    setNovoNpc(npcVazio)
    setSelecionadoId(data)
    setMensagem('NPC adicionado à cena.')
    await carregar()
  }

  async function publicar(evento) {
    evento.preventDefault()
    if (!selecionadoId || !conteudo.trim()) return
    setMensagem('')
    setProcessando(true)
    const { error } = await supabase.rpc('rpg_publicar_como_npc', {
      p_npc_id: selecionadoId,
      p_tipo: tipo,
      p_conteudo: conteudo.trim(),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível publicar como NPC.'); return }
    setConteudo('')
    setMensagem(`Turno de ${selecionado?.nome || 'NPC'} publicado.`)
    await carregar()
    window.dispatchEvent(new CustomEvent('castelobruxo:rpg-atualizar-cena'))
  }

  async function alternarNpc(npc) {
    const acao = npc.ativo ? 'retirar' : 'reativar'
    if (!window.confirm(`Deseja ${acao} ${npc.nome} nesta cena?`)) return
    const { error } = await supabase.rpc('rpg_atualizar_npc', {
      p_npc_id: npc.id,
      p_nome: npc.nome,
      p_titulo: npc.titulo || '',
      p_descricao: npc.descricao || '',
      p_avatar_url: npc.avatar_url || '',
      p_categoria: npc.categoria || 'personagem',
      p_ativo: !npc.ativo,
    })
    if (error) { setMensagem(error.message || 'Não foi possível atualizar o NPC.'); return }
    await carregar()
  }

  if (!cenaId || !cena || !sessao || !podeNarrar) return null

  return (
    <div className="rpg-npcs-global">
      <button type="button" className="rpg-npcs-atalho" onClick={() => setAberto((valor) => !valor)}>🎭 NPCs</button>
      {aberto && <button className="rpg-npcs-overlay" aria-label="Fechar painel" onClick={() => setAberto(false)} />}
      <aside className={`rpg-npcs-painel ${aberto ? 'aberto' : ''}`}>
        <header><div><small>Ferramentas do narrador</small><h2>NPCs da cena</h2></div><button onClick={() => setAberto(false)}>×</button></header>

        <section className="rpg-npcs-lista">
          <h3>Personagens ativos</h3>
          {npcs.length === 0 ? <p>Nenhum NPC criado ainda.</p> : npcs.map((npc) => (
            <article key={npc.id} className={!npc.ativo ? 'inativo' : ''}>
              <div className="rpg-npc-avatar">{npc.avatar_url ? <img src={npc.avatar_url} alt={npc.nome} /> : <span>{npc.nome.slice(0, 1).toUpperCase()}</span>}</div>
              <div><strong>{npc.nome}</strong><small>{npc.titulo || npc.categoria}</small><p>{npc.descricao || 'Sem descrição.'}</p></div>
              <div><button className={selecionadoId === npc.id ? '' : 'rpg-secundario'} disabled={!npc.ativo} onClick={() => setSelecionadoId(npc.id)}>Controlar</button><button className="rpg-secundario" onClick={() => alternarNpc(npc)}>{npc.ativo ? 'Retirar' : 'Reativar'}</button></div>
            </article>
          ))}
        </section>

        <section className="rpg-npc-publicar">
          <h3>Publicar como NPC</h3>
          <form onSubmit={publicar}>
            <label>NPC<select value={selecionadoId} onChange={(e) => setSelecionadoId(e.target.value)} required><option value="">Selecione</option>{npcs.filter((npc) => npc.ativo).map((npc) => <option key={npc.id} value={npc.id}>{npc.nome}</option>)}</select></label>
            <label>Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="fala">Fala</option><option value="acao">Ação</option><option value="pensamento">Pensamento</option><option value="narracao">Narração</option></select></label>
            <label>Turno<textarea rows="5" maxLength="5000" value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Escreva a fala ou ação do NPC..." /></label>
            <button disabled={processando || !selecionadoId || !conteudo.trim()} type="submit">Publicar como {selecionado?.nome || 'NPC'}</button>
          </form>
        </section>

        <section className="rpg-npc-criar">
          <h3>Criar NPC</h3>
          <form onSubmit={criarNpc}>
            <input required minLength="2" maxLength="80" placeholder="Nome" value={novoNpc.nome} onChange={(e) => setNovoNpc({ ...novoNpc, nome: e.target.value })} />
            <input maxLength="120" placeholder="Título ou função" value={novoNpc.titulo} onChange={(e) => setNovoNpc({ ...novoNpc, titulo: e.target.value })} />
            <select value={novoNpc.categoria} onChange={(e) => setNovoNpc({ ...novoNpc, categoria: e.target.value })}><option value="personagem">Personagem</option><option value="professor">Professor</option><option value="criatura">Criatura</option><option value="espirito">Espírito</option><option value="inimigo">Inimigo</option><option value="aliado">Aliado</option></select>
            <input placeholder="URL do avatar (opcional)" value={novoNpc.avatar_url} onChange={(e) => setNovoNpc({ ...novoNpc, avatar_url: e.target.value })} />
            <textarea rows="3" maxLength="1000" placeholder="Descrição, aparência e personalidade" value={novoNpc.descricao} onChange={(e) => setNovoNpc({ ...novoNpc, descricao: e.target.value })} />
            <button disabled={processando} type="submit">Adicionar NPC</button>
          </form>
        </section>

        <section className="rpg-npc-historico"><h3>Últimas aparições</h3>{postagens.length === 0 ? <p>Nenhum turno de NPC ainda.</p> : postagens.slice(0, 12).map((post) => <article key={post.id}><strong>{nomeNpc(post.npc_id)}</strong><span>{post.tipo}</span><p>{post.conteudo}</p><time>{new Date(post.criado_em).toLocaleString('pt-BR')}</time></article>)}</section>
        {mensagem && <p className="rpg-npcs-mensagem">{mensagem}</p>}
      </aside>
    </div>
  )
}
