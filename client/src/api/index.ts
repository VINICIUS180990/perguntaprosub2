// Exportações principais da API
export { chatWithAI } from './chat';
export type { MessageHistory } from './chat';
export { 
  sendMainPageMessage, 
  sendLandingPageMessage, 
  sendCustomMessage 
} from './messaging';
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
  hybridSearch
} from './chunking';
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
export type { DocumentChunk } from './chunking';
export type { ProcessingOptions } from './preprocessing';
export type { DebugInfo } from './debug';
