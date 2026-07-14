import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function Cadastro({ onVoltar, onCadastroConcluido }) {
  const [nomePersonagem, setNomePersonagem] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function criarConta(evento) {
    evento.preventDefault()
    setMensagem('')

    const usuarioLimpo = usuario.trim().toLowerCase()
    const nomeLimpo = nomePersonagem.trim()

    if (!nomeLimpo || !usuarioLimpo || !senha || !confirmacaoSenha) {
      setMensagem('Preencha todos os campos.')
      return
    }

    if (!/^[a-z0-9_]+$/.test(usuarioLimpo)) {
      setMensagem(
        'O usuário pode conter apenas letras minúsculas, números e underline.',
      )
      return
    }

    if (usuarioLimpo.length < 3) {
      setMensagem('O nome de usuário precisa ter pelo menos 3 caracteres.')
      return
    }

    if (senha.length < 8) {
      setMensagem('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmacaoSenha) {
      setMensagem('As senhas não coincidem.')
      return
    }

    setCarregando(true)

    const emailInterno = `${usuarioLimpo}@castelobruxo.local`

    const { data, error } = await supabase.auth.signUp({
      email: emailInterno,
      password: senha,
      options: {
        data: {
          usuario: usuarioLimpo,
          nome_personagem: nomeLimpo,
        },
      },
    })

    if (error) {
      console.error(error)

      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered')
      ) {
        setMensagem('Esse nome de usuário já está em uso.')
      } else {
        setMensagem(error.message || 'Não foi possível criar a conta.')
      }

      setCarregando(false)
      return
    }

    if (!data.user) {
      setMensagem('Não foi possível concluir o cadastro.')
      setCarregando(false)
      return
    }

    setMensagem('Conta criada com sucesso.')
    setCarregando(false)

    if (onCadastroConcluido) {
      onCadastroConcluido()
    }
  }

  return (
    <main
      style={{
        maxWidth: '460px',
        margin: '60px auto',
        padding: '24px',
      }}
    >
      <section
        style={{
          background:
            'linear-gradient(180deg, rgba(28,34,29,.98), rgba(17,20,18,.98))',
          border: '1px solid rgba(201,164,92,.45)',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 12px 30px rgba(0,0,0,.35)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: '#e5c16b',
            marginTop: 0,
            marginBottom: '8px',
          }}
        >
          Criar conta
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: '#aab7aa',
            marginBottom: '26px',
          }}
        >
          Comece sua jornada em Castelobruxo.
        </p>

        <form onSubmit={criarConta}>
          <label htmlFor="nome-personagem">Nome do personagem</label>
          <input
            id="nome-personagem"
            type="text"
            value={nomePersonagem}
            onChange={(evento) => setNomePersonagem(evento.target.value)}
            autoComplete="name"
            required
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '16px',
            }}
          />

          <label htmlFor="usuario-cadastro">Nome de usuário</label>
          <input
            id="usuario-cadastro"
            type="text"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            autoComplete="username"
            required
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '16px',
            }}
          />

          <label htmlFor="senha-cadastro">Senha</label>
          <input
            id="senha-cadastro"
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            autoComplete="new-password"
            required
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '16px',
            }}
          />

          <label htmlFor="confirmacao-cadastro">Confirmar senha</label>
          <input
            id="confirmacao-cadastro"
            type="password"
            value={confirmacaoSenha}
            onChange={(evento) => setConfirmacaoSenha(evento.target.value)}
            autoComplete="new-password"
            required
            style={{
              width: '100%',
              padding: '13px',
              marginTop: '8px',
              marginBottom: '20px',
            }}
          />

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontWeight: '700',
            }}
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        {mensagem && (
          <p
            style={{
              marginTop: '18px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(201,164,92,.1)',
              border: '1px solid rgba(201,164,92,.25)',
            }}
          >
            {mensagem}
          </p>
        )}

        <button
          type="button"
          onClick={onVoltar}
          style={{
            width: '100%',
            marginTop: '14px',
          }}
        >
          Voltar ao login
        </button>
      </section>
    </main>
  )
}