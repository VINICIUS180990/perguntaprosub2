/**
 * Configurações de preços da API Gemini
 * Valores atualizados em julho de 2025
 */

export const GEMINI_PRICING = {
  // Preços por 1 milhão de tokens
  INPUT_COST_PER_1M_TOKENS: 1.25,   // $1.25 - Para entrada (texto, imagem, vídeo, áudio)
  OUTPUT_COST_PER_1M_TOKENS: 10.00, // $10.00 - Para saída (texto e raciocínio)
  
  // Limites da API
  MAX_INPUT_TOKENS_FOR_LOW_PRICE: 200_000, // <= 200k tokens para preço baixo
  
  // Configurações de alerta de custo
  DEFAULT_COST_ALERT_THRESHOLD: 0.01, // $0.01
  HIGH_USAGE_THRESHOLD: 0.05,         // $0.05
  DAILY_BUDGET_ALERT: 1.00,           // $1.00
  
  // Configurações de cache
  CACHE_DURATION_MS: 30 * 60 * 1000,  // 30 minutos
  MAX_CACHE_ENTRIES: 100,
  
  // Configurações de otimização
  RECOMMENDED_MAX_TOKENS: 4000,        // Para balancear custo vs qualidade
  EMERGENCY_MAX_TOKENS: 6000,          // Para casos críticos
  MIN_TOKENS_FOR_CHUNKING: 1000,      // Abaixo disso não vale chunking
} as const;

/**
 * Calcula custo baseado nos preços atuais do Gemini
 */
export function calculateGeminiCost(inputTokens: number, outputTokens: number = 100): number {
  const inputCost = (inputTokens / 1_000_000) * GEMINI_PRICING.INPUT_COST_PER_1M_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * GEMINI_PRICING.OUTPUT_COST_PER_1M_TOKENS;
  
  return inputCost + outputCost;
}

/**
 * Formata custo para exibição
 */
export function formatCost(cost: number): string {
  if (cost < 0.000001) {
    return '<$0.000001';
  }
  return `$${cost.toFixed(6)}`;
}

/**
 * Calcula economia percentual
 */
export function calculateSavings(originalCost: number, optimizedCost: number): {
  absolute: number;
  percentage: number;
  formatted: string;
} {
  const absolute = originalCost - optimizedCost;
  const percentage = originalCost > 0 ? (absolute / originalCost) * 100 : 0;
  
  return {
    absolute,
    percentage,
    formatted: `${formatCost(absolute)} (${percentage.toFixed(1)}%)`
  };
}

/**
 * Verifica se o custo está dentro do orçamento
 */
export function isCostWithinBudget(cost: number, budget: number): {
  withinBudget: boolean;
  remaining: number;
  usagePercentage: number;
} {
  const withinBudget = cost <= budget;
  const remaining = budget - cost;
  const usagePercentage = budget > 0 ? (cost / budget) * 100 : 0;
  
  return {
    withinBudget,
    remaining,
    usagePercentage
  };
}

/**
 * Sugere otimizações baseadas no custo atual
 */
export function suggestOptimizations(
  inputTokens: number, 
  outputTokens: number, 
  cost: number
): string[] {
  const suggestions: string[] = [];
  
  if (inputTokens > GEMINI_PRICING.RECOMMENDED_MAX_TOKENS) {
    suggestions.push(`Reduzir tokens de entrada de ${inputTokens} para ~${GEMINI_PRICING.RECOMMENDED_MAX_TOKENS}`);
  }
  
  if (outputTokens > 500) {
    suggestions.push('Usar prompts mais específicos para respostas mais concisas');
  }
  
  if (cost > GEMINI_PRICING.DEFAULT_COST_ALERT_THRESHOLD) {
    suggestions.push('Implementar cache mais agressivo');
    suggestions.push('Usar chunking inteligente');
  }
  
  if (inputTokens > GEMINI_PRICING.MAX_INPUT_TOKENS_FOR_LOW_PRICE) {
    suggestions.push('⚠️ ATENÇÃO: Entrada excede 200k tokens - custo pode ser maior');
  }
  
  return suggestions;
}
