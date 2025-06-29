export default function TermosPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 800, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--color-title, #1976d2)', marginBottom: 24 }}>Termos de Uso</h2>
        
        <div style={{ textAlign: 'left', lineHeight: 1.6, fontSize: 15, width: '100%' }}>
          <h3 style={{ color: '#1976d2', marginTop: 20 }}>1. Aceitação dos Termos</h3>
          <p>Ao utilizar o PerguntaProSubIA, você concorda com todos os termos e condições descritos neste documento. O uso da plataforma implica na aceitação integral destes termos.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>2. Descrição do Serviço</h3>
          <p>O PerguntaProSubIA é uma plataforma de consulta de normas através de inteligência artificial, permitindo upload de documentos e consultas personalizadas sobre regulamentos e normas institucionais.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>3. Uso Responsável</h3>
          <p>É proibido na plataforma:</p>
          <ul>
            <li>Anexar ou consultar documentos classificados ou sigilosos</li>
            <li>Utilizar a ferramenta para fins inadequados ou ilegais</li>
            <li>Compartilhar credenciais de acesso com terceiros</li>
            <li>Tentar burlar os sistemas de segurança</li>
            <li>Fazer uso comercial não autorizado da plataforma</li>
            <li>Sobrecarregar o sistema com consultas excessivas</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>4. Responsabilidade do Usuário</h3>
          <p>Os usuários são responsáveis por:</p>
          <ul>
            <li>Garantir que os documentos anexados não violem direitos autorais</li>
            <li>Verificar a veracidade das informações fornecidas</li>
            <li>Usar as respostas da IA como referência, não como decisão final</li>
            <li>Manter suas credenciais de acesso seguras</li>
            <li>Reportar uso inadequado ou problemas técnicos</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>5. Limitações da IA</h3>
          <p>A inteligência artificial fornece respostas baseadas nos documentos fornecidos, mas não substitui a consulta a especialistas ou a análise jurídica profissional. As respostas são orientativas.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>6. Propriedade Intelectual</h3>
          <p>Os documentos anexados permanecem de propriedade do usuário. A plataforma utiliza o conteúdo apenas para processar consultas.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>7. Modificações e Suspensão</h3>
          <p>Reservamo-nos o direito de:</p>
          <ul>
            <li>Modificar estes termos a qualquer momento</li>
            <li>Suspender contas que violem as regras de uso</li>
            <li>Interromper o serviço para manutenção</li>
            <li>Remover conteúdo inadequado</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>8. Limitação de Responsabilidade</h3>
          <p>A plataforma é fornecida "como está". Não nos responsabilizamos por decisões tomadas com base nas consultas ou por problemas decorrentes do uso inadequado.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>9. Contato</h3>
          <p>Para dúvidas sobre estes termos: perguntaprosub@gmail.com</p>

          <p style={{ marginTop: 32, padding: 16, backgroundColor: '#f0f8ff', borderRadius: 8, textAlign: 'center', fontWeight: 500, color: '#1976d2' }}>
            Ao usar esta plataforma, você declara compreender suas limitações e responsabilidades como usuário.
          </p>
        </div>
      </div>
    </div>
  );
}
