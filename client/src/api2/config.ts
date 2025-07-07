/**
 * CONFIGURAÇÕES - API2
 * Configurações centralizadas do sistema
 */

console.log('[CONFIG] 🔧 Carregando configurações da API2...');

// === CONFIGURAÇÕES DE DOCUMENTOS === //
export const DOCUMENT_CONFIG = {
  // Limite para documento pequeno (em tokens)
  SMALL_DOCUMENT_MAX_TOKENS: 5000,
  
  // Configurações de divisão para documentos grandes
  DIVISION: {
    MIN_SECTION_SIZE: 500,    // Mínimo de caracteres por seção
    MAX_SECTION_SIZE: 3000,   // Máximo de caracteres por seção
    OVERLAP_SIZE: 100,        // Sobreposição entre seções
  },
  
  // Configurações de resumo
  SUMMARY: {
    MAX_LENGTH: 200,          // Máximo de caracteres no resumo
    MIN_LENGTH: 50,           // Mínimo de caracteres no resumo
  }
} as const;

// === CONFIGURAÇÕES DE CACHE === //
export const CACHE_CONFIG = {
  DURATION: 2 * 60 * 60 * 1000,  // 2 horas em ms
  MAX_ENTRIES: 50,                // Máximo de documentos em cache
  CLEANUP_INTERVAL: 30 * 60 * 1000, // Limpeza a cada 30 minutos
} as const;

// === CONFIGURAÇÕES DA API === //
export const AI_CONFIG = {
  API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  MODEL: 'gpt-4o-mini',
  API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // Configurações de tokens
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.1,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000,     // 30 segundos
  RETRY_ATTEMPTS: 3,
} as const;

// === CONFIGURAÇÕES DE CUSTOS === //
export const COST_CONFIG = {
  // Preços por 1000 tokens (GPT-4o-mini)
  INPUT_COST_PER_1K: 0.00015,
  OUTPUT_COST_PER_1K: 0.0006,
  
  // Alertas
  DAILY_BUDGET: 5.0,          // $5 por dia
  WARNING_THRESHOLD: 0.8,     // 80% do budget
} as const;

// === CONFIGURAÇÕES DE DEBUG === //
export const DEBUG_CONFIG = {
  ENABLED: true,
  LOG_LEVELS: {
    ERROR: true,
    WARN: true,
    INFO: true,
    DEBUG: true,
  },
  
  // Prefixos para logs
  PREFIXES: {
    PROCESSOR: '[DOC_PROCESSOR]',
    DIVIDER: '[DOC_DIVIDER]',
    CACHE: '[CACHE]',
    QUERY: '[QUERY_PROCESSOR]',
    SELECTOR: '[PART_SELECTOR]',
    COST: '[COST_MONITOR]',
    CHAT: '[CHAT_API]',
  }
} as const;

// === VALIDAÇÃO === //
if (!AI_CONFIG.API_KEY) {
  console.warn('[CONFIG] ⚠️ VITE_OPENAI_API_KEY não configurada!');
}

console.log('[CONFIG] ✅ Configurações carregadas:');
console.log('[CONFIG] ✅ - Limite doc pequeno:', DOCUMENT_CONFIG.SMALL_DOCUMENT_MAX_TOKENS, 'tokens');
console.log('[CONFIG] ✅ - Cache duration:', CACHE_CONFIG.DURATION / 1000 / 60, 'minutos');
console.log('[CONFIG] ✅ - AI Model:', AI_CONFIG.MODEL);
console.log('[CONFIG] ✅ - Debug enabled:', DEBUG_CONFIG.ENABLED);
