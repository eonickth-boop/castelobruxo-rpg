import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/painel-administrativo.css'

function formatarData(valor) {
  if (!valor) return '—'

  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function PainelAdministrativo({ perfil, onVoltar }) {
  const [aba, setAba] = useState('visao-geral')
  const [estatisticas, setEstatisticas] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const administrador = ['administrador', 'admin'].includes(
    String(perfil?.cargo || '').toLowerCase(),
  )

  useEffect(() => {
    if (!administrador) {
      setCarregando(false)
      return
    }

    carregarPainel()
  }, [administrador])

  async function carregarPainel() {
    setCarregando(true)
    setMensagem('')

    const [resumo, listaUsuarios] = await Promise.all([
      supabase.rpc('obter_resumo_administrativo'),
      supabase.rpc('listar_usuarios_administracao'),
    ])

    if (resumo.error) {
      console.error('Erro no resumo administrativo:', resumo.error)
      setMensagem(
        resumo.error.message ||
          'Não foi possível carregar o resumo administrativo.',
      )
    } else {
      setEstatisticas(resumo.data)
    }

    if (listaUsuarios.error) {
      console.error(
        'Erro ao carregar usuários administrativos:',
        listaUsuarios.error,
      )
      setMensagem(
        listaUsuarios.error.message ||
          'Não foi possível carregar os usuários.',
      )
      setUsuarios([])
    } else {
      setUsuarios(listaUsuarios.data ?? [])
    }

    setCarregando(false)
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) return usuarios

    return usuarios.filter((usuario) =>
      [
        usuario.usuario,
        usuario.nome_personagem,
        usuario.cargo,
        usuario.tribo,
        usuario.status_conta,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(termo),
    )
  }, [usuarios, busca])

  async function alterarStatus(usuario, novoStatus) {
    setProcessando(usuario.id)
    setMensagem('')

    const confirmar = window.confirm(
      `${novoStatus === 'aprovado' ? 'Aprovar' : novoStatus === 'rejeitado' ? 'Rejeitar' : 'Bloquear'} a conta de ${usuario.nome_personagem || usuario.usuario}?`,
    )

    if (!confirmar) {
      setProcessando(null)
      return
    }

    const { error } = await supabase.rpc(
      'alterar_status_conta_administracao',
      {
        usuario_alvo: usuario.id,
        novo_status: novoStatus,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível alterar o status da conta.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Status da conta atualizado.')
    setProcessando(null)
    await carregarPainel()
  }

  async function alterarCargo(usuario, novoCargo) {
    setProcessando(usuario.id)
    setMensagem('')

    const { error } = await supabase.rpc(
      'alterar_cargo_usuario_administracao',
      {
        usuario_alvo: usuario.id,
        novo_cargo: novoCargo,
      },
    )

    if (error) {
      setMensagem(
        error.message ||
          'Não foi possível alterar o cargo.',
      )
      setProcessando(null)
      return
    }

    setMensagem('Cargo atualizado com sucesso.')
    setProcessando(null)
    await carregarPainel()
  }

  if (!administrador) {
    return (
      <main className="admin-pagina">
        <button type="button" onClick={onVoltar}>
          ← Voltar
        </button>

        <section className="admin-sem-acesso">
          <span>🔒</span>
          <h1>Acesso restrito</h1>
          <p>
            Apenas administradores podem acessar este painel.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-pagina">
      <button
        type="button"
        className="admin-voltar"
        onClick={onVoltar}
      >
        ← Voltar
      </button>

      <header className="admin-hero">
        <p>Gestão central de Castelobruxo</p>
        <h1>Painel Administrativo</h1>
        <span>
          Sessão de <strong>{perfil.nome_personagem || perfil.usuario}</strong>
        </span>
      </header>

      <nav className="admin-abas">
        <button
          type="button"
          className={aba === 'visao-geral' ? 'ativo' : ''}
          onClick={() => setAba('visao-geral')}
        >
          📊 Visão geral
        </button>

        <button
          type="button"
          className={aba === 'usuarios' ? 'ativo' : ''}
          onClick={() => setAba('usuarios')}
        >
          👥 Usuários
        </button>

        <button
          type="button"
          className={aba === 'aprovacoes' ? 'ativo' : ''}
          onClick={() => setAba('aprovacoes')}
        >
          ✅ Aprovações
        </button>
      </nav>

      {mensagem && <p className="admin-mensagem">{mensagem}</p>}

      {carregando ? (
        <p className="admin-estado">Carregando painel...</p>
      ) : aba === 'visao-geral' ? (
        <section className="admin-dashboard">
          <div className="admin-cards">
            <article>
              <small>Usuários</small>
              <strong>{estatisticas?.usuarios_total ?? 0}</strong>
            </article>

            <article>
              <small>Pendentes</small>
              <strong>{estatisticas?.usuarios_pendentes ?? 0}</strong>
            </article>

            <article>
              <small>Aprovados</small>
              <strong>{estatisticas?.usuarios_aprovados ?? 0}</strong>
            </article>

            <article>
              <small>Professores</small>
              <strong>{estatisticas?.professores_total ?? 0}</strong>
            </article>

            <article>
              <small>Itens</small>
              <strong>{estatisticas?.itens_total ?? 0}</strong>
            </article>

            <article>
              <small>Missões</small>
              <strong>{estatisticas?.missoes_total ?? 0}</strong>
            </article>

            <article>
              <small>Eventos</small>
              <strong>{estatisticas?.eventos_total ?? 0}</strong>
            </article>

            <article>
              <small>Mensagens</small>
              <strong>{estatisticas?.mensagens_total ?? 0}</strong>
            </article>
          </div>

          <article className="admin-bloco">
            <p className="admin-rotulo">Núcleo administrativo</p>
            <h2>Módulos instalados</h2>

            <div className="admin-modulos">
              {[
                ['Usuários e aprovação', true],
                ['Cargos e permissões', true],
                ['Estatísticas gerais', true],
                ['Gestão financeira', false],
                ['Mercado e inventários', false],
                ['Missões e eventos', false],
                ['Mapa e locais', false],
                ['Certificados e conquistas', false],
                ['Logs administrativos', false],
              ].map(([nome, ativo]) => (
                <div key={nome}>
                  <span>{ativo ? '✓' : '○'}</span>
                  <strong>{nome}</strong>
                  <small>{ativo ? 'Disponível' : 'Próximo módulo'}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : (
        <section className="admin-usuarios">
          <div className="admin-usuarios-topo">
            <div>
              <p className="admin-rotulo">
                {aba === 'aprovacoes'
                  ? 'Solicitações pendentes'
                  : 'Cadastro geral'}
              </p>
              <h2>
                {aba === 'aprovacoes'
                  ? 'Aprovação de contas'
                  : 'Usuários'}
              </h2>
            </div>

            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar usuário"
            />
          </div>

          <div className="admin-tabela-wrap">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Personagem</th>
                  <th>Usuário</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th>Nível</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados
                  .filter((usuario) =>
                    aba === 'aprovacoes'
                      ? usuario.status_conta === 'pendente'
                      : true,
                  )
                  .map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <strong>
                          {usuario.nome_personagem || 'Sem nome'}
                        </strong>
                      </td>
                      <td>@{usuario.usuario}</td>
                      <td>
                        <select
                          value={usuario.cargo || 'aluno'}
                          disabled={processando === usuario.id}
                          onChange={(evento) =>
                            alterarCargo(
                              usuario,
                              evento.target.value,
                            )
                          }
                        >
                          <option value="aluno">Aluno</option>
                          <option value="professor">Professor</option>
                          <option value="administrador">
                            Administrador
                          </option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`admin-status status-${usuario.status_conta}`}
                        >
                          {usuario.status_conta}
                        </span>
                      </td>
                      <td>{usuario.nivel || 1}</td>
                      <td>{formatarData(usuario.criado_em)}</td>
                      <td>
                        <div className="admin-acoes">
                          {usuario.status_conta !== 'aprovado' && (
                            <button
                              type="button"
                              disabled={processando === usuario.id}
                              onClick={() =>
                                alterarStatus(usuario, 'aprovado')
                              }
                            >
                              Aprovar
                            </button>
                          )}

                          {usuario.status_conta !== 'rejeitado' && (
                            <button
                              type="button"
                              disabled={processando === usuario.id}
                              onClick={() =>
                                alterarStatus(usuario, 'rejeitado')
                              }
                            >
                              Rejeitar
                            </button>
                          )}

                          {usuario.status_conta !== 'bloqueado' && (
                            <button
                              type="button"
                              disabled={processando === usuario.id}
                              onClick={() =>
                                alterarStatus(usuario, 'bloqueado')
                              }
                            >
                              Bloquear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
