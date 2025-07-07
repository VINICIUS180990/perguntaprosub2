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
  API_KEY: "AIzaSyAPx6__sK5MRLXYTs6IZpKf5tyeIRxBcuA",
  MODEL: "gemini-1.5-pro",
  API_URL: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyAPx6__sK5MRLXYTs6IZpKf5tyeIRxBcuA`,
  
  // Configurações de tokens
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.1,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000,     // 30 segundos
  RETRY_ATTEMPTS: 3,
} as const;

// === CONFIGURAÇÕES DE CUSTOS === //
export const COST_CONFIG = {
  // Preços por 1000 tokens (Gemini 1.5 Pro)
  // Baseado nos preços por 1M de tokens:
  // Input: $1.25 (<=128K tokens) / $2.50 (>128K tokens) por 1M tokens
  // Output: $5.00 (<=128K tokens) / $10.00 (>128K tokens) por 1M tokens
  
  INPUT_COST_PER_1K: 0.00125,   // $1.25 / 1000 = $0.00125 por 1K tokens (<=128K)
  INPUT_COST_PER_1K_LARGE: 0.0025, // $2.50 / 1000 = $0.0025 por 1K tokens (>128K)
  
  OUTPUT_COST_PER_1K: 0.005,    // $5.00 / 1000 = $0.005 por 1K tokens (<=128K)
  OUTPUT_COST_PER_1K_LARGE: 0.01, // $10.00 / 1000 = $0.01 por 1K tokens (>128K)
  
  // Limite para considerar request grande (em tokens)
  LARGE_REQUEST_THRESHOLD: 128000, // 128K tokens
  
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
  console.warn('[CONFIG] ⚠️ API Key do Gemini não configurada!');
}

console.log('[CONFIG] ✅ Configurações carregadas:');
console.log('[CONFIG] ✅ - Limite doc pequeno:', DOCUMENT_CONFIG.SMALL_DOCUMENT_MAX_TOKENS, 'tokens');
console.log('[CONFIG] ✅ - Cache duration:', CACHE_CONFIG.DURATION / 1000 / 60, 'minutos');
console.log('[CONFIG] ✅ - AI Model:', AI_CONFIG.MODEL);
console.log('[CONFIG] ✅ - Debug enabled:', DEBUG_CONFIG.ENABLED);

// === EXPORTAÇÕES COMPATÍVEIS === //
// Para manter compatibilidade com código existente
export const AI_API_KEY = AI_CONFIG.API_KEY;
export const AI_MODEL = AI_CONFIG.MODEL;
export const AI_API_URL = AI_CONFIG.API_URL;
