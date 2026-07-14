import { useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import '../styles/criacao-personagem.css'

const anos = [
  { valor: 1, rotulo: '1º ano' },
  { valor: 2, rotulo: '2º ano' },
  { valor: 3, rotulo: '3º ano' },
  { valor: 4, rotulo: '4º ano' },
  { valor: 5, rotulo: '5º ano' },
  { valor: 6, rotulo: '6º ano' },
  { valor: 7, rotulo: '7º ano' },
]

const tracos = [
  'Protetor',
  'Corajoso',
  'Observador',
  'Criativo',
  'Curioso',
  'Leal',
  'Paciente',
  'Estratégico',
]

function extensaoArquivo(arquivo) {
  const partes = arquivo.name.split('.')
  return partes.length > 1 ? partes.pop().toLowerCase() : 'jpg'
}

export default function CriacaoPersonagem({ perfil, onConcluido, sair }) {
  const [etapa, setEtapa] = useState(1)
  const [nome, setNome] = useState(perfil?.nome_personagem || '')
  const [idade, setIdade] = useState(perfil?.idade_personagem || '')
  const [ano, setAno] = useState(Number(perfil?.ano) || 1)
  const [pronomes, setPronomes] = useState(perfil?.pronomes || '')
  const [origem, setOrigem] = useState(perfil?.origem || '')
  const [traco, setTraco] = useState(perfil?.traco_principal || 'Curioso')
  const [bio, setBio] = useState(perfil?.bio || '')
  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(perfil?.avatar_url || '')
  const [previewBanner, setPreviewBanner] = useState(perfil?.banner_url || '')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const progresso = useMemo(() => Math.round((etapa / 3) * 100), [etapa])

  function selecionarArquivo(tipo, arquivo) {
    if (!arquivo) return

    if (!arquivo.type.startsWith('image/')) {
      setMensagem('Envie apenas arquivos de imagem.')
      return
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem('A imagem deve ter no máximo 5 MB.')
      return
    }

    const preview = URL.createObjectURL(arquivo)

    if (tipo === 'avatar') {
      setAvatar(arquivo)
      setPreviewAvatar(preview)
    } else {
      setBanner(arquivo)
      setPreviewBanner(preview)
    }

    setMensagem('')
  }

  function validarEtapaAtual() {
    if (etapa === 1) {
      if (nome.trim().length < 3) {
        setMensagem('O nome do personagem deve ter pelo menos 3 caracteres.')
        return false
      }

      const idadeNumero = Number(idade)

      if (!Number.isInteger(idadeNumero) || idadeNumero < 11 || idadeNumero > 99) {
        setMensagem('Informe uma idade válida entre 11 e 99 anos.')
        return false
      }

      if (!Number.isInteger(Number(ano)) || Number(ano) < 1 || Number(ano) > 7) {
        setMensagem('Informe um ano escolar válido.')
        return false
      }
    }

    if (etapa === 2) {
      if (origem.trim().length < 2) {
        setMensagem('Informe a origem do personagem.')
        return false
      }

      if (bio.trim().length < 20) {
        setMensagem('A apresentação deve ter pelo menos 20 caracteres.')
        return false
      }
    }

    setMensagem('')
    return true
  }

  function avancar() {
    if (!validarEtapaAtual()) return
    setEtapa((valor) => Math.min(3, valor + 1))
  }

  function voltar() {
    setMensagem('')
    setEtapa((valor) => Math.max(1, valor - 1))
  }

  async function enviarMidia(tipo, arquivo) {
    if (!arquivo) return null

    const extensao = extensaoArquivo(arquivo)
    const caminho = `${perfil.id}/${tipo}-${crypto.randomUUID()}.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('midias-perfis')
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false,
      })

    if (erroUpload) throw erroUpload

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

    if (erroRegistro) throw erroRegistro

    return urlPublica.publicUrl
  }

  async function concluirCriacao() {
    if (!validarEtapaAtual()) return

    setSalvando(true)
    setMensagem('')

    try {
      await Promise.all([
        enviarMidia('avatar', avatar),
        enviarMidia('banner', banner),
      ])

      const { data, error } = await supabase.rpc(
        'concluir_criacao_personagem',
        {
          p_nome_personagem: nome.trim(),
          p_idade_personagem: Number(idade),
          p_ano: Number(ano),
          p_pronomes: pronomes.trim() || null,
          p_origem: origem.trim(),
          p_traco_principal: traco,
          p_bio: bio.trim(),
        },
      )

      if (error) throw error

      setMensagem('Personagem criado. A Cerimônia dos Guardiões começará agora.')
      onConcluido?.(data)
    } catch (error) {
      console.error(error)
      setMensagem(
        error.message ||
          'Não foi possível concluir a criação do personagem.',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="criacao-personagem">
      <div className="criacao-fundo" />

      <section className="criacao-painel">
        <header className="criacao-cabecalho">
          <img src="/assets/logo/castelobruxo-logo.png" alt="Castelobruxo" />

          <div>
            <p>Primeiro registro</p>
            <h1>Crie seu personagem</h1>
            <span>
              Antes da cerimônia de tribo, precisamos conhecer
              quem está chegando a Castelobruxo.
            </span>
          </div>
        </header>

        <div className="criacao-progresso">
          <div><span style={{ width: `${progresso}%` }} /></div>
          <small>Etapa {etapa} de 3</small>
        </div>

        {mensagem && <p className="criacao-mensagem">{mensagem}</p>}

        {etapa === 1 && (
          <section className="criacao-etapa">
            <div className="criacao-titulo-etapa">
              <span>01</span>
              <div><p>Identidade</p><h2>Quem é você?</h2></div>
            </div>

            <div className="criacao-form-grade">
              <label>
                <span>Nome do personagem</span>
                <input
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  maxLength={70}
                  placeholder="Nome usado no RPG"
                />
              </label>

              <label>
                <span>Idade</span>
                <input
                  type="number"
                  min="11"
                  max="99"
                  value={idade}
                  onChange={(evento) => setIdade(evento.target.value)}
                />
              </label>

              <label>
                <span>Ano escolar</span>
                <select
                  value={ano}
                  onChange={(evento) => setAno(Number(evento.target.value))}
                >
                  {anos.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {item.rotulo}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Pronomes (opcional)</span>
                <input
                  value={pronomes}
                  onChange={(evento) => setPronomes(evento.target.value)}
                  maxLength={40}
                  placeholder="Ex.: ele/dele"
                />
              </label>
            </div>
          </section>
        )}

        {etapa === 2 && (
          <section className="criacao-etapa">
            <div className="criacao-titulo-etapa">
              <span>02</span>
              <div><p>História</p><h2>O que trouxe você até aqui?</h2></div>
            </div>

            <div className="criacao-form-grade">
              <label>
                <span>Origem ou região</span>
                <input
                  value={origem}
                  onChange={(evento) => setOrigem(evento.target.value)}
                  maxLength={90}
                  placeholder="Cidade, comunidade ou região"
                />
              </label>

              <label>
                <span>Traço marcante</span>
                <select
                  value={traco}
                  onChange={(evento) => setTraco(evento.target.value)}
                >
                  {tracos.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="criacao-campo-largo">
                <span>Pequena apresentação</span>
                <textarea
                  value={bio}
                  onChange={(evento) => setBio(evento.target.value)}
                  maxLength={600}
                  rows={7}
                  placeholder="Conte brevemente quem é o personagem, o que busca e como chegou à escola."
                />
                <small>{bio.length}/600</small>
              </label>
            </div>
          </section>
        )}

        {etapa === 3 && (
          <section className="criacao-etapa">
            <div className="criacao-titulo-etapa">
              <span>03</span>
              <div><p>Retrato oficial</p><h2>Como seu personagem será visto?</h2></div>
            </div>

            <div className="criacao-midias">
              <article>
                <div className="criacao-preview-avatar">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Prévia do avatar" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div>
                  <h3>Foto de perfil</h3>
                  <p>Será enviada para aprovação da administração.</p>

                  <label className="criacao-arquivo">
                    Escolher imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(evento) =>
                        selecionarArquivo('avatar', evento.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              </article>

              <article>
                <div
                  className="criacao-preview-banner"
                  style={
                    previewBanner
                      ? { backgroundImage: `url("${previewBanner}")` }
                      : undefined
                  }
                >
                  {!previewBanner && <span>Banner</span>}
                </div>

                <div>
                  <h3>Banner público</h3>
                  <p>Também ficará pendente até ser aprovado.</p>

                  <label className="criacao-arquivo">
                    Escolher imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(evento) =>
                        selecionarArquivo('banner', evento.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              </article>
            </div>

            <div className="criacao-resumo">
              <p>Resumo do registro</p>
              <h3>{nome || 'Personagem sem nome'}</h3>

              <dl>
                <div><dt>Idade</dt><dd>{idade || '—'}</dd></div>
                <div><dt>Ano</dt><dd>{anos.find((item) => item.valor === Number(ano))?.rotulo}</dd></div>
                <div><dt>Origem</dt><dd>{origem || '—'}</dd></div>
                <div><dt>Traço</dt><dd>{traco}</dd></div>
              </dl>

              <p>
                A tribo será revelada durante a Cerimônia dos Guardiões.
              </p>
            </div>
          </section>
        )}

        <footer className="criacao-acoes">
          <button type="button" className="criacao-sair" onClick={sair}>
            Sair da conta
          </button>

          <div>
            {etapa > 1 && (
              <button type="button" onClick={voltar} disabled={salvando}>
                Voltar
              </button>
            )}

            {etapa < 3 ? (
              <button type="button" onClick={avancar}>Continuar</button>
            ) : (
              <button type="button" onClick={concluirCriacao} disabled={salvando}>
                {salvando ? 'Registrando...' : 'Concluir personagem'}
              </button>
            )}
          </div>
        </footer>
      </section>
    </main>
  )
}
