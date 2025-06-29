import { useState, useEffect } from "react";

export default function PrivacidadePage() {
  const [headerColor, setHeaderColor] = useState("#f7f7f9");

  // Carrega cor do tema salvo no localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    if (savedColor) {
      setHeaderColor(savedColor);
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: headerColor }}>
      <div style={{ width: 380, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Política de Privacidade</h2>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center' }}>Esta página explica como suas informações são coletadas, usadas e protegidas no PerguntaProSub. Não compartilhamos dados pessoais com terceiros e utilizamos cookies apenas para melhorar sua experiência. Para dúvidas, entre em contato pelo e-mail informado no site.</p>
      </div>
    </div>
  );
}
