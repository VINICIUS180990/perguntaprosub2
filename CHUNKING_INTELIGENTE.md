# Sistema de Chunking Inteligente com Solicitação Automática

## O que é?

O sistema de chunking inteligente permite que a API solicite novos chunks (pedaços) do documento automaticamente quando os chunks iniciais não forem suficientes para responder completamente à pergunta do usuário.

## Como Funciona?

### 1. **Processo Inicial**
- Quando o usuário faz uma pergunta, o sistema divide o documento em chunks
- Identifica os 3 chunks mais relevantes para a pergunta
- Envia esses chunks para a IA junto com a pergunta

### 2. **Detecção de Insuficiência**
- A IA analisa se as informações são suficientes
- Se não forem, ela responde com: `NEED_MORE_CHUNKS: [descrição do que precisa]`
- Exemplo: `NEED_MORE_CHUNKS: informações sobre procedimentos de segurança`

### 3. **Busca Iterativa**
- O sistema busca chunks adicionais baseado na descrição
- Combina com os chunks anteriores
- Envia novamente para a IA
- Repete até 3 vezes se necessário

### 4. **Finalização**
- Quando a IA tem informações suficientes, responde normalmente
- Se após 3 tentativas ainda não é suficiente, informa que buscou em todo o documento

## Vantagens

### ✅ **Economia de Custos**
- Envia apenas chunks relevantes inicialmente
- Só busca mais informações quando necessário
- Reduz tokens desnecessários

### ✅ **Respostas Mais Completas**
- Não fica limitado aos primeiros chunks encontrados
- Pode encontrar informações distribuídas pelo documento
- Melhora a qualidade das respostas

### ✅ **Busca Inteligente**
- Usa as dicas da IA para refinar a busca
- Evita chunks já utilizados
- Busca por variações de palavras-chave

## Implementação

### **Função Universal para Todas as Páginas**

Agora existe uma **função única** que pode ser usada por qualquer página:

```typescript
import { sendSmartChunkingMessage, LANDING_PAGE_SYSTEM_PROMPT } from "../api";

// Para LandingPage
const resposta = await sendSmartChunkingMessage(
  historico, 
  contexto, 
  LANDING_PAGE_SYSTEM_PROMPT,
  'landing_session_123' // sessionId opcional
);
```

```typescript
import { sendSmartChunkingMessage, MAIN_PAGE_SYSTEM_PROMPT } from "../api";

// Para MainPage
const resposta = await sendSmartChunkingMessage(
  historico, 
  contexto, 
  MAIN_PAGE_SYSTEM_PROMPT,
  'main_session_456' // sessionId opcional
);
```

```typescript
import { sendSmartChunkingMessage } from "../api";

// Para qualquer página personalizada
const customPrompt = "Você é um assistente especializado em documentos técnicos...";
const resposta = await sendSmartChunkingMessage(
  historico, 
  contexto, 
  customPrompt,
  'custom_session_789'
);
```

### **Funções Específicas (Ainda Disponíveis)**

**Para facilitar, ainda existem as funções específicas:**

```typescript
// Específica para LandingPage (usa LANDING_PAGE_SYSTEM_PROMPT automaticamente)
import { sendEnhancedLandingPageMessage } from "../api";
const resposta = await sendEnhancedLandingPageMessage(historico, contexto, sessionId);

// Específica para MainPage (usa MAIN_PAGE_SYSTEM_PROMPT automaticamente)
import { sendEnhancedMainPageMessage } from "../api";
const resposta = await sendEnhancedMainPageMessage(historico, contexto, sessionId);
```

### **Uso do ChunkingManager Diretamente**

```typescript
import { ChunkingManager } from "../api";

// Criar manager para um documento
const manager = new ChunkingManager(documentContent);

// Buscar chunks iniciais
const initialResponse = manager.getInitialChunks("pergunta do usuário", 3);

// Buscar chunks adicionais se necessário
const additionalResponse = manager.getAdditionalChunks({
  query: "pergunta do usuário",
  excludeChunkIds: manager.getStats().usedChunkIds,
  maxChunks: 2,
  contextHint: "informações sobre segurança"
});

// Estatísticas de uso
const stats = manager.getStats();
console.log(`Usado: ${stats.usedChunks}/${stats.totalChunks} chunks (${stats.coverage}%)`);
```

## Exemplos de Uso

### **Exemplo 1: Pergunta Simples**
**Pergunta:** "Qual é o horário de funcionamento?"
**Resultado:** 
- ✅ Encontra a informação no primeiro chunk
- ✅ Responde imediatamente
- ✅ Não precisa de chunks adicionais

### **Exemplo 2: Pergunta Complexa**
**Pergunta:** "Quais são todos os procedimentos de emergência e equipamentos necessários?"
**Resultado:**
1. 🔍 Busca chunks sobre "procedimentos emergência"
2. 🤖 IA: "NEED_MORE_CHUNKS: informações sobre equipamentos de emergência"
3. 🔍 Busca chunks sobre "equipamentos"
4. 🤖 IA: "NEED_MORE_CHUNKS: lista completa de equipamentos obrigatórios"
5. 🔍 Busca mais chunks sobre "equipamentos obrigatórios"
6. ✅ IA responde com informação completa

### **Exemplo 3: Informação Não Encontrada**
**Pergunta:** "Qual é a receita do bolo de chocolate?"
**Resultado:**
1. 🔍 Busca chunks (não encontra nada relevante)
2. 🤖 IA: "NEED_MORE_CHUNKS: receitas ou ingredientes"
3. 🔍 Busca mais chunks (ainda não encontra)
4. 🔍 Última tentativa (não encontra)
5. ✅ IA: "Não encontrei informações sobre receitas no documento"

## Configurações

### **Parâmetros Ajustáveis**
- `maxChunks`: Máximo de chunks por busca (padrão: 3)
- `maxAttempts`: Máximo tentativas de busca adicional (padrão: 3)
- `chunkSize`: Tamanho de cada chunk (padrão: 2000 caracteres)

### **Gerenciamento de Sessão**
- Cada conversa tem uma sessão única
- Chunks usados são lembrados durante a sessão
- Sessões são limpas automaticamente

## Monitoring e Debug

### **Logs Disponíveis**
```
[CHUNKING_MANAGER] Documento dividido em 25 chunks
[SMART_MESSAGING] Tentativa inicial com 3 chunks
[SMART_MESSAGING] IA solicitou mais chunks: informações sobre segurança
[SMART_MESSAGING] Tentativa 2 com 5 chunks totais
[SMART_MESSAGING] Estatísticas: 5/25 chunks usados (20%)
```

### **Monitoramento de Custos**
- Rastreia tokens enviados e recebidos
- Calcula economia vs. envio de documento completo
- Mostra estatísticas de uso de chunks

## Benefícios Práticos

### **Para Documentos Militares**
- ✅ Encontra regulamentações espalhadas pelo documento
- ✅ Combina procedimentos de diferentes seções
- ✅ Economiza custos com documentos longos
- ✅ Melhora precisão das respostas

### **Para Documentos Técnicos**
- ✅ Localiza especificações técnicas específicas
- ✅ Correlaciona informações de diferentes capítulos
- ✅ Reduz tempo de resposta
- ✅ Aumenta completude das respostas

---

**Resultado:** O sistema agora é mais inteligente, econômico e fornece respostas mais completas automaticamente! 🚀
