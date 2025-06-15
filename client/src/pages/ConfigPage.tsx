import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { avisoExclusaoConta } from "../utils/excluirConta";

const opcoes = [
  { id: "home", label: "Página Inicial" },
  { id: "perfil", label: "Perfil" },
  { id: "seguranca", label: "Redefinir senha" },
  { id: "excluir", label: "Excluir Conta" },
  { id: "faleconosco", label: "Fale Conosco" }
];

export default function ConfigPage() {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("perfil");
  const [perfil, setPerfil] = useState({
    nome: "",
    nomeguerra: "",
    posto: "",
    forca: "",
    om: "",
    celular: "",
    email: ""
  });
  const [headerColor, setHeaderColor] = useState("#fff");
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [menuUsuarioPos, setMenuUsuarioPos] = useState<{ top: number; left: number } | null>(null);
  const [perfilCarregando, setPerfilCarregando] = useState(true);
  const navigate = useNavigate();

  // Carrega cor do tema ao abrir a página
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    setHeaderColor(savedColor || "#fff");
  }, []);

  // Carrega nome, email e perfil do usuário autenticado ao abrir a página
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        // Busca perfil salvo no banco
        let { data: perfilDb } = await supabase
          .from("perfil_usuario")
          .select("*")
          .eq("user_id", data.user.id)
          .single();
        // Se não existir, cria com dados do Auth
        if (!perfilDb) {
          const novoPerfil = {
            user_id: data.user.id,
            nome: data.user.user_metadata?.full_name || "",
            nomeguerra: "",
            posto: "",
            forca: "",
            om: "",
            celular: "",
            email: data.user.email || ""
          };
          await supabase.from("perfil_usuario").insert(novoPerfil);
          perfilDb = novoPerfil;
        }
        setPerfil(perfil => ({
          ...perfil,
          nome: perfilDb?.nome || data.user.user_metadata?.full_name || "",
          nomeguerra: perfilDb?.nomeguerra || "",
          posto: perfilDb?.posto || "",
          forca: perfilDb?.forca || "",
          om: perfilDb?.om || "",
          celular: perfilDb?.celular || "",
          email: perfilDb?.email || data.user.email || ""
        }));
      }
      setPerfilCarregando(false);
    });
  }, []);

  // Salva perfil no Supabase (table: perfil_usuario)
  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return alert("Usuário não autenticado!");
    // Upsert (cria ou atualiza) na tabela 'perfil_usuario', garantindo conflito por user_id
    const { error } = await supabase.from("perfil_usuario").upsert([
      {
        user_id: user.id,
        ...perfil
      }
    ], { onConflict: 'user_id' });
    if (error) {
      alert("Erro ao salvar perfil: " + error.message);
      return;
    }
    alert("Perfil salvo com sucesso!");
  }

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

  function ExcluirContaPage() {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#d32f2f" }}>Excluir Conta</h2>
        <p style={{ color: "#888", marginTop: 24, fontSize: 18, textAlign: "center" }}>{avisoExclusaoConta()}</p>
      </div>
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
        <div style={{ display: "flex", alignItems: "center" }}>
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
            {perfilCarregando ? '' : (perfil.nome ? perfil.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '')}
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
                  navigate("/config");
                }}
              >Configurações</button>
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
              {opcoes.map(opcao => (
                <button
                  key={opcao.id}
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
                  onClick={() => {
                    if (opcao.id === "home") {
                      navigate("/main");
                    } else if (opcao.id === "seguranca") {
                      navigate("/resetsenha");
                    } else {
                      setOpcaoSelecionada(opcao.id);
                    }
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
            {opcaoSelecionada === "perfil" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSalvarPerfil}>
                <h2 style={{ margin: 0, fontSize: 22 }}>Perfil do Usuário</h2>
                <input type="text" placeholder="Nome completo" value={perfil.nome} onChange={e => setPerfil({ ...perfil, nome: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} required />
                <input type="text" placeholder="Nome de guerra" value={perfil.nomeguerra} onChange={e => setPerfil({ ...perfil, nomeguerra: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
                <input type="text" placeholder="Posto/Graduação" value={perfil.posto} onChange={e => setPerfil({ ...perfil, posto: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
                <input type="text" placeholder="Força/Instituição" value={perfil.forca} onChange={e => setPerfil({ ...perfil, forca: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
                <input type="text" placeholder="Organização Militar" value={perfil.om} onChange={e => setPerfil({ ...perfil, om: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
                <input type="tel" placeholder="Celular" value={perfil.celular} onChange={e => setPerfil({ ...perfil, celular: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
                <input type="email" placeholder="E-mail" value={perfil.email} onChange={e => setPerfil({ ...perfil, email: e.target.value })} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} required />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                  <button type="submit" style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                </div>
              </form>
            )}
            {opcaoSelecionada === "seguranca" && (
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Segurança</h2>
                <AlterarSenhaForm />
              </div>
            )}
            {opcaoSelecionada === "excluir" && (
              <ExcluirContaPage />
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
