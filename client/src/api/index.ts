// DEBUG: Log de inicialização do index.ts
console.log('[DEBUG] index.ts - Iniciando exports da API');

// === NOVO SISTEMA DE ECONOMIA DE TOKENS === //
export {
  processLandingPageQuery,
  processMainPageQuery,
  preProcessDocument,
  getSystemStats,
  clearSystemCache,
  checkSystemHealth
} from './newMainAPI';

// === NOVA API PRINCIPAL === //
// Sistema de Documentos Inteligente  
export {
  processDocumentContent,
  processUserQuery,
  preloadDocument
} from './mainAPI';

// === EXPORTAÇÕES BÁSICAS === //
export { chatWithAI } from './chat';
export type { MessageHistory } from './chat';

// === PROMPTS === //
export { 
  MAIN_PAGE_SYSTEM_PROMPT, 
  LANDING_PAGE_SYSTEM_PROMPT, 
  createContextPrompt 
} from './prompts';

// === CONFIGURAÇÕES === //
export { AI_API_KEY, AI_MODEL, AI_API_URL } from './config';

// === CACHE === //
export { apiCache } from './cache';

// DEBUG: Verificando exports do costMonitor
console.log('[DEBUG] index.ts - Preparando exports do costMonitor');

// === CUSTOS E MONITORAMENTO === //
export { 
  costMonitor, 
  estimateTokens, 
  estimateCost, 
  calculateCost, 
  formatCost 
} from './costMonitor';

// DEBUG: Verificar se exports do costMonitor funcionaram
console.log('[DEBUG] index.ts - Exports do costMonitor configurados');

// === TIPOS === //
export type { 
  DocumentProcessingResult, 
  DocumentDivision 
} from './documentProcessor';

export type {
  QueryAnalysisResult,
  QueryResponse
} from './intelligentQuery';

// === GUIA DE TESTE === //
export { TESTING_GUIDE } from './testingGuide';

// DEBUG: Importar teste do costMonitor
import './testCostMonitor';

// DEBUG: Importar teste do prompts
import './testPrompts';
