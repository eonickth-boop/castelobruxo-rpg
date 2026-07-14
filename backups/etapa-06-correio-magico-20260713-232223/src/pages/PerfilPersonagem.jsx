import Notificacao from '../components/Notificacao'
import '../styles/perfil-personagem.css'

function formatarCargo(cargo) {
  if (!cargo) return 'Aluno'
  return cargo.charAt(0).toUpperCase() + cargo.slice(1)
}

export default function PerfilPersonagem({
  perfil,
  saldo,
  mensagem,
  carregando,
  mostrarAlterarSenha,
  novaSenha,
  confirmacaoSenha,
  setMostrarAlterarSenha,
  setNovaSenha,
  setConfirmacaoSenha,
  alterarSenha,
  onAbrirInventario,
  onAbrirPets,
  onAbrirDiario,
  onAbrirPerfilPublico,
  onVoltar,
}) {
  const nomeExibido =
    perfil?.nome_personagem || perfil?.usuario || 'Estudante'

  const cargoExibido = formatarCargo(perfil?.cargo)
  const triboExibida = perfil?.tribo || 'Não definida'
  const anoExibido = Number(perfil?.ano) || 1
  const nivelAtual = Number(perfil?.nivel) || 1
  const xpTotal = Number(perfil?.xp) || 0
  const xpPorNivel = 100
  const xpNoNivel = xpTotal % xpPorNivel
  const progressoXp = Math.min(
    100,
    Math.max(0, (xpNoNivel / xpPorNivel) * 100),
  )

  const titulo =
    perfil?.titulo_exibido ||
    perfil?.titulo ||
    'Estudante de Castelobruxo'

  const biografia =
    perfil?.biografia ||
    perfil?.descricao ||
    'Este estudante ainda não escreveu sua apresentação no diário.'

  const atributos = [
    ['Conhecimento', Number(perfil?.conhecimento_magico) || 0],
    ['Exploração', Number(perfil?.exploracao) || 0],
    ['Poções', Number(perfil?.pocoes) || 0],
    ['Criaturas', Number(perfil?.criaturas) || 0],
    ['Defesa', Number(perfil?.defesa) || 0],
    ['Natureza', Number(perfil?.afinidade_natureza) || 0],
  ]

  return (
    <main className="perfil-personagem-pagina">
      <div className="perfil-topo-acoes">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>

        <button
          type="button"
          onClick={onAbrirPerfilPublico}
        >
          🌐 Ver perfil público
        </button>
      </div>

      <section className="perfil-caderno">
        <div className="perfil-furos" aria-hidden="true">
          {Array.from({ length: 11 }).map((_, indice) => (
            <span key={indice} />
          ))}
        </div>

        <header className="perfil-cabecalho">
          <p>Arquivo estudantil de Castelobruxo</p>
          <h1>Diário do Personagem</h1>
          <span>Registro pessoal e acadêmico</span>
        </header>

        <section className="perfil-identidade">
          <div className="perfil-foto-area">
            <span className="perfil-clipe" aria-hidden="true" />

            <div className="perfil-foto">
              {perfil?.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt={nomeExibido}
                />
              ) : (
                <span>👤</span>
              )}
            </div>

            <div className="perfil-assinatura">
              @{perfil?.usuario}
            </div>
          </div>

          <div className="perfil-dados-principais">
            <p className="perfil-rotulo">
              Estudante registrado
            </p>

            <h2>{nomeExibido}</h2>
            <strong>{titulo}</strong>

            <div className="perfil-selos">
              <span>{cargoExibido}</span>
              <span>Tribo {triboExibida}</span>
              <span>{anoExibido}º ano</span>
              <span>Nível {nivelAtual}</span>
            </div>

            <blockquote>{biografia}</blockquote>
          </div>
        </section>

        <section className="perfil-progresso">
          <div className="perfil-progresso-topo">
            <div>
              <small>Progresso acadêmico</small>
              <h3>Nível {nivelAtual}</h3>
            </div>

            <strong>
              {xpNoNivel} / {xpPorNivel} XP
            </strong>
          </div>

          <div className="perfil-barra">
            <span style={{ width: `${progressoXp}%` }} />
          </div>
        </section>

        <section className="perfil-resumo-grid">
          <article>
            <small>Saldo</small>
            <strong>{Number(saldo || 0)} Ipês</strong>
          </article>

          <article>
            <small>Tribo</small>
            <strong>{triboExibida}</strong>
          </article>

          <article>
            <small>Ano</small>
            <strong>{anoExibido}º ano</strong>
          </article>

          <article>
            <small>Experiência total</small>
            <strong>{xpTotal} XP</strong>
          </article>
        </section>

        <section className="perfil-duas-colunas">
          <article className="perfil-bloco">
            <header>
              <p>Desenvolvimento</p>
              <h3>Atributos</h3>
            </header>

            <div className="perfil-atributos">
              {atributos.map(([nome, valor]) => (
                <div key={nome}>
                  <span>{nome}</span>
                  <strong>{valor}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="perfil-bloco">
            <header>
              <p>Itens em uso</p>
              <h3>Equipamentos</h3>
            </header>

            <div className="perfil-equipamentos">
              <div>
                <small>Traje</small>
                <strong>
                  {perfil?.traje_equipado ||
                    'Nenhum traje equipado'}
                </strong>
              </div>

              <div>
                <small>Acessório</small>
                <strong>
                  {perfil?.acessorio_equipado ||
                    'Nenhum acessório equipado'}
                </strong>
              </div>

              <div>
                <small>Artefato</small>
                <strong>
                  {perfil?.artefato_equipado ||
                    'Nenhum artefato equipado'}
                </strong>
              </div>

              <div>
                <small>Utensílio</small>
                <strong>
                  {perfil?.utensilio_equipado ||
                    'Nenhum utensílio equipado'}
                </strong>
              </div>
            </div>

            <p className="perfil-observacao">
              Em Castelobruxo, a magia não é canalizada por
              varinhas. Artefatos, conhecimentos, gestos,
              vínculos e tradições ocupam esse papel.
            </p>
          </article>
        </section>

        <section className="perfil-atalhos">
          <button type="button" onClick={onAbrirInventario}>
            🎒 Inventário
          </button>

          <button type="button" onClick={onAbrirPets}>
            🐾 Companheiro
          </button>

          <button type="button" onClick={onAbrirDiario}>
            📖 Anotações
          </button>
        </section>

        <section className="perfil-bloco perfil-seguranca">
          <header>
            <div>
              <p>Segurança</p>
              <h3>Proteção da conta</h3>
            </div>

            {!mostrarAlterarSenha && (
              <button
                type="button"
                onClick={() => setMostrarAlterarSenha(true)}
              >
                Alterar senha
              </button>
            )}
          </header>

          {mostrarAlterarSenha && (
            <form onSubmit={alterarSenha}>
              <label>
                <span>Nova senha</span>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(evento) =>
                    setNovaSenha(evento.target.value)
                  }
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </label>

              <label>
                <span>Confirme a nova senha</span>
                <input
                  type="password"
                  value={confirmacaoSenha}
                  onChange={(evento) =>
                    setConfirmacaoSenha(
                      evento.target.value,
                    )
                  }
                  placeholder="Digite novamente"
                  required
                />
              </label>

              <div className="perfil-seguranca-acoes">
                <button
                  type="submit"
                  disabled={carregando}
                >
                  {carregando
                    ? 'Alterando...'
                    : 'Salvar nova senha'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarAlterarSenha(false)
                    setNovaSenha('')
                    setConfirmacaoSenha('')
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>
      </section>

      <Notificacao mensagem={mensagem} />
    </main>
  )
}
