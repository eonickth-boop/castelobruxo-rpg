import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/recompensas-escola.css'

export default function RecompensasEscolaStandalone() {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [cargo, setCargo] = useState('')
  const [usuarioAlvo, setUsuarioAlvo] = useState('')
  const [recompensaEquipe, setRecompensaEquipe] = useState('distintivo_monitor')

  async function carregar() {
    setCarregando(true)
    const [{ data, error }, { data: sessao }] = await Promise.all([
      supabase.rpc('listar_recompensas_escola'),
      supabase.auth.getSession(),
    ])
    if (sessao?.session?.user?.id) {
      const { data: perfil } = await supabase.from('perfis').select('cargo').eq('id', sessao.session.user.id).maybeSingle()
      setCargo(perfil?.cargo || '')
    }
    if (error) {
      setMensagem(error.message || 'Não foi possível carregar os benefícios.')
      setItens([])
    } else setItens(data ?? [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function resgatar(item) {
    setProcessando(item.codigo)
    setMensagem('')
    const { data, error } = await supabase.rpc('resgatar_recompensa_escola', { recompensa_alvo: item.codigo })
    if (error) setMensagem(error.message || 'Não foi possível resgatar esta recompensa.')
    else {
      setMensagem(`${data?.item || item.titulo} foi adicionado ao seu inventário.`)
      await carregar()
    }
    setProcessando(null)
  }

  async function conceder(evento) {
    evento.preventDefault()
    if (!usuarioAlvo.trim()) return
    setProcessando('equipe')
    setMensagem('')
    const { data, error } = await supabase.rpc('conceder_recompensa_escola', {
      usuario_alvo: usuarioAlvo.trim(),
      recompensa_alvo: recompensaEquipe,
    })
    if (error) setMensagem(error.message || 'Não foi possível conceder a recompensa.')
    else {
      setMensagem(`${data?.item} foi concedido a ${data?.jogador}.`)
      setUsuarioAlvo('')
    }
    setProcessando(null)
  }

  const grupos = useMemo(() => itens.reduce((acc, item) => {
    const chave = item.origem || 'Escola'
    acc[chave] = acc[chave] || []
    acc[chave].push(item)
    return acc
  }, {}), [itens])

  const equipe = ['administrador', 'professor'].includes(cargo)

  return (
    <main className="recompensas-escola-pagina">
      <header className="recompensas-escola-topo">
        <button type="button" onClick={() => window.location.assign('/')}>← Voltar</button>
        <button type="button" onClick={() => window.location.assign('/?pagina=inventario')}>🎒 Inventário</button>
      </header>

      <section className="recompensas-escola-hero">
        <p>Benefícios e recompensas</p>
        <h1>Serviços da Escola</h1>
        <span>Cumpra requisitos, participe dos sistemas e retire itens que não são vendidos no mercado.</span>
      </section>

      {mensagem && <p className="recompensas-escola-mensagem">{mensagem}</p>}

      {equipe && (
        <section className="recompensas-equipe-painel">
          <div><small>Equipe escolar</small><h2>Conceder item institucional</h2><p>Entregue recompensas exclusivas diretamente ao inventário de um jogador.</p></div>
          <form onSubmit={conceder}>
            <input value={usuarioAlvo} onChange={(e) => setUsuarioAlvo(e.target.value)} placeholder="Nome de usuário" />
            <select value={recompensaEquipe} onChange={(e) => setRecompensaEquipe(e.target.value)}>
              <option value="distintivo_monitor">Distintivo de Monitor</option>
              <option value="chave_mestra">Chave Mestra</option>
              <option value="selo_academico">Selo Acadêmico</option>
            </select>
            <button type="submit" disabled={processando === 'equipe'}>{processando === 'equipe' ? 'Concedendo...' : 'Conceder'}</button>
          </form>
        </section>
      )}

      {carregando ? <p className="recompensas-escola-estado">Carregando benefícios...</p> : Object.entries(grupos).map(([grupo, registros]) => (
        <section className="recompensas-escola-grupo" key={grupo}>
          <h2>{grupo}</h2>
          <div className="recompensas-escola-grade">
            {registros.map((item) => {
              const bloqueado = !item.elegivel || item.resgatado || item.tipo_regra === 'equipe'
              let texto = 'Resgatar'
              if (item.tipo_regra === 'equipe') texto = 'Concedido pela equipe'
              else if (item.resgatado) texto = item.repetivel ? 'Retirado hoje' : 'Já recebido'
              else if (!item.elegivel) texto = 'Requisito pendente'
              else if (processando === item.codigo) texto = 'Resgatando...'
              return (
                <article className={`recompensa-escola-card ${item.elegivel ? 'elegivel' : 'bloqueado'}`} key={item.codigo}>
                  <div className="recompensa-escola-icone">{['diaria','dia_semana','horario'].includes(item.tipo_regra) ? '🍽️' : item.tipo_regra === 'tribo' ? '🛡️' : '🎁'}</div>
                  <small>{item.item_codigo}</small><h3>{item.titulo}</h3><p>{item.status_texto || item.descricao}</p>
                  <div className="recompensa-escola-status"><span>{item.resgatado ? '✓ Recebido' : item.elegivel ? 'Disponível' : 'Bloqueado'}</span></div>
                  <button type="button" disabled={bloqueado || processando === item.codigo} onClick={() => resgatar(item)}>{texto}</button>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
