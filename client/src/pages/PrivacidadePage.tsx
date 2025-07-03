export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 800, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--color-title, #1976d2)', marginBottom: 24 }}>Política de Privacidade</h2>
        <div style={{ textAlign: 'left', lineHeight: 1.6, fontSize: 15 }}>
          <h3 style={{ color: '#1976d2', marginTop: 20 }}>1. Coleta de Informações</h3>
          <p>O PerguntaProSub coleta apenas as informações necessárias para funcionamento da plataforma de consultas:</p>
          <ul>
            <li>Dados de cadastro: nome, e-mail e senha criptografada</li>
            <li>Documentos anexados para processamento</li>
            <li>Histórico de conversas e consultas realizadas</li>
            <li>Dados técnicos de uso da plataforma</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>2. Uso das Informações</h3>
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul>
            <li>Processar consultas através da inteligência artificial</li>
            <li>Manter o histórico de conversas organizadas</li>
            <li>Personalizar sua experiência na plataforma</li>
            <li>Garantir a segurança e funcionamento do sistema</li>
            <li>Fornecer suporte técnico quando solicitado</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>3. Tratamento de Documentos</h3>
          <p>Os documentos anexados são processados de forma segura. O conteúdo é utilizado apenas para gerar respostas às suas consultas.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>4. Compartilhamento</h3>
          <p>Não compartilhamos seus dados pessoais ou documentos com terceiros. Todas as informações permanecem confidenciais e são utilizadas exclusivamente para o funcionamento da plataforma.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>5. Segurança</h3>
          <p>Implementamos medidas de segurança robustas, incluindo:</p>
          <ul>
            <li>Criptografia de dados sensíveis</li>
            <li>Transmissão segura via HTTPS</li>
            <li>Autenticação segura de usuários</li>
            <li>Monitoramento de segurança contínuo</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>6. Seus Direitos</h3>
          <p>Você tem direito a:</p>
          <ul>
            <li>Acessar seus dados pessoais armazenados</li>
            <li>Solicitar correção de informações incorretas</li>
            <li>Excluir sua conta e dados associados</li>
            <li>Receber explicações sobre o uso de seus dados</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>7. Retenção de Dados</h3>
          <p>Mantemos suas informações apenas pelo tempo necessário para fornecer os serviços. Dados de conversas podem ser mantidos para melhorar a experiência, mas podem ser excluídos mediante solicitação.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>8. Cookies e Tecnologias</h3>
          <p>Utilizamos cookies essenciais para funcionamento da plataforma, como manutenção de sessões e preferências de usuário.</p>

          <p style={{ marginTop: 24, textAlign: 'center', fontWeight: 500, color: '#1976d2' }}>
            Dúvidas sobre privacidade? Contate-nos: perguntaprosub@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
