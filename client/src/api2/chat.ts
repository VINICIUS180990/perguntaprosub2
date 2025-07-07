/**
 * CHAT API - API2
 * Interface limpa com OpenAI
 */

import { AI_CONFIG, DEBUG_CONFIG } from './config';
import { logger, calculateCost, estimateTokens, PerformanceTimer } from './utils';

const PREFIX = DEBUG_CONFIG.PREFIXES.CHAT;

logger.info(PREFIX, 'Inicializando Chat API...');

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  processingTime: number;
}

/**
 * Chama a API da OpenAI com logs detalhados
 */
export async function callChatAPI(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatResponse> {
  const timer = new PerformanceTimer('ChatAPI Request');
  
  logger.processing(PREFIX, 'Iniciando chamada para API...');
  logger.debug(PREFIX, `Mensagens: ${messages.length}`);
  logger.debug(PREFIX, `Temperature: ${options?.temperature || AI_CONFIG.TEMPERATURE}`);
  logger.debug(PREFIX, `Max tokens: ${options?.maxTokens || AI_CONFIG.MAX_TOKENS}`);
  
  // Calcular tokens de entrada
  const inputText = messages.map(m => m.content).join('\n');
  const inputTokens = estimateTokens(inputText);
  const estimatedCost = calculateCost(inputTokens);
  
  logger.info(PREFIX, `Tokens de entrada: ${inputTokens}`);
  logger.info(PREFIX, `Custo estimado: $${estimatedCost.toFixed(6)}`);
  
  try {
    logger.processing(PREFIX, 'Enviando requisição para OpenAI...');
    
    const response = await fetch(AI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL,
        messages: messages,
        temperature: options?.temperature || AI_CONFIG.TEMPERATURE,
        max_tokens: options?.maxTokens || AI_CONFIG.MAX_TOKENS,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(PREFIX, `Erro HTTP ${response.status}:`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const processingTime = timer.end();
    
    logger.success(PREFIX, 'Resposta recebida da OpenAI');
    
    // Extrair resposta
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};
    
    // Calcular tokens e custos reais
    const actualInputTokens = usage.prompt_tokens || inputTokens;
    const outputTokens = usage.completion_tokens || estimateTokens(content);
    const totalTokens = usage.total_tokens || (actualInputTokens + outputTokens);
    const actualCost = calculateCost(actualInputTokens, outputTokens);
    
    logger.success(PREFIX, `Resposta processada: ${content.length} chars`);
    logger.info(PREFIX, `Tokens reais - Input: ${actualInputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
    logger.info(PREFIX, `Custo real: $${actualCost.toFixed(6)}`);
    logger.info(PREFIX, `Tempo de processamento: ${processingTime.toFixed(0)}ms`);
    
    const result: ChatResponse = {
      content,
      tokensUsed: {
        input: actualInputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: actualCost,
      processingTime,
    };
    
    logger.debug(PREFIX, 'Resultado completo:', result);
    
    return result;
    
  } catch (error) {
    const processingTime = timer.end();
    
    logger.error(PREFIX, 'Erro na chamada da API:', error);
    logger.error(PREFIX, `Falha após ${processingTime.toFixed(0)}ms`);
    
    throw new Error(`Falha na comunicação com a API: ${error}`);
  }
}

/**
 * Função simplificada para chamadas rápidas
 */
export async function simpleChat(prompt: string, systemPrompt?: string): Promise<string> {
  logger.debug(PREFIX, 'Chamada simples do chat...');
  
  const messages: ChatMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });
  
  const response = await callChatAPI(messages);
  return response.content;
}

/**
 * Função para chat com histórico
 */
export async function chatWithHistory(
  newMessage: string,
  history: ChatMessage[],
  systemPrompt?: string
): Promise<ChatResponse> {
  logger.debug(PREFIX, `Chat com histórico: ${history.length} mensagens anteriores`);
  
  const messages: ChatMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push(...history);
  messages.push({ role: 'user', content: newMessage });
  
  return await callChatAPI(messages);
}

logger.success(PREFIX, 'Chat API inicializada com sucesso');
