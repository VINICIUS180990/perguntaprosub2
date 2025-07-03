/**
 * Sistema de Messaging Otimizado - Integração com SmartContextManager
 * 
 * Este arquivo substitui o sistema de chunking tradicional por análise contextual inteligente
 */

import { chatWithAI } from './chat';
import type { MessageHistory } from './chat';
import { SmartContextManager } from './smartChunking';
import { compressMessageHistory, estimateTokens, estimateCost } from './compression';
import { costMonitor } from './costMonitor';
import { apiCache } from './cache';

// Cache global dos managers por documento
const smartManagers = new Map<string, SmartContextManager>();

/**
 * Função principal otimizada para qualquer tipo de consulta
 */
export async function sendOptimizedMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string,
  maxTokens: number = 10000 // Aumentado de 6000 para 10000
): Promise<string> {
  // Se não há documento, usa sistema normal
  if (!documentContext) {
    console.log('[OPTIMIZED] Sem documento, usando chat normal');
    return await chatWithAI(systemPrompt, historico);
  }

  // Obtém ou cria o smart manager para este documento
  const documentHash = generateDocumentHash(documentContext);
  let manager = smartManagers.get(documentHash);
  
  if (!manager) {
    console.log('[OPTIMIZED] Criando novo SmartContextManager para documento');
    manager = new SmartContextManager(documentContext);
    smartManagers.set(documentHash, manager);
    
    // Limpa managers antigos se há muitos em memória
    if (smartManagers.size > 5) {
      const oldestKey = smartManagers.keys().next().value;
      if (oldestKey) {
        smartManagers.delete(oldestKey);
        console.log('[OPTIMIZED] Manager antigo removido da memória');
      }
    }
  }

  // Extrai a última pergunta do usuário
  const lastUserMessage = [...historico].reverse().find(m => m.autor === 'user');
  if (!lastUserMessage) {
    return "Por favor, faça uma pergunta sobre o documento.";
  }

  // Verifica cache primeiro
  const cachedResponse = apiCache.get(documentContext, lastUserMessage.texto);
  if (cachedResponse) {
    console.log('[OPTIMIZED] Resposta encontrada no cache');
    const estimatedTokens = estimateTokens(systemPrompt + documentContext + lastUserMessage.texto);
    costMonitor.logCall(estimatedTokens, estimateTokens(cachedResponse), 0, 'Optimized', true);
    return cachedResponse;
  }

  // Comprime histórico se necessário
  const compressedHistory = compressMessageHistory(historico, 6);

  // Obtém contexto otimizado do documento
  const availableTokens = Math.max(maxTokens - estimateTokens(systemPrompt) - 1000, 4000); // Aumentado reserva e mínimo
  const optimizedContext = manager.getOptimalContext(lastUserMessage.texto, availableTokens);

  // Monta prompt final
  const contextPrompt = createOptimizedContextPrompt(optimizedContext);
  const fullPrompt = systemPrompt + contextPrompt;

  // Calcula custos estimados
  const totalInputTokens = estimateTokens(fullPrompt + JSON.stringify(compressedHistory));
  const estimatedCost = estimateCost(totalInputTokens);
  
  console.log(`[OPTIMIZED] Tokens de entrada: ${totalInputTokens}, Custo estimado: $${estimatedCost.toFixed(6)}`);

  // Faz a chamada para a API
  const response = await chatWithAI(fullPrompt, compressedHistory);

  // Registra no monitor de custos
  const outputTokens = estimateTokens(response);
  const actualCost = estimateCost(totalInputTokens, outputTokens);
  costMonitor.logCall(totalInputTokens, outputTokens, actualCost, 'Optimized', false);

  // Salva no cache
  apiCache.set(documentContext, lastUserMessage.texto, response);

  console.log(`[OPTIMIZED] Resposta gerada com sucesso. Tokens de saída: ${outputTokens}`);
  return response;
}

/**
 * Cria prompt de contexto otimizado
 */
function createOptimizedContextPrompt(context: string): string {
  const tokenCount = estimateTokens(context);
  const sectionCount = (context.match(/===/g) || []).length / 2; // Conta seções pelo delimitador
  
  return `
=== CONTEXTO INTELIGENTE SELECIONADO ===
📄 ${sectionCount} seções analisadas | 🔤 ~${tokenCount} tokens

${context}

=== INSTRUÇÕES PARA RESPOSTA DE ALTA QUALIDADE ===

CONTEXTO FORNECIDO:
✅ Seções selecionadas por análise semântica inteligente
✅ Conteúdo otimizado para sua pergunta específica  
✅ Incluídas seções relacionadas por importância

COMO RESPONDER:
1. 🎯 Use TODO o contexto fornecido para dar uma resposta COMPLETA
2. 📖 Cite artigos, parágrafos e seções específicas
3. 🔍 Explique procedimentos, prazos e requisitos detalhadamente
4. ⚖️ Use terminologia militar adequada

NUNCA diga que faltam informações - USE TODO O CONTEXTO DISPONÍVEL!

`;
}

/**
 * Gera hash único para o documento (para cache)
 */
function generateDocumentHash(content: string): string {
  // Hash simples baseado no conteúdo e tamanho
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit
  }
  return `doc_${Math.abs(hash)}_${content.length}`;
}

/**
 * Versão otimizada para MainPage
 */
export async function sendOptimizedMainPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string
): Promise<string> {
  return sendOptimizedMessage(historico, documentContext, systemPrompt, 12000); // Aumentado de 8000 para 12000
}

/**
 * Versão otimizada para LandingPage
 */
export async function sendOptimizedLandingPageMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string
): Promise<string> {
  return sendOptimizedMessage(historico, documentContext, systemPrompt, 10000); // Aumentado de 6000 para 10000
}

/**
 * Função para análise comparativa (documentos grandes que precisam de muito contexto)
 */
export async function sendDeepAnalysisMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string
): Promise<string> {
  return sendOptimizedMessage(historico, documentContext, systemPrompt, 12000);
}

/**
 * Função para consultas rápidas (contexto mínimo, máxima economia)
 */
export async function sendQuickQueryMessage(
  historico: MessageHistory[], 
  documentContext: string | null,
  systemPrompt: string
): Promise<string> {
  return sendOptimizedMessage(historico, documentContext, systemPrompt, 3000);
}

/**
 * Limpa cache dos smart managers
 */
export function clearOptimizedCache(): void {
  smartManagers.forEach(manager => manager.clearCache());
  smartManagers.clear();
  console.log('[OPTIMIZED] Cache dos Smart Managers limpo');
}

/**
 * Obtém estatísticas de todos os managers ativos
 */
export function getOptimizedStats(): {
  activeManagers: number;
  totalSections: number;
  cacheHits: number;
} {
  let totalSections = 0;
  let cacheHits = 0;
  
  smartManagers.forEach(manager => {
    const stats = manager.getStats();
    totalSections += stats.totalSections;
    cacheHits += stats.cacheSize;
  });
  
  return {
    activeManagers: smartManagers.size,
    totalSections,
    cacheHits
  };
}

/**
 * Debug function para análise de performance
 */
export function debugOptimizedSystem(): void {
  console.log('=== RELATÓRIO DO SISTEMA OTIMIZADO ===');
  
  const stats = getOptimizedStats();
  console.log(`📊 Managers ativos: ${stats.activeManagers}`);
  console.log(`📄 Total de seções: ${stats.totalSections}`);
  console.log(`💾 Cache hits: ${stats.cacheHits}`);
  
  // Estatísticas individuais dos managers
  smartManagers.forEach((manager, hash) => {
    const managerStats = manager.getStats();
    console.log(`\n📄 Manager ${hash}:`);
    console.log(`  - Seções: ${managerStats.totalSections}`);
    console.log(`  - Importância média: ${managerStats.averageImportance}`);
    console.log(`  - Conceitos: ${managerStats.concepts.join(', ')}`);
    console.log(`  - Cache: ${managerStats.cacheSize} entradas`);
  });
  
  // Instruções para diagnóstico
  console.log('\n=== DIAGNÓSTICO AVANÇADO ===');
  console.log('Para diagnosticar problemas de contexto:');
  console.log('1. Verifique se o número de seções é adequado (>= 3)');
  console.log('2. Confirme se os conceitos incluem termos da sua pergunta');
  console.log('3. Use debugOptimizedQuery("sua pergunta") para análise específica');
  
  console.log('\n=== FIM DO RELATÓRIO ===');
}

/**
 * Debug function para análise específica de uma pergunta
 */
export function debugOptimizedQuery(query: string): void {
  console.log(`=== ANÁLISE DA PERGUNTA: "${query}" ===`);
  
  if (smartManagers.size === 0) {
    console.log('❌ Nenhum manager ativo. Faça uma pergunta primeiro.');
    return;
  }
  
  const manager = smartManagers.values().next().value;
  if (!manager) return;
  
  const context = manager.getOptimalContext(query, 10000);
  const tokenCount = Math.ceil(context.length / 4);
  const sectionCount = (context.match(/===/g) || []).length / 2;
  
  console.log(`📊 Contexto gerado:`);
  console.log(`  - Seções selecionadas: ${sectionCount}`);
  console.log(`  - Tokens estimados: ${tokenCount}`);
  console.log(`  - Tamanho do contexto: ${context.length} caracteres`);
  
  console.log(`\n📄 Primeiros 500 caracteres do contexto:`);
  console.log(context.substring(0, 500) + '...');
  
  console.log(`\n=== ANÁLISE COMPLETA ===`);
}

// Expõe função de debug globalmente
if (typeof window !== 'undefined') {
  (window as any).debugOptimized = debugOptimizedSystem;
  (window as any).clearOptimizedCache = clearOptimizedCache;
  (window as any).debugOptimizedQuery = debugOptimizedQuery;
}
