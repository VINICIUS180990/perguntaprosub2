// Exportações principais da API
export { chatWithAI } from './chat';
export type { MessageHistory } from './chat';
export { 
  sendMainPageMessage, 
  sendLandingPageMessage, 
  sendCustomMessage,
  sendEnhancedMainPageMessage,
  sendEnhancedLandingPageMessage,
  sendSmartChunkingMessage,
  clearChunkingSession,
  cleanupInactiveSessions
} from './messaging';

// Novo sistema otimizado (recomendado)
export {
  sendOptimizedMessage,
  sendOptimizedMainPageMessage,
  sendOptimizedLandingPageMessage,
  sendDeepAnalysisMessage,
  sendQuickQueryMessage,
  clearOptimizedCache,
  getOptimizedStats,
  debugOptimizedSystem,
  debugOptimizedQuery
} from './optimizedMessaging';

export { 
  MAIN_PAGE_SYSTEM_PROMPT, 
  LANDING_PAGE_SYSTEM_PROMPT, 
  createContextPrompt 
} from './prompts';
export { AI_API_KEY, AI_MODEL, AI_API_URL } from './config';

// Exportações para otimização de custos
export { 
  chunkDocument, 
  findRelevantChunks, 
  combineRelevantChunks,
  hybridSearch,
  ChunkingManager
} from './chunking';
export type { DocumentChunk, ChunkRequest, ChunkResponse } from './chunking';

// Novo sistema de análise contextual inteligente
export { SmartContextManager } from './smartChunking';
export type { SemanticSection, QueryAnalysis, ContextStrategy } from './smartChunking';

export { apiCache } from './cache';
export { 
  compressMessageHistory, 
  compressContext, 
  removeRedundantContent,
  estimateTokens,
  estimateCost 
} from './compression';
export { 
  preprocessDocument, 
  extractKeywords, 
  getProcessingPriority,
  intelligentDocumentSearch
} from './preprocessing';
export { costMonitor } from './costMonitor';
export { 
  GEMINI_PRICING,
  calculateGeminiCost,
  formatCost,
  calculateSavings,
  isCostWithinBudget,
  suggestOptimizations
} from './pricing';
export { debugMonitor, useChunkDebug } from './debug';
export type { ProcessingOptions } from './preprocessing';
export type { DebugInfo } from './debug';
