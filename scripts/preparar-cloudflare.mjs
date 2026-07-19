import { stat, unlink } from 'node:fs/promises'

const arquivosComLimite = [
  'dist/assets/tribos/yandara/icone.png',
]

for (const arquivo of arquivosComLimite) {
  try {
    const info = await stat(arquivo)
    const limiteCloudflare = 25 * 1024 * 1024

    if (info.size > limiteCloudflare) {
      await unlink(arquivo)
      console.log(`[cloudflare] Cópia de publicação removida por exceder 25 MiB: ${arquivo}`)
    }
  } catch (erro) {
    if (erro?.code !== 'ENOENT') throw erro
  }
}
