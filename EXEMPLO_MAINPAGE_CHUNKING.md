# Exemplo de Implementação do Chunking Inteligente

## Para MainPage.tsx

```typescript
import { sendSmartChunkingMessage, MAIN_PAGE_SYSTEM_PROMPT } from "../api";

// Função para enviar mensagem com chunking inteligente
async function enviarMensagem(mensagemTexto?: string) {
  let mensagensAtualizadas = mensagens;
  
  if (mensagemTexto?.trim()) {
    const novaMensagem = { autor: 'user' as const, texto: mensagemTexto };
    mensagensAtualizadas = [...mensagens, novaMensagem];
    setMensagens(mensagensAtualizadas);
  }
  
  if (mensagensAtualizadas.length === 0) return;
  
  const ultimaMensagem = mensagensAtualizadas[mensagensAtualizadas.length - 1];
  if (ultimaMensagem.autor === 'bot') return;
  
  setEnviando(true);

  // Monta o histórico para a API
  const historicoApi = mensagensAtualizadas.map(m => ({
    autor: m.autor,
    texto: m.texto
  }));

  // Busca contexto nos documentos
  const contexto = await buscarContextoPergunta();
  
  // ✅ NOVA IMPLEMENTAÇÃO: Usa a função universal
  try {
    const respostaIA = await sendSmartChunkingMessage(
      historicoApi, 
      contexto, 
      MAIN_PAGE_SYSTEM_PROMPT,
      `main_${conversaAtiva}` // sessionId
    );
    
    const mensagensComBot = [
      ...mensagensAtualizadas,
      { autor: 'bot' as const, texto: respostaIA }
    ];
    setMensagens(mensagensComBot);
  } catch (err) {
    // ... tratamento de erro ...
  }
  setEnviando(false);
}
```

## Alternativa Usando Função Específica

```typescript
import { sendEnhancedMainPageMessage } from "../api";

async function enviarMensagemSimples() {
  try {
    const respostaIA = await sendEnhancedMainPageMessage(
      historicoApi, 
      contexto,
      `main_${conversaAtiva}`
    );
    // ... resto do código ...
  } catch (err) {
    // ... tratamento de erro ...
  }
}
```

## Para Página Customizada

```typescript
import { sendSmartChunkingMessage } from "../api";

const CUSTOM_PROMPT = `
Você é um assistente especializado em análise de documentos técnicos.
Sempre forneça respostas detalhadas e técnicas.
Se necessário, solicite mais informações usando NEED_MORE_CHUNKS.
`;

async function enviarMensagemCustomizada() {
  try {
    const respostaIA = await sendSmartChunkingMessage(
      historicoApi, 
      contexto, 
      CUSTOM_PROMPT,
      'custom_session_123'
    );
    // ... resto do código ...
  } catch (err) {
    // ... tratamento de erro ...
  }
}
```
