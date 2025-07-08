import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InicialPage() {
  const [headerColor, setHeaderColor] = useState("#fff");
  const [menuConfigAberto, setMenuConfigAberto] = useState(false);
  const [showTemaModal, setShowTemaModal] = useState(false);
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null);
  const navigate = useNavigate();

  // Definição dos temas (igual ao original)
  const headerCores: Record<string, string> = {
    "Marinha": "#e5e5e5",
    "Exército": "#4d5c2b",
    "Aeronáutica": "#305a91",
    "Polícia": "#666666",
    "Bombeiro": "#b08c3e"
  };

  const temas = [
    { nome: "Marinha", cor: "#e5e5e5", borda: "#bbb" },
    { nome: "Exército", cor: "#4d5c2b", borda: "#0d47a1" },
    { nome: "Aeronáutica", cor: "#305a91", borda: "#2e7d32" },
    { nome: "Polícia", cor: "#666666", borda: "#c62828" },
    { nome: "Bombeiro", cor: "#b08c3e", borda: "#f57f17" },
  ];

  // Carrega a cor do tema do localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    if (savedColor) {
      setHeaderColor(savedColor);
    }
  }, []);

  // Mostra modal de tema após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowTemaModal(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Função para escolher tema (igual ao original)
  function handleEscolherTema(tema: string) {
    setTemaSelecionado(tema);
    setHeaderColor(headerCores[tema] || "#fff");
    localStorage.setItem("paletaCor", headerCores[tema] || "#fff");
    setShowTemaModal(false);
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      width: "100vw", 
      background: "#fff",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Cabeçalho */}
      <header style={{
        width: "100%",
        height: 96,
        background: headerColor,
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/simbolo.png" alt="Logo" style={{ 
            width: 72, 
            height: 72, 
            borderRadius: "50%", 
            marginRight: 14 
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              PerguntaProSub
            </div>
            <div style={{ fontSize: 12, color: "#000" }}>
              Sistema de IA para o mundo Militar
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            style={{ 
              background: "#1976d2", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6, 
              padding: "8px 16px", 
              fontWeight: 600, 
              fontSize: 14, 
              cursor: "pointer" 
            }} 
            onClick={() => navigate("/login")}
          >
            Entrar
          </button>
          <div style={{ position: "relative" }}>
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
                fontSize: 20,
                cursor: "pointer",
                userSelect: "none"
              }}
              title="Menu"
              onClick={() => setMenuConfigAberto(v => !v)}
            >
              ☰
            </span>
            {menuConfigAberto && (
              <div
                style={{
                  position: "fixed",
                  right: 32,
                  top: 90,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #0003",
                  zIndex: 9999,
                  minWidth: 180,
                  fontSize: 15,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 15,
                    color: "#000"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/sobre");
                    setMenuConfigAberto(false);
                  }}
                >
                  Sobre
                </button>
                <button
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 15,
                    color: "#000"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/contato");
                    setMenuConfigAberto(false);
                  }}
                >
                  Contato
                </button>
                <button
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 15,
                    color: "#000"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/privacidade");
                    setMenuConfigAberto(false);
                  }}
                >
                  Privacidade
                </button>
                <button
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    fontSize: 15,
                    color: "#000"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/termos");
                    setMenuConfigAberto(false);
                  }}
                >
                  Termos
                </button>
              </div>
            )}
            {/* Overlay para fechar menu ao clicar fora */}
            {menuConfigAberto && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  zIndex: 9998,
                  background: "transparent"
                }}
                onClick={() => setMenuConfigAberto(false)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal - Área de Anúncios */}
      <main style={{
        flex: 1,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0px"
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: "center",
          maxWidth: "800px",
          marginBottom: "0px"
        }}>
          <h1 style={{
            fontSize: "44px",
            fontWeight: "bold",
            color: "#1976d2",
            marginBottom: "16px"
          }}>
            TODOS JUNTOS EM UMA SÓ MISSÃO
          </h1>
          <p style={{
            fontSize: "20px",
            color: "#666",
            lineHeight: "1.6",
            marginBottom: "32px"
          }}>
            A primeira Inteligência Artificial totalmente integrada a uma revolucionária Rede de Comunicação voltada para Militares das Forças Armadas e de Segurança Pública. 
            Converse, compartilhe experiências e construa sua rede profissional.
          </p>
        </div>

        {/* Destaque IA PerguntaProSub */}
        <div style={{
          width: "100%",
          maxWidth: "1600px",
          textAlign: "center",
          marginBottom: "0px"
        }}>
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              margin: "0px auto",
              maxWidth: "1150px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/landing")}
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
              background: "#f8f9fa",
              borderRadius: "12px",
              padding: "32px 24px",
              marginBottom: "24px",
              border: "1px solid #e0e0e0"
            }}>
              <div 
                style={{
                  display: "inline-block",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: "24px",
                  maxWidth: "100%"
                }}
              >
                <img 
                  src="./ia-banner.png" 
                  alt="IA PerguntaProSub - Inteligência Artificial Militar"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    height: "400px",
                    objectFit: "contain",
                    display: "block"
                  }}
                  onError={(e) => {
                    console.error('Erro ao carregar ia-banner.png, tentando caminho alternativo...');
                    // Tenta caminhos alternativos
                    if (e.currentTarget.src.includes('./ia-banner.png')) {
                      e.currentTarget.src = '/ia-banner.png';
                    } else if (e.currentTarget.src.includes('/ia-banner.png')) {
                      e.currentTarget.src = '/simbolo.png';
                      e.currentTarget.style.width = "400px";
                      e.currentTarget.style.height = "400px";
                      e.currentTarget.style.objectFit = "contain";
                      console.log('Usando imagem fallback: simbolo.png');
                    }
                  }}
                  onLoad={() => {
                    console.log('Imagem IA carregada com sucesso!');
                  }}
                />
              </div>
              
              <p style={{
                fontSize: "20px",
                lineHeight: "1.6",
                color: "#555",
                maxWidth: "700px",
                margin: "0 auto",
                textAlign: "center"
              }}>
                <strong style={{ color: "#1976d2" }}>CLIQUE AQUI e acesse o PerguntaProSub AI</strong><br />
                A mais avançada IA para analise de normas, regulamentos, instruções e demais documentos. 
                Faça perguntas específicas e receba orientações precisas baseadas na documentação oficial. 
                Ideal para consultas rápidas sobre procedimentos, regulamentações e diretrizes.
              </p>
            </div>
          </div>
          
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "24px",
              margin: "0px auto",
              marginTop: "40px",
              maxWidth: "1150px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => navigate("/login")}
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
              background: "#f8f9fa",
              borderRadius: "12px",
              padding: "32px 24px",
              marginBottom: "24px",
              border: "1px solid #e0e0e0"
            }}>
              <h3 style={{
                color: "#1976d2",
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}>
                🚀 CADASTRE-SE e tenha acesso completo!
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "16px",
                textAlign: "left"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🤖</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>IA Avançada:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Consulte documentos com precisão total</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>👥</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>Rede de Comunicação:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Conecte-se com usuários de todas as Forças</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>💾</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>Salvar Conversas:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Guarde suas consultas e respostas importantes</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>📁</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>Biblioteca Pessoal:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Organize seus documentos favoritos</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>💬</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>Chat Privado:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Converse com segurança total</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🔒</span>
                  <div>
                    <strong style={{ color: "#1976d2" }}>100% Seguro:</strong>
                    <span style={{ color: "#333", marginLeft: "8px" }}>Ambiente exclusivo para usuários verificados</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Links para Sites Oficiais */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          width: "100%",
          maxWidth: "1200px",
          marginTop: "40px"
        }}>
          {/* Marinha do Brasil */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => window.open("https://www.marinha.mil.br/", "_blank")}
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
              height: "200px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #eee",
              overflow: "hidden",
              position: "relative",
              background: "#e5e5e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img 
                src="/logo-marinha.png" 
                alt="Logo Marinha do Brasil"
                style={{
                  width: "140px",
                  height: "140px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
                }}
              />
            </div>
            <h3 style={{ color: "#1976d2", marginBottom: "8px", fontSize: "18px" }}>
              Marinha do Brasil
            </h3>
            <p style={{ color: "#666", fontSize: "14px", margin: "0" }}>
              Acesse o site oficial da Marinha do Brasil
            </p>
          </div>

          {/* Exército Brasileiro */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => window.open("https://www.eb.mil.br/", "_blank")}
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
              height: "200px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #eee",
              overflow: "hidden",
              position: "relative",
              background: "#4d5c2b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img 
                src="/logo-exercito.png" 
                alt="Logo Exército Brasileiro"
                style={{
                  width: "140px",
                  height: "140px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
                }}
              />
            </div>
            <h3 style={{ color: "#4CAF50", marginBottom: "8px", fontSize: "18px" }}>
              Exército Brasileiro
            </h3>
            <p style={{ color: "#666", fontSize: "14px", margin: "0" }}>
              Acesse o site oficial do Exército Brasileiro
            </p>
          </div>

          {/* Força Aérea Brasileira */}
          <div 
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              overflow: "hidden"
            }}
            onClick={() => window.open("https://www.fab.mil.br/index.php", "_blank")}
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
              height: "200px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #eee",
              overflow: "hidden",
              position: "relative",
              background: "#305a91",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img 
                src="/logo-aeronautica.png" 
                alt="Logo Força Aérea Brasileira"
                style={{
                  width: "140px",
                  height: "140px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
                }}
              />
            </div>
            <h3 style={{ color: "#2196F3", marginBottom: "8px", fontSize: "18px" }}>
              Força Aérea Brasileira
            </h3>
            <p style={{ color: "#666", fontSize: "14px", margin: "0" }}>
              Acesse o site oficial da Força Aérea Brasileira
            </p>
          </div>
        </div>

        {/* Features */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          width: "100%",
          maxWidth: "1000px",
          marginTop: "48px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>Chat em Tempo Real</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Converse instantaneamente com outros militares
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>Rede de Contatos</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Construa sua rede profissional militar
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ color: "#333", marginBottom: "8px" }}>Segurança Total</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Ambiente seguro para militares e civis
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: "#f8f9fa",
        padding: "24px 32px",
        borderTop: "1px solid #eee",
        textAlign: "center",
        color: "#666"
      }}>
        <p>&copy; 2025 PerguntaProSub. Todos os direitos reservados.</p>
      </footer>

      {/* Modal de escolha de tema (igual ao original) */}
      {showTemaModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowTemaModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px #0002",
              padding: "38px 32px 32px 32px",
              minWidth: 540,
              maxWidth: 650,
              width: 600,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src="/simbolo.png"
              alt="Símbolo"
              style={{ width: 120, height: 120, marginBottom: 12, borderRadius: "50%" }}
            />
            <div style={{ fontWeight: 700, fontSize: 32, color: "#000", marginBottom: 0, textAlign: "center" }}>PerguntaProSub</div>
            <div style={{ height: 12 }} />
            <div style={{ color: "#000", marginBottom: 24, fontSize: 14, textAlign: "center" }}>
              A primeira rede social voltada para o Universo Militar!
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12, color: "#000" }}>Escolha seu tema:</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 8 }}>
              {temas.map((t) => (
                <div key={t.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      border: temaSelecionado === t.nome ? `3px solid ${t.borda}` : `2px solid #bbb`,
                      background: t.cor,
                      cursor: "pointer",
                      marginBottom: 6,
                      boxShadow: "0 1px 4px #0001",
                      outline: "none",
                      transition: "border 0.2s"
                    }}
                    onClick={() => handleEscolherTema(t.nome)}
                    title={t.nome}
                  />
                  <span style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
                    {t.nome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
