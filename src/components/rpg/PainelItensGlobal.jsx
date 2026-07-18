import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/rpg-itens.css'

const PASTAS_ITENS = {
  ART: 'ART',
  CRI: 'CRIS',
  LIV: 'LIV',
  PLA: 'PLA',
  POT: 'POT',
  UTE: 'UTE',
  VES: 'VEST',
}

function imagemDoItem(item) {
  if (!item) return ''
  if (item.imagem_url || item.image_url || item.url_imagem) {
    return item.imagem_url || item.image_url || item.url_imagem
  }
  if (!item.imagem || !item.id) return ''
  const pasta = PASTAS_ITENS[String(item.id).slice(0, 3)]
  return pasta ? `/assets/${pasta}/${item.imagem}` : ''
}

export default function PainelItensGlobal() {
  const [cenaId, setCenaId] = useState('')
  const [aberto, setAberto] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [cena, setCena] = useState(null)
  const [participando, setParticipando] = useState(false)
  const [inventario, setInventario] = useState([])
  const [usos, setUsos] = useState([])
  const [perfis, setPerfis] = useState({})
  const [selecionadoId, setSelecionadoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    const verificarUrl = () => {
      const id = new URLSearchParams(window.location.search).get('cena') || ''
      setCenaId((atual) => (atual === id ? atual : id))
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

    const [resCena, resParticipante, resInventario, resCatalogo, resUsos] = await Promise.all([
      supabase.from('rpg_cenas').select('*').eq('id', cenaId).maybeSingle(),
      supabase.from('rpg_participantes').select('id').eq('cena_id', cenaId).eq('usuario_id', novaSessao.user.id).maybeSingle(),
      supabase.from('inventario').select('id,quantidade,adquirido_em,itens(codigo)').eq('usuario_id', novaSessao.user.id).order('adquirido_em', { ascending: false }),
      supabase.from('items').select('*').eq('ativo', true),
      supabase.from('rpg_usos_itens').select('*').eq('cena_id', cenaId).order('criado_em', { ascending: false }),
    ])

    if (resCena.error || !resCena.data) return
    setCena(resCena.data)
    setParticipando(Boolean(resParticipante.data))

    const catalogo = Object.fromEntries((resCatalogo.data || []).map((item) => [item.id, item]))
    const lista = (resInventario.data || []).map((registro) => ({
      ...registro,
      item: catalogo[registro.itens?.codigo] || null,
    })).filter((registro) => registro.item && Number(registro.quantidade) > 0)

    setInventario(lista)
    setUsos(resUsos.data || [])
    if (!selecionadoId && lista.length) setSelecionadoId(lista[0].id)
    if (selecionadoId && !lista.some((registro) => registro.id === selecionadoId)) {
      setSelecionadoId(lista[0]?.id || '')
    }

    const ids = [...new Set((resUsos.data || []).map((uso) => uso.usuario_id))]
    if (ids.length) {
      const { data } = await supabase.from('perfis').select('id,usuario,nome_personagem').in('id', ids)
      setPerfis(Object.fromEntries((data || []).map((perfil) => [perfil.id, perfil])))
    }
  }

  const selecionado = useMemo(
    () => inventario.find((registro) => registro.id === selecionadoId) || null,
    [inventario, selecionadoId],
  )

  function nomePerfil(id) {
    const dados = perfis[id]
    return dados?.nome_personagem || dados?.usuario || 'Personagem'
  }

  async function usarItem(evento) {
    evento.preventDefault()
    if (!selecionado || processando) return
    const aviso = selecionado.item.consumivel
      ? `Usar ${selecionado.item.nome}? Uma unidade será consumida.`
      : `Registrar o uso de ${selecionado.item.nome} nesta cena?`
    if (!window.confirm(aviso)) return

    setProcessando(true)
    setMensagem('')
    const { data, error } = await supabase.rpc('rpg_usar_item', {
      p_cena_id: cenaId,
      p_inventario_id: selecionado.id,
      p_descricao: descricao.trim(),
    })
    setProcessando(false)

    if (error) {
      setMensagem(error.message || 'Não foi possível usar o item.')
      return
    }

    setDescricao('')
    setMensagem(data.consumido
      ? `${data.item_nome} foi usado e uma unidade saiu do inventário.`
      : `${data.item_nome} foi registrado na cena sem ser consumido.`)
    await carregarTudo()
  }

  if (!cenaId || !cena || !sessao) return null

  return (
    <div className="rpg-itens-global">
      <button type="button" className="rpg-itens-atalho" onClick={() => setAberto((valor) => !valor)}>
        🎒 Itens
      </button>

      {aberto && <button className="rpg-itens-overlay" aria-label="Fechar painel" onClick={() => setAberto(false)} />}

      <aside className={`rpg-itens-painel ${aberto ? 'aberto' : ''}`}>
        <header>
          <div><small>Inventário da cena</small><h2>Usar item</h2></div>
          <button type="button" onClick={() => setAberto(false)}>×</button>
        </header>

        {!participando ? (
          <section className="rpg-itens-aviso"><p>Entre na cena para usar itens do seu inventário.</p></section>
        ) : cena.status !== 'aberta' ? (
          <section className="rpg-itens-aviso"><p>Itens só podem ser usados enquanto a cena estiver aberta.</p></section>
        ) : inventario.length === 0 ? (
          <section className="rpg-itens-aviso"><p>Seu inventário está vazio.</p></section>
        ) : (
          <>
            <section className="rpg-itens-lista">
              <h3>Meu inventário</h3>
              <div>
                {inventario.map((registro) => {
                  const imagem = imagemDoItem(registro.item)
                  return (
                    <button
                      type="button"
                      key={registro.id}
                      className={selecionadoId === registro.id ? 'selecionado' : ''}
                      onClick={() => setSelecionadoId(registro.id)}
                    >
                      <span>{imagem ? <img src={imagem} alt="" /> : '✦'}</span>
                      <p><strong>{registro.item.nome}</strong><small>{registro.item.categoria} · ×{registro.quantidade}</small></p>
                      <b>{registro.item.consumivel ? 'Consumível' : 'Reutilizável'}</b>
                    </button>
                  )
                })}
              </div>
            </section>

            {selecionado && (
              <section className="rpg-item-selecionado">
                <h3>{selecionado.item.nome}</h3>
                <p>{selecionado.item.descricao || 'Item mágico do inventário.'}</p>
                {selecionado.item.efeito_rpg && <small>Efeito: {selecionado.item.efeito_rpg}</small>}
                <form onSubmit={usarItem}>
                  <label>Como o personagem usará o item?
                    <textarea rows="3" maxLength="500" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: aplica a poção sobre o ferimento antes de continuar." />
                  </label>
                  <button disabled={processando} type="submit">
                    {selecionado.item.consumivel ? 'Usar e consumir 1' : 'Usar na cena'}
                  </button>
                </form>
              </section>
            )}
          </>
        )}

        <section className="rpg-historico-itens">
          <h3>Usos nesta cena</h3>
          {usos.length === 0 ? <p>Nenhum item foi usado ainda.</p> : usos.map((uso) => (
            <article key={uso.id}>
              <div><strong>{uso.item_nome}</strong><span>{nomePerfil(uso.usuario_id)}</span></div>
              <p>{uso.descricao_uso || 'Uso narrativo sem descrição adicional.'}</p>
              <small>{uso.consumido ? '1 unidade consumida' : 'Item preservado'} · {new Date(uso.criado_em).toLocaleString('pt-BR')}</small>
            </article>
          ))}
        </section>

        {mensagem && <p className="rpg-itens-mensagem">{mensagem}</p>}
      </aside>
    </div>
  )
}
