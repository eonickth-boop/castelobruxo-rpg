import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/rpg-cenas.css'

export default function RpgCenas() {
  const parametros = useMemo(() => new URLSearchParams(window.location.search), [])
  const localInicial = parametros.get('local') || ''
  const nomeLocalInicial = parametros.get('nome') || ''
  const cenaInicialId = parametros.get('cena') || ''

  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cenas, setCenas] = useState([])
  const [cenaAtual, setCenaAtual] = useState(null)
  const [postagens, setPostagens] = useState([])
  const [participando, setParticipando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')
  const [tipo, setTipo] = useState('acao')
  const [conteudo, setConteudo] = useState('')
  const [formAberto, setFormAberto] = useState(parametros.get('nova') === '1')
  const [filtro, setFiltro] = useState(localInicial ? 'local' : 'abertas')
  const [novaCena, setNovaCena] = useState({
    titulo: '',
    descricao: '',
    local_nome: nomeLocalInicial,
    local_codigo: localInicial,
    visibilidade: 'publica',
  })

  const nomeJogador = useMemo(
    () => perfil?.nome_personagem || perfil?.usuario || 'Jogador',
    [perfil],
  )

  const cenasVisiveis = useMemo(() => cenas.filter((cena) => {
    if (filtro === 'local') return localInicial && cena.local_codigo === localInicial
    if (filtro === 'historico') return cena.status === 'encerrada'
    return cena.status === 'aberta'
  }), [cenas, filtro, localInicial])

  useEffect(() => { iniciar() }, [])

  async function iniciar() {
    setCarregando(true)
    const { data } = await supabase.auth.getSession()
    const novaSessao = data.session
    setSessao(novaSessao)

    if (!novaSessao?.user) {
      setCarregando(false)
      return
    }

    const [{ data: dadosPerfil }, { data: dadosCenas, error }] = await Promise.all([
      supabase.from('perfis').select('*').eq('id', novaSessao.user.id).single(),
      supabase.from('rpg_cenas').select('*').order('criado_em', { ascending: false }),
    ])

    setPerfil(dadosPerfil)
    if (error) setMensagem('Não foi possível carregar as cenas.')
    const lista = dadosCenas || []
    setCenas(lista)
    setCarregando(false)

    if (cenaInicialId) {
      const cena = lista.find((item) => item.id === cenaInicialId)
      if (cena) abrirCena(cena, novaSessao)
    }
  }

  async function abrirCena(cena, sessaoFornecida = sessao) {
    setCenaAtual(cena)
    setMensagem('')
    const usuarioId = sessaoFornecida?.user?.id

    const [{ data: posts }, { data: participante }] = await Promise.all([
      supabase.from('rpg_postagens').select('*').eq('cena_id', cena.id).order('criado_em'),
      supabase.from('rpg_participantes').select('id').eq('cena_id', cena.id).eq('usuario_id', usuarioId).maybeSingle(),
    ])

    setPostagens(posts || [])
    setParticipando(Boolean(participante))
    window.history.replaceState({}, '', `/rpg?cena=${cena.id}`)
  }

  async function criarCena(evento) {
    evento.preventDefault()
    setMensagem('')

    const { data, error } = await supabase.from('rpg_cenas').insert({
      ...novaCena,
      local_nome: novaCena.local_nome.trim() || 'Castelobruxo',
      local_codigo: novaCena.local_codigo || null,
      criador_id: sessao.user.id,
    }).select().single()

    if (error) {
      setMensagem(error.message || 'Não foi possível criar a cena.')
      return
    }

    setCenas((atuais) => [data, ...atuais])
    setNovaCena({ titulo: '', descricao: '', local_nome: nomeLocalInicial, local_codigo: localInicial, visibilidade: 'publica' })
    setFormAberto(false)
    abrirCena(data)
  }

  async function entrarNaCena() {
    const { error } = await supabase.from('rpg_participantes').insert({
      cena_id: cenaAtual.id,
      usuario_id: sessao.user.id,
      papel: cenaAtual.criador_id === sessao.user.id ? 'narrador' : 'jogador',
    })

    if (error && error.code !== '23505') {
      setMensagem(error.message || 'Não foi possível entrar na cena.')
      return
    }
    setParticipando(true)
  }

  async function publicar(evento) {
    evento.preventDefault()
    const texto = conteudo.trim()
    if (!texto) return

    const { data, error } = await supabase.from('rpg_postagens').insert({
      cena_id: cenaAtual.id,
      autor_id: sessao.user.id,
      tipo,
      conteudo: texto,
    }).select().single()

    if (error) {
      setMensagem(error.message || 'Não foi possível publicar.')
      return
    }

    setPostagens((atuais) => [...atuais, data])
    setConteudo('')
  }

  async function encerrarCena() {
    const { data, error } = await supabase.from('rpg_cenas')
      .update({ status: 'encerrada', atualizado_em: new Date().toISOString() })
      .eq('id', cenaAtual.id).select().single()

    if (error) {
      setMensagem(error.message || 'Não foi possível encerrar a cena.')
      return
    }

    setCenaAtual(data)
    setCenas((atuais) => atuais.map((cena) => cena.id === data.id ? data : cena))
  }

  function voltarLista() {
    setCenaAtual(null)
    setPostagens([])
    window.history.replaceState({}, '', localInicial ? `/rpg?local=${encodeURIComponent(localInicial)}&nome=${encodeURIComponent(nomeLocalInicial)}` : '/rpg')
  }

  if (carregando) return <main className="rpg-shell"><p>Carregando o salão de interpretação...</p></main>
  if (!sessao) return <main className="rpg-shell rpg-centralizado"><h1>RPG Textual</h1><p>Entre na sua conta para participar das cenas.</p><button onClick={() => { window.location.href = '/' }}>Ir para o login</button></main>

  if (cenaAtual) {
    const podeNarrar = cenaAtual.criador_id === sessao.user.id
    return (
      <main className="rpg-shell">
        <button className="rpg-voltar" onClick={voltarLista}>← Voltar às cenas</button>
        <header className="rpg-cabecalho-cena">
          <div><span>{cenaAtual.local_nome}</span><h1>{cenaAtual.titulo}</h1><p>{cenaAtual.descricao || 'Uma nova história está começando.'}</p></div>
          <div className="rpg-badges"><strong>{cenaAtual.status}</strong><small>{cenaAtual.visibilidade}</small></div>
        </header>
        <section className="rpg-postagens">
          {postagens.length === 0 ? <div className="rpg-vazio">Ainda não há turnos nesta cena.</div> : postagens.map((postagem) => (
            <article key={postagem.id} className={`rpg-postagem rpg-${postagem.tipo}`}>
              <header><strong>{postagem.autor_id === sessao.user.id ? nomeJogador : 'Outro personagem'}</strong><span>{postagem.tipo}</span><time>{new Date(postagem.criado_em).toLocaleString('pt-BR')}</time></header>
              <p>{postagem.conteudo}</p>
            </article>
          ))}
        </section>
        {cenaAtual.status === 'aberta' && !participando && <button className="rpg-entrar" onClick={entrarNaCena}>Entrar nesta cena</button>}
        {cenaAtual.status === 'aberta' && participando && (
          <form className="rpg-editor" onSubmit={publicar}>
            <div><label>Tipo do turno</label><select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="acao">Ação</option><option value="fala">Fala</option>{podeNarrar && <option value="narracao">Narração</option>}</select></div>
            <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Descreva a ação, fala ou narração do seu personagem..." maxLength={5000} rows={7} />
            <button type="submit">Publicar turno</button>
          </form>
        )}
        {podeNarrar && cenaAtual.status === 'aberta' && <button className="rpg-encerrar" onClick={encerrarCena}>Encerrar cena</button>}
        {mensagem && <p className="rpg-mensagem">{mensagem}</p>}
      </main>
    )
  }

  return (
    <main className="rpg-shell">
      <header className="rpg-topo">
        <div><span>{localInicial ? nomeLocalInicial : 'Castelobruxo'}</span><h1>{localInicial ? `Cenas em ${nomeLocalInicial}` : 'Salão de Interpretação'}</h1><p>Crie cenas, interprete seu personagem e continue a história pelo site.</p></div>
        <div className="rpg-acoes-topo"><button onClick={() => setFormAberto((valor) => !valor)}>Nova cena</button><button className="rpg-secundario" onClick={() => { window.location.href = '/' }}>Voltar ao portal</button></div>
      </header>

      <div className="rpg-acoes-topo">
        <button className={filtro === 'abertas' ? '' : 'rpg-secundario'} onClick={() => setFiltro('abertas')}>Cenas abertas</button>
        {localInicial && <button className={filtro === 'local' ? '' : 'rpg-secundario'} onClick={() => setFiltro('local')}>Neste local</button>}
        <button className={filtro === 'historico' ? '' : 'rpg-secundario'} onClick={() => setFiltro('historico')}>Histórico</button>
      </div>

      {formAberto && (
        <form className="rpg-nova-cena" onSubmit={criarCena}>
          <input required minLength={3} maxLength={120} placeholder="Título da cena" value={novaCena.titulo} onChange={(e) => setNovaCena({ ...novaCena, titulo: e.target.value })} />
          <input placeholder="Local" value={novaCena.local_nome} onChange={(e) => setNovaCena({ ...novaCena, local_nome: e.target.value, local_codigo: '' })} readOnly={Boolean(localInicial)} />
          <textarea placeholder="Descrição inicial" rows={4} value={novaCena.descricao} onChange={(e) => setNovaCena({ ...novaCena, descricao: e.target.value })} />
          <select value={novaCena.visibilidade} onChange={(e) => setNovaCena({ ...novaCena, visibilidade: e.target.value })}><option value="publica">Pública</option><option value="privada">Privada</option></select>
          <button type="submit">Criar e abrir cena</button>
        </form>
      )}

      <section className="rpg-grade-cenas">
        {cenasVisiveis.length === 0 ? <div className="rpg-vazio">Nenhuma cena encontrada neste filtro.</div> : cenasVisiveis.map((cena) => (
          <button key={cena.id} className="rpg-card-cena" onClick={() => abrirCena(cena)}>
            <span>{cena.local_nome}</span><h2>{cena.titulo}</h2><p>{cena.descricao || 'Sem descrição.'}</p>
            <footer><strong>{cena.status}</strong><small>{new Date(cena.criado_em).toLocaleDateString('pt-BR')}</small></footer>
          </button>
        ))}
      </section>
      {mensagem && <p className="rpg-mensagem">{mensagem}</p>}
    </main>
  )
}
