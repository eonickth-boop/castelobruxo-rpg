import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-central-narrador.css'

const NPC_INICIAL = { nome: '', titulo: '', descricao: '', avatar_url: '', categoria: 'personagem' }

export default function CentralNarradorGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberta, setAberta] = useState(false)
  const [aba, setAba] = useState('convites')
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [convites, setConvites] = useState([])
  const [npcs, setNpcs] = useState([])
  const [usuario, setUsuario] = useState('')
  const [textoConvite, setTextoConvite] = useState('')
  const [novoNpc, setNovoNpc] = useState(NPC_INICIAL)
  const [npcSelecionado, setNpcSelecionado] = useState('')
  const [tipoTurno, setTipoTurno] = useState('fala')
  const [turno, setTurno] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const verificar = () => setCenaId(new URLSearchParams(window.location.search).get('cena') || '')
    verificar()
    const intervalo = window.setInterval(verificar, 500)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!cenaId) { setCena(null); setAberta(false); return }
    carregar()
  }, [cenaId])

  async function carregar() {
    const { data: dadosSessao } = await supabase.auth.getSession()
    const atual = dadosSessao.session
    if (!atual?.user || !cenaId) return
    setSessao(atual)

    const [resCena, resConvites, resNpcs] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('rpg_convites').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
      supabase.from('rpg_npcs').select('*').eq('cena_id', cenaId).order('criado_em'),
    ])

    setCena(resCena.data || null)
    setConvites(resConvites.data || [])
    setNpcs(resNpcs.data || [])
    if (!npcSelecionado && resNpcs.data?.length) {
      setNpcSelecionado(resNpcs.data.find((npc) => npc.ativo)?.id || '')
    }
  }

  const podeNarrar = cena?.criador_id === sessao?.user?.id
  const npcAtual = useMemo(() => npcs.find((npc) => npc.id === npcSelecionado), [npcs, npcSelecionado])

  async function convidar(evento) {
    evento.preventDefault()
    const nome = usuario.trim().toLowerCase().replace(/^@/, '')
    if (!nome) return
    setProcessando(true); setMensagem('')
    const { error } = await supabase.rpc('rpg_convidar_usuario', {
      p_cena_id: cenaId,
      p_usuario: nome,
      p_mensagem: textoConvite.trim(),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível enviar o convite.'); return }
    setUsuario(''); setTextoConvite(''); setMensagem(`Convite enviado para @${nome}.`)
    await carregar()
  }

  async function cancelarConvite(id) {
    const { error } = await supabase.rpc('rpg_cancelar_convite', { p_convite_id: id })
    if (error) { setMensagem(error.message || 'Não foi possível cancelar o convite.'); return }
    await carregar()
  }

  async function criarNpc(evento) {
    evento.preventDefault()
    setProcessando(true); setMensagem('')
    const { data, error } = await supabase.rpc('rpg_criar_npc', {
      p_cena_id: cenaId,
      p_nome: novoNpc.nome.trim(),
      p_titulo: novoNpc.titulo.trim(),
      p_descricao: novoNpc.descricao.trim(),
      p_avatar_url: novoNpc.avatar_url.trim(),
      p_categoria: novoNpc.categoria,
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível criar o NPC.'); return }
    setNovoNpc(NPC_INICIAL); setNpcSelecionado(data); setMensagem('NPC criado e vinculado à cena.')
    await carregar()
  }

  async function publicarNpc(evento) {
    evento.preventDefault()
    if (!npcSelecionado || !turno.trim()) return
    setProcessando(true); setMensagem('')
    const { error } = await supabase.rpc('rpg_publicar_como_npc', {
      p_npc_id: npcSelecionado,
      p_tipo: tipoTurno,
      p_conteudo: turno.trim(),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível publicar como NPC.'); return }
    setTurno(''); setMensagem(`Turno de ${npcAtual?.nome || 'NPC'} publicado.`)
    window.dispatchEvent(new CustomEvent('castelobruxo:rpg-atualizar-cena'))
    await carregar()
  }

  if (!cenaId || !cena || !sessao || !podeNarrar) return null

  return <div className="rpg-central-narrador-global">
    <button className="rpg-central-narrador-atalho" onClick={() => setAberta(true)}>🗝️ Central do narrador</button>
    {aberta && <button className="rpg-central-narrador-overlay" aria-label="Fechar" onClick={() => setAberta(false)} />}
    <aside className={`rpg-central-narrador-painel ${aberta ? 'aberto' : ''}`}>
      <header><div><small>{cena.titulo}</small><h2>Central do narrador</h2></div><button onClick={() => setAberta(false)}>×</button></header>
      <nav><button className={aba === 'convites' ? 'ativo' : ''} onClick={() => setAba('convites')}>Convites</button><button className={aba === 'npcs' ? 'ativo' : ''} onClick={() => setAba('npcs')}>NPCs</button></nav>

      {aba === 'convites' && <section>
        <h3>Convidar jogador</h3>
        <form onSubmit={convidar}><input required placeholder="Nome de usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} /><textarea rows="3" maxLength="500" placeholder="Mensagem opcional" value={textoConvite} onChange={(e) => setTextoConvite(e.target.value)} /><button disabled={processando}>Enviar convite</button></form>
        <div className="rpg-central-lista">{convites.length === 0 ? <p>Nenhum convite enviado.</p> : convites.map((convite) => <article key={convite.id}><div><strong>@{convite.convidado_id.slice(0, 8)}</strong><small>{convite.status}</small></div>{convite.status === 'pendente' && <button onClick={() => cancelarConvite(convite.id)}>Cancelar</button>}</article>)}</div>
      </section>}

      {aba === 'npcs' && <>
        <section><h3>NPCs da cena</h3>{npcs.length === 0 ? <p>Nenhum NPC criado.</p> : <div className="rpg-central-lista">{npcs.map((npc) => <article key={npc.id} className={!npc.ativo ? 'inativo' : ''}><div><strong>{npc.nome}</strong><small>{npc.titulo || npc.categoria}</small></div><button disabled={!npc.ativo} onClick={() => setNpcSelecionado(npc.id)}>{npcSelecionado === npc.id ? 'Selecionado' : 'Controlar'}</button></article>)}</div>}</section>
        <section><h3>Publicar como NPC</h3><form onSubmit={publicarNpc}><select required value={npcSelecionado} onChange={(e) => setNpcSelecionado(e.target.value)}><option value="">Selecione um NPC</option>{npcs.filter((npc) => npc.ativo).map((npc) => <option key={npc.id} value={npc.id}>{npc.nome}</option>)}</select><select value={tipoTurno} onChange={(e) => setTipoTurno(e.target.value)}><option value="fala">Fala</option><option value="acao">Ação</option><option value="pensamento">Pensamento</option><option value="narracao">Narração</option></select><textarea rows="5" maxLength="5000" placeholder="Escreva o turno do NPC" value={turno} onChange={(e) => setTurno(e.target.value)} /><button disabled={processando || !npcSelecionado || !turno.trim()}>Publicar como NPC</button></form></section>
        <section><h3>Criar NPC</h3><form onSubmit={criarNpc}><input required minLength="2" maxLength="80" placeholder="Nome" value={novoNpc.nome} onChange={(e) => setNovoNpc({ ...novoNpc, nome: e.target.value })} /><input maxLength="120" placeholder="Título ou função" value={novoNpc.titulo} onChange={(e) => setNovoNpc({ ...novoNpc, titulo: e.target.value })} /><select value={novoNpc.categoria} onChange={(e) => setNovoNpc({ ...novoNpc, categoria: e.target.value })}><option value="personagem">Personagem</option><option value="professor">Professor</option><option value="criatura">Criatura</option><option value="espirito">Espírito</option><option value="inimigo">Inimigo</option><option value="aliado">Aliado</option></select><input placeholder="URL do avatar" value={novoNpc.avatar_url} onChange={(e) => setNovoNpc({ ...novoNpc, avatar_url: e.target.value })} /><textarea rows="3" maxLength="1000" placeholder="Descrição" value={novoNpc.descricao} onChange={(e) => setNovoNpc({ ...novoNpc, descricao: e.target.value })} /><button disabled={processando}>Criar NPC</button></form></section>
      </>}
      {mensagem && <p className="rpg-central-mensagem">{mensagem}</p>}
    </aside>
  </div>
}