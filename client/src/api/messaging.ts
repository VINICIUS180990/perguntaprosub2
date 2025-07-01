import { chatWithAI } from './chat';
import type { MessageHistory } from './chat';
import { MAIN_PAGE_SYSTEM_PROMPT, LANDING_PAGE_SYSTEM_PROMPT, createContextPrompt } from './prompts';
import { apiCache } from './cache';
import { preprocessDocument, getProcessingPriority } from './preprocessing';
import { compressMessageHistory, estimateTokens, estimateCost } from './compression';
import { costMonitor } from './costMonitor';

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
