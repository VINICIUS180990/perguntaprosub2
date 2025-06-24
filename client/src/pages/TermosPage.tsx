export default function TermosPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 380, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Termos de Uso</h2>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center' }}>Ao utilizar o PerguntaProSub, você concorda em respeitar as regras de uso, não publicar conteúdo proibido e agir de acordo com a legislação vigente. O descumprimento pode resultar em banimento e remoção de conteúdo. Para mais detalhes, consulte nossa Política de Privacidade.</p>
      </div>
    </div>
  );
}
