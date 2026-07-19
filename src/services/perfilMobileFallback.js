import { supabase } from './supabase'

export function ativarFallbackDePerfilMobile() {
  if (supabase.__fallbackPerfilMobileAtivo) return

  const fromOriginal = supabase.from.bind(supabase)

  supabase.from = (tabela) => {
    if (tabela !== 'perfis') return fromOriginal(tabela)

    let builder = fromOriginal(tabela)
    let consultaSelect = false
    let filtroId = null

    const adaptador = {
      select(colunas = '*', opcoes) {
        consultaSelect = true
        builder = builder.select(colunas, opcoes)
        return adaptador
      },
      eq(coluna, valor) {
        if (consultaSelect && coluna === 'id') filtroId = valor
        builder = builder.eq(coluna, valor)
        return adaptador
      },
      async single() {
        if (!consultaSelect || !filtroId) return builder.single()

        const limite = new Promise((resolve) => {
          window.setTimeout(() => {
            resolve({
              data: {
                id: filtroId,
                nome_usuario: 'jogador',
                nome_personagem: 'Estudante',
                papel: 'aluno',
                personagem_criado: true,
                selecao_tribo_concluida: true,
                xp: 0,
                nivel: 1,
              },
              error: null,
              fallbackMobile: true,
            })
          }, 8000)
        })

        try {
          return await Promise.race([builder.single(), limite])
        } catch (erro) {
          console.error('Falha ao carregar perfil no celular:', erro)
          return await limite
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

  supabase.__fallbackPerfilMobileAtivo = true
}
