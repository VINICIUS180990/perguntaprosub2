import { useNavigate } from "react-router-dom";

export default function PrivacidadePage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 380, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Política de Privacidade</h2>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center' }}>Esta página explica como suas informações são coletadas, usadas e protegidas no PerguntaProSub. Não compartilhamos dados pessoais com terceiros e utilizamos cookies apenas para melhorar sua experiência. Para dúvidas, entre em contato pelo e-mail informado no site.</p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginTop: 32 }}>
          <button
            onClick={() => navigate("/main")}
            style={{ background: "#eee", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            Pagina Inicial
          </button>
          <button
            onClick={() => navigate("/config")}
            style={{ background: "#eee", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
