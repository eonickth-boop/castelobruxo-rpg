import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-recompensas.css'

export default function PainelRecompensasGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberto, setAberto] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [perfis, setPerfis] = useState({})
  const [missoes, setMissoes] = useState([])
  const [itens, setItens] = useState([])
  const [recompensas, setRecompensas] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)
  const [form, setForm] = useState({ usuario_id: '', xp: 0, ipes: 0, item_codigo: '', quantidade_item: 0, descricao: '' })

  useEffect(() => {
    const verificarUrl = () => setCenaId(new URLSearchParams(window.location.search).get('cena') || '')
    verificarUrl()
    const intervalo = window.setInterval(verificarUrl, 700)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!cenaId) { setAberto(false); setCena(null); return undefined }
    carregarTudo()
    const intervalo = window.setInterval(carregarTudo, 8000)
    return () => window.clearInterval(intervalo)
  }, [cenaId])

  async function carregarTudo() {
    const { data: dadosSessao } = await supabase.auth.getSession()
    const novaSessao = dadosSessao.session
    if (!novaSessao?.user || !cenaId) return
    setSessao(novaSessao)

    const [resCena, resParticipantes, resMissoes, resItens, resRecompensas] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('rpg_participantes').select('*').eq('cena_id', cenaId).order('entrou_em'),
      supabase.from('missoes').select('id,titulo,descricao,recompensa_xp,recompensa_ipes,recompensa_item_codigo,meta,ativo').eq('ativo', true).order('ordem'),
      supabase.from('items').select('id,nome,categoria,ativo').eq('ativo', true).order('nome'),
      supabase.from('rpg_recompensas').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
    ])

    if (resCena.error || !resCena.data) return
    setCena(resCena.data)
    setParticipantes(resParticipantes.data || [])
    setMissoes(resMissoes.data || [])
    setItens(resItens.data || [])
    setRecompensas(resRecompensas.data || [])

    const ids = [...new Set([...(resParticipantes.data || []).map((p) => p.usuario_id), ...(resRecompensas.data || []).map((r) => r.usuario_id)])]
    if (ids.length) {
      const { data } = await supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,nivel,xp,tribo').in('id', ids)
      setPerfis(Object.fromEntries((data || []).map((p) => [p.id, p])))
      if (!form.usuario_id) {
        const alvo = ids.find((id) => id !== novaSessao.user.id) || ids[0]
        setForm((atual) => ({ ...atual, usuario_id: alvo || '' }))
      }
    }
  }

  const podeNarrar = cena?.criador_id === sessao?.user?.id
  const missaoVinculada = useMemo(() => missoes.find((m) => m.id === cena?.missao_id), [missoes, cena?.missao_id])
  const idsRecompensados = useMemo(() => new Set(recompensas.map((r) => r.usuario_id)), [recompensas])

  function nomePerfil(id) {
    const p = perfis[id]
    return p?.nome_personagem || p?.usuario || 'Personagem'
  }

  async function vincularMissao(missaoId) {
    setMensagem('')
    setProcessando(true)
    const { error } = await supabase.rpc('rpg_vincular_missao', { p_cena_id: cenaId, p_missao_id: missaoId || null })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível vincular a missão.'); return }
    setMensagem(missaoId ? 'Missão vinculada à cena.' : 'Missão removida da cena.')
    await carregarTudo()
  }

  function aplicarRecompensaDaMissao() {
    if (!missaoVinculada) return
    setForm((atual) => ({
      ...atual,
      xp: missaoVinculada.recompensa_xp || 0,
      ipes: missaoVinculada.recompensa_ipes || 0,
      item_codigo: missaoVinculada.recompensa_item_codigo || '',
      quantidade_item: missaoVinculada.recompensa_item_codigo ? 1 : 0,
      descricao: `Conclusão da missão: ${missaoVinculada.titulo}`,
    }))
  }

  async function conceder(evento) {
    evento.preventDefault()
    if (!window.confirm(`Entregar esta recompensa para ${nomePerfil(form.usuario_id)}? Esta ação não pode ser desfeita.`)) return
    setMensagem('')
    setProcessando(true)
    const { error } = await supabase.rpc('rpg_conceder_recompensa', {
      p_cena_id: cenaId,
      p_usuario_id: form.usuario_id,
      p_xp: Number(form.xp || 0),
      p_ipes: Number(form.ipes || 0),
      p_item_codigo: form.item_codigo || null,
      p_quantidade_item: Number(form.quantidade_item || 0),
      p_descricao: form.descricao.trim(),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível entregar a recompensa.'); return }
    setMensagem('Recompensa entregue e registrada com sucesso.')
    setForm((atual) => ({ ...atual, xp: 0, ipes: 0, item_codigo: '', quantidade_item: 0, descricao: '' }))
    await carregarTudo()
  }

  if (!cenaId || !cena || !sessao) return null

  return (
    <div className="rpg-recompensas-global">
      <button type="button" className="rpg-recompensas-atalho" onClick={() => setAberto((v) => !v)}>🏆 Recompensas</button>
      {aberto && <button className="rpg-recompensas-overlay" aria-label="Fechar painel" onClick={() => setAberto(false)} />}

      <aside className={`rpg-recompensas-painel ${aberto ? 'aberto' : ''}`}>
        <header><div><small>Progresso da cena</small><h2>Missões e recompensas</h2></div><button type="button" onClick={() => setAberto(false)}>×</button></header>

        <section className="rpg-missao-vinculada">
          <h3>Missão da cena</h3>
          {missaoVinculada ? <article><strong>{missaoVinculada.titulo}</strong><p>{missaoVinculada.descricao}</p><div><span>{missaoVinculada.recompensa_xp || 0} XP</span><span>{missaoVinculada.recompensa_ipes || 0} Ipês</span>{missaoVinculada.recompensa_item_codigo && <span>{missaoVinculada.recompensa_item_codigo}</span>}</div></article> : <p>Nenhuma missão foi vinculada.</p>}
          {podeNarrar && <label>Vincular missão<select value={cena.missao_id || ''} disabled={processando || recompensas.length > 0} onChange={(e) => vincularMissao(e.target.value)}><option value="">Sem missão</option>{missoes.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}</select></label>}
        </section>

        {podeNarrar && <section className="rpg-entregar-recompensa"><h3>Entregar recompensa</h3><form onSubmit={conceder}>
          <label>Personagem<select required value={form.usuario_id} onChange={(e) => setForm({ ...form, usuario_id: e.target.value })}><option value="">Selecione</option>{participantes.map((p) => <option key={p.id} value={p.usuario_id} disabled={idsRecompensados.has(p.usuario_id)}>{nomePerfil(p.usuario_id)}{idsRecompensados.has(p.usuario_id) ? ' — já recebeu' : ''}</option>)}</select></label>
          {missaoVinculada && <button type="button" className="rpg-recompensas-secundario" onClick={aplicarRecompensaDaMissao}>Usar recompensas da missão</button>}
          <div className="rpg-recompensas-valores"><label>XP<input type="number" min="0" max="5000" value={form.xp} onChange={(e) => setForm({ ...form, xp: e.target.value })} /></label><label>Ipês<input type="number" min="0" max="100000" value={form.ipes} onChange={(e) => setForm({ ...form, ipes: e.target.value })} /></label></div>
          <label>Item<select value={form.item_codigo} onChange={(e) => setForm({ ...form, item_codigo: e.target.value, quantidade_item: e.target.value ? Math.max(1, Number(form.quantidade_item || 1)) : 0 })}><option value="">Nenhum item</option>{itens.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.id}</option>)}</select></label>
          {form.item_codigo && <label>Quantidade<input type="number" min="1" max="20" value={form.quantidade_item} onChange={(e) => setForm({ ...form, quantidade_item: e.target.value })} /></label>}
          <label>Motivo<textarea rows="3" maxLength="500" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: ajudou a proteger a clareira" /></label>
          <button type="submit" disabled={processando || !form.usuario_id || idsRecompensados.has(form.usuario_id)}>Confirmar entrega</button>
        </form></section>}

        <section className="rpg-historico-recompensas"><h3>Entregas nesta cena</h3>{recompensas.length === 0 ? <p>Nenhuma recompensa foi entregue ainda.</p> : recompensas.map((r) => <article key={r.id}><div><strong>{nomePerfil(r.usuario_id)}</strong><small>{new Date(r.criado_em).toLocaleString('pt-BR')}</small></div><p>{r.xp > 0 && <span>{r.xp} XP</span>}{r.ipes > 0 && <span>{r.ipes} Ipês</span>}{r.item_codigo && <span>{r.quantidade_item}x {r.item_codigo}</span>}{r.missao_id && <span>Missão concluída</span>}</p>{r.descricao && <em>{r.descricao}</em>}</article>)}</section>
        {mensagem && <p className="rpg-recompensas-mensagem">{mensagem}</p>}
      </aside>
    </div>
  )
}
