import { chatWithAI } from './chat';
import type { MessageHistory } from './chat';
import { MAIN_PAGE_SYSTEM_PROMPT, LANDING_PAGE_SYSTEM_PROMPT, createContextPrompt } from './prompts';

/**
 * Função para enviar mensagem com contexto da MainPage
 */
export async function sendMainPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null
): Promise<string> {
  const systemPrompt = MAIN_PAGE_SYSTEM_PROMPT;
  const contextPrompt = createContextPrompt(documentContext);
  const fullPrompt = systemPrompt + contextPrompt;
  
  return await chatWithAI(fullPrompt, historico);
}

/**
 * Função para enviar mensagem com contexto da LandingPage
 */
export async function sendLandingPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null
): Promise<string> {
  const systemPrompt = LANDING_PAGE_SYSTEM_PROMPT;
  const contextPrompt = createContextPrompt(documentContext);
  const fullPrompt = systemPrompt + contextPrompt;
  
  return await chatWithAI(fullPrompt, historico);
}

/**
 * Função genérica para enviar mensagem com prompt customizado
 */
export async function sendCustomMessage(
  systemPrompt: string,
  historico: MessageHistory[],
  documentContext?: string | null
): Promise<string> {
  let fullPrompt = systemPrompt;
  
  if (documentContext !== undefined) {
    const contextPrompt = createContextPrompt(documentContext);
    fullPrompt = systemPrompt + contextPrompt;
  }
  
  return await chatWithAI(fullPrompt, historico);
}
