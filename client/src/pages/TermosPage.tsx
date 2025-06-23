import { useNavigate } from "react-router-dom";

export default function TermosPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 380, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Termos de Uso</h2>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center' }}>Ao utilizar o PerguntaProSub, você concorda em respeitar as regras de uso, não publicar conteúdo proibido e agir de acordo com a legislação vigente. O descumprimento pode resultar em banimento e remoção de conteúdo. Para mais detalhes, consulte nossa Política de Privacidade.</p>
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
