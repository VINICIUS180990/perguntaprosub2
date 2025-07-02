import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// Hook customizado para verificar conversas não lidas
function useConversasNaoLidas() {
  const [temConversasNaoLidas, setTemConversasNaoLidas] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Buscar ID do usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  // Verificar mensagens não lidas
  useEffect(() => {
    if (!userId) return;

    async function verificarMensagensNaoLidas() {
      // Busca se existe pelo menos uma mensagem não lida para o usuário logado
      const { data } = await supabase
        .from('mensagens')
        .select('id')
        .eq('destinatario_id', userId)
        .or('lida_por.is.null,lida_por.not.cs.{"' + userId + '"}')
        .limit(1);
      
      setTemConversasNaoLidas(!!(data && data.length > 0));
    }

    verificarMensagensNaoLidas();

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel('mensagens-nao-lidas')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
          filter: `destinatario_id=eq.${userId}`
        },
        () => {
          verificarMensagensNaoLidas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return temConversasNaoLidas;
}

const opcoes = [
  { id: "perguntaprosub", label: "PerguntaProSub AI" },
  { id: "perfil", label: "Perfil" },
  { id: "sobre", label: "Sobre" },
  { id: "termos", label: "Termos de Uso" },
  { id: "contato", label: "Contato" },
  { id: "privacidade", label: "Política de Privacidade" },
  { id: "seguranca", label: "Redefinir senha" },
  { id: "excluir", label: "Excluir Conta" }
];

export default function MenuPage() {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("perfil");
  const [headerColor, setHeaderColor] = useState("#fff");
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [menuUsuarioPos, setMenuUsuarioPos] = useState<{ top: number; left: number } | null>(null);
  const navigate = useNavigate();
  const temConversasNaoLidas = useConversasNaoLidas();

  // Carrega cor do tema ao abrir a página
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    setHeaderColor(savedColor || "#fff");
  }, []);

  // Formulário de alteração de senha
  function AlterarSenhaForm() {
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState("");

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
      <form onSubmit={handleAlterarSenha} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18, maxWidth: 340 }}>
        <input
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={e => setNovaSenha(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          required
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={e => setConfirmarSenha(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          required
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
    );
  }

  function FaleConoscoPage() {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1976d2" }}>Fale Conosco</h2>
        <p style={{ color: "#888", marginTop: 24, fontSize: 18, textAlign: "center" }}>
          Contatos<br />
          Whatsapp: (21) 98364-2119<br />
          Email: PERGUNTAPROSUB@GMAIL.COM
        </p>
      </div>
    );
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuUsuarioAberto) {
        const menu = document.getElementById('menu-usuario');
        if (menu && !menu.contains(event.target as Node)) {
          setMenuUsuarioAberto(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuUsuarioAberto]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#fff", overflow: "hidden" }}>
      {/* Cabeçalho idêntico ao da MainPage */}
      <header style={{
        height: 96,
        background: headerColor,
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/simbolo.png" alt="Logo" style={{ width: 72, height: 72, borderRadius: "50%", marginRight: 14 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>PerguntaProSub</div>
            <div style={{ fontSize: 12, color: "#000" }}>Sistema de IA para o mundo Militar</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "4px 14px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
              onClick={() => navigate("/chat")}
            >
              Bate-Papo
            </button>
            {temConversasNaoLidas && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#4CAF50",
                  border: "2px solid #fff",
                  zIndex: 1
                }}
              />
            )}
          </div>
          <span
            style={{
              background: "#1976d2",
              color: "#fff",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              marginRight: 8,
              cursor: "pointer",
              userSelect: "none"
            }}
            title="Menu do usuário"
            onClick={e => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setMenuUsuarioAberto(v => !v);
              setMenuUsuarioPos({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
              });
            }}
          >
            ☰
          </span>
          {menuUsuarioAberto && menuUsuarioPos && (
            <div
              id="menu-usuario"
              style={{
                position: "fixed",
                left: menuUsuarioPos.left - 160,
                top: menuUsuarioPos.top,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                boxShadow: "0 2px 8px #0003",
                zIndex: 9999,
                minWidth: 160,
                fontSize: 15,
                padding: 0,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#222",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  navigate("/");
                }}
              >Página Inicial</button>
              <div style={{ borderTop: "1px solid #eee" }} />
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#222",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  navigate("/main");
                }}
              >IA PerguntaProSub</button>
              <div style={{ borderTop: "1px solid #eee" }} />
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#d32f2f",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  supabase.auth.signOut().then(() => window.location.href = "/");
                }}
              >Sair</button>
            </div>
          )}
        </div>
      </header>
      {/* Conteúdo principal */}
      <div style={{ display: "flex", height: "calc(100vh - 96px)", width: "100vw" }}>
        {/* Sidebar de opções */}
        <aside style={{
          width: 260,
          background: "#fff",
          borderRight: "1px solid #eee",
          padding: 24,
          height: "100%",
          boxSizing: "border-box"
        }}>
          <nav>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {opcoes.map((opcao) => (
                <button
                  key={opcao.id}
                  onClick={() => {
                    setOpcaoSelecionada(opcao.id);
                    if (opcao.id === "perguntaprosub") navigate("/main");
                    else if (opcao.id === "perfil") navigate("/perfil");
                    else if (opcao.id === "privacidade") navigate("/privacidade");
                    else if (opcao.id === "sobre") navigate("/sobre");
                    else if (opcao.id === "termos") navigate("/termos");
                    else if (opcao.id === "contato") navigate("/contato");
                    else if (opcao.id === "home") navigate("/main");
                    else if (opcao.id === "seguranca") navigate("/resetsenha");
                    else if (opcao.id === "excluir") navigate("/excluir-conta");
                    // ...demais navegações já existentes...
                  }}
                  style={{
                    padding: "12px 10px",
                    background: opcaoSelecionada === opcao.id ? "#e3eaff" : "#f7f7f9",
                    border: opcaoSelecionada === opcao.id ? "1.5px solid #1976d2" : "1px solid #eee",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#222",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>
        {/* Área de conteúdo */}
        <main
          style={{
            flex: 1,
            height: "100%",
            background: "#f7f7f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box"
          }}
        >
          <div style={{ width: "100%", maxWidth: 700, minHeight: 400, background: "#f7f7f9", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, margin: 24 }}>
            {opcaoSelecionada === "seguranca" && (
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Segurança</h2>
                <AlterarSenhaForm />
              </div>
            )}
            {opcaoSelecionada === "faleconosco" && (
              <FaleConoscoPage />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
