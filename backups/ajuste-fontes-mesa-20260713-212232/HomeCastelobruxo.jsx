import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import StudentDesk from '../components/studentDesk/StudentDesk'
import '../styles/homeCastelobruxo.css'

export default function HomeCastelobruxo({
  perfil,
  carregando,
  mensagem,
  saldo,
  sair,
  carregarCarteira,
  carregarMercado,
  carregarInventario,
  setPagina,
  setMensagem,
}) {
  const [saldoAtual, setSaldoAtual] = useState(saldo)

  const nome = perfil.nome_personagem || perfil.usuario
  const cargo = perfil.cargo
    ? perfil.cargo.charAt(0).toUpperCase() + perfil.cargo.slice(1)
    : 'Aluno'

  const tribo = perfil.tribo || 'Sem tribo'

  useEffect(() => {
    let ativo = true

    async function buscarSaldo() {
      const { data, error } = await supabase
        .from('carteiras')
        .select('saldo')
        .eq('usuario_id', perfil.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar saldo da Home:', error)
        return
      }

      if (ativo) setSaldoAtual(data?.saldo ?? 0)
    }

    buscarSaldo()

    return () => {
      ativo = false
    }
  }, [perfil.id])

  useEffect(() => {
    if (saldo !== null && saldo !== undefined) {
      setSaldoAtual(saldo)
    }
  }, [saldo])

  function navegar(pagina) {
    setPagina(pagina)
    setMensagem('')
  }

  return (
    <main className="cb-home">
      <section className="cb-home-boas-vindas">
        <div className="cb-home-logo-flutuante">
          <img
            src="/assets/logo/castelobruxo-logo.png"
            alt="Castelobruxo"
          />
        </div>

        <div className="cb-home-papel">
          <div className="cb-home-avatar">
            {perfil.avatar_url ? (
              <img src={perfil.avatar_url} alt={nome} />
            ) : (
              <span>👤</span>
            )}
          </div>

          <div className="cb-home-texto">
            <small>Bem-vindo de volta</small>
            <h1>{nome}</h1>
            <strong>{cargo} · {tribo}</strong>

            <p>
              Os caminhos de Castelobruxo estão abertos.
              Escolha seu próximo passo.
            </p>
          </div>

          <span className="cb-home-prego cb-home-prego-1" />
          <span className="cb-home-prego cb-home-prego-2" />
        </div>
      </section>

      <section className="cb-home-mesa-area">
        <header className="cb-home-secao-cabecalho">
          <div>
            <small>Navegação</small>
            <h2>Menu principal</h2>
          </div>

          <div className="cb-home-resumo">
            <span>🌿 {tribo}</span>
            <span>⭐ Nível {perfil.nivel || 1}</span>
            <span>💰 {saldoAtual ?? 0} Ipês</span>
          </div>
        </header>

        <div className="cb-home-mesa-moldura">
          <StudentDesk
            carregando={carregando}
            onBanco={carregarCarteira}
            onMercado={carregarMercado}
            onInventario={carregarInventario}
            onBiblioteca={() => navegar('biblioteca')}
            onDiario={() => navegar('diario-personagem')}
            onAvisos={() => navegar('quadro-avisos')}
            onPerfil={() => navegar('perfil-publico')}
            onAcademico={() => navegar('aulas')}
            onPets={() => navegar('pets')}
            usuarioId={perfil.id}
          />
        </div>
      </section>

      <section className="cb-home-noticias">
        <header>
          <small>Mural da escola</small>
          <h2>Notícias de Castelobruxo</h2>
        </header>

        <div className="cb-home-noticias-grade">
          <article>
            <span>⌛</span>
            <h3>Período de testes</h3>
            <p>O sistema de Castelobruxo está em evolução.</p>
          </article>

          <article>
            <span>📖</span>
            <h3>Biblioteca Central</h3>
            <p>O novo acervo será aberto em breve.</p>
          </article>

          <article>
            <span>✦</span>
            <h3>Boas-vindas</h3>
            <p>Explore os sistemas e prepare-se para as aulas.</p>
          </article>
        </div>

        {mensagem && (
          <p className="cb-home-mensagem">{mensagem}</p>
        )}

        <button
          type="button"
          className="cb-home-sair"
          onClick={sair}
        >
          Sair
        </button>
      </section>
    </main>
  )
}
