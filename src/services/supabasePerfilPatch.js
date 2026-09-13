import { supabase } from './supabase'

const fromOriginal = supabase.from.bind(supabase)

supabase.from = (tabela) => {
  const consulta = fromOriginal(tabela)

  if (tabela !== 'perfis') return consulta

  const selectOriginal = consulta.select.bind(consulta)

  consulta.select = (...args) => {
    const selecionada = selectOriginal(...args)
    const eqOriginal = selecionada.eq.bind(selecionada)

    selecionada.eq = (coluna, valor) => {
      const filtrada = eqOriginal(coluna, valor)
      const singleOriginal = filtrada.single.bind(filtrada)

      filtrada.single = async () => {
        let timer
        const limite = new Promise((resolve) => {
          timer = window.setTimeout(() => {
            resolve({
              data: {
                id: valor,
                usuario: 'estudante',
                nome_personagem: 'Estudante de Castelobruxo',
                cargo: 'aluno',
                tribo: null,
                personagem_criado: true,
                selecao_tribo_concluida: true,
                perfil_temporario: true,
              },
              error: null,
            })
          }, 6000)
        })

        try {
          return await Promise.race([singleOriginal(), limite])
        } finally {
          window.clearTimeout(timer)
        }
      }

      return filtrada
    }

    return selecionada
  }

  return consulta
}
