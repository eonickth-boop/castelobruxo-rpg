import { useMemo, useState } from 'react'
import Notificacao from '../components/Notificacao'
import { itemEhCompravel, motivoDeObtencao } from '../marketAvailabilityGuard'
import '../styles/mercado.css'

const CATEGORIAS = [
  'Todos',
  'Uniformes',
  'Materiais Escolares',
  'Comidas',
  'Itens da Escola',
  'Institucionais',
  'Poções',
  'Plantas',
  'Artefatos',
  'Livros',
  'Vestimentas',
  'Cristais',
  'Utensílios',
]

function normalizarCategoria(valor = '') {
  const texto = String(valor).trim().toLowerCase()
  const mapa = {
    uniforme: 'Uniformes', uniformes: 'Uniformes',
    material: 'Materiais Escolares', materiais: 'Materiais Escolares',
    'material escolar': 'Materiais Escolares', 'materiais escolares': 'Materiais Escolares',
    comida: 'Comidas', comidas: 'Comidas', alimento: 'Comidas', alimentos: 'Comidas',
    'item da escola': 'Itens da Escola', 'itens da escola': 'Itens da Escola',
    institucional: 'Institucionais', institucionais: 'Institucionais',
    pocao: 'Poções', pocoes: 'Poções', poção: 'Poções', poções: 'Poções',
    planta: 'Plantas', plantas: 'Plantas', artefato: 'Artefatos', artefatos: 'Artefatos',
    livro: 'Livros', livros: 'Livros', vestimenta: 'Vestimentas', vestimentas: 'Vestimentas',
    cristal: 'Cristais', cristais: 'Cristais', utensilio: 'Utensílios', utensilios: 'Utensílios',
    utensílio: 'Utensílios', utensílios: 'Utensílios',
  }
  return mapa[texto] || valor || 'Outros'
}

const PASTAS_ITENS = {
  ART: 'ART', CRI: 'CRIS', LIV: 'LIV', PLA: 'PLA', POT: 'POT', UTE: 'UTE', VES: 'VEST',
}

function imagemDoItem(item) {
  if (!item) return ''
  if (item.imagem_url || item.image_url || item.url_imagem) return item.imagem_url || item.image_url || item.url_imagem
  if (!item.imagem || !item.id || item.imagem === 'placeholder.webp') return ''
  const prefixo = String(item.id).slice(0, 3)
  if (['UNI', 'MAT', 'COM', 'ESC', 'BRO'].includes(prefixo)) {
    return `/assets/market/${item.imagem}`
  }
  const pasta = PASTAS_ITENS[prefixo]
  if (!pasta) return ''
  return `/assets/${pasta}/${item.imagem}`
}

function ImagemItem({ src, alt }) {
  const [falhou, setFalhou] = useState(false)
  return src && !falhou
    ? <img src={src} alt={alt} onError={() => setFalhou(true)} />
    : <span aria-hidden="true">✦</span>
}

export default function Mercado({ perfil, saldo, itens = [], itemComprando, mensagem, onComprar, onAbrirInventario, onVoltar }) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [ordenacao, setOrdenacao] = useState('nome')

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return [...itens].filter((item) => {
      const categoriaItem = normalizarCategoria(item.categoria || item.tipo)
      const correspondeCategoria = categoria === 'Todos' || categoriaItem === categoria
      const correspondeBusca = !termo || String(item.nome || '').toLowerCase().includes(termo) || String(item.descricao || '').toLowerCase().includes(termo) || categoriaItem.toLowerCase().includes(termo)
      return correspondeCategoria && correspondeBusca
    }).sort((a, b) => {
      if (ordenacao === 'menor-preco') return Number(a.preco || 0) - Number(b.preco || 0)
      if (ordenacao === 'maior-preco') return Number(b.preco || 0) - Number(a.preco || 0)
      return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
    })
  }, [itens, busca, categoria, ordenacao])

  return (
    <main className="mercado-pagina">
      <div className="mercado-topo-acoes">
        <button type="button" onClick={onVoltar}>← Voltar</button>
        <button type="button" onClick={() => window.location.assign('/beneficios')}>🎁 Benefícios da escola</button>
        <button type="button" onClick={onAbrirInventario}>🎒 Abrir inventário</button>
      </div>

      <header className="mercado-hero">
        <p>Mercado oficial de Castelobruxo</p>
        <h1>Mercado das Cinco Trilhas</h1>
        <span>Bem-vindo, <strong>{perfil?.nome_personagem || perfil?.usuario}</strong></span>
        <div className="mercado-saldo"><small>Saldo disponível</small><strong>💰 {Number(saldo || 0)} Ipês</strong></div>
      </header>

      <section className="mercado-filtros">
        <label><span>Pesquisar</span><input type="search" placeholder="Nome, descrição ou categoria" value={busca} onChange={(evento) => setBusca(evento.target.value)} /></label>
        <label><span>Categoria</span><select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}>{CATEGORIAS.map((opcao) => <option key={opcao}>{opcao}</option>)}</select></label>
        <label><span>Ordenação</span><select value={ordenacao} onChange={(evento) => setOrdenacao(evento.target.value)}><option value="nome">Nome</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option></select></label>
      </section>

      <Notificacao mensagem={mensagem} />
      <div className="mercado-contagem"><span>{itensFiltrados.length} {itensFiltrados.length === 1 ? 'item encontrado' : 'itens encontrados'}</span></div>

      {itens.length === 0 ? (
        <section className="mercado-vazio"><h2>Nenhum item disponível</h2><p>Confira se a tabela <strong>items</strong> possui produtos ativos e se as políticas de leitura estão liberadas.</p></section>
      ) : itensFiltrados.length === 0 ? (
        <section className="mercado-vazio"><h2>Nenhum resultado</h2><p>Tente outra pesquisa ou categoria.</p></section>
      ) : (
        <section className="mercado-grade">
          {itensFiltrados.map((item) => {
            const preco = Number(item.preco || 0)
            const semSaldo = Number(saldo || 0) < preco
            const comprando = itemComprando === item.id
            const categoriaItem = normalizarCategoria(item.categoria || item.tipo)
            const imagem = imagemDoItem(item)
            const compravel = itemEhCompravel(item)
            const motivoObtencao = motivoDeObtencao(item)
            return (
              <article className={`mercado-item${compravel ? '' : ' mercado-item-institucional'}`} key={item.id}>
                <div className="mercado-item-imagem">
                  <ImagemItem src={imagem} alt={item.nome} />
                  {!compravel && <em>Institucional</em>}
                  <small>{categoriaItem}</small>
                </div>
                <div className="mercado-item-conteudo">
                  <h2>{item.nome}</h2>
                  <p>{item.descricao || 'Item mágico disponível no mercado.'}</p>
                  <div className="mercado-item-rodape">
                    <strong className={compravel ? '' : 'mercado-obtencao'}>{compravel ? `💰 ${preco} Ipês` : motivoObtencao}</strong>
                    {compravel && <button type="button" disabled={comprando || semSaldo} onClick={() => onComprar?.(item)}>{comprando ? 'Comprando...' : semSaldo ? 'Saldo insuficiente' : 'Comprar'}</button>}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
