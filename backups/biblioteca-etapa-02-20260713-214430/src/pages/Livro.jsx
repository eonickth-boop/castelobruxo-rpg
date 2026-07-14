import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react'
import HTMLFlipBook from 'react-pageflip'
import '../styles/livro.css'

const Pagina = forwardRef(function Pagina(
  { titulo, conteudo, numero, imagemUrl, capa = false },
  ref,
) {
  return (
    <article
      ref={ref}
      className={`pagina-livro ${capa ? 'pagina-capa' : ''}`}
      data-density={capa ? 'hard' : 'soft'}
    >
      {capa ? (
        <div className="conteudo-capa">
          {imagemUrl && (
            <img
              src={imagemUrl}
              alt={titulo}
              className="imagem-capa-livro"
            />
          )}

          <h1>{titulo}</h1>
          <p>Arquivo Central de Castelobruxo</p>
        </div>
      ) : (
        <>
          <div className="ornamento-pagina">❦</div>

          {titulo && <h2>{titulo}</h2>}

          {imagemUrl && (
            <img
              src={imagemUrl}
              alt={titulo || `Página ${numero}`}
              className="imagem-pagina-livro"
            />
          )}

          <p className="texto-pagina">{conteudo}</p>

          <span className="numero-pagina">{numero}</span>
        </>
      )}
    </article>
  )
})

export default function Livro({
  livro,
  paginas,
  onFechar,
  paginaInicial,
  modoAula = false,
}) {
  const livroRef = useRef(null)
  const [paginaAtual, setPaginaAtual] = useState(0)

  useEffect(() => {
    setPaginaAtual(0)
  }, [livro?.id, paginas])

  function paginaAnterior() {
    livroRef.current?.pageFlip()?.flipPrev()
  }

  function proximaPagina() {
    livroRef.current?.pageFlip()?.flipNext()
  }

  const paginaExibida =
    paginaAtual === 0
      ? 'Capa'
      : paginas[paginaAtual - 1]?.numero ??
        paginaInicial ??
        paginaAtual

  return (
    <div className="leitor-livro">
      <div className="barra-leitor">
        <button type="button" onClick={onFechar}>
          {modoAula ? 'Voltar para a aula' : 'Fechar livro'}
        </button>

        <div className="dados-leitura">
          <strong>{livro.titulo}</strong>
          <span>
            {paginaAtual === 0
              ? 'Capa'
              : `Página ${paginaExibida}`}
            {' • '}
            {paginas.length} páginas carregadas
          </span>
        </div>
      </div>

      <div className="area-livro">
        <HTMLFlipBook
          ref={livroRef}
          width={420}
          height={600}
          size="stretch"
          minWidth={280}
          maxWidth={480}
          minHeight={420}
          maxHeight={680}
          showCover
          usePortrait
          drawShadow
          maxShadowOpacity={0.45}
          flippingTime={850}
          mobileScrollSupport
          onFlip={(evento) => setPaginaAtual(evento.data)}
          className="livro-pageflip"
        >
          <Pagina
            capa
            titulo={livro.titulo}
            imagemUrl={livro.capa_url}
          />

          {paginas.map((pagina) => (
            <Pagina
              key={pagina.id}
              titulo={pagina.titulo}
              conteudo={pagina.conteudo}
              imagemUrl={pagina.imagem_url}
              numero={pagina.numero}
            />
          ))}
        </HTMLFlipBook>
      </div>

      <div className="controles-livro">
        <button type="button" onClick={paginaAnterior}>
          ← Página anterior
        </button>

        <button type="button" onClick={proximaPagina}>
          Próxima página →
        </button>
      </div>
    </div>
  )
}