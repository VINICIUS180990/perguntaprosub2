/**
 * Sistema de compressão de contexto para otimizar custos
 */

import type { MessageHistory } from './chat';

/**
 * Comprime o histórico de mensagens mantendo apenas o essencial
 */
export function compressMessageHistory(
  history: MessageHistory[],
  maxMessages: number = 10
): MessageHistory[] {
  if (history.length <= maxMessages) {
    return history;
  }

  // Mantém sempre a primeira mensagem (contexto inicial) e as últimas N
  const firstMessage = history[0];
  const recentMessages = history.slice(-Math.max(maxMessages - 1, 1));

  // Evita duplicar se a primeira mensagem já está nas recentes
  if (recentMessages[0] === firstMessage) {
    return recentMessages;
  }

  return [firstMessage, ...recentMessages];
}

/**
 * Resume contexto longo mantendo informações essenciais
 */
export function compressContext(context: string, maxLength: number = 4000): string {
  if (context.length <= maxLength) {
    return context;
  }

  // Estratégia: manter início, meio e fim do documento
  const partSize = Math.floor(maxLength / 3);
  const start = context.substring(0, partSize);
  const end = context.substring(context.length - partSize);
  
  // Pega uma parte do meio que contenha informações importantes
  const middleStart = Math.floor(context.length / 2) - Math.floor(partSize / 2);
  const middle = context.substring(middleStart, middleStart + partSize);

  return `${start}\n\n[... documento continua ...]\n\n${middle}\n\n[... documento continua ...]\n\n${end}`;
}

/**
 * Remove conteúdo redundante do contexto
 */
export function removeRedundantContent(context: string): string {
  // Remove linhas em branco excessivas
  let cleaned = context.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove espaços múltiplos
  cleaned = cleaned.replace(/\s{3,}/g, ' ');
  
  // Remove caracteres especiais desnecessários
  cleaned = cleaned.replace(/[^\w\sÀ-ÿ.,!?;:()\-"']/g, '');
  
  return cleaned.trim();
}

/**
 * Calcula o custo estimado baseado no número de tokens
 */
export function estimateTokens(text: string): number {
  // Estimativa aproximada: 1 token ≈ 4 caracteres para português
  return Math.ceil(text.length / 4);
}

/**
 * Calcula custo estimado em dólares (baseado no preço do Gemini)
 */
export function estimateCost(inputTokens: number, outputTokens: number = 100): number {
  // Preços aproximados do Gemini 1.5 Pro (valores podem mudar)
  const INPUT_COST_PER_1M_TOKENS = 3.50; // $3.50 per 1M input tokens
  const OUTPUT_COST_PER_1M_TOKENS = 10.50; // $10.50 per 1M output tokens
  
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M_TOKENS;
  
  return inputCost + outputCost;
}
