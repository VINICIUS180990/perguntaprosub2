import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { avisoExclusaoConta } from "../utils/excluirConta";

const opcoes = [
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
  const [perfil, setPerfil] = useState({
    nome: "",
    nomeguerra: "",
    posto: "",
    forca: "",
    om: "",
    celular: "",
    email: "",
    foto: "" // Corrigido: tipo string
  });
  const [headerColor, setHeaderColor] = useState("#fff");
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [menuUsuarioPos, setMenuUsuarioPos] = useState<{ top: number; left: number } | null>(null);
  const [perfilCarregando, setPerfilCarregando] = useState(true);
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showFotoPerfil, setShowFotoPerfil] = useState(true);
  const navigate = useNavigate();

  // Carrega cor do tema ao abrir a página
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    setHeaderColor(savedColor || "#fff");
  }, []);

  // Carrega nome, email, perfil e foto do usuário autenticado ao abrir a página
  useEffect(() => {
    setShowFotoPerfil(true); // Sempre tenta mostrar a foto ao recarregar
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        let { data: perfilDb } = await supabase
          .from("perfil_usuario")
          .select("*")
          .eq("user_id", data.user.id)
          .single();
        if (!perfilDb) {
          const novoPerfil = {
            user_id: data.user.id,
            nome: data.user.user_metadata?.full_name || "",
            nomeguerra: "",
            posto: "",
            forca: "",
            om: "",
            celular: "",
            email: data.user.email || "",
            foto: ""
          };
          await supabase.from("perfil_usuario").insert(novoPerfil);
          perfilDb = novoPerfil;
        }
        setPerfil({
          nome: perfilDb?.nome || data.user.user_metadata?.full_name || "",
          nomeguerra: perfilDb?.nomeguerra || "",
          posto: perfilDb?.posto || "",
          forca: perfilDb?.forca || "",
          om: perfilDb?.om || "",
          celular: perfilDb?.celular || "",
          email: perfilDb?.email || data.user.email || "",
          foto: perfilDb?.foto || ""
        });
        // Gera uma URL pública se houver foto
        if (perfilDb?.foto) {
          const path = perfilDb.foto;
          const { data: publicData } = supabase.storage.from('fotos-perfil').getPublicUrl(path);
          setFotoPerfilUrl(publicData?.publicUrl || null);
        } else {
          setFotoPerfilUrl(null);
        }
      } else {
        setPerfil({
          nome: "",
          nomeguerra: "",
          posto: "",
          forca: "",
          om: "",
          celular: "",
          email: "",
          foto: ""
        });
        setFotoPerfilUrl(null);
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
    // Prepara objeto só com campos válidos
    const perfilToSave = {
      user_id: user.id,
      nome: perfil.nome || "",
      nomeguerra: perfil.nomeguerra || "",
      posto: perfil.posto || "",
      forca: perfil.forca || "",
      om: perfil.om || "",
      celular: perfil.celular || "",
      email: perfil.email || "",
      foto: perfil.foto || ""
    };
    console.log('Enviando para upsert:', perfilToSave);
    const { error } = await supabase.from("perfil_usuario").upsert([
      perfilToSave
    ], { onConflict: 'user_id' });
    if (error) {
      alert("Erro ao salvar perfil: " + error.message + '\n' + JSON.stringify(error, null, 2));
      return;
    }
    alert("Perfil salvo com sucesso!");
  }

  // Função para upload da foto
  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;
    if (!userId) {
      setUploading(false);
      return;
    }
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/foto-perfil.${fileExt}`;
    // Remove arquivo anterior se existir
    await supabase.storage.from('fotos-perfil').remove([`${userId}/foto-perfil.jpg`, `${userId}/foto-perfil.png`, `${userId}/foto-perfil.jpeg`, `${userId}/foto-perfil.webp`]);
    const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(filePath, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      alert('Erro ao fazer upload da foto: ' + uploadError.message);
      setUploading(false);
      return;
    }
    // Gera URL pública após upload
    const { data: publicData } = supabase.storage.from('fotos-perfil').getPublicUrl(filePath);
    console.log(filePath, publicData?.publicUrl); // Corrigido: filePath representa o caminho da foto
    if (!publicData?.publicUrl) {
      alert('Erro ao gerar URL da foto: URL inválida');
      setFotoPerfilUrl(null);
    } else {
      setFotoPerfilUrl(publicData.publicUrl);
    }
    // Atualiza a url da foto no perfil do usuário (salva o caminho, não a publicUrl)
    console.log('Atualizando perfil_usuario:', { foto: filePath, userId });
    const { error: updateError } = await supabase.from('perfil_usuario').update({ foto: filePath }).eq('user_id', userId);
    if (updateError) {
      alert('Erro ao atualizar foto do perfil: ' + updateError.message + '\n' + JSON.stringify(updateError, null, 2));
      setUploading(false);
      return;
    }
    // Força reload do perfil após upload da foto para garantir consistência
    const { data: perfilDb } = await supabase
      .from('perfil_usuario')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (perfilDb) {
      setPerfil(perfil => ({
        ...perfil,
        nome: perfilDb.nome || '',
        nomeguerra: perfilDb.nomeguerra || '',
        posto: perfilDb.posto || '',
        forca: perfilDb.forca || '',
        om: perfilDb.om || '',
        celular: perfilDb.celular || '',
        email: perfilDb.email || '',
        foto: perfilDb.foto || ''
      }));
    }
    setUploading(false);
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                  navigate("/main");
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
                  navigate("/config");
                }}
              >Menu</button>
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
                    if (opcao.id === "privacidade") navigate("/privacidade");
                    else if (opcao.id === "sobre") navigate("/sobre");
                    else if (opcao.id === "termos") navigate("/termos");
                    else if (opcao.id === "contato") navigate("/contato");
                    else if (opcao.id === "home") navigate("/main");
                    else if (opcao.id === "seguranca") navigate("/resetsenha");
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
            {opcaoSelecionada === "perfil" && (
              <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSalvarPerfil}>
                <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)', textAlign: 'center', width: '100%' }}>Perfil do Usuário</h2>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
                  {/* Foto do perfil */}
                  <div style={{ width: 96, height: 96, borderRadius: '50%', marginBottom: 8, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
                    {fotoPerfilUrl && showFotoPerfil && !fotoPerfilUrl.includes('null') && !fotoPerfilUrl.includes('undefined') && !fotoPerfilUrl.includes('error') ? (
                      <img
                        src={fotoPerfilUrl + '?t=' + Date.now()}
                        alt=""
                        style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1976d2', position: 'absolute', top: 0, left: 0 }}
                        onError={() => setShowFotoPerfil(false)}
                        draggable={false}
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24"><path fill="#888" d="M12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-2.1 0-6.25 1.05-6.25 3.15v.6c0 .41.34.75.75.75h11c.41 0 .75-.34.75-.75v-.6c0-2.1-4.15-3.15-6.25-3.15Z"/></svg>
                    )}
                  </div>
                  <label style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500 }}>
                    {uploading ? 'Enviando...' : 'Alterar foto'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadFoto} disabled={uploading} />
                  </label>
                </div>
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
