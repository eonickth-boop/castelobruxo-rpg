import {
  forwardRef,
  useEffect,
  useMemo,
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
      className={`pagina-livro ${
        capa ? 'pagina-capa' : ''
      }`}
      data-density={capa ? 'hard' : 'soft'}
    >
      {capa ? (
        <div className="conteudo-capa">
          {imagemUrl ? (
            <img
              src={imagemUrl}
              alt={titulo}
              className="imagem-capa-livro"
            />
          ) : (
            <div className="capa-leitor-sem-imagem">❦</div>
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

          <div className="texto-pagina">
            {String(conteudo || '')
              .split('\n')
              .map((paragrafo, indice) =>
                paragrafo.trim() ? (
                  <p key={indice}>{paragrafo}</p>
                ) : (
                  <br key={indice} />
                ),
              )}
          </div>

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

  const totalPaginas = paginas.length

  const paginaExibida = useMemo(() => {
    if (paginaAtual === 0) return 'Capa'

    return (
      paginas[paginaAtual - 1]?.numero ??
      paginaInicial ??
      paginaAtual
    )
  }, [paginaAtual, paginas, paginaInicial])

  const progresso =
    totalPaginas === 0
      ? 0
      : Math.min(
          100,
          Math.round((paginaAtual / totalPaginas) * 100),
        )

  function paginaAnterior() {
    livroRef.current?.pageFlip()?.flipPrev()
  }

  function proximaPagina() {
    livroRef.current?.pageFlip()?.flipNext()
  }

  return (
    <main className="leitor-livro">
      <header className="barra-leitor">
        <button
          type="button"
          className="leitor-voltar"
          onClick={onFechar}
        >
          ← {modoAula ? 'Voltar para a aula' : 'Biblioteca'}
        </button>

        <div className="dados-leitura">
          <strong>{livro.titulo}</strong>
          <span>
            {paginaAtual === 0
              ? 'Capa'
              : `Página ${paginaExibida}`}
            {' · '}
            {totalPaginas}{' '}
            {totalPaginas === 1 ? 'página' : 'páginas'}
          </span>
        </div>
      </header>

      <div
        className="leitor-progresso"
        aria-label={`Progresso de leitura: ${progresso}%`}
      >
        <span style={{ width: `${progresso}%` }} />
      </div>

      {paginas.length === 0 && (
        <p className="leitor-sem-paginas">
          Este livro ainda não possui páginas cadastradas.
        </p>
      )}

      <section className="area-livro">
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
          maxShadowOpacity={0.42}
          flippingTime={750}
          mobileScrollSupport
          onFlip={(evento) =>
            setPaginaAtual(evento.data)
          }
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
      </section>

      <nav
        className="controles-livro"
        aria-label="Controles do livro"
      >
        <button
          type="button"
          onClick={paginaAnterior}
          disabled={paginaAtual === 0}
        >
          ← Página anterior
        </button>

        <span>
          {paginaAtual === 0
            ? 'Capa'
            : `${paginaExibida} de ${totalPaginas}`}
        </span>

        <button
          type="button"
          onClick={proximaPagina}
          disabled={paginaAtual >= totalPaginas}
        >
          Próxima página →
        </button>
      </nav>
    </main>
  )
}
