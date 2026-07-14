import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/mapa-interativo.css'

export default function MapaInterativo({ perfil, onVoltar, onNavegar }) {
  const [locais, setLocais] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarMapa()
  }, [perfil?.id])

  async function carregarMapa() {
    setCarregando(true)
    setMensagem('')

    const { data, error } = await supabase.rpc(
      'listar_locais_mapa_usuario',
    )

    if (error) {
      console.error('Erro ao carregar mapa:', error)
      setMensagem(
        error.message || 'Não foi possível carregar o mapa.',
      )
      setLocais([])
      setCarregando(false)
      return
    }

    const lista = data ?? []
    setLocais(lista)
    setSelecionado((atual) => atual ?? lista[0] ?? null)
    setCarregando(false)
  }

  const grupos = useMemo(() => {
    return locais.reduce((resultado, local) => {
      const categoria = local.categoria || 'Outros'

      if (!resultado[categoria]) {
        resultado[categoria] = []
      }

      resultado[categoria].push(local)
      return resultado
    }, {})
  }, [locais])

  function abrirDestino(local) {
    if (!local.desbloqueado) {
      setMensagem(local.motivo_bloqueio || 'Local bloqueado.')
      return
    }

    if (!local.destino_pagina) {
      setMensagem('Este local ainda não possui uma página própria.')
      return
    }

    onNavegar(local.destino_pagina)
  }

  return (
    <main className="mapa-pagina">
      <button
        type="button"
        className="mapa-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="mapa-hero">
        <p>Território de Castelobruxo</p>
        <h1>Mapa Interativo</h1>
        <span>
          Rotas disponíveis para{' '}
          <strong>
            {perfil.nome_personagem || perfil.usuario}
          </strong>
        </span>
      </header>

      {mensagem && <p className="mapa-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="mapa-estado">Carregando mapa...</p>
      ) : (
        <section className="mapa-layout">
          <div className="mapa-tabuleiro">
            <div className="mapa-rio" aria-hidden="true" />
            <div className="mapa-caminho mapa-caminho-um" aria-hidden="true" />
            <div className="mapa-caminho mapa-caminho-dois" aria-hidden="true" />

            {locais.map((local) => (
              <button
                type="button"
                key={local.id}
                className={`mapa-marcador ${
                  local.desbloqueado ? '' : 'bloqueado'
                } ${
                  selecionado?.id === local.id ? 'selecionado' : ''
                }`}
                style={{
                  left: `${local.posicao_x}%`,
                  top: `${local.posicao_y}%`,
                }}
                onClick={() => {
                  setSelecionado(local)
                  setMensagem('')
                }}
                aria-label={local.nome}
              >
                <span>{local.icone || '📍'}</span>
                <strong>{local.nome}</strong>
                {!local.desbloqueado && <small>🔒</small>}
              </button>
            ))}
          </div>

          <aside className="mapa-painel">
            {selecionado ? (
              <>
                <div className="mapa-painel-topo">
                  <span>{selecionado.icone || '📍'}</span>

                  <div>
                    <small>{selecionado.categoria}</small>
                    <h2>{selecionado.nome}</h2>
                  </div>
                </div>

                <p>{selecionado.descricao}</p>

                <div className="mapa-requisitos">
                  <div>
                    <small>Nível mínimo</small>
                    <strong>{selecionado.nivel_minimo}</strong>
                  </div>

                  <div>
                    <small>Ano mínimo</small>
                    <strong>{selecionado.ano_minimo}º ano</strong>
                  </div>

                  {selecionado.tribo_requisito && (
                    <div>
                      <small>Tribo</small>
                      <strong>{selecionado.tribo_requisito}</strong>
                    </div>
                  )}
                </div>

                <div
                  className={`mapa-status ${
                    selecionado.desbloqueado
                      ? 'desbloqueado'
                      : 'bloqueado'
                  }`}
                >
                  {selecionado.desbloqueado
                    ? '✓ Local disponível'
                    : `🔒 ${selecionado.motivo_bloqueio}`}
                </div>

                <button
                  type="button"
                  disabled={!selecionado.desbloqueado}
                  onClick={() => abrirDestino(selecionado)}
                >
                  {selecionado.destino_pagina
                    ? 'Entrar no local'
                    : 'Explorar em breve'}
                </button>
              </>
            ) : (
              <p>Selecione um local do mapa.</p>
            )}

            <div className="mapa-legenda">
              <h3>Regiões</h3>

              {Object.entries(grupos).map(
                ([categoria, itens]) => (
                  <div key={categoria}>
                    <strong>{categoria}</strong>
                    <span>{itens.length} locais</span>
                  </div>
                ),
              )}
            </div>
          </aside>
        </section>
      )}
    </main>
  )
}
