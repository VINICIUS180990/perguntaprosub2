export default function ExcluirContaPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 800, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 24, color: "#d32f2f", marginBottom: 24 }}>Excluir Conta</h2>
        
        <div style={{ textAlign: 'center', lineHeight: 1.6, fontSize: 16, width: '100%' }}>
          <p style={{ margin: '0 0 24px 0', fontSize: 18, color: "#666" }}>
            Você está prestes a solicitar a exclusão permanente da sua conta no PerguntaProSub.
          </p>

          <div style={{ background: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: 8, padding: 20, margin: "24px 0", textAlign: "left" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#856404" }}>⚠️ Importante - Leia antes de prosseguir:</h4>
            <ul style={{ margin: '0', padding: '0 0 0 20px', lineHeight: 1.8, color: "#856404" }}>
              <li>A exclusão da conta é <strong>permanente e irreversível</strong></li>
              <li>Todos os seus dados serão removidos definitivamente</li>
              <li>Seus documentos, conversas e histórico serão perdidos</li>
              <li>Suas conexões com outros usuários serão desfeitas</li>
              <li>Não será possível recuperar informações após a exclusão</li>
            </ul>
          </div>

          <div style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: 8, padding: 20, margin: "24px 0", textAlign: "left" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#495057" }}>📋 O que será removido:</h4>
            <ul style={{ margin: '0', padding: '0 0 0 20px', lineHeight: 1.8, color: "#495057" }}>
              <li>Perfil completo (nome, foto, informações pessoais)</li>
              <li>Todos os documentos anexados</li>
              <li>Histórico completo de conversas com a IA</li>
              <li>Conversas do chat com outros usuários</li>
              <li>Lista de amigos e conexões</li>
              <li>Configurações e preferências</li>
            </ul>
          </div>

          <div style={{ background: "#d4edda", border: "1px solid #c3e6cb", borderRadius: 8, padding: 20, margin: "24px 0", textAlign: "left" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#155724" }}>📞 Como solicitar a exclusão:</h4>
            <p style={{ margin: "0", color: "#155724", fontSize: 16 }}>
              Para excluir a sua conta, envie uma solicitação para o nosso email de suporte:
            </p>
            <p style={{ margin: "12px 0 0 0", fontSize: 18, fontWeight: 600, color: "#155724" }}>
              📧 PERGUNTAPROSUB@GMAIL.COM
            </p>
            <p style={{ margin: "12px 0 0 0", color: "#155724", fontSize: 14 }}>
              <strong>Inclua em sua mensagem:</strong><br />
              • Seu nome completo<br />
              • Email da conta a ser excluída<br />
              • Confirmação de que deseja excluir permanentemente a conta
            </p>
          </div>

          <div style={{ background: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: 8, padding: 20, margin: "24px 0", textAlign: "left" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#0c5460" }}>⏱️ Prazo para processamento:</h4>
            <p style={{ margin: "0", color: "#0c5460", fontSize: 16 }}>
              Sua solicitação será processada em até <strong>48 horas úteis</strong>. 
              Você receberá uma confirmação por email quando a exclusão for concluída.
            </p>
          </div>

          <div style={{ background: "#f2dede", border: "1px solid #ebccd1", borderRadius: 8, padding: 20, margin: "24px 0", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#a94442" }}>🔄 Alternativas à exclusão:</h4>
            <p style={{ margin: "0", color: "#a94442", fontSize: 15 }}>
              Considere estas opções antes de excluir permanentemente:
            </p>
            <ul style={{ margin: '12px 0 0 0', padding: '0', listStyle: 'none', color: "#a94442" }}>
              <li>• Fazer logout temporário</li>
              <li>• Remover documentos sensíveis</li>
              <li>• Alterar configurações de privacidade</li>
              <li>• Redefinir senha se houver problemas de acesso</li>
            </ul>
          </div>

          <p style={{ margin: '32px 0 0 0', textAlign: 'center', fontWeight: 600, color: '#d32f2f', fontSize: 16 }}>
            Tem certeza de que deseja prosseguir com a exclusão?
          </p>
        </div>
      </div>
    </div>
  );
}
