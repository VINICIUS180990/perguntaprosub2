export default function SobrePage() {
  return (
    <div style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f7f9", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 800, background: "#fff", color: "#222", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--color-title, #1976d2)', marginBottom: 24 }}>Sobre o PerguntaProSub</h2>
        
        <p style={{ margin: '0 0 24px 0', textAlign: 'center', fontSize: 16, lineHeight: 1.6 }}>
          Sua ferramenta inteligente para consultas de normas militares e de segurança pública.
          Acesse informações precisas sobre regulamentos, portarias, instruções e demais normas através de nossa IA especializada.
        </p>

        <div style={{ textAlign: 'left', lineHeight: 1.6, fontSize: 15, width: '100%' }}>
          <h3 style={{ color: '#1976d2', marginTop: 20 }}>🎯 Nossa Missão</h3>
          <p>Facilitar o acesso a informações normativas para profissionais das Forças Armadas e de Segurança Pública, oferecendo consultas rápidas e precisas através de inteligência artificial avançada.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>🚀 Funcionalidades</h3>
          <ul style={{ margin: '12px 0', padding: '0 0 0 20px', lineHeight: 1.8 }}>
            <li><b>IA Militar:</b> Anexe normas, regulamentos ou qualquer outro documento e o PerguntaProSub te dirá como agir em qualquer situação, baseada na documentação específica.</li>
            <li><b>Upload de Documentos:</b> Clique em "+ Novo" no campo de documentos na página inicial para anexar seus arquivos (PDF, DOCX). O conteúdo será usado para responder suas perguntas.</li>
            <li><b>Organização de Conversas:</b> Clique em "+ Nova" no campo de conversas para organizar suas dúvidas. Cada conversa mantém seu histórico separado.</li>
            <li><b>Chat em Tempo Real:</b> Clique em "Bate-papo" no canto superior direito do seu perfil e converse instantaneamente com outros usuários de forma segura e privada.</li>
            <li><b>Gerenciamento de Perfil:</b> Edite seu nome, nome de guerra, posto, força, OM, celular e e-mail na aba Perfil do Menu. Mantenha os dados sempre atualizados para que seus amigos possam encontrá-lo pela pesquisa do Chat.</li>
            <li><b>Busca de Usuários:</b> Encontre outros usuários por nome, nome de guerra ou unidade através da função de pesquisa do Chat.</li>
            <li><b>Redefinir Senha:</b> Altere sua senha na opção "Redefinir senha" do Menu ou através da tela de recuperação de senha.</li>
            <li><b>Exclusão de Conta:</b> Solicite a exclusão da sua conta na opção "Excluir Conta" no Menu.</li>
            <li><b>Temas Personalizados:</b> Escolha o tema da sua força (Marinha, Exército, Aeronáutica, Polícia, Bombeiros) nas configurações.</li>
            <li><b>Foto de Perfil:</b> Faça upload da sua foto de perfil para personalizar ainda mais sua conta.</li>
            <li><b>Sistema de Amigos:</b> Adicione e remova amigos, visualize perfis de outros usuários e gerencie suas conexões.</li>
            <li><b>Armazenamento Seguro:</b> Todos os documentos, conversas e dados são armazenados de forma segura no Supabase Storage.</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>🛡️ Segurança e Confiabilidade</h3>
          <p>Todas as consultas e documentos são processados com segurança. Seus dados são protegidos e utilizados exclusivamente para o funcionamento da plataforma.</p>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>👥 Público-Alvo</h3>
          <p>Ferramenta desenvolvida para profissionais que necessitam de acesso rápido a normas, incluindo:</p>
          <ul style={{ margin: '12px 0', padding: '0 0 0 20px' }}>
            <li>Militares das Forças Armadas</li>
            <li>Profissionais de segurança pública</li>
            <li>Servidores públicos</li>
            <li>Estudantes de ciências militares</li>
            <li>Advogados especializados em direito militar</li>
            <li>Pesquisadores e acadêmicos</li>
          </ul>

          <h3 style={{ color: '#1976d2', marginTop: 20 }}>📞 Suporte</h3>
          <p>Para dúvidas, sugestões ou suporte técnico:</p>
          <ul style={{ margin: '12px 0', padding: '0 0 0 20px' }}>
            <li>Email: perguntaprosub@gmail.com</li>
          </ul>
        </div>

        <p style={{ margin: '32px 0 0 0', textAlign: 'center', fontWeight: 600, color: '#1976d2', fontSize: 16 }}>
          Consulte. Esclareça. Mantenha-se informado.
        </p>
      </div>
    </div>
  );
}
