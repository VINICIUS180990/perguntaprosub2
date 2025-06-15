import { useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Reset() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Extrai o access_token do hash da URL
  const getAccessToken = () => {
    const hash = location.hash.substring(1); // remove o '#'
    const params = new URLSearchParams(hash);
    return params.get("access_token");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setMessage("");
    const access_token = getAccessToken();
    if (!access_token) {
      setMessage("Token de redefinição inválido ou ausente.");
      setLoading(false);
      return;
    }
    // Autentica o usuário com o token recebido
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token: access_token });
    if (sessionError) {
      setMessage("Erro ao autenticar sessão: " + sessionError.message);
      setLoading(false);
      return;
    }
    // Atualiza a senha
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Erro ao redefinir a senha: " + error.message);
    } else {
      setMessage("Senha redefinida com sucesso! Faça login novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Redefinir senha</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Nova senha:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Confirmar nova senha:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Redefinindo..." : "Redefinir Senha"}
        </button>
      </form>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}
