import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/uploads-perfil.css'

function extensaoArquivo(arquivo) {
  const partes = arquivo.name.split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : 'jpg'
}

export default function UploadsPerfil({ perfil, onVoltar }) {
  const [tipo, setTipo] = useState('avatar')
  const [arquivo, setArquivo] = useState(null)
  const [galeria, setGaleria] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarMidias()
  }, [perfil?.id])

  async function carregarMidias() {
    const { data, error } = await supabase
      .from('midias_perfil')
      .select('*')
      .eq('usuario_id', perfil.id)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setGaleria(data ?? [])
  }

  async function enviar(evento) {
    evento.preventDefault()
    setMensagem('')

    if (!arquivo) {
      setMensagem('Escolha uma imagem.')
      return
    }

    if (!arquivo.type.startsWith('image/')) {
      setMensagem('Envie apenas arquivos de imagem.')
      return
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem('A imagem deve ter no máximo 5 MB.')
      return
    }

    setEnviando(true)

    const extensao = extensaoArquivo(arquivo)
    const caminho = `${perfil.id}/${tipo}-${crypto.randomUUID()}.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('midias-perfis')
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false,
      })

    if (erroUpload) {
      setMensagem(erroUpload.message || 'Não foi possível enviar a imagem.')
      setEnviando(false)
      return
    }

    const { data: urlPublica } = supabase.storage
      .from('midias-perfis')
      .getPublicUrl(caminho)

    const { error: erroRegistro } = await supabase
      .from('midias_perfil')
      .insert({
        usuario_id: perfil.id,
        tipo,
        caminho_arquivo: caminho,
        url_arquivo: urlPublica.publicUrl,
        status: 'pendente',
      })

    if (erroRegistro) {
      setMensagem(
        erroRegistro.message ||
          'A imagem foi enviada, mas não pôde ser registrada.',
      )
      setEnviando(false)
      return
    }

    setArquivo(null)
    setMensagem(
      'Imagem enviada. Ela aparecerá no perfil após aprovação da administração.',
    )
    setEnviando(false)
    await carregarMidias()
  }

  return (
    <main className="uploads-pagina">
      <button type="button" onClick={onVoltar}>← Voltar</button>

      <header className="uploads-hero">
        <p>Personalização do personagem</p>
        <h1>Imagens do Perfil</h1>
        <span>Avatar, banner público e álbum do personagem</span>
      </header>

      <section className="uploads-formulario">
        <form onSubmit={enviar}>
          <label htmlFor="tipo-midia">Tipo de imagem</label>

          <select
            id="tipo-midia"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
          >
            <option value="avatar">Foto de perfil</option>
            <option value="banner">Banner do perfil público</option>
            <option value="galeria">Álbum do personagem</option>
          </select>

          <label htmlFor="arquivo-midia">Imagem</label>

          <input
            id="arquivo-midia"
            type="file"
            accept="image/*"
            onChange={(evento) =>
              setArquivo(evento.target.files?.[0] ?? null)
            }
          />

          <p>
            Limite de 5 MB. Todas as imagens precisam ser aprovadas
            pela administração antes de aparecerem publicamente.
          </p>

          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar para aprovação'}
          </button>
        </form>

        {mensagem && <p className="uploads-mensagem">{mensagem}</p>}
      </section>

      <section className="uploads-historico">
        <header>
          <p>Histórico</p>
          <h2>Imagens enviadas</h2>
        </header>

        <div className="uploads-grade">
          {galeria.length === 0 ? (
            <article className="uploads-vazio">
              <span>🖼️</span>
              <p>Nenhuma imagem enviada.</p>
            </article>
          ) : (
            galeria.map((item) => (
              <article key={item.id}>
                <img src={item.url_arquivo} alt={item.tipo} />
                <div>
                  <strong>{item.tipo}</strong>
                  <span>Status: {item.status}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
