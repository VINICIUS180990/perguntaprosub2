/**
 * UTILITÁRIOS - API2
 * Funções auxiliares para o sistema
 */

import { DEBUG_CONFIG } from './config';

console.log('[UTILS] 🔧 Carregando utilitários...');

// === LOGGING === //
export const logger = {
  error: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.ERROR) {
      console.error(`${prefix} ❌ ${message}`, ...args);
    }
  },
  
  warn: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.WARN) {
      console.warn(`${prefix} ⚠️ ${message}`, ...args);
    }
  },
  
  info: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.INFO) {
      console.log(`${prefix} ℹ️ ${message}`, ...args);
    }
  },
  
  debug: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.DEBUG) {
      console.log(`${prefix} 🔍 ${message}`, ...args);
    }
  },
  
  success: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.INFO) {
      console.log(`${prefix} ✅ ${message}`, ...args);
    }
  },
  
  processing: (prefix: string, message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.LOG_LEVELS.INFO) {
      console.log(`${prefix} ⏳ ${message}`, ...args);
    }
  }
};

// === HASH GENERATION === //
export function generateHash(content: string, name: string): string {
  logger.debug('[UTILS]', `Gerando hash para: ${name}`);
  
  const combined = content + name + content.length;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32bit
  }
  
  const result = `doc_${Math.abs(hash)}_${content.length}_${Date.now()}`;
  logger.debug('[UTILS]', `Hash gerado: ${result}`);
  
  return result;
}

// === TOKEN ESTIMATION === //
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Estimativa: ~4 caracteres por token para português
  const estimated = Math.ceil(text.length / 4);
  
  logger.debug('[UTILS]', `Tokens estimados: ${estimated} (${text.length} chars)`);
  
  return estimated;
}

// === COST CALCULATION === //
export function calculateCost(inputTokens: number, outputTokens: number = 0): number {
  const inputCost = (inputTokens / 1000) * 0.00015;  // $0.00015 per 1K input tokens
  const outputCost = (outputTokens / 1000) * 0.0006; // $0.0006 per 1K output tokens
  const total = inputCost + outputCost;
  
  logger.debug('[UTILS]', `Custo calculado: $${total.toFixed(6)} (in: ${inputTokens}, out: ${outputTokens})`);
  
  return total;
}

// === TEXT CLEANING === //
export function cleanText(text: string): string {
  if (!text) return '';
  
  logger.debug('[UTILS]', `Limpando texto: ${text.length} chars`);
  
  const cleaned = text
    .replace(/\r\n/g, '\n')           // Normalizar quebras
    .replace(/\n{3,}/g, '\n\n')       // Reduzir múltiplas quebras
    .replace(/\s{2,}/g, ' ')          // Reduzir múltiplos espaços
    .replace(/[^\w\s\n\.\,\;\:\!\?\-\(\)\[\]]/g, '') // Remover caracteres especiais
    .trim();
  
  logger.debug('[UTILS]', `Texto limpo: ${cleaned.length} chars`);
  
  return cleaned;
}

// === ID GENERATION === //
export function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}_${random}`;
  
  logger.debug('[UTILS]', `ID gerado: ${id}`);
  
  return id;
}

// === TIME FORMATTING === //
export function formatTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    return `${(milliseconds / 60000).toFixed(1)}min`;
  }
}

// === FILE SIZE FORMATTING === //
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`;
}

// === PERFORMANCE MEASUREMENT === //
export class PerformanceTimer {
  private startTime: number;
  private name: string;
  
  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
    logger.processing('[UTILS]', `Timer iniciado: ${name}`);
  }
  
  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    logger.success('[UTILS]', `Timer finalizado: ${this.name} - ${formatTime(duration)}`);
    return duration;
  }
}

console.log('[UTILS] ✅ Utilitários carregados com sucesso');
