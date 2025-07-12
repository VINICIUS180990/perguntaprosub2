import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function PerfilPage() {
  const [perfil, setPerfil] = useState({
    nome: "",
    nomeguerra: "",
    posto: "",
    forca: "",
    om: "",
    celular: "",
    email: "",
    foto: ""
  });
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showFotoPerfil, setShowFotoPerfil] = useState(true);
  const navigate = useNavigate();

  // Carrega perfil e foto do usuário autenticado (mesma estrutura da função original)
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        navigate("/login");
        return;
      }

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
        setShowFotoPerfil(true);
      } else {
        setFotoPerfilUrl(null);
      }
    });
  }, [navigate]);

  // Upload de foto (mesma estrutura da função original)
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
    console.log(filePath, publicData?.publicUrl);
    if (!publicData?.publicUrl) {
      alert('Erro ao gerar URL da foto: URL inválida');
      setFotoPerfilUrl(null);
    } else {
      setFotoPerfilUrl(publicData.publicUrl);
    }
    // Atualiza a url da foto no perfil do usuário (salva o caminho, não a publicUrl)
    await supabase.from('perfil_usuario').update({ foto: filePath }).eq('user_id', userId);
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

  // Salvar perfil (mesma estrutura da função original)
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

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: "#f7f7f9" }}>
      {/* Conteúdo principal */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        minHeight: "100vh"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 700,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: 32
        }}>
          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSalvarPerfil}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#1976d2", textAlign: "center", width: "100%" }}>
              Perfil do Usuário
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
              {fotoPerfilUrl && !fotoPerfilUrl.includes("null") && !fotoPerfilUrl.includes("undefined") && !fotoPerfilUrl.includes("error") && showFotoPerfil ? (
                <img
                  src={fotoPerfilUrl + "?t=" + Date.now()}
                  alt=" "
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "2px solid #1976d2", marginBottom: 8 }}
                  onError={() => {
                    setShowFotoPerfil(false);
                  }}
                />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 40, marginBottom: 8 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24">
                    <path fill="#888" d="M12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-2.1 0-6.25 1.05-6.25 3.15v.6c0 .41.34.75.75.75h11c.41 0 .75-.34.75-.75v-.6c0-2.1-4.15-3.15-6.25-3.15Z"/>
                  </svg>
                </div>
              )}
              <label style={{ cursor: "pointer", color: "#1976d2", fontWeight: 500 }}>
                {uploading ? "Enviando..." : "Alterar foto"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUploadFoto} disabled={uploading} />
              </label>
            </div>

            <input 
              type="text" 
              placeholder="Nome completo" 
              value={perfil.nome} 
              onChange={e => setPerfil({ ...perfil, nome: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
              required 
            />
            <input 
              type="text" 
              placeholder="Nome de guerra" 
              value={perfil.nomeguerra} 
              onChange={e => setPerfil({ ...perfil, nomeguerra: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
            />
            <input 
              type="text" 
              placeholder="Posto/Graduação" 
              value={perfil.posto} 
              onChange={e => setPerfil({ ...perfil, posto: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
            />
            <input 
              type="text" 
              placeholder="Força/Instituição" 
              value={perfil.forca} 
              onChange={e => setPerfil({ ...perfil, forca: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
            />
            <input 
              type="text" 
              placeholder="Organização Militar" 
              value={perfil.om} 
              onChange={e => setPerfil({ ...perfil, om: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
            />
            <input 
              type="tel" 
              placeholder="Celular" 
              value={perfil.celular} 
              onChange={e => setPerfil({ ...perfil, celular: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
            />
            <input 
              type="email" 
              placeholder="E-mail" 
              value={perfil.email} 
              onChange={e => setPerfil({ ...perfil, email: e.target.value })} 
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, background: "#fff", color: "#000" }} 
              required 
            />
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
              <button 
                type="submit" 
                style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
