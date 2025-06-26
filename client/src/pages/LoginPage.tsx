import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { inserirPerfilUsuario } from "../utils/perfilUsuario";

const coresTema: Record<string, string> = {
  marinha: "#e5e5e5",
  exercito: "#4d5c2b",
  aeronautica: "#305a91",
  policia: "#666666",
  bombeiro: "#b08c3e",
};

const nomesTema: Record<string, string> = {
  marinha: "Marinha",
  exercito: "Exército",
  aeronautica: "Aeronáutica",
  policia: "Polícia",
  bombeiro: "Bombeiro",
};

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [tema, setTema] = useState<keyof typeof coresTema>("marinha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [nomeguerra, setNomeguerra] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  // Sempre que o tema mudar, salva a cor no localStorage
  useEffect(() => {
    localStorage.setItem("paletaCor", coresTema[tema]);
  }, [tema]);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);
    if (error) {
      alert("Usuário ou senha inválidos");
    } else {
      window.location.href = "/main";
    }
  }

  async function handleRegister() {
    if (!email || !senha || !nome || !nomeguerra) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    
    try {
      console.log("=== DEBUG REGISTRO ===");
      console.log("Email:", email);
      console.log("Nome:", nome);
      console.log("Nome de guerra:", nomeguerra);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { 
          data: { 
            full_name: nome, 
            nomeguerra: nomeguerra 
          } 
        }
      });
      
      console.log("Resposta do signUp:", { data, error });
      
      if (error) {
        console.error("Erro no signUp:", error);
        let errorMessage = "Erro ao criar conta: ";
        
        if (error.message.includes("already registered")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login ou redefinir a senha.";
        } else if (error.message.includes("invalid email")) {
          errorMessage = "Email inválido. Verifique o formato do email.";
        } else if (error.message.includes("password")) {
          errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres.";
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
        setLoading(false);
        return;
      }
      
      if (data.user) {
        console.log("Usuário criado:", data.user);
        
        // Insere perfil do usuário na tabela perfil_usuario
        try {
          const perfilResult = await inserirPerfilUsuario({
            user_id: data.user.id,
            nome,
            nomeguerra,
            posto: "",
            forca: "",
            om: "",
            celular: "",
            email
          });
          
          console.log("Resultado inserção perfil:", perfilResult);
          
          if (perfilResult.error) {
            console.error("Erro ao inserir perfil:", perfilResult.error);
            // Não bloqueia o cadastro, mas registra o erro
          }
        } catch (profileError) {
          console.error("Erro inesperado ao inserir perfil:", profileError);
        }
        
        alert("Conta criada com sucesso! Verifique seu email para confirmar o cadastro.");
        setTab("login");
        // Limpar campos
        setEmail("");
        setSenha("");
        setNome("");
        setNomeguerra("");
      } else {
        console.warn("signUp retornou sucesso mas sem usuário");
        alert("Houve um problema no cadastro. Tente novamente.");
      }
      
    } catch (unexpectedError) {
      console.error("Erro inesperado no registro:", unexpectedError);
      alert("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetMsg("");
    
    if (!resetEmail) {
      setResetMsg("Digite seu email para redefinir a senha.");
      return;
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetMsg("Por favor, digite um email válido.");
      return;
    }
    
    setResetMsg("⏳ Enviando email...");
    
    try {
      console.log("=== DEBUG RESET PASSWORD ===");
      console.log("Email:", resetEmail);
      console.log("URL de redirecionamento:", `${window.location.origin}/resetsenha`);
      
      // Primeiro, vamos verificar se o usuário existe
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.log("Erro ao listar usuários (normal se não for admin):", listError);
      } else {
        const userExists = users.users.some(user => user.email === resetEmail);
        console.log("Usuário existe no sistema:", userExists);
      }
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/resetsenha`
      });
      
      console.log("Resposta do Supabase:", { data, error });
      
      if (error) {
        console.error("Erro detalhado:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Mensagens de erro mais específicas baseadas no tipo de erro
        if (error.message.includes("rate limit") || error.message.includes("too many")) {
          setResetMsg("❌ Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
        } else if (error.message.includes("Invalid email")) {
          setResetMsg("❌ Email inválido. Verifique o endereço digitado.");
        } else if (error.message.includes("not found") || error.message.includes("User not found")) {
          setResetMsg("❌ Email não encontrado. Verifique se você tem uma conta com este email.");
        } else if (error.message.includes("For security purposes")) {
          setResetMsg("⚠️ Por segurança, aguarde alguns minutos antes de tentar novamente.");
        } else if (error.message.includes("Email not confirmed")) {
          setResetMsg("❌ Email não confirmado. Verifique se confirmou seu cadastro primeiro.");
        } else {
          setResetMsg(`❌ Erro: ${error.message}`);
        }
      } else {
        console.log("✅ Email de reset enviado com sucesso!");
        console.log("Data retornada:", data);
        
        setResetMsg("✅ Email enviado com sucesso! 📧\n\nVerifique:\n• Caixa de entrada\n• Pasta de spam/lixo eletrônico\n• Pode demorar até 5 minutos para chegar");
        setResetEmail("");
        
        // Fecha o modal após 8 segundos para dar tempo de ler
        setTimeout(() => {
          setShowReset(false);
          setResetMsg("");
        }, 8000);
      }
    } catch (err) {
      console.error("Erro inesperado completo:", err);
      setResetMsg(`❌ Erro inesperado: ${err}. Tente novamente.`);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: coresTema[tema],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 400,
        }}
      >
        <img
          src="/simbolo.png"
          alt="Símbolo"
          style={{ width: 160, height: 160, marginBottom: 16, borderRadius: "50%" }}
        />
        <h1 style={{ color: "#000", fontWeight: 700, fontSize: 32, marginBottom: 0, textAlign: "center" }}>
          PerguntaProSub
        </h1>
        <div style={{ height: 16 }} />
        <div style={{ color: "#000", fontWeight: 500, marginBottom: 8, fontSize: 18, textAlign: "center" }}>
          Tá na onça né Boysinho?
        </div>
        <div style={{ color: "#000", marginBottom: 24, fontSize: 14, textAlign: "center" }}>
          A primeira Inteligência Artificial voltada para o Universo Militar!
        </div>
        {/* Paleta de temas */}
        <div style={{ margin: "0 0 24px 0", textAlign: "center" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#000" }}>Escolha seu tema:</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
            {Object.keys(coresTema).map((key) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <button
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: tema === key ? "3px solid #1976d2" : "2px solid #bbb",
                    background: coresTema[key],
                    cursor: "pointer",
                    marginBottom: 6,
                    boxShadow: "0 1px 4px #0001",
                  }}
                  onClick={() => setTema(key as keyof typeof coresTema)}
                  title={nomesTema[key]}
                />
                <span style={{ color: "#000", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
                  {nomesTema[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Card de login/cadastro */}
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px #0001",
            padding: 24,
            minWidth: 340,
            marginBottom: 16,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", marginBottom: 16 }}>
            <button
              onClick={() => setTab("login")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                borderBottom: tab === "login" ? "2px solid #1976d2" : "2px solid #eee",
                background: "none",
                fontWeight: 600,
                color: tab === "login" ? "#1976d2" : "#888",
                cursor: "pointer",
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab("register")}
              style={{
                flex: 1,
                padding: 8,
                border: "none",
                borderBottom: tab === "register" ? "2px solid #1976d2" : "2px solid #eee",
                background: "none",
                fontWeight: 600,
                color: tab === "register" ? "#1976d2" : "#888",
                cursor: "pointer",
              }}
            >
              Criar Conta
            </button>
          </div>
          {tab === "login" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ fontSize: 20, margin: "8px 0", color: "#000" }}>Fazer Login</h2>
                <input
                  type="email"
                  placeholder="Email"
                  style={inputStyle}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  placeholder="Senha"
                  style={inputStyle}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                  required
                />
                <button 
                  style={buttonStyle} 
                  onClick={handleLogin} 
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
                <div style={{ marginTop: 8, textAlign: "right" }}>
                  <a
                    href="#"
                    style={{ color: "#1976d2", fontSize: 13, textDecoration: "underline" }}
                    onClick={e => {
                      e.preventDefault();
                      setShowReset(true);
                    }}
                  >
                    Esqueci login/senha
                  </a>
                </div>
                {showReset && (
                  <div
                    style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 20, marginTop: 16, boxShadow: "0 2px 8px #0002", maxWidth: 340 }}
                    onClick={() => setShowReset(false)}
                  >
                    <form onClick={e => e.stopPropagation()} onSubmit={handleResetPassword}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Redefinir senha</div>
                      <input
                        type="email"
                        placeholder="Digite seu email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 15, marginBottom: 10 }}
                        required
                      />
                      <button
                        type="submit"
                        style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%" }}
                      >
                        Enviar link de redefinição
                      </button>
                      {resetMsg && (
                        <div style={{ 
                          color: resetMsg.includes("✅") ? "green" : resetMsg.includes("❌") ? "red" : resetMsg.includes("⚠️") ? "orange" : "blue", 
                          marginTop: 8, 
                          fontSize: 13,
                          lineHeight: 1.4,
                          whiteSpace: "pre-line"
                        }}>
                          {resetMsg}
                        </div>
                      )}
                      <div style={{ marginTop: 10, textAlign: "center" }}>
                        <a href="#" style={{ color: "#1976d2", fontSize: 13 }} onClick={e => { e.preventDefault(); setShowReset(false); }}>Voltar</a>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, margin: "8px 0", color: "#000" }}>Criar Conta</h2>
              <input
                type="text"
                placeholder="Nome completo"
                style={inputStyle}
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
              <input
                type="text"
                placeholder="Nome de guerra"
                style={inputStyle}
                value={nomeguerra}
                onChange={e => setNomeguerra(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                style={inputStyle}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha"
                style={inputStyle}
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
              <button style={buttonStyle} onClick={handleRegister} disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </>
          )}
        </div>
        <div style={{ color: "#000", fontSize: 13, marginTop: 16, textAlign: "center" }}>
          Sistema de IA para consulta de normas
          <br />
          © 2025 PerguntaProSub
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  margin: "8px 0",
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  color: "#000",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 0",
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontWeight: 700,
  fontSize: 16,
  marginTop: 10,
  cursor: "pointer",
};