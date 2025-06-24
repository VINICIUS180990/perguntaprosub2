export default function SobrePage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9" }}>
      <div style={{ width: 600, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-title, #1976d2)' }}>Sobre</h2>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center' }}>O PerguntaProSub é um sistema de IA voltado para o mundo militar, criado para facilitar a interpretação de documentos e o compartilhamento de conhecimento entre usuários. Nosso objetivo é promover a troca de informações de forma segura, ética e colaborativa.</p>
        <ul style={{ margin: '24px 0 0 0', padding: 0, textAlign: 'left', fontSize: 15, lineHeight: 1.6 }}>
          <li><b>IA Militar:</b> Anexe normas, regulamentos ou qualquer outro documento e a IA PerguntaProSub te dirá como agir em qualquer situação, baseada na documentação específica.</li>
          <li><b>Enviar arquivos:</b> Clique em "+ Novo" no campo de documentos na pagina inicial para anexar seus arquivos (arquivos criptografados deverão ser descriptografadosantes e serem anexados). O conteúdo será usado para responder suas perguntas.</li>
          <li><b>Conversas:</b> Clique em "+ Nova" no campo de conversas para organizar suas dúvidas. Cada conversa mantém seu histórico separado.</li>
          <li><b>Perfil:</b> Edite seu nome, nome de guerra, posto, força, OM, celular e e-mail na aba Perfil do Menu. Mantenha os dados sempre atualizados pois eles irão permitir que seus amigos o encontrem pela pesquisa do Chat.</li>
          <li><b>Redefinir senha:</b> Altere sua senha na opção "Redefinir senha" do Menu.</li>
          <li><b>Excluir conta:</b> Solicite a exclusão da sua conta na opção "Excluir Conta".</li>
          <li><b>Fale Conosco:</b> Veja os canais de contato para suporte e dúvidas.</li>
          <li><b>Privacidade:</b> Seus dados são protegidos e utilizados apenas para funcionamento da plataforma.</li>
        </ul>
        <p style={{ margin: '24px 0 0 0', textAlign: 'center', fontWeight: 500 }}>
          Dúvidas adicionais? Fale com a IA ou entre em contato via Whatsapp (21 98364-2119) / email (perguntaprosub@gmail.com).
        </p>
      </div>
    </div>
  );
}
