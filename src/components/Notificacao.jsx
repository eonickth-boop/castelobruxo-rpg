import './Notificacao.css'

export default function Notificacao({ mensagem }) {
  if (!mensagem) return null

  const texto = mensagem.toLowerCase()

  const erro =
    texto.includes('não foi possível') ||
    texto.includes('incorreto') ||
    texto.includes('insuficiente') ||
    texto.includes('erro')

  return (
    <div
      className={`notificacao ${
        erro ? 'notificacao-erro' : 'notificacao-sucesso'
      }`}
      role="status"
    >
      <strong>{erro ? 'Atenção' : 'Tudo certo'}</strong>
      <span>{mensagem}</span>
    </div>
  )
}