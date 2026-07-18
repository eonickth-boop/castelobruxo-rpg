import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/dormitorio-pessoal.css'

const SLOTS = [
  ['parede_1', 'Parede esquerda'], ['parede_2', 'Parede direita'],
  ['estante_1', 'Estante superior'], ['estante_2', 'Estante inferior'],
  ['mesa', 'Mesa de estudos'], ['trofeu', 'Pedestal'],
]

const TEMAS = {
  floresta: 'Floresta ancestral', tribo: 'Cores da tribo',
  biblioteca: 'Biblioteca antiga', luar: 'Noite de luar',
}

function imagemItem(item) {
  if (!item) return ''
  if (item.imagem_url) return item.imagem_url
  if (item.imagem) return `/assets/${String(item.id || '').slice(0, 3)}/${item.imagem}`
  return ''
}

export default function DormitorioPessoal({ perfil, onVoltar, onAbrirInventario, onAbrirPets, onAbrirCertificados, onAbrirConquistas }) {
  const [config, setConfig] = useState({ nome: 'Meu dormitório', descricao: '', tema: 'floresta', iluminacao: 'aconchegante', mensagem_mural: '', pet_usuario_id: '' })
  const [exibicoes, setExibicoes] = useState([])
  const [colecao, setColecao] = useState([])
  const [pets, setPets] = useState([])
  const [editando, setEditando] = useState(false)
  const [slotSelecionado, setSlotSelecionado] = useState('parede_1')
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [perfil.id])

  async function carregar() {
    setMensagem('')
    const [dormitorio, exib, inventario, itens, certificados, conquistas, petsUsuario] = await Promise.all([
      supabase.from('dormitorios').select('*').eq('usuario_id', perfil.id).maybeSingle(),
      supabase.from('dormitorio_exibicoes').select('*').eq('usuario_id', perfil.id),
      supabase.from('inventario').select('id,item_id,quantidade,itens(codigo)').eq('usuario_id', perfil.id),
      supabase.from('items').select('id,nome,categoria,imagem,descricao').eq('ativo', true),
      supabase.from('certificados').select('id,titulo,descricao').eq('usuario_id', perfil.id).order('emitido_em', { ascending: false }),
      supabase.from('conquistas_usuarios').select('id,conquista_id,conquistas(nome,icone,descricao)').eq('usuario_id', perfil.id).eq('desbloqueada', true),
      supabase.from('pets_usuarios').select('id,nome_personalizado,equipado,pets(nome,especie,imagem_url,foto_url)').eq('usuario_id', perfil.id),
    ])

    if (dormitorio.data) setConfig({ ...dormitorio.data, pet_usuario_id: dormitorio.data.pet_usuario_id || '' })
    setExibicoes(exib.data || [])
    setPets(petsUsuario.data || [])

    const itensMap = Object.fromEntries((itens.data || []).map((i) => [i.id, i]))
    const colecaoItens = (inventario.data || []).map((r) => {
      const item = itensMap[r.itens?.codigo]
      return item ? { chave: `item:${r.id}`, tipo: 'item', referencia_id: r.id, titulo: item.nome, subtitulo: item.categoria, imagem: imagemItem(item) } : null
    }).filter(Boolean)
    const colecaoCertificados = (certificados.data || []).map((c) => ({ chave: `certificado:${c.id}`, tipo: 'certificado', referencia_id: c.id, titulo: c.titulo, subtitulo: 'Certificado', imagem: '' }))
    const colecaoConquistas = (conquistas.data || []).map((c) => ({ chave: `conquista:${c.id}`, tipo: 'conquista', referencia_id: c.id, titulo: c.conquistas?.nome || 'Conquista', subtitulo: 'Conquista', imagem: c.conquistas?.icone || '' }))
    setColecao([...colecaoItens, ...colecaoCertificados, ...colecaoConquistas])
  }

  async function salvarConfiguracao(evento) {
    evento.preventDefault()
    setSalvando(true); setMensagem('')
    const payload = { usuario_id: perfil.id, nome: config.nome.trim(), descricao: config.descricao.trim(), tema: config.tema, iluminacao: config.iluminacao, mensagem_mural: config.mensagem_mural.trim(), pet_usuario_id: config.pet_usuario_id || null, atualizado_em: new Date().toISOString() }
    const { error } = await supabase.from('dormitorios').upsert(payload)
    setSalvando(false)
    if (error) { setMensagem(error.message || 'Não foi possível salvar o dormitório.'); return }
    setEditando(false); setMensagem('Dormitório atualizado.')
  }

  async function exibirNoSlot() {
    const escolhido = colecao.find((item) => item.chave === itemSelecionado)
    if (!escolhido) { setMensagem('Escolha algo para exibir.'); return }
    const { error } = await supabase.from('dormitorio_exibicoes').upsert({ usuario_id: perfil.id, slot: slotSelecionado, tipo: escolhido.tipo, referencia_id: escolhido.referencia_id, titulo_snapshot: escolhido.titulo, imagem_snapshot: escolhido.imagem || null }, { onConflict: 'usuario_id,slot' })
    if (error) { setMensagem(error.message || 'Não foi possível decorar este espaço.'); return }
    setMensagem(`${escolhido.titulo} foi colocado no dormitório.`); setItemSelecionado(''); await carregar()
  }

  async function limparSlot(slot) {
    await supabase.from('dormitorio_exibicoes').delete().eq('usuario_id', perfil.id).eq('slot', slot)
    await carregar()
  }

  const porSlot = useMemo(() => Object.fromEntries(exibicoes.map((e) => [e.slot, e])), [exibicoes])
  const pet = pets.find((p) => p.id === config.pet_usuario_id)
  const nome = perfil.nome_personagem || perfil.usuario

  return <main className={`dormitorio-pagina tema-${config.tema} luz-${config.iluminacao}`}>
    <header className="dormitorio-topo">
      <button onClick={onVoltar}>← Voltar</button>
      <div><small>Espaço pessoal de {nome}</small><h1>{config.nome}</h1><p>{config.descricao || 'Um refúgio dentro de Castelobruxo.'}</p></div>
      <button onClick={() => setEditando((v) => !v)}>{editando ? 'Fechar edição' : 'Personalizar'}</button>
    </header>

    {editando && <form className="dormitorio-editor" onSubmit={salvarConfiguracao}>
      <label>Nome do dormitório<input minLength="2" maxLength="60" required value={config.nome} onChange={(e) => setConfig({ ...config, nome: e.target.value })} /></label>
      <label>Tema<select value={config.tema} onChange={(e) => setConfig({ ...config, tema: e.target.value })}>{Object.entries(TEMAS).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
      <label>Iluminação<select value={config.iluminacao} onChange={(e) => setConfig({ ...config, iluminacao: e.target.value })}><option value="aconchegante">Aconchegante</option><option value="clara">Clara</option><option value="noturna">Noturna</option></select></label>
      <label>Companheiro<select value={config.pet_usuario_id} onChange={(e) => setConfig({ ...config, pet_usuario_id: e.target.value })}><option value="">Nenhum</option>{pets.map((p) => <option key={p.id} value={p.id}>{p.nome_personalizado || p.pets?.nome}</option>)}</select></label>
      <label className="largo">Descrição<textarea maxLength="500" rows="3" value={config.descricao} onChange={(e) => setConfig({ ...config, descricao: e.target.value })} /></label>
      <label className="largo">Mensagem no mural<textarea maxLength="240" rows="2" value={config.mensagem_mural} onChange={(e) => setConfig({ ...config, mensagem_mural: e.target.value })} /></label>
      <button className="largo" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar personalização'}</button>
    </form>}

    <section className="dormitorio-cena">
      <div className="dormitorio-janela"><span>✦</span></div>
      <div className="dormitorio-mural"><small>Mural pessoal</small><p>{config.mensagem_mural || '“Conhecer, respeitar e proteger.”'}</p></div>
      <div className="dormitorio-cama"><div /><span>Seu descanso</span></div>
      <div className="dormitorio-mesa"><div className="tampo" /><strong>Mesa de estudos</strong>{porSlot.mesa && <Exibicao item={porSlot.mesa} onRemover={() => limparSlot('mesa')} />}</div>
      <div className="dormitorio-estante"><strong>Estante</strong>{['estante_1','estante_2'].map((slot) => porSlot[slot] ? <Exibicao key={slot} item={porSlot[slot]} onRemover={() => limparSlot(slot)} /> : <span key={slot} className="slot-vazio">Espaço vazio</span>)}</div>
      <div className="dormitorio-parede esquerda">{porSlot.parede_1 ? <Exibicao item={porSlot.parede_1} onRemover={() => limparSlot('parede_1')} /> : <span>Quadro vazio</span>}</div>
      <div className="dormitorio-parede direita">{porSlot.parede_2 ? <Exibicao item={porSlot.parede_2} onRemover={() => limparSlot('parede_2')} /> : <span>Quadro vazio</span>}</div>
      <div className="dormitorio-trofeu">{porSlot.trofeu ? <Exibicao item={porSlot.trofeu} onRemover={() => limparSlot('trofeu')} /> : <span>Pedestal vazio</span>}</div>
      {pet && <div className="dormitorio-pet">{(pet.pets?.foto_url || pet.pets?.imagem_url) ? <img src={pet.pets.foto_url || pet.pets.imagem_url} alt={pet.nome_personalizado || pet.pets?.nome} /> : <span>🐾</span>}<strong>{pet.nome_personalizado || pet.pets?.nome}</strong></div>}
    </section>

    <section className="dormitorio-decorar">
      <div><small>Decoração por posições</small><h2>Exibir uma lembrança</h2><p>Escolha um item, certificado ou conquista e defina onde ele ficará.</p></div>
      <select value={slotSelecionado} onChange={(e) => setSlotSelecionado(e.target.value)}>{SLOTS.map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select>
      <select value={itemSelecionado} onChange={(e) => setItemSelecionado(e.target.value)}><option value="">Escolha da coleção</option>{colecao.map((i) => <option key={i.chave} value={i.chave}>{i.titulo} · {i.subtitulo}</option>)}</select>
      <button onClick={exibirNoSlot}>Colocar no dormitório</button>
    </section>

    <section className="dormitorio-atalhos"><button onClick={onAbrirInventario}>Inventário</button><button onClick={onAbrirPets}>Companheiros</button><button onClick={onAbrirCertificados}>Certificados</button><button onClick={onAbrirConquistas}>Conquistas</button></section>
    {mensagem && <p className="dormitorio-mensagem">{mensagem}</p>}
  </main>
}

function Exibicao({ item, onRemover }) {
  return <article className={`dormitorio-exibicao tipo-${item.tipo}`} title={item.titulo_snapshot}>
    {item.imagem_snapshot ? (String(item.imagem_snapshot).startsWith('http') || String(item.imagem_snapshot).startsWith('/') ? <img src={item.imagem_snapshot} alt="" /> : <span>{item.imagem_snapshot}</span>) : <span>{item.tipo === 'certificado' ? '📜' : item.tipo === 'conquista' ? '🏆' : '✦'}</span>}
    <strong>{item.titulo_snapshot}</strong><button aria-label="Remover" onClick={onRemover}>×</button>
  </article>
}
