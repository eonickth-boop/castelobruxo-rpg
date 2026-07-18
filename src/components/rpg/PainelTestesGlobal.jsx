import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-testes.css'

const atributos = [
  ['conhecimento_magico', 'Conhecimento Mágico'],
  ['exploracao', 'Exploração'],
  ['pocoes', 'Poções'],
  ['criaturas', 'Criaturas'],
  ['defesa', 'Defesa'],
  ['afinidade_natureza', 'Afinidade Natural'],
]

const nomeAtributo = Object.fromEntries(atributos)

export default function PainelTestesGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberto, setAberto] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [perfis, setPerfis] = useState({})
  const [testes, setTestes] = useState([])
  const [rolagens, setRolagens] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)
  const [novoTeste, setNovoTeste] = useState({ alvo_id: '', atributo: 'exploracao', dificuldade: 10, descricao: '' })

  useEffect(() => {
    const verificarUrl = () => {
      const id = new URLSearchParams(window.location.search).get('cena') || ''
      setCenaId((atual) => atual === id ? atual : id)
    }
    verificarUrl()
    const intervalo = window.setInterval(verificarUrl, 700)
    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (!cenaId) {
      setAberto(false)
      setCena(null)
      return undefined
    }
    carregarTudo()
    const intervalo = window.setInterval(carregarTudo, 8000)
    return () => window.clearInterval(intervalo)
  }, [cenaId])

  async function carregarTudo() {
    const { data: dadosSessao } = await supabase.auth.getSession()
    const novaSessao = dadosSessao.session
    if (!novaSessao?.user || !cenaId) return
    setSessao(novaSessao)

    const [resCena, resPerfil, resParticipantes, resTestes, resRolagens] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('perfis').select('*').eq('id', novaSessao.user.id).maybeSingle(),
      supabase.from('rpg_participantes').select('*').eq('cena_id', cenaId).order('entrou_em'),
      supabase.from('rpg_testes').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
      supabase.from('rpg_rolagens').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
    ])

    if (resCena.error || !resCena.data) return
    setCena(resCena.data)
    setPerfil(resPerfil.data)
    setParticipantes(resParticipantes.data || [])
    setTestes(resTestes.data || [])
    setRolagens(resRolagens.data || [])

    const ids = [...new Set((resParticipantes.data || []).map((item) => item.usuario_id))]
    if (ids.length) {
      const { data } = await supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,tribo,nivel,conhecimento_magico,exploracao,pocoes,criaturas,defesa,afinidade_natureza').in('id', ids)
      setPerfis(Object.fromEntries((data || []).map((item) => [item.id, item])))
      if (!novoTeste.alvo_id && ids.length > 1) {
        const primeiroJogador = ids.find((id) => id !== novaSessao.user.id) || ids[0]
        setNovoTeste((atual) => ({ ...atual, alvo_id: primeiroJogador }))
      }
    }
  }

  const podeNarrar = cena?.criador_id === sessao?.user?.id
  const meusTestes = useMemo(() => testes.filter((teste) => teste.alvo_id === sessao?.user?.id), [testes, sessao?.user?.id])
  const pendentes = meusTestes.filter((teste) => teste.status === 'pendente')
  const rolagemPorTeste = useMemo(() => Object.fromEntries(rolagens.map((rolagem) => [rolagem.teste_id, rolagem])), [rolagens])

  function nomePerfil(id) {
    const dados = perfis[id]
    return dados?.nome_personagem || dados?.usuario || 'Personagem'
  }

  async function solicitarTeste(evento) {
    evento.preventDefault()
    setMensagem('')
    setProcessando(true)
    const { error } = await supabase.rpc('rpg_solicitar_teste', {
      p_cena_id: cenaId,
      p_alvo_id: novoTeste.alvo_id,
      p_atributo: novoTeste.atributo,
      p_dificuldade: Number(novoTeste.dificuldade),
      p_descricao: novoTeste.descricao.trim(),
    })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível solicitar o teste.'); return }
    setNovoTeste((atual) => ({ ...atual, descricao: '' }))
    setMensagem('Teste solicitado.')
    await carregarTudo()
  }

  async function realizarTeste(teste) {
    setMensagem('')
    setProcessando(true)
    const { data, error } = await supabase.rpc('rpg_realizar_teste', { p_teste_id: teste.id })
    setProcessando(false)
    if (error) { setMensagem(error.message || 'Não foi possível realizar o teste.'); return }
    setMensagem(data.sucesso ? `Sucesso: ${data.total} contra dificuldade ${data.dificuldade}.` : `Falha: ${data.total} contra dificuldade ${data.dificuldade}.`)
    await carregarTudo()
  }

  async function cancelarTeste(teste) {
    if (!window.confirm('Cancelar este teste?')) return
    const { error } = await supabase.rpc('rpg_cancelar_teste', { p_teste_id: teste.id })
    if (error) { setMensagem(error.message || 'Não foi possível cancelar.'); return }
    await carregarTudo()
  }

  if (!cenaId || !cena || !sessao) return null

  return (
    <div className="rpg-dados-global">
      <button type="button" className="rpg-dados-atalho" onClick={() => setAberto((valor) => !valor)}>
        🎲 Dados {pendentes.length > 0 && <strong>{pendentes.length}</strong>}
      </button>

      {aberto && <button className="rpg-dados-overlay" aria-label="Fechar painel" onClick={() => setAberto(false)} />}

      <aside className={`rpg-dados-painel ${aberto ? 'aberto' : ''}`}>
        <header>
          <div><small>Sistema de testes</small><h2>Dados e atributos</h2></div>
          <button type="button" onClick={() => setAberto(false)}>×</button>
        </header>

        <section className="rpg-ficha-atributos">
          <h3>Minha ficha</h3>
          <div>{atributos.map(([chave, rotulo]) => <article key={chave}><span>{rotulo}</span><strong>{perfil?.[chave] ?? 0}</strong><small>Bônus +{Math.floor((perfil?.[chave] ?? 0) / 10)}</small></article>)}</div>
        </section>

        {pendentes.length > 0 && <section className="rpg-testes-pendentes"><h3>Testes pendentes</h3>{pendentes.map((teste) => <article key={teste.id}><div><strong>{nomeAtributo[teste.atributo]}</strong><span>Dificuldade {teste.dificuldade}</span><p>{teste.descricao || 'Teste solicitado pelo narrador.'}</p></div><button disabled={processando} onClick={() => realizarTeste(teste)}>Rolar 1d20</button></article>)}</section>}

        {podeNarrar && <section className="rpg-solicitar-teste"><h3>Solicitar teste</h3><form onSubmit={solicitarTeste}>
          <label>Personagem<select required value={novoTeste.alvo_id} onChange={(e) => setNovoTeste({ ...novoTeste, alvo_id: e.target.value })}><option value="">Selecione</option>{participantes.filter((item) => item.usuario_id !== sessao.user.id).map((item) => <option key={item.id} value={item.usuario_id}>{nomePerfil(item.usuario_id)}</option>)}</select></label>
          <label>Atributo<select value={novoTeste.atributo} onChange={(e) => setNovoTeste({ ...novoTeste, atributo: e.target.value })}>{atributos.map(([chave, rotulo]) => <option key={chave} value={chave}>{rotulo}</option>)}</select></label>
          <label>Dificuldade<input type="number" min="1" max="30" value={novoTeste.dificuldade} onChange={(e) => setNovoTeste({ ...novoTeste, dificuldade: e.target.value })} /></label>
          <label>Motivo<textarea rows="3" maxLength="500" value={novoTeste.descricao} onChange={(e) => setNovoTeste({ ...novoTeste, descricao: e.target.value })} placeholder="Ex.: perceber rastros escondidos" /></label>
          <button disabled={processando || !novoTeste.alvo_id} type="submit">Solicitar rolagem</button>
        </form></section>}

        <section className="rpg-historico-testes"><h3>Histórico</h3>{testes.length === 0 ? <p>Nenhum teste nesta cena.</p> : testes.map((teste) => { const rolagem = rolagemPorTeste[teste.id]; return <article key={teste.id}><div><strong>{nomePerfil(teste.alvo_id)}</strong><span>{nomeAtributo[teste.atributo]} · dificuldade {teste.dificuldade}</span></div>{rolagem ? <b className={rolagem.sucesso ? 'sucesso' : 'falha'}>{rolagem.dado} + {rolagem.bonus} = {rolagem.total} · {rolagem.sucesso ? 'Sucesso' : 'Falha'}</b> : <b>{teste.status}</b>}{podeNarrar && teste.status === 'pendente' && <button onClick={() => cancelarTeste(teste)}>Cancelar</button>}</article> })}</section>

        {mensagem && <p className="rpg-dados-mensagem">{mensagem}</p>}
      </aside>
    </div>
  )
}
