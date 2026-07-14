import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/certificados.css'

function formatarData(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function Certificados({ perfil, onVoltar }) {
  const [certificados, setCertificados] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarCertificados()
  }, [perfil?.id])

  async function carregarCertificados() {
    if (!perfil?.id) return

    setCarregando(true)
    setMensagem('')

    const { error: erroVerificacao } = await supabase.rpc(
      'verificar_certificados_usuario',
      {
        usuario_alvo: perfil.id,
      },
    )

    if (erroVerificacao) {
      console.error(
        'Erro ao verificar certificados:',
        erroVerificacao,
      )
    }

    const { data, error } = await supabase
      .from('certificados')
      .select(`
        id,
        titulo,
        descricao,
        categoria,
        emitido_em,
        codigo_verificacao,
        instituicao,
        assinatura,
        carga_horaria,
        destaque,
        usuario_id
      `)
      .eq('usuario_id', perfil.id)
      .order('emitido_em', { ascending: false })

    if (error) {
      console.error('Erro ao carregar certificados:', error)
      setMensagem('Não foi possível carregar os certificados.')
      setCertificados([])
      setCarregando(false)
      return
    }

    const lista = data ?? []
    setCertificados(lista)
    setSelecionado((atual) => atual ?? lista[0] ?? null)
    setCarregando(false)
  }

  const totalPorCategoria = useMemo(() => {
    return certificados.reduce((resumo, certificado) => {
      const categoria = certificado.categoria || 'Outros'
      resumo[categoria] = (resumo[categoria] || 0) + 1
      return resumo
    }, {})
  }, [certificados])

  async function destacarCertificado(certificado) {
    const { error } = await supabase.rpc(
      'destacar_certificado_usuario',
      {
        certificado_alvo: certificado.id,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível destacar o certificado.',
      )
      return
    }

    setMensagem('Certificado destacado no perfil.')
    await carregarCertificados()
  }

  function imprimirCertificado() {
    window.print()
  }

  return (
    <main className="certificados-pagina">
      <button
        type="button"
        className="certificados-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="certificados-hero">
        <p>Arquivo acadêmico oficial</p>
        <h1>Meus Certificados</h1>
        <span>
          Registros de{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>

        <div className="certificados-resumo">
          <article>
            <small>Total emitido</small>
            <strong>{certificados.length}</strong>
          </article>

          {Object.entries(totalPorCategoria)
            .slice(0, 3)
            .map(([categoria, total]) => (
              <article key={categoria}>
                <small>{categoria}</small>
                <strong>{total}</strong>
              </article>
            ))}
        </div>
      </header>

      {mensagem && (
        <p className="certificados-mensagem">{mensagem}</p>
      )}

      {carregando ? (
        <p className="certificados-estado">
          Carregando certificados...
        </p>
      ) : certificados.length === 0 ? (
        <section className="certificados-vazio">
          <span>📜</span>
          <h2>Nenhum certificado emitido</h2>
          <p>
            Certificados aparecerão aqui após conclusões
            acadêmicas, eventos, missões ou emissões especiais.
          </p>
        </section>
      ) : (
        <section className="certificados-conteudo">
          <aside className="certificados-lista">
            {certificados.map((certificado) => (
              <button
                type="button"
                key={certificado.id}
                className={
                  selecionado?.id === certificado.id
                    ? 'selecionado'
                    : ''
                }
                onClick={() => setSelecionado(certificado)}
              >
                <span>📜</span>

                <div>
                  <strong>{certificado.titulo}</strong>
                  <small>{certificado.categoria}</small>
                  <time>
                    {formatarData(certificado.emitido_em)}
                  </time>
                </div>
              </button>
            ))}
          </aside>

          {selecionado && (
            <article className="certificado-area">
              <div className="certificado-documento">
                <div className="certificado-moldura">
                  <p className="certificado-instituicao">
                    {selecionado.instituicao ||
                      'Escola de Magia e Bruxaria Castelobruxo'}
                  </p>

                  <span className="certificado-simbolo">❧</span>

                  <p className="certificado-rotulo">
                    Certificado oficial
                  </p>

                  <h2>{selecionado.titulo}</h2>

                  <p className="certificado-declaracao">
                    Certificamos que
                  </p>

                  <h3>
                    {perfil.nome_personagem || perfil.usuario}
                  </h3>

                  <p className="certificado-descricao">
                    {selecionado.descricao}
                  </p>

                  {selecionado.carga_horaria && (
                    <p className="certificado-carga">
                      Carga horária:{' '}
                      <strong>
                        {selecionado.carga_horaria} horas
                      </strong>
                    </p>
                  )}

                  <div className="certificado-rodape">
                    <div>
                      <span>Emitido em</span>
                      <strong>
                        {formatarData(selecionado.emitido_em)}
                      </strong>
                    </div>

                    <div className="certificado-assinatura">
                      <strong>
                        {selecionado.assinatura ||
                          'Direção de Castelobruxo'}
                      </strong>
                      <span>Assinatura responsável</span>
                    </div>
                  </div>

                  <p className="certificado-codigo">
                    Código de verificação:{' '}
                    <strong>
                      {selecionado.codigo_verificacao}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="certificado-acoes">
                <button
                  type="button"
                  onClick={imprimirCertificado}
                >
                  🖨 Imprimir certificado
                </button>

                <button
                  type="button"
                  className={
                    selecionado.destaque ? 'destacado' : ''
                  }
                  onClick={() =>
                    destacarCertificado(selecionado)
                  }
                >
                  {selecionado.destaque
                    ? '★ Destacado no perfil'
                    : '☆ Destacar no perfil'}
                </button>
              </div>
            </article>
          )}
        </section>
      )}
    </main>
  )
}
