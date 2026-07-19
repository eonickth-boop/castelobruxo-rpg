import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import '../styles/livro.css'

const estilosCapa = {
  Enciclopédias: ['enciclopedias', '✦'], Herbologia: ['herbologia', '❧'], História: ['historia', '☀'],
  Feitiços: ['feiticos', '✧'], Poções: ['pocoes', '⚗'], Minerais: ['minerais', '◆'],
  Exploração: ['exploracao', '⌖'], Literatura: ['literatura', '❦'], Astronomia: ['astronomia', '☾'], Cultura: ['cultura', '♨'],
  Criaturas: ['criaturas', '♞'], Castelobruxo: ['castelobruxo', '✺'],
}

const Pagina = forwardRef(function Pagina({ titulo, conteudo, numero, imagemUrl, capa = false, categoria, autor }, ref) {
  const [classeCapa, simbolo] = estilosCapa[categoria] || ['geral', '❦']
  return <article ref={ref} className={`pagina-livro ${capa ? `pagina-capa pagina-capa-${classeCapa}` : ''}`} data-density={capa ? 'hard' : 'soft'}>
    {capa ? <div className="conteudo-capa">
      {imagemUrl ? <img src={imagemUrl} alt={titulo} className="imagem-capa-livro" /> : <div className="capa-leitor-css"><span>{simbolo}</span><small>{categoria || 'Acervo Geral'}</small></div>}
      <h1>{titulo}</h1><p>{autor || 'Arquivo Central de Castelobruxo'}</p>
    </div> : <><div className="ornamento-pagina">❦</div>{titulo && <h2>{titulo}</h2>}{imagemUrl && <img src={imagemUrl} alt={titulo || `Página ${numero}`} className="imagem-pagina-livro" />}<div className="texto-pagina">{String(conteudo || '').split('\n').map((paragrafo, indice) => paragrafo.trim() ? <p key={indice}>{paragrafo}</p> : <br key={indice} />)}</div><span className="numero-pagina">{numero}</span></>}
  </article>
})

export default function Livro({ livro, paginas, onFechar, paginaInicial, modoAula = false }) {
  const livroRef = useRef(null)
  const [paginaAtual, setPaginaAtual] = useState(0)
  useEffect(() => { setPaginaAtual(0) }, [livro?.id, paginas])
  const totalPaginas = paginas.length
  const paginaExibida = useMemo(() => paginaAtual === 0 ? 'Capa' : (paginas[paginaAtual - 1]?.numero ?? paginaInicial ?? paginaAtual), [paginaAtual, paginas, paginaInicial])
  const progresso = totalPaginas === 0 ? 0 : Math.min(100, Math.round((paginaAtual / totalPaginas) * 100))

  return <main className="leitor-livro">
    <header className="barra-leitor"><button type="button" className="leitor-voltar" onClick={onFechar}>← {modoAula ? 'Voltar para a aula' : 'Biblioteca'}</button><div className="dados-leitura"><strong>{livro.titulo}</strong><span>{paginaAtual === 0 ? 'Capa' : `Página ${paginaExibida}`} · {totalPaginas} páginas</span></div></header>
    <div className="leitor-progresso" aria-label={`Progresso de leitura: ${progresso}%`}><span style={{ width: `${progresso}%` }} /></div>
    {paginas.length === 0 && <p className="leitor-sem-paginas">Este livro ainda não possui páginas cadastradas.</p>}
    <section className="area-livro"><HTMLFlipBook ref={livroRef} width={420} height={600} size="stretch" minWidth={280} maxWidth={480} minHeight={420} maxHeight={680} showCover usePortrait drawShadow maxShadowOpacity={0.42} flippingTime={750} mobileScrollSupport onFlip={evento => setPaginaAtual(evento.data)} className="livro-pageflip">
      <Pagina capa titulo={livro.titulo} autor={livro.autor} categoria={livro.categoria} imagemUrl={livro.capa_url} />
      {paginas.map(pagina => <Pagina key={pagina.id} titulo={pagina.titulo} conteudo={pagina.conteudo} imagemUrl={pagina.imagem_url} numero={pagina.numero} />)}
    </HTMLFlipBook></section>
    <nav className="controles-livro" aria-label="Controles do livro"><button type="button" onClick={() => livroRef.current?.pageFlip()?.flipPrev()} disabled={paginaAtual === 0}>← Página anterior</button><span>{paginaAtual === 0 ? 'Capa' : `${paginaExibida} de ${totalPaginas}`}</span><button type="button" onClick={() => livroRef.current?.pageFlip()?.flipNext()} disabled={paginaAtual >= totalPaginas}>Próxima página →</button></nav>
  </main>
}
