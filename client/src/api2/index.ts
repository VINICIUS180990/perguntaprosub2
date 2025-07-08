/**
 * INDEX - API2
 * Arquivo principal com todas as exportações
 */

console.log('[API2] 🚀 Carregando API2...');

// === TIPOS === //
export type {
  DocumentInfo,
  SmallDocument,
  LargeDocument,
  DocumentDivision,
  CacheEntry,
  QueryAnalysis,
  PartSelectionResult,
  QueryResponse,
  ProcessingStatus,
  SystemStats
} from './types';

// === CONFIGURAÇÕES === //
export {
  DOCUMENT_CONFIG,
  CACHE_CONFIG,
  AI_CONFIG,
  COST_CONFIG,
  DEBUG_CONFIG
} from './config';

// === UTILITÁRIOS === //
export {
  logger,
  generateHash,
  estimateTokens,
  calculateCost,
  cleanText,
  generateId,
  formatTime,
  formatFileSize,
  PerformanceTimer
} from './utils';

// === CHAT API === //
export {
  callChatAPI,
  simpleChat,
  chatWithHistory
} from './chat';
export type { ChatMessage, ChatResponse } from './chat';

// === CACHE === //
export { documentCache, DocumentCache } from './documentCache';

// === DIVISOR === //
export { documentDivider, DocumentDivider } from './documentDivider';

// === SELETOR === //
export { partSelector, PartSelector } from './partSelector';

// === PROMPTS === //
export {
  SMALL_DOCUMENT_PROMPTS,
  LARGE_DOCUMENT_PROMPTS,
  ANALYSIS_PROMPTS,
  GENERAL_PROMPTS,
  processPrompt,
  createSmallDocumentPrompt,
  createLargeDocumentPrompt,
  createAnalysisPrompt,
  createGeneralPrompt,
  formatSelectedSections
} from './prompts';

// === MONITOR DE CUSTOS === //
export { costMonitor, CostMonitor } from './costMonitor';
export type { CostEntry, CostSummary } from './costMonitor';

// === PROCESSADORES PRINCIPAIS === //
export { documentProcessor, DocumentProcessor } from './documentProcessor';
export { queryProcessor, QueryProcessor } from './queryProcessor';

// Imports para uso interno
import { documentProcessor } from './documentProcessor';
import { queryProcessor } from './queryProcessor';
import { documentCache } from './documentCache';
import { costMonitor } from './costMonitor';
import type { SystemStats } from './types';

// === API PRINCIPAL === //

/**
 * Classe principal da API2 que coordena todos os componentes
 */
export class API2 {
  
  /**
   * Processa um documento anexado/selecionado
   */
  async processDocument(
    content: string,
    name: string,
    source: 'ATTACHED' | 'SELECTED' = 'ATTACHED'
  ) {
    console.log('[API2] 📄 Processando documento:', name);
    console.log('[API2] 🔍 Contexto atual antes:', {
      activeDoc: queryProcessor.getActiveDocument()?.name || 'Nenhum',
      historyLength: queryProcessor.getStats().conversationLength,
      totalCost: queryProcessor.getStats().totalConversationCost
    });
    
    try {
      const document = await documentProcessor.processDocument(content, name, source);
      
      // Definir como documento ativo
      console.log('[API2] 🔄 Definindo documento ativo...');
      queryProcessor.setActiveDocument(document);
      
      console.log('[API2] ✅ Documento processado e ativo:', document.type);
      console.log('[API2] 📊 Contexto após processamento:', {
        activeDoc: queryProcessor.getActiveDocument()?.name,
        historyLength: queryProcessor.getStats().conversationLength,
        totalCost: queryProcessor.getStats().totalConversationCost
      });
      
      return {
        success: true,
        document,
        message: `Documento "${name}" processado com sucesso!`
      };
      
    } catch (error) {
      console.error('[API2] ❌ Erro no processamento:', error);
      
      return {
        success: false,
        error: String(error),
        message: 'Falha no processamento do documento'
      };
    }
  }
  
  /**
   * Processa uma pergunta do usuário
   */
  async processQuery(query: string) {
    console.log('[API2] ❓ Processando query:', query.substring(0, 100) + '...');
    
    try {
      const response = await queryProcessor.processQuery(query);
      
      console.log('[API2] ✅ Query processada com sucesso');
      
      return {
        success: true,
        response,
        message: 'Pergunta processada com sucesso!'
      };
      
    } catch (error) {
      console.error('[API2] ❌ Erro na query:', error);
      
      return {
        success: false,
        error: String(error),
        message: 'Falha no processamento da pergunta'
      };
    }
  }
  
  /**
   * Obtém estatísticas completas do sistema
   */
  getSystemStats(): SystemStats {
    const cacheStats = documentCache.getStats();
    const costSummary = costMonitor.getSummary();
    const queryStats = queryProcessor.getStats();
    
    return {
      totalDocuments: cacheStats.totalEntries,
      smallDocuments: cacheStats.smallDocuments,
      largeDocuments: cacheStats.largeDocuments,
      cacheSize: cacheStats.totalSizeKB,
      totalQueries: queryStats.totalQueries,
      totalCost: costSummary.totalCost
    };
  }
  
  /**
   * Obtém status detalhado
   */
  getDetailedStatus() {
    return {
      cache: documentCache.getStats(),
      cost: costMonitor.getSummary(),
      query: queryProcessor.getStats(),
      processor: documentProcessor.getStats()
    };
  }
  
  /**
   * Limpa todo o sistema
   */
  clearAll() {
    console.log('[API2] 🧹 Limpando sistema...');
    
    documentCache.clear();
    queryProcessor.clearActiveDocument();
    queryProcessor.resetStats();
    
    console.log('[API2] ✅ Sistema limpo');
  }
  
  /**
   * Pré-visualização de documento sem processar
   */
  previewDocument(content: string, name: string) {
    return documentProcessor.previewDocument(content, name);
  }
  
  /**
   * Obtém documento ativo
   */
  getActiveDocument() {
    return queryProcessor.getActiveDocument();
  }
  
  /**
   * Lista documentos em cache
   */
  getCachedDocuments() {
    return documentProcessor.listCachedDocuments();
  }
  
  /**
   * Monitora custos
   */
  getCostSummary() {
    return costMonitor.getSummary();
  }
  
  /**
   * Log de status
   */
  logStatus() {
    console.log('[API2] 📊 STATUS DO SISTEMA:');
    
    const stats = this.getSystemStats();
    console.log('[API2] 📄 Documentos:', stats.totalDocuments, '(P:', stats.smallDocuments, 'G:', stats.largeDocuments, ')');
    console.log('[API2] ❓ Queries:', stats.totalQueries);
    console.log('[API2] 💰 Custo total: $' + stats.totalCost.toFixed(4));
    console.log('[API2] 💾 Cache:', stats.cacheSize.toFixed(1), 'KB');
    
    const activeDoc = this.getActiveDocument();
    console.log('[API2] 🎯 Documento ativo:', activeDoc ? `${activeDoc.name} (${activeDoc.type})` : 'Nenhum');
  }
}

// Instância global da API2
export const api2 = new API2();

console.log('[API2] ✅ API2 carregada com sucesso!');

// Log inicial de status
setTimeout(() => {
  api2.logStatus();
}, 100);
