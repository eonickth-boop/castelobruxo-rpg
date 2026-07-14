import { useEffect, useState } from 'react'

const tiposBloco = [
  {
    id: 'texto',
    icone: '📄',
    titulo: 'Texto',
    descricao: 'Parágrafos e explicações',
  },
  {
    id: 'imagem',
    icone: '🖼️',
    titulo: 'Imagem',
    descricao: 'Imagem com legenda',
  },
  {
    id: 'dica',
    icone: '💡',
    titulo: 'Dica',
    descricao: 'Orientação destacada',
  },
  {
    id: 'curiosidade',
    icone: '📜',
    titulo: 'Curiosidade',
    descricao: 'Informação complementar',
  },
  {
    id: 'aviso',
    icone: '⚠️',
    titulo: 'Aviso',
    descricao: 'Alerta importante',
  },
  {
    id: 'separador',
    icone: '➖',
    titulo: 'Separador',
    descricao: 'Divisão visual',
  },
]

const titulosPadrao = {
  dica: 'Dica do professor',
  curiosidade: 'Curiosidade',
  aviso: 'Atenção',
}

export default function ModalTipoBloco({
  salvando,
  onAdicionar,
  onFechar,
}) {
  const [tipoSelecionado, setTipoSelecionado] =
    useState('texto')
  const [texto, setTexto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [arquivoImagem, setArquivoImagem] =
    useState(null)
  const [legendaImagem, setLegendaImagem] =
    useState('')
  const [previewImagem, setPreviewImagem] =
    useState('')

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewImagem('')
      return undefined
    }

    const urlTemporaria =
      URL.createObjectURL(arquivoImagem)

    setPreviewImagem(urlTemporaria)

    return () => {
      URL.revokeObjectURL(urlTemporaria)
    }
  }, [arquivoImagem])

  function selecionarTipo(tipo) {
    setTipoSelecionado(tipo)
    setTexto('')
    setTitulo(
      titulosPadrao[tipo] ?? '',
    )
    setArquivoImagem(null)
    setLegendaImagem('')
  }

  async function adicionar() {
    const sucesso = await onAdicionar({
      tipo: tipoSelecionado,
      texto,
      titulo,
      arquivo: arquivoImagem,
      legenda: legendaImagem,
    })

    if (sucesso) {
      setTexto('')
      setTitulo('')
      setArquivoImagem(null)
      setLegendaImagem('')
    }
  }

  const usaCaixa =
    tipoSelecionado === 'dica' ||
    tipoSelecionado === 'curiosidade' ||
    tipoSelecionado === 'aviso'

  return (
    <div className="painel-seletor-blocos">
      <div className="painel-seletor-cabecalho">
        <div>
          <small>Novo conteúdo</small>
          <h4>Escolha o tipo de bloco</h4>
        </div>

        <button
          type="button"
          className="painel-seletor-fechar"
          onClick={onFechar}
          disabled={salvando}
        >
          ✕
        </button>
      </div>

      <div className="painel-tipos-bloco">
        {tiposBloco.map((tipo) => (
          <button
            key={tipo.id}
            type="button"
            className={`painel-tipo-bloco ${
              tipoSelecionado === tipo.id
                ? 'painel-tipo-bloco-selecionado'
                : ''
            }`}
            disabled={salvando}
            onClick={() => selecionarTipo(tipo.id)}
          >
            <span>{tipo.icone}</span>

            <div>
              <strong>{tipo.titulo}</strong>
              <small>{tipo.descricao}</small>
            </div>
          </button>
        ))}
      </div>

      {tipoSelecionado === 'texto' && (
        <div className="painel-novo-conteudo">
          <label>
            <span>Conteúdo do texto</span>
            <textarea
              value={texto}
              onChange={(event) =>
                setTexto(event.target.value)
              }
              placeholder="Escreva o conteúdo deste bloco..."
              rows={7}
              disabled={salvando}
            />
          </label>
        </div>
      )}

      {tipoSelecionado === 'imagem' && (
        <div className="painel-novo-conteudo">
          <label>
            <span>Arquivo da imagem</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) =>
                setArquivoImagem(
                  event.target.files?.[0] ?? null,
                )
              }
              disabled={salvando}
            />
            <small>
              JPG, PNG, WEBP ou GIF. Máximo de 5 MB.
            </small>
          </label>

          {previewImagem && (
            <div className="painel-imagem-preview">
              <img
                src={previewImagem}
                alt="Pré-visualização da imagem"
              />
            </div>
          )}

          <label>
            <span>Legenda</span>
            <input
              type="text"
              value={legendaImagem}
              onChange={(event) =>
                setLegendaImagem(event.target.value)
              }
              placeholder="Legenda opcional"
              disabled={salvando}
            />
          </label>
        </div>
      )}

      {usaCaixa && (
        <div
          className={`painel-novo-conteudo painel-novo-caixa painel-novo-caixa-${tipoSelecionado}`}
        >
          <label>
            <span>Título opcional</span>
            <input
              type="text"
              value={titulo}
              onChange={(event) =>
                setTitulo(event.target.value)
              }
              disabled={salvando}
            />
          </label>

          <label>
            <span>Conteúdo</span>
            <textarea
              value={texto}
              onChange={(event) =>
                setTexto(event.target.value)
              }
              rows={6}
              placeholder="Digite o conteúdo destacado..."
              disabled={salvando}
            />
          </label>
        </div>
      )}

      {tipoSelecionado === 'separador' && (
        <div className="painel-novo-conteudo">
          <div className="painel-separador-demonstracao">
            <span />
            <p>
              O separador cria uma divisão visual entre
              partes da aula.
            </p>
          </div>
        </div>
      )}

      <div className="painel-novo-conteudo-acoes">
        <button
          type="button"
          className="painel-editor-cancelar"
          onClick={onFechar}
          disabled={salvando}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={adicionar}
          disabled={
            salvando ||
            (tipoSelecionado === 'imagem' &&
              !arquivoImagem)
          }
        >
          {salvando
            ? 'Adicionando...'
            : `Adicionar ${
                tiposBloco.find(
                  (tipo) =>
                    tipo.id === tipoSelecionado,
                )?.titulo.toLowerCase() ?? 'bloco'
              }`}
        </button>
      </div>
    </div>
  )
}
