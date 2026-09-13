import { supabase } from './supabase'

const CHAVE_LOGIN_ATUAL = 'castelobruxo:login-autenticado-atual'
const CHAVE_LIMPEZA = 'castelobruxo:limpeza-sessao-v3'

function limparSessaoAntigaUmaVez() {
  try {
    if (localStorage.getItem(CHAVE_LIMPEZA) === '1') return

    for (let indice = localStorage.length - 1; indice >= 0; indice -= 1) {
      const chave = localStorage.key(indice)
      if (chave?.startsWith('sb-') && chave.endsWith('-auth-token')) {
        localStorage.removeItem(chave)
      }
    }

    sessionStorage.removeItem(CHAVE_LOGIN_ATUAL)
    localStorage.setItem(CHAVE_LIMPEZA, '1')
  } catch (erro) {
    console.warn('Não foi possível limpar a sessão antiga:', erro)
  }
}

limparSessaoAntigaUmaVez()

const entrarOriginal = supabase.auth.signInWithPassword.bind(supabase.auth)

supabase.auth.signInWithPassword = async (...argumentos) => {
  const resultado = await entrarOriginal(...argumentos)
  const usuarioId = resultado?.data?.user?.id || resultado?.data?.session?.user?.id

  if (!resultado?.error && usuarioId) {
    sessionStorage.setItem(CHAVE_LOGIN_ATUAL, usuarioId)
  } else {
    sessionStorage.removeItem(CHAVE_LOGIN_ATUAL)
  }

  return resultado
}

const sairOriginal = supabase.auth.signOut.bind(supabase.auth)

supabase.auth.signOut = async (...argumentos) => {
  sessionStorage.removeItem(CHAVE_LOGIN_ATUAL)
  return sairOriginal(...argumentos)
}

const fromOriginal = supabase.from.bind(supabase)

supabase.from = (tabela) => {
  if (tabela !== 'perfis') return fromOriginal(tabela)

  let builder = fromOriginal(tabela)
  let consultaSelect = false
  let usuarioId = null

  const adaptador = {
    select(colunas = '*', opcoes) {
      consultaSelect = true
      builder = builder.select(colunas, opcoes)
      return adaptador
    },
    eq(coluna, valor) {
      if (consultaSelect && coluna === 'id') usuarioId = valor
      builder = builder.eq(coluna, valor)
      return adaptador
    },
    async single() {
      if (!consultaSelect || !usuarioId) return builder.single()

      const loginAtual = sessionStorage.getItem(CHAVE_LOGIN_ATUAL)
      const consulta = builder.single()
      let timer

      const limite = new Promise((resolve) => {
        timer = window.setTimeout(() => resolve({ data: null, error: new Error('Tempo limite ao carregar perfil') }), 5000)
      })

      let resultado
      try {
        resultado = await Promise.race([consulta, limite])
      } finally {
        window.clearTimeout(timer)
      }

      if (!resultado?.error || loginAtual !== usuarioId) return resultado

      const { data: dadosUsuario } = await supabase.auth.getUser()
      const usuario = dadosUsuario?.user

      if (!usuario || usuario.id !== usuarioId) return resultado

      const nomeUsuario =
        usuario.user_metadata?.usuario ||
        usuario.user_metadata?.username ||
        usuario.email?.split('@')[0] ||
        'estudante'

      return {
        data: {
          id: usuario.id,
          usuario: nomeUsuario,
          nome_usuario: nomeUsuario,
          nome_personagem: usuario.user_metadata?.nome_personagem || nomeUsuario,
          cargo: usuario.user_metadata?.cargo || 'aluno',
          papel: usuario.user_metadata?.papel || 'aluno',
          tribo: usuario.user_metadata?.tribo || null,
          personagem_criado: true,
          selecao_tribo_concluida: true,
          xp: 0,
          nivel: 1,
          perfil_autenticado_emergencia: true,
        },
        error: null,
      }
    },
    maybeSingle() {
      return builder.maybeSingle()
    },
    update(...argumentos) {
      return fromOriginal(tabela).update(...argumentos)
    },
    insert(...argumentos) {
      return fromOriginal(tabela).insert(...argumentos)
    },
    upsert(...argumentos) {
      return fromOriginal(tabela).upsert(...argumentos)
    },
    delete(...argumentos) {
      return fromOriginal(tabela).delete(...argumentos)
    },
  }

  return adaptador
}
