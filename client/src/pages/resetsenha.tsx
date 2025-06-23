import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function RedefinirSenhaPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    if (novaSenha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setCarregando(false);
    if (error) {
      setMensagem("Erro ao alterar senha: " + error.message);
    } else {
      setMensagem("Senha alterada com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
    }
  }

  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 380, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Redefinir senha</h2>
        <form onSubmit={handleAlterarSenha} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18, width: "100%" }} autoComplete="off">
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha || ""}
            onChange={e => setNovaSenha(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha || ""}
            onChange={e => setConfirmarSenha(e.target.value)}
            style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            style={{ background: carregando ? "#aaa" : "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 16, fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer" }}
            disabled={carregando}
          >
            {carregando ? "Alterando..." : "Alterar Senha"}
          </button>
          {mensagem && <div style={{ color: mensagem.includes("sucesso") ? "green" : "red", marginTop: 6 }}>{mensagem}</div>}
        </form>
        <button
          onClick={() => navigate("/main")}
          style={{ marginTop: 24, background: "#eee", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
        >
          Pagina Inicial
        </button>
      </div>
    </div>
  );
}
