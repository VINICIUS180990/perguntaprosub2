export default function ContatoPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 380, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Contato</h2>
        <div style={{ margin: '24px 0 0 0', textAlign: 'center', width: '100%' }}>
          <p style={{ margin: 0 }}><b>Whatsapp:</b> <a href="https://wa.me/5521983642119" target="_blank" rel="noopener noreferrer">(21) 98364-2119</a></p>
          <p style={{ margin: '12px 0 0 0' }}><b>Email:</b> <a href="mailto:PERGUNTAPROSUB@GMAIL.COM">PERGUNTAPROSUB@GMAIL.COM</a></p>
        </div>
      </div>
    </div>
  );
}
