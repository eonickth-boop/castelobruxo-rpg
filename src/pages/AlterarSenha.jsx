import { useState } from "react";
import { supabase } from "../services/supabase";

export default function AlterarSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function alterarSenha(event) {
    event.preventDefault();
    setMensagem("");

    if (novaSenha.length < 8) {
      setMensagem("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmacao) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);

      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) {
        throw error;
      }

      setNovaSenha("");
      setConfirmacao("");
      setMensagem("Senha alterada com sucesso.");
    } catch (error) {
      console.error(error);
      setMensagem("Não foi possível alterar a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="pagina-alterar-senha">
      <form onSubmit={alterarSenha}>
        <h1>Alterar senha</h1>

        <label htmlFor="novaSenha">Nova senha</label>
        <input
          id="novaSenha"
          type="password"
          value={novaSenha}
          onChange={(event) => setNovaSenha(event.target.value)}
          autoComplete="new-password"
          required
        />

        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <input
          id="confirmacao"
          type="password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={carregando}>
          {carregando ? "Alterando..." : "Alterar senha"}
        </button>

        {mensagem && <p>{mensagem}</p>}
      </form>
    </main>
  );
}