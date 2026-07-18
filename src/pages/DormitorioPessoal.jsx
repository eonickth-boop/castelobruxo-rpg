import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/dormitorio-pessoal.css'

const SLOTS = [
  ['parede_1', 'Parede esquerda'], ['parede_2', 'Parede direita'],
  ['estante_1', 'Estante superior'], ['estante_2', 'Estante inferior'],
  ['mesa', 'Mesa de estudos'], ['trofeu', 'Pedestal'],
  ['criado_mudo', 'Criado-mudo'], ['pe_cama', 'Pé da cama'], ['janela', 'Janela'],
]

const TEMAS = {
  floresta: 'Floresta ancestral', tribo: 'Cores da tribo',
  biblioteca: 'Biblioteca antiga', luar: 'Noite de luar',
}

const MOVEIS = [
  ['mural', 'Mural'], ['cama', 'Cama'], ['pedestal', 'Pedestal'],
  ['mesa', 'Mesa de estudos'], ['estante', 'Estante'],
]

function imagemItem(item) {
  if (!item) return ''
  if (item.imagem_url) return item.imagem_url
  if (item.imagem) return `/assets/${String(item.id || '').slice(0, 3)}/${item.imagem}`
  return ''
}

export default function DormitorioPessoal({ perfil, onVoltar, onAbrirInventario, onAbrirPets, onAbrirCertificados, onAbrirConquistas }) {
  const [config, setConfig] = useState({
    nome: 'Meu dormitório', descricao: '', tema: 'floresta', iluminacao: 'aconchegante',
    mensagem_mural: '', pet_usuario_id: '', moveis_visiveis: Object.fromEntries(MOVEIS.map(([id]) => [id, true])), modo_visita: false,
  })
  const [exibicoes, setExibicoes] = useState([])
  const [colecao, setColecao] = useState([])
  const [pets, setPets] = useState([])
  const [editando, setEditando] = useState(false)
  const [abaEditor, setAbaEditor] = useState('ambiente')
  const [slotSelecionado, setSlotSelecionado] = useState('parede_1')
  const [itemSelecionado, setItemSelecionado] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [telaCheia, setTelaCheia] = useState(false)

  useEffect(() => { carregar() }, [perfil.id])

  async function carregar() {
    setCarregando(true); setMensagem('')
    const [dormitorio, exib, inventario, itens, certificados, conquistas, petsUsuario] = await Promise.all([
      supabase.from('dormitorios').select('*').eq('usuario_id', perfil.id).maybeSingle(),
      supabase.from('dormitorio_exibicoes').select('*').eq('usuario_id', perfil.id),
      supabase.from('inventario').select('id,item_id,quantidade,itens(codigo)').eq('usuario_id', perfil.id),
      supabase.from('items').select('id,nome,categoria,imagem,descricao').eq('ativo', true),
      supabase.from('certificados').select('id,titulo,descricao').eq('usuario_id', perfil.id).order('emitido_em', { ascending: false }),
      supabase.from('conquistas_usuarios').select('id,conquista_id,conquistas(nome,icone,descricao)').eq('usuario_id', perfil.id).eq('desbloqueada', true),
      supabase.from('pets_usuarios').select('id,nome_personalizado,equipado,pets(nome,especie,imagem_url,foto_url)').eq('usuario_id', perfil.id),
    ])

    if (dormitorio.data) setConfig({ ...config, ...dormitorio.data, pet_usuario_id: dormitorio.data.pet_usuario_id || '', moveis_visiveis: dormitorio.data.moveis_visiveis || config.moveis_visiveis })
    setExibicoes(exib.data || [])
    setPets(petsUsuario.data || [])

    const itensMap = Object.fromEntries((itens.data || []).map((i) => [i.id, i]))
    const colecaoItens = (inventario.data || []).map((r) => {
      const item = itensMap[r.itens?.codigo]
      return item ? { chave: `item:${r.id}`, tipo: 'item', referencia_id: r.id, titulo: item.nome, subtitulo: item.categoria, descricao: item.descricao, imagem: imagemItem(item) } : null
    }).filter(Boolean)
    const colecaoCertificados = (certificados.data || []).map((c) => ({ chave: `certificado:${c.id}`, tipo: 'certificado', referencia_id: c.id, titulo: c.titulo, subtitulo: 'Certificado', descricao: c.descricao, imagem: '' }))
    const colecaoConquistas = (conquistas.data || []).map((c) => ({ chave: `conquista:${c.id}`, tipo: 'conquista', referencia_id: c.id, titulo: c.conquistas?.nome || 'Conquista', subtitulo: 'Conquista', descricao: c.conquistas?.descricao, imagem: c.conquistas?.icone || '' }))
    setColecao([...colecaoItens, ...colecaoCertificados, ...colecaoConquistas])
    setCarregando(false)
  }

  async function salvarConfiguracao(evento) {
    evento?.preventDefault()
    setSalvando(true); setMensagem('')
    const payload = {
      usuario_id: perfil.id, nome: config.nome.trim(), descricao: config.descricao.trim(), tema: config.tema,
      iluminacao: config.iluminacao, mensagem_mural: config.mensagem_mural.trim(), pet_usuario_id: config.pet_usuario_id || null,
      moveis_visiveis: config.moveis_visiveis, modo_visita: Boolean(config.modo_visita), atualizado_em: new Date().toISOString(),
    }
    const { error } = await supabase.from('dormitorios').upsert(payload)
    setSalvando(false)
    if (error) { setMensagem(error.message || 'Não foi possível salvar o dormitório.'); return }
    setMensagem('Dormitório salvo com sucesso.')
  }

  async function exibirNoSlot(itemDireto) {
    const escolhido = itemDireto || colecao.find((item) => item.chave === itemSelecionado)
    if (!escolhido) { setMensagem('Escolha algo para exibir.'); return }
    const { error } = await supabase.from('dormitorio_exibicoes').upsert({
      usuario_id: perfil.id, slot: slotSelecionado, tipo: escolhido.tipo, referencia_id: escolhido.referencia_id,
      titulo_snapshot: escolhido.titulo, imagem_snapshot: escolhido.imagem || null,
    }, { onConflict: 'usuario_id,slot' })
    if (error) { setMensagem(error.message || 'Não foi possível decorar este espaço.'); return }
    setMensagem(`${escolhido.titulo} foi colocado em ${SLOTS.find(([id]) => id === slotSelecionado)?.[1]}.`)
    setItemSelecionado(''); await carregar()
  }

  async function limparSlot(slot) {
    const { error } = await supabase.from('dormitorio_exibicoes').delete().eq('usuario_id', perfil.id).eq('slot', slot)
    if (error) { setMensagem('Não foi possível remover a decoração.'); return }
    await carregar()
  }

  function alternarMovel(id) {
    setConfig((atual) => ({ ...atual, moveis_visiveis: { ...atual.moveis_visiveis, [id]: atual.moveis_visiveis?.[id] === false } }))
  }

  const porSlot = useMemo(() => Object.fromEntries(exibicoes.map((e) => [e.slot, e])), [exibicoes])
  const pet = pets.find((p) => p.id === config.pet_usuario_id)
  const nome = perfil.nome_personagem || perfil.usuario
  const colecaoFiltrada = useMemo(() => colecao.filter((item) => {
    const correspondeTipo = filtro === 'todos' || item.tipo === filtro
    const termo = busca.trim().toLowerCase()
    return correspondeTipo && (!termo || `${item.titulo} ${item.subtitulo} ${item.descricao || ''}`.toLowerCase().includes(termo))
  }), [colecao, filtro, busca])

  return <main className={`dormitorio-pagina tema-${config.tema} luz-${config.iluminacao} ${telaCheia ? 'dormitorio-tela-cheia' : ''}`}>
    <header className="dormitorio-topo">
      <button onClick={onVoltar}>← Voltar</button>
      <div><small>Espaço pessoal de {nome}</small><h1>{config.nome}</h1><p>{config.descricao || 'Um refúgio dentro de Castelobruxo.'}</p></div>
      <div className="dormitorio-acoes-topo"><button onClick={() => setTelaCheia((v) => !v)}>{telaCheia ? 'Sair da visão ampla' : 'Visão ampla'}</button><button onClick={() => setEditando((v) => !v)}>{editando ? 'Concluir edição' : 'Personalizar'}</button></div>
    </header>

    {editando && <section className="dormitorio-editor">
      <nav className="dormitorio-editor-abas">
        <button className={abaEditor === 'ambiente' ? 'ativo' : ''} onClick={() => setAbaEditor('ambiente')}>Ambiente</button>
        <button className={abaEditor === 'moveis' ? 'ativo' : ''} onClick={() => setAbaEditor('moveis')}>Móveis</button>
        <button className={abaEditor === 'colecao' ? 'ativo' : ''} onClick={() => setAbaEditor('colecao')}>Coleção</button>
      </nav>

      {abaEditor === 'ambiente' && <form className="dormitorio-editor-form" onSubmit={salvarConfiguracao}>
        <label>Nome do dormitório<input minLength="2" maxLength="60" required value={config.nome} onChange={(e) => setConfig({ ...config, nome: e.target.value })} /></label>
        <label>Tema<select value={config.tema} onChange={(e) => setConfig({ ...config, tema: e.target.value })}>{Object.entries(TEMAS).map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select></label>
        <label>Iluminação<select value={config.iluminacao} onChange={(e) => setConfig({ ...config, iluminacao: e.target.value })}><option value="aconchegante">Aconchegante</option><option value="clara">Clara</option><option value="noturna">Noturna</option></select></label>
        <label>Companheiro<select value={config.pet_usuario_id} onChange={(e) => setConfig({ ...config, pet_usuario_id: e.target.value })}><option value="">Nenhum</option>{pets.map((p) => <option key={p.id} value={p.id}>{p.nome_personalizado || p.pets?.nome}</option>)}</select></label>
        <label className="largo">Descrição<textarea maxLength="500" rows="3" value={config.descricao} onChange={(e) => setConfig({ ...config, descricao: e.target.value })} /></label>
        <label className="largo">Mensagem no mural<textarea maxLength="240" rows="2" value={config.mensagem_mural} onChange={(e) => setConfig({ ...config, mensagem_mural: e.target.value })} /></label>
        <label className="dormitorio-toggle largo"><input type="checkbox" checked={config.modo_visita} onChange={(e) => setConfig({ ...config, modo_visita: e.target.checked })} /><span>Permitir que o dormitório seja exibido futuramente no perfil público</span></label>
        <button className="largo" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar ambiente'}</button>
      </form>}

      {abaEditor === 'moveis' && <div className="dormitorio-moveis-editor">
        <div><small>Conjunto atual</small><h2>{TEMAS[config.tema]}</h2><p>Ative ou esconda os móveis principais. O conjunto visual poderá receber os arquivos separados do pacote enviado.</p></div>
        <div className="dormitorio-moveis-grade">{MOVEIS.map(([id, rotulo]) => <button key={id} className={config.moveis_visiveis?.[id] !== false ? 'ativo' : ''} onClick={() => alternarMovel(id)}><span>{config.moveis_visiveis?.[id] !== false ? '✓' : '+'}</span><strong>{rotulo}</strong></button>)}</div>
        <button onClick={salvarConfiguracao} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar móveis'}</button>
      </div>}

      {abaEditor === 'colecao' && <div className="dormitorio-colecao-editor">
        <div className="dormitorio-colecao-filtros"><select value={slotSelecionado} onChange={(e) => setSlotSelecionado(e.target.value)}>{SLOTS.map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select><input placeholder="Buscar na coleção" value={busca} onChange={(e) => setBusca(e.target.value)} /><select value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="todos">Tudo</option><option value="item">Itens</option><option value="certificado">Certificados</option><option value="conquista">Conquistas</option></select></div>
        <div className="dormitorio-colecao-grade">{colecaoFiltrada.map((item) => <button key={item.chave} onClick={() => exibirNoSlot(item)}>{item.imagem ? (String(item.imagem).startsWith('http') || String(item.imagem).startsWith('/') ? <img src={item.imagem} alt="" /> : <span>{item.imagem}</span>) : <span>{item.tipo === 'certificado' ? '📜' : item.tipo === 'conquista' ? '🏆' : '✦'}</span>}<strong>{item.titulo}</strong><small>{item.subtitulo}</small></button>)}</div>
        {!carregando && colecaoFiltrada.length === 0 && <p className="dormitorio-vazio">Nenhum objeto encontrado nessa categoria.</p>}
      </div>}
    </section>}

    <section className="dormitorio-cena" aria-label={`Dormitório ${TEMAS[config.tema]}`}>
      <div className="dormitorio-luz-ambiente" />
      <div className="dormitorio-janela"><span>✦</span>{porSlot.janela && <Exibicao item={porSlot.janela} onRemover={() => limparSlot('janela')} />}</div>
      {config.moveis_visiveis?.mural !== false && <div className="dormitorio-mural"><small>Mural pessoal</small><p>{config.mensagem_mural || '“Conhecer, respeitar e proteger.”'}</p>{porSlot.parede_1 && <Exibicao item={porSlot.parede_1} onRemover={() => limparSlot('parede_1')} />}</div>}
      {config.moveis_visiveis?.cama !== false && <div className="dormitorio-cama"><div /><span>Seu descanso</span>{porSlot.pe_cama && <Exibicao item={porSlot.pe_cama} onRemover={() => limparSlot('pe_cama')} />}</div>}
      {config.moveis_visiveis?.mesa !== false && <div className="dormitorio-mesa"><div className="tampo" /><strong>Mesa de estudos</strong>{porSlot.mesa && <Exibicao item={porSlot.mesa} onRemover={() => limparSlot('mesa')} />}{porSlot.criado_mudo && <Exibicao item={porSlot.criado_mudo} onRemover={() => limparSlot('criado_mudo')} />}</div>}
      {config.moveis_visiveis?.estante !== false && <div className="dormitorio-estante"><strong>Estante</strong>{['estante_1','estante_2'].map((slot) => porSlot[slot] ? <Exibicao key={slot} item={porSlot[slot]} onRemover={() => limparSlot(slot)} /> : <span key={slot} className="slot-vazio">Espaço vazio</span>)}</div>}
      <div className="dormitorio-parede direita">{porSlot.parede_2 ? <Exibicao item={porSlot.parede_2} onRemover={() => limparSlot('parede_2')} /> : <span>Espaço para lembrança</span>}</div>
      {config.moveis_visiveis?.pedestal !== false && <div className="dormitorio-trofeu">{porSlot.trofeu ? <Exibicao item={porSlot.trofeu} onRemover={() => limparSlot('trofeu')} /> : <span>Pedestal vazio</span>}</div>}
      {pet && <div className="dormitorio-pet">{(pet.pets?.foto_url || pet.pets?.imagem_url) ? <img src={pet.pets.foto_url || pet.pets.imagem_url} alt={pet.nome_personalizado || pet.pets?.nome} /> : <span>🐾</span>}<strong>{pet.nome_personalizado || pet.pets?.nome}</strong></div>}
      {editando && <div className="dormitorio-modo-edicao">Modo de edição ativo</div>}
    </section>

    {!editando && <section className="dormitorio-resumo"><article><small>Tema</small><strong>{TEMAS[config.tema]}</strong></article><article><small>Iluminação</small><strong>{config.iluminacao}</strong></article><article><small>Lembranças exibidas</small><strong>{exibicoes.length}</strong></article><article><small>Companheiro</small><strong>{pet ? pet.nome_personalizado || pet.pets?.nome : 'Nenhum'}</strong></article></section>}

    <section className="dormitorio-atalhos"><button onClick={onAbrirInventario}>Inventário</button><button onClick={onAbrirPets}>Companheiros</button><button onClick={onAbrirCertificados}>Certificados</button><button onClick={onAbrirConquistas}>Conquistas</button></section>
    {mensagem && <p className="dormitorio-mensagem" role="status">{mensagem}</p>}
  </main>
}

function Exibicao({ item, onRemover }) {
  return <article className={`dormitorio-exibicao tipo-${item.tipo}`} title={item.titulo_snapshot}>
    {item.imagem_snapshot ? (String(item.imagem_snapshot).startsWith('http') || String(item.imagem_snapshot).startsWith('/') ? <img src={item.imagem_snapshot} alt="" /> : <span>{item.imagem_snapshot}</span>) : <span>{item.tipo === 'certificado' ? '📜' : item.tipo === 'conquista' ? '🏆' : '✦'}</span>}
    <strong>{item.titulo_snapshot}</strong><button type="button" aria-label={`Remover ${item.titulo_snapshot}`} onClick={onRemover}>×</button>
  </article>
}