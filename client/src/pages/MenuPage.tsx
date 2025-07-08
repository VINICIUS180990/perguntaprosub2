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

// Componente da MenuPage com layout de cards

export default function MenuPage() {
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
    <div style={{ minHeight: "100vh", width: "100vw", background: "#fff" }}>
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
              >PerguntaProSub AI</button>
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
      
      {/* Conteúdo principal - Layout de Cards */}
      <main style={{
        minHeight: "calc(100vh - 96px)",
        background: "#f7f7f9",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        
        {/* Título da página */}
        <div style={{
          textAlign: "center",
          marginBottom: "48px"
        }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#1976d2",
            marginBottom: "16px"
          }}>
            Estação de Comando
          </h1>
          <p style={{
            fontSize: "18px",
            color: "#666",
            margin: 0
          }}>
            Acesse todas as funcionalidades do sistema
          </p>
        </div>

        {/* Grid de Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          width: "100%",
          maxWidth: "1200px"
        }}>
          
          {/* Card IA PerguntaProSub */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/main")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>🤖</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              PerguntaProSub AI
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Acesse a Inteligência Artificial para consultas sobre regulamentos e normas militares
            </p>
          </div>

          {/* Card Perfil */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/perfil")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>👤</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Meu Perfil
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Gerencie suas informações pessoais e configurações do perfil
            </p>
          </div>

          {/* Card Bate-Papo */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/chat")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>💬</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Bate-Papo
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Converse com outros usuários do sistema em tempo real
            </p>
          </div>

          {/* Card Sobre */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/sobre")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>ℹ️</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Sobre
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Conheça mais sobre o PerguntaProSub e sua missão
            </p>
          </div>

          {/* Card Termos de Uso */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/termos")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>📄</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Termos de Uso
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Consulte os termos e condições de uso da plataforma
            </p>
          </div>

          {/* Card Contato */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/contato")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>📞</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Contato
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Entre em contato conosco para dúvidas e suporte
            </p>
          </div>

          {/* Card Política de Privacidade */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/privacidade")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>🔒</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Política de Privacidade
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Entenda como protegemos e utilizamos seus dados
            </p>
          </div>

          {/* Card Redefinir Senha */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/resetsenha")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>🔑</div>
            <h3 style={{
              color: "#1976d2",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Redefinir Senha
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Altere sua senha de acesso ao sistema
            </p>
          </div>

          {/* Card Excluir Conta */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/excluir-conta")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            <div style={{
              fontSize: "48px",
              marginBottom: "16px"
            }}>🗑️</div>
            <h3 style={{
              color: "#d32f2f",
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px"
            }}>
              Excluir Conta
            </h3>
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Remova permanentemente sua conta do sistema
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
