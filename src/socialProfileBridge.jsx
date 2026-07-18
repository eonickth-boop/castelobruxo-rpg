import { createRoot } from 'react-dom/client'
import { supabase } from './services/supabase'
import PainelSocialPerfil from './components/perfil/PainelSocialPerfil.jsx'
import './styles/social-integracoes.css'

let raizAtual = null
let alvoAtual = null
let usuarioAtual = ''
let processando = false

async function montar() {
  if (processando) return
  const perfilVivo = document.querySelector('.perfil-vivo')
  if (!perfilVivo) {
    if (raizAtual) { raizAtual.unmount(); raizAtual = null; alvoAtual = null; usuarioAtual = '' }
    return
  }

  const textoUsuario = [...perfilVivo.querySelectorAll('span')].map((el) => el.textContent?.trim()).find((texto) => texto?.startsWith('@'))
  const usuario = textoUsuario?.slice(1)
  if (!usuario) return

  let alvo = perfilVivo.parentElement?.querySelector(':scope > .perfil-social-ponte')
  if (!alvo) {
    alvo = document.createElement('div')
    alvo.className = 'perfil-social-ponte'
    perfilVivo.insertAdjacentElement('afterend', alvo)
  }

  if (alvo === alvoAtual && usuario === usuarioAtual) return
  processando = true
  try {
    const { data: sessao } = await supabase.auth.getSession()
    if (!sessao.session?.user) return
    const [{ data: atual }, { data: exibido }] = await Promise.all([
      supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,tribo,ano,nivel').eq('id', sessao.session.user.id).single(),
      supabase.from('perfis').select('id,usuario,nome_personagem,avatar_url,tribo,ano,nivel').eq('usuario', usuario).single(),
    ])
    if (!atual || !exibido) return
    if (raizAtual) raizAtual.unmount()
    raizAtual = createRoot(alvo)
    raizAtual.render(<PainelSocialPerfil perfilAtual={atual} perfilExibido={exibido} proprio={atual.id === exibido.id} />)
    alvoAtual = alvo
    usuarioAtual = usuario
  } finally { processando = false }
}

export function iniciarPontePerfilSocial() {
  const observador = new MutationObserver(() => window.setTimeout(montar, 80))
  observador.observe(document.body, { childList: true, subtree: true })
  window.setTimeout(montar, 300)
  return () => observador.disconnect()
}
