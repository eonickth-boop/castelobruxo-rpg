const CHAVE_MIGRACAO = 'castelobruxo:jwt-reset-v1'

export function limparSessaoJwtInvalidaUmaVez() {
  try {
    if (localStorage.getItem(CHAVE_MIGRACAO) === 'ok') return

    const chaves = []
    for (let indice = 0; indice < localStorage.length; indice += 1) {
      const chave = localStorage.key(indice)
      if (chave && chave.startsWith('sb-') && chave.includes('auth-token')) {
        chaves.push(chave)
      }
    }

    chaves.forEach((chave) => localStorage.removeItem(chave))
    sessionStorage.clear()
    localStorage.setItem(CHAVE_MIGRACAO, 'ok')
  } catch (erro) {
    console.warn('Não foi possível limpar a sessão antiga do Supabase:', erro)
  }
}
