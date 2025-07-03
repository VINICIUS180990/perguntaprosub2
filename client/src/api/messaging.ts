import { chatWithAI } from './chat';
import type { MessageHistory } from './chat';
import { MAIN_PAGE_SYSTEM_PROMPT, LANDING_PAGE_SYSTEM_PROMPT, createContextPrompt } from './prompts';
import { apiCache } from './cache';
import { preprocessDocument, getProcessingPriority } from './preprocessing';
import { compressMessageHistory, estimateTokens, estimateCost } from './compression';
import { costMonitor } from './costMonitor';
import { ChunkingManager, combineRelevantChunks } from './chunking';
import type { ChunkRequest } from './chunking';

/**
 * Função otimizada para enviar mensagem com contexto da MainPage
 */
export async function sendMainPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null
): Promise<string> {
  // Comprime histórico se necessário
  const compressedHistory = compressMessageHistory(historico, 8);
  
  // Se há documento, otimiza o contexto baseado na última pergunta
  let optimizedContext = documentContext;
  if (documentContext && historico.length > 0) {
    const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
    if (lastUserMessage) {
      // Verifica cache primeiro
      const cachedResponse = apiCache.get(documentContext, lastUserMessage.texto);
      if (cachedResponse) {
        console.log('[CACHE] Resposta encontrada no cache, economizando chamada da API');
        // Registra como chamada em cache
        const totalTokens = estimateTokens(MAIN_PAGE_SYSTEM_PROMPT + documentContext + lastUserMessage.texto);
        costMonitor.logCall(totalTokens, estimateTokens(cachedResponse), 0, 'MainPage', true);
        return cachedResponse;
      }

      // Otimiza documento baseado na pergunta
      const options = getProcessingPriority(lastUserMessage.texto);
      optimizedContext = preprocessDocument(documentContext, lastUserMessage.texto, options);
    }
  }

  const systemPrompt = MAIN_PAGE_SYSTEM_PROMPT;
  const contextPrompt = createContextPrompt(optimizedContext);
  const fullPrompt = systemPrompt + contextPrompt;
  
  // Log de custos
  const totalTokens = estimateTokens(fullPrompt + JSON.stringify(compressedHistory));
  const estimatedCost = estimateCost(totalTokens);
  console.log(`[COST] Tokens estimados: ${totalTokens}, Custo estimado: $${estimatedCost.toFixed(6)}`);
  
  const response = await chatWithAI(fullPrompt, compressedHistory);
  
  // Registra no monitor de custos
  costMonitor.logCall(totalTokens, estimateTokens(response), estimatedCost, 'MainPage', false);
  
  // Salva no cache se havia documento
  if (documentContext && historico.length > 0) {
    const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
    if (lastUserMessage) {
      apiCache.set(documentContext, lastUserMessage.texto, response);
    }
  }
  
  return response;
}

/**
 * Função otimizada para enviar mensagem com contexto da LandingPage
 */
export async function sendLandingPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null
): Promise<string> {
  // Comprime histórico se necessário
  const compressedHistory = compressMessageHistory(historico, 8);
  
  // Se há documento, otimiza o contexto baseado na última pergunta
  let optimizedContext = documentContext;
  if (documentContext && historico.length > 0) {
    const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
    if (lastUserMessage) {
      // Verifica cache primeiro
      const cachedResponse = apiCache.get(documentContext, lastUserMessage.texto);
      if (cachedResponse) {
        console.log('[CACHE] Resposta encontrada no cache, economizando chamada da API');
        // Registra como chamada em cache
        const totalTokens = estimateTokens(LANDING_PAGE_SYSTEM_PROMPT + documentContext + lastUserMessage.texto);
        costMonitor.logCall(totalTokens, estimateTokens(cachedResponse), 0, 'LandingPage', true);
        return cachedResponse;
      }

      // Otimiza documento baseado na pergunta
      const options = getProcessingPriority(lastUserMessage.texto);
      optimizedContext = preprocessDocument(documentContext, lastUserMessage.texto, options);
    }
  }

  const systemPrompt = LANDING_PAGE_SYSTEM_PROMPT;
  const contextPrompt = createContextPrompt(optimizedContext);
  const fullPrompt = systemPrompt + contextPrompt;
  
  // Log de custos
  const totalTokens = estimateTokens(fullPrompt + JSON.stringify(compressedHistory));
  const estimatedCost = estimateCost(totalTokens);
  console.log(`[COST] Tokens estimados: ${totalTokens}, Custo estimado: $${estimatedCost.toFixed(6)}`);
  
  const response = await chatWithAI(fullPrompt, compressedHistory);
  
  // Registra no monitor de custos
  costMonitor.logCall(totalTokens, estimateTokens(response), estimatedCost, 'LandingPage', false);
  
  // Salva no cache se havia documento
  if (documentContext && historico.length > 0) {
    const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
    if (lastUserMessage) {
      apiCache.set(documentContext, lastUserMessage.texto, response);
    }
  }
  
  return response;
}

/**
 * Função genérica para enviar mensagem com prompt customizado
 */
export async function sendCustomMessage(
  systemPrompt: string,
  historico: MessageHistory[],
  documentContext?: string | null
): Promise<string> {
  const compressedHistory = compressMessageHistory(historico, 8);
  
  let fullPrompt = systemPrompt;
  
  if (documentContext !== undefined) {
    const contextPrompt = createContextPrompt(documentContext);
    fullPrompt = systemPrompt + contextPrompt;
  }
  
  return await chatWithAI(fullPrompt, compressedHistory);
}

/**
 * Sistema de messaging com chunking inteligente e iterativo
 */

// Armazena managers de chunking por sessão
const chunkingManagers = new Map<string, ChunkingManager>();

/**
 * Cria ou recupera um chunking manager para uma sessão
 */
function getChunkingManager(sessionId: string, documentContent?: string): ChunkingManager | null {
  if (!chunkingManagers.has(sessionId) && documentContent) {
    chunkingManagers.set(sessionId, new ChunkingManager(documentContent));
  }
  return chunkingManagers.get(sessionId) || null;
}

/**
 * Função avançada para enviar mensagem com chunking iterativo
 */
export async function sendSmartMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  sessionId: string,
  systemPrompt: string
): Promise<string> {
  if (!documentContext) {
    // Sem documento, usa o sistema normal
    return await chatWithAI(systemPrompt, historico);
  }

  const manager = getChunkingManager(sessionId, documentContext);
  if (!manager) {
    console.log('[SMART_MESSAGING] Erro: não foi possível criar chunking manager');
    return await chatWithAI(systemPrompt, historico);
  }

  const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
  if (!lastUserMessage) {
    return "Por favor, faça uma pergunta sobre o documento.";
  }

  // Primeira tentativa: busca chunks iniciais
  const initialResponse = manager.getInitialChunks(lastUserMessage.texto, 3);
  let contextPrompt = createContextPrompt(combineRelevantChunks(initialResponse.chunks));
  let fullSystemPrompt = systemPrompt + contextPrompt;

  console.log(`[SMART_MESSAGING] Tentativa inicial com ${initialResponse.chunks.length} chunks`);
  
  // Adiciona instruções especiais para solicitar mais informações se necessário
  const enhancedSystemPrompt = fullSystemPrompt + `

IMPORTANTE: Se você perceber que as informações fornecidas não são suficientes para responder completamente à pergunta do usuário, responda EXATAMENTE no seguinte formato:

NEED_MORE_CHUNKS: [descrição específica do que você precisa encontrar]

Por exemplo:
- NEED_MORE_CHUNKS: informações sobre procedimentos de segurança
- NEED_MORE_CHUNKS: dados técnicos sobre equipamentos
- NEED_MORE_CHUNKS: regulamentações específicas mencionadas

Caso contrário, responda normalmente com base nas informações disponíveis.}`;

  let response = await chatWithAI(enhancedSystemPrompt, historico);
  
  // Verifica se a IA solicitou mais chunks
  if (response.startsWith('NEED_MORE_CHUNKS:')) {
    const contextHint = response.replace('NEED_MORE_CHUNKS:', '').trim();
    console.log(`[SMART_MESSAGING] IA solicitou mais chunks: ${contextHint}`);
    
    // Máximo 3 tentativas de busca adicional
    let attempts = 0;
    const maxAttempts = 3;
    
    while (response.startsWith('NEED_MORE_CHUNKS:') && attempts < maxAttempts && initialResponse.hasMoreChunks) {
      attempts++;
      
      const chunkRequest: ChunkRequest = {
        query: lastUserMessage.texto,
        excludeChunkIds: manager.getStats().usedChunkIds,
        maxChunks: 2,
        contextHint: contextHint
      };

      const additionalResponse = manager.getAdditionalChunks(chunkRequest);
      
      if (additionalResponse.chunks.length > 0) {
        // Combina chunks anteriores com novos
        const allUsedChunks = [
          ...initialResponse.chunks,
          ...additionalResponse.chunks
        ];
        
        contextPrompt = createContextPrompt(combineRelevantChunks(allUsedChunks));
        fullSystemPrompt = systemPrompt + contextPrompt;
        
        console.log(`[SMART_MESSAGING] Tentativa ${attempts + 1} com ${allUsedChunks.length} chunks totais`);
        
        response = await chatWithAI(fullSystemPrompt, historico);
      } else {
        console.log('[SMART_MESSAGING] Não há mais chunks relevantes disponíveis');
        response = response.replace('NEED_MORE_CHUNKS:', '') + '\n\n*Nota: Busquei em todo o documento disponível, mas não encontrei informações adicionais sobre este tópico específico.*';
        break;
      }
    }
    
    // Se ainda está pedindo mais chunks após todas as tentativas
    if (response.startsWith('NEED_MORE_CHUNKS:')) {
      response = "Com base nas informações disponíveis no documento, posso fornecer uma resposta parcial. Se você precisar de informações mais específicas, considere consultar fontes adicionais ou fornecer mais detalhes sobre o que está procurando.";
    }
  }

  // Registra estatísticas
  const stats = manager.getStats();
  console.log(`[SMART_MESSAGING] Estatísticas da sessão: ${stats.usedChunks}/${stats.totalChunks} chunks usados (${stats.coverage}%)`);
  
  return response;
}

/**
 * Versão melhorada da função da MainPage com chunking inteligente
 */
export async function sendEnhancedMainPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  sessionId?: string
): Promise<string> {
  return sendSmartChunkingMessage(
    historico, 
    documentContext, 
    MAIN_PAGE_SYSTEM_PROMPT,
    sessionId || `main_${Date.now()}`
  );
}

/**
 * Versão melhorada da função da LandingPage com chunking inteligente
 */
export async function sendEnhancedLandingPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  sessionId?: string
): Promise<string> {
  return sendSmartChunkingMessage(
    historico, 
    documentContext, 
    LANDING_PAGE_SYSTEM_PROMPT,
    sessionId || `landing_${Date.now()}`
  );
}

/**
 * Função universal com chunking inteligente - pode ser usada por qualquer página
 * Esta é a função principal que todas as páginas devem usar
 */
export async function sendSmartChunkingMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string,
  sessionId?: string
): Promise<string> {
  const actualSessionId = sessionId || `universal_${Date.now()}`;
  return sendSmartMessage(
    historico, 
    documentContext, 
    actualSessionId, 
    systemPrompt
  );
}

/**
 * Limpa o chunking manager de uma sessão
 */
export function clearChunkingSession(sessionId: string): void {
  if (chunkingManagers.has(sessionId)) {
    chunkingManagers.delete(sessionId);
    console.log(`[SMART_MESSAGING] Sessão ${sessionId} removida`);
  }
}

/**
 * Limpa todas as sessões inativas (mais de 1 hora)
 */
export function cleanupInactiveSessions(): void {
  // Implementação simples - em produção, seria bom ter timestamps
  if (chunkingManagers.size > 10) {
    chunkingManagers.clear();
    console.log('[SMART_MESSAGING] Limpeza de sessões inativas realizada');
  }
}
