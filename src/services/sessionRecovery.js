function decodificarPayloadJwt(token) {
  try {
    const parte = token.split('.')[1]
    if (!parte) return null

    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const normalizado = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(normalizado))
  } catch {
    return null
  }
}

function extrairAccessToken(valor) {
  try {
    const dados = JSON.parse(valor)
    return dados?.access_token || dados?.currentSession?.access_token || null
  } catch {
    return null
  }
}

function limparTokensInvalidos(storage) {
  const agora = Math.floor(Date.now() / 1000)

  for (let indice = storage.length - 1; indice >= 0; indice -= 1) {
    const chave = storage.key(indice)
    if (!chave || !chave.startsWith('sb-') || !chave.endsWith('-auth-token')) continue

    const valor = storage.getItem(chave)
    const token = valor ? extrairAccessToken(valor) : null
    const payload = token ? decodificarPayloadJwt(token) : null

    const emitidoNoFuturo = Number(payload?.iat) > agora + 60
    const expirado = Number(payload?.exp) > 0 && Number(payload.exp) <= agora
    const corrompido = Boolean(valor) && !token

    if (emitidoNoFuturo || expirado || corrompido) {
      storage.removeItem(chave)
    }
  }
}

try {
  limparTokensInvalidos(window.localStorage)
  limparTokensInvalidos(window.sessionStorage)
} catch (erro) {
  console.warn('Não foi possível verificar a sessão salva:', erro)
}
