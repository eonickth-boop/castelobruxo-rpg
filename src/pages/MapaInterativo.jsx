import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/mapa-interativo.css'

const ABAS = [
  { id: 'interna', nome: 'Mapa interno' },
  { id: 'externa', nome: 'Mapa externo' },
]

export default function MapaInterativo({ perfil, onVoltar, onAbrirLocal }) {
  const [locais, setLocais] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [ambiente, setAmbiente] = useState('interna')
  const [cenasPorLocal, setCenasPorLocal] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => { carregarMapa() }, [perfil?.id])

  async function carregarMapa() {
    setCarregando(true)
    setMensagem('')
    const [{ data: dadosLocais, error }, { data: cenas, error: erroCenas }] = await Promise.all([
      supabase.rpc('listar_locais_mapa_usuario'),
      supabase.from('rpg_cenas').select('id, local_codigo, status').eq('status', 'aberta'),
    ])
    if (error) {
      console.error('Erro ao carregar mapa:', error)
      setMensagem(error.message || 'Não foi possível carregar o mapa.')
      setLocais([])
      setCarregando(false)
      return
    }
    if (erroCenas) console.error('Erro ao carregar atividade do RPG:', erroCenas)
    const contagem = (cenas || []).reduce((r, cena) => {
      if (cena.local_codigo) r[cena.local_codigo] = (r[cena.local_codigo] || 0) + 1
      return r
    }, {})
    const lista = (dadosLocais ?? []).filter(local => ['interna', 'externa', 'secreta'].includes(local.ambiente))
    setCenasPorLocal(contagem)
    setLocais(lista)
    setSelecionado(lista.find(local => local.ambiente === 'interna') ?? lista[0] ?? null)
    setCarregando(false)
  }

  const locaisVisiveis = useMemo(() => locais.filter(local => local.ambiente === ambiente).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [locais, ambiente])
  const secretos = useMemo(() => locais.filter(local => local.ambiente === 'secreta').sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [locais])
  const imagemMapa = ambiente === 'interna'
    ? '/assets/decoracao-vintage/mapas/mapa-interno.png'
    : '/assets/decoracao-vintage/mapas/mapa-externo.png'

  function trocarAmbiente(novo) {
    setAmbiente(novo)
    setMensagem('')
    setSelecionado(locais.find(local => local.ambiente === novo) ?? null)
  }

  function abrirLocal(local) {
    if (!local.desbloqueado) {
      setMensagem(local.motivo_bloqueio || 'Local bloqueado.')
      return
    }
    onAbrirLocal(local)
  }

  function abrirRpg(local, criar = false) {
    if (!local.desbloqueado) {
      setMensagem(local.motivo_bloqueio || 'Local bloqueado.')
      return
    }
    const parametros = new URLSearchParams({ local: local.codigo, nome: local.nome })
    if (criar) parametros.set('nova', '1')
    window.location.href = `/rpg?${parametros.toString()}`
  }

  return (
    <main className="mapa-pagina">
      <button type="button" className="mapa-voltar" onClick={onVoltar}>← Voltar</button>
      <header className="mapa-hero">
        <p>Mapa oficial de Castelobruxo</p>
        <h1>Territórios da escola</h1>
        <span>Os ambientes internos e externos são mostrados em mapas independentes.</span>
      </header>

      <nav className="mapa-abas" aria-label="Escolha do mapa">
        {ABAS.map(aba => <button key={aba.id} type="button" className={ambiente === aba.id ? 'ativo' : ''} onClick={() => trocarAmbiente(aba.id)}>{aba.nome}</button>)}
      </nav>

      {mensagem && <p className="mapa-mensagem">{mensagem}</p>}

      {carregando ? <p className="mapa-estado">Abrindo o mapa oficial...</p> : <>
        <section className="mapa-layout">
          <div className={`mapa-oficial mapa-oficial-${ambiente}`}>
            <img className="mapa-imagem" src={imagemMapa} alt={ambiente === 'interna' ? 'Mapa interno de Castelobruxo' : 'Mapa externo de Castelobruxo'} />
            {locaisVisiveis.map((local, indice) => <button key={local.id} type="button" className={`mapa-ponto ${selecionado?.id === local.id ? 'selecionado' : ''}`} style={{ left: `${local.posicao_x}%`, top: `${local.posicao_y}%` }} onClick={() => setSelecionado(local)} title={local.nome}><span>{indice + 1}</span></button>)}
          </div>

          <aside className="mapa-painel">
            <p className="mapa-painel-rotulo">{ambiente === 'interna' ? 'Dentro da escola' : 'Além dos portões'}</p>
            <div className="mapa-lista">
              {locaisVisiveis.map((local, indice) => <button type="button" key={local.id} className={`${selecionado?.id === local.id ? 'selecionado' : ''} ${local.desbloqueado ? '' : 'bloqueado'}`} onClick={() => { setSelecionado(local); setMensagem('') }}>
                <span>{indice + 1}</span><div><strong>{local.nome}</strong><small>{local.categoria}</small></div>{!local.desbloqueado && <em>🔒</em>}
              </button>)}
            </div>

            {selecionado && <article className="mapa-detalhe">
              <div className="mapa-painel-topo"><span>{selecionado.icone || '📍'}</span><div><small>{selecionado.categoria}</small><h2>{selecionado.nome}</h2></div></div>
              <p>{selecionado.descricao}</p>
              <div className={`mapa-status ${selecionado.desbloqueado ? 'desbloqueado' : 'bloqueado'}`}>{selecionado.desbloqueado ? '✓ Local disponível' : `🔒 ${selecionado.motivo_bloqueio}`}</div>
              <button type="button" disabled={!selecionado.desbloqueado} onClick={() => abrirLocal(selecionado)}>Abrir página do local</button>
              <button type="button" disabled={!selecionado.desbloqueado} onClick={() => abrirRpg(selecionado)}>Ver cenas ({cenasPorLocal[selecionado.codigo] || 0})</button>
              <button type="button" disabled={!selecionado.desbloqueado} onClick={() => abrirRpg(selecionado, true)}>Criar cena</button>
            </article>}
          </aside>
        </section>

        <section className="mapa-secretos">
          <header><p>Registros restritos</p><h2>Locais secretos</h2></header>
          <div>{secretos.map(local => <article key={local.id}><span>{local.icone || '🔐'}</span><h3>{local.nome}</h3><p>{local.descricao}</p><button type="button" onClick={() => abrirRpg(local)} disabled={!local.desbloqueado}>{local.desbloqueado ? 'Investigar' : 'Ainda bloqueado'}</button></article>)}</div>
        </section>
      </>}
    </main>
  )
}
