import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../services/supabase'
import '../../styles/layout/sidebarGlobal.css'

const gruposBase = [
  { titulo: 'Principal', itens: [
    { id: 'inicio', icone: '🏠', rotulo: 'Início' },
    { id: 'dormitorio-pessoal', icone: '🛏️', rotulo: 'Dormitório', href: '/dormitorio' },
    { id: 'perfil', icone: '👤', rotulo: 'Meu Perfil' },
    { id: 'perfil-publico', icone: '🌐', rotulo: 'Perfil Público' },
    { id: 'diario-personagem', icone: '📖', rotulo: 'Diário' },
    { id: 'pets', icone: '🐾', rotulo: 'Companheiros' },
  ]},
  { titulo: 'Escola', itens: [
    { id: 'rotina-escolar', icone: '🗓️', rotulo: 'Rotina Escolar', href: '/rotina' },
    { id: 'aulas', icone: '🎓', rotulo: 'Sistema Acadêmico' },
    { id: 'biblioteca', icone: '📚', rotulo: 'Biblioteca' },
    { id: 'quadro-avisos', icone: '📜', rotulo: 'Quadro de Avisos' },
  ]},
  { titulo: 'Interpretação', itens: [
    { id: 'rpg-textual', icone: '🪶', rotulo: 'RPG Textual', href: '/rpg' },
  ]},
  { titulo: 'Exploração', itens: [
    { id: 'mapa-interativo', icone: '🗺️', rotulo: 'Mapa Interativo' },
    { id: 'missoes', icone: '🧭', rotulo: 'Missões' },
    { id: 'eventos', icone: '📅', rotulo: 'Eventos' },
  ]},
  { titulo: 'Economia', itens: [
    { id: 'banco', icone: '🏦', rotulo: 'Banco' },
    { id: 'mercado', icone: '🛒', rotulo: 'Mercado' },
    { id: 'inventario', icone: '🎒', rotulo: 'Inventário' },
  ]},
  { titulo: 'Registros', itens: [
    { id: 'correio-magico', icone: '✉️', rotulo: 'Correio Mágico' },
    { id: 'conquistas', icone: '🏆', rotulo: 'Conquistas' },
    { id: 'certificados', icone: '📜', rotulo: 'Certificados' },
  ]},
]

function navegar(item) {
  if (item.href) {
    window.location.href = item.href
    return
  }

  window.dispatchEvent(new CustomEvent('castelobruxo:navegar', {
    detail: { pagina: item.id },
  }))
}

export default function SidebarGlobal() {
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [aberta, setAberta] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(() => {
    if (window.location.pathname.startsWith('/rpg')) return 'rpg-textual'
    if (window.location.pathname.startsWith('/rotina')) return 'rotina-escolar'
    if (window.location.pathname.startsWith('/dormitorio')) return 'dormitorio-pessoal'
    return 'inicio'
  })

  useEffect(() => {
    let ativo = true

    async function carregarPerfilDaSessao(novaSessao) {
      if (!novaSessao?.user) {
        setPerfil(null)
        return
      }

      const { data, error } = await supabase
        .from('perfis')
        .select('id, usuario, nome_personagem, avatar_url, cargo, tribo, nivel')
        .eq('id', novaSessao.user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao carregar perfil da sidebar:', error)
        return
      }

      if (ativo) setPerfil(data ?? null)
    }

    async function iniciar() {
      const { data } = await supabase.auth.getSession()
      if (!ativo) return
      setSessao(data.session)
      await carregarPerfilDaSessao(data.session)
    }

    iniciar()

    const { data } = supabase.auth.onAuthStateChange(async (_evento, novaSessao) => {
      setSessao(novaSessao)
      await carregarPerfilDaSessao(novaSessao)
    })

    const ouvirPagina = (evento) => {
      if (evento.detail?.pagina) {
        setPaginaAtual(evento.detail.pagina)
        setAberta(false)
      }
    }

    window.addEventListener('castelobruxo:pagina-alterada', ouvirPagina)

    return () => {
      ativo = false
      data.subscription.unsubscribe()
      window.removeEventListener('castelobruxo:pagina-alterada', ouvirPagina)
    }
  }, [])

  useEffect(() => {
    const deveExibir = Boolean(sessao && perfil)
    document.body.classList.toggle('cb-com-sidebar', deveExibir)
    return () => document.body.classList.remove('cb-com-sidebar')
  }, [sessao, perfil])

  const grupos = useMemo(() => {
    if (!perfil || !['professor', 'administrador'].includes(perfil.cargo)) return gruposBase

    return [...gruposBase, {
      titulo: 'Gestão',
      itens: [
        { id: 'painel-professor', icone: '👨‍🏫', rotulo: 'Painel do Professor' },
        { id: 'painel-administrativo', icone: '🛡️', rotulo: 'Painel Administrativo' },
        { id: 'cms-conteudo', icone: '🧰', rotulo: 'CMS de Conteúdo' },
      ],
    }]
  }, [perfil])

  if (!sessao || !perfil) return null

  const nome = perfil.nome_personagem || perfil.usuario

  return (
    <>
      <button type="button" className="cb-sidebar-toggle" onClick={() => setAberta((valor) => !valor)} aria-label="Abrir menu">☰</button>
      {aberta && <button type="button" className="cb-sidebar-overlay" onClick={() => setAberta(false)} aria-label="Fechar menu" />}

      <aside className={`cb-sidebar-global ${aberta ? 'cb-sidebar-aberta' : ''}`}>
        <header className="cb-sidebar-perfil">
          <div className="cb-sidebar-avatar">
            {perfil.avatar_url ? <img src={perfil.avatar_url} alt={nome} /> : <span>👤</span>}
          </div>
          <div>
            <small>Estudante</small>
            <strong>{nome}</strong>
            <span>{perfil.tribo || 'Sem tribo'} · Nível {perfil.nivel || 1}</span>
          </div>
        </header>

        <nav className="cb-sidebar-nav">
          {grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <h3>{grupo.titulo}</h3>
              {grupo.itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={paginaAtual === item.id ? 'cb-sidebar-item cb-sidebar-item-ativo' : 'cb-sidebar-item'}
                  onClick={() => navegar(item)}
                >
                  <span>{item.icone}</span>
                  <strong>{item.rotulo}</strong>
                </button>
              ))}
            </section>
          ))}
        </nav>

        <footer className="cb-sidebar-footer">
          <span>Castelobruxo</span>
          <small>Conhecer · Respeitar · Proteger</small>
        </footer>
      </aside>
    </>
  )
}
