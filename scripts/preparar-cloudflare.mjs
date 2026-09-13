import { readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const pastaPublicada = 'dist'
const limiteSeguro = 24 * 1024 * 1024

async function listarArquivos(pasta) {
  const entradas = await readdir(pasta, { withFileTypes: true })
  const arquivos = []

  for (const entrada of entradas) {
    const caminho = join(pasta, entrada.name)

    if (entrada.isDirectory()) {
      arquivos.push(...(await listarArquivos(caminho)))
    } else if (entrada.isFile()) {
      arquivos.push(caminho)
    }
  }

  return arquivos
}

try {
  const arquivos = await listarArquivos(pastaPublicada)
  let removidos = 0

  for (const arquivo of arquivos) {
    const info = await stat(arquivo)

    if (info.size > limiteSeguro) {
      await unlink(arquivo)
      removidos += 1
      console.log(
        `[cloudflare] Cópia de publicação removida por exceder 24 MiB: ${arquivo} (${(info.size / 1024 / 1024).toFixed(2)} MiB)`,
      )
    }
  }

  console.log(`[cloudflare] Preparação concluída. Arquivos grandes removidos: ${removidos}`)
} catch (erro) {
  console.error('[cloudflare] Falha ao preparar os assets:', erro)
  process.exitCode = 1
}
