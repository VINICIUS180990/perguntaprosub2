/**
 * Monitor de custos em tempo real
 */

import { calculateGeminiCost, formatCost, GEMINI_PRICING } from './pricing';

interface CostEntry {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  endpoint: string;
  cached: boolean;
}

class CostMonitor {
  private costs: CostEntry[] = [];
  private sessionStart: number = Date.now();

  /**
   * Registra uma chamada da API
   */
  logCall(
    inputTokens: number, 
    outputTokens: number, 
    cost: number, 
    endpoint: string = 'default',
    cached: boolean = false
  ): void {
    this.costs.push({
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
      cost: cached ? 0 : cost, // Chamadas em cache não custam nada
      endpoint,
      cached
    });

    // Mantém apenas os últimos 1000 registros
    if (this.costs.length > 1000) {
      this.costs = this.costs.slice(-1000);
    }
  }

  /**
   * Estatísticas da sessão atual
   */
  getSessionStats(): {
    totalCalls: number;
    cachedCalls: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    averageCostPerCall: number;
    cacheHitRate: number;
    costSaved: number;
  } {
    const sessionCosts = this.costs.filter(c => c.timestamp >= this.sessionStart);
    
    const totalCalls = sessionCosts.length;
    const cachedCalls = sessionCosts.filter(c => c.cached).length;
    const totalCost = sessionCosts.reduce((sum, c) => sum + c.cost, 0);
    const totalInputTokens = sessionCosts.reduce((sum, c) => sum + c.inputTokens, 0);
    const totalOutputTokens = sessionCosts.reduce((sum, c) => sum + c.outputTokens, 0);
    
    // Calcula custo que seria gasto sem cache
    const costWithoutCache = sessionCosts.reduce((sum, c) => {
      if (c.cached) {
        // Estima o custo que teria se não fosse cache (usando preços atuais do Gemini)
        const estimatedCost = calculateGeminiCost(c.inputTokens, c.outputTokens);
        return sum + estimatedCost;
      }
      return sum + c.cost;
    }, 0);

    return {
      totalCalls,
      cachedCalls,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      cacheHitRate: totalCalls > 0 ? cachedCalls / totalCalls : 0,
      costSaved: costWithoutCache - totalCost
    };
  }

  /**
   * Estatísticas por endpoint
   */
  getStatsByEndpoint(): Record<string, {
    calls: number;
    cost: number;
    inputTokens: number;
    outputTokens: number;
  }> {
    const stats: Record<string, any> = {};
    
    this.costs.forEach(cost => {
      if (!stats[cost.endpoint]) {
        stats[cost.endpoint] = {
          calls: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0
        };
      }
      
      stats[cost.endpoint].calls++;
      stats[cost.endpoint].cost += cost.cost;
      stats[cost.endpoint].inputTokens += cost.inputTokens;
      stats[cost.endpoint].outputTokens += cost.outputTokens;
    });
    
    return stats;
  }

  /**
   * Exibe relatório no console
   */
  printReport(): void {
    const stats = this.getSessionStats();
    
    console.log('\n📊 RELATÓRIO DE CUSTOS DA API GEMINI');
    console.log('═══════════════════════════════════════');
    console.log(`💸 Custo total da sessão: ${formatCost(stats.totalCost)}`);
    console.log(`💰 Economia com cache: ${formatCost(stats.costSaved)}`);
    console.log(`📞 Total de chamadas: ${stats.totalCalls}`);
    console.log(`⚡ Chamadas em cache: ${stats.cachedCalls} (${(stats.cacheHitRate * 100).toFixed(1)}%)`);
    console.log(`🔤 Tokens de entrada: ${stats.totalInputTokens.toLocaleString()}`);
    console.log(`🔤 Tokens de saída: ${stats.totalOutputTokens.toLocaleString()}`);
    console.log(`📈 Custo médio por chamada: ${formatCost(stats.averageCostPerCall)}`);
    
    // Alerta se estiver próximo do limite
    if (stats.totalCost > GEMINI_PRICING.DEFAULT_COST_ALERT_THRESHOLD) {
      console.log(`⚠️  ATENÇÃO: Custo da sessão excedeu ${formatCost(GEMINI_PRICING.DEFAULT_COST_ALERT_THRESHOLD)}`);
    }
    
    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Limpa o histórico
   */
  clear(): void {
    this.costs = [];
    this.sessionStart = Date.now();
  }

  /**
   * Alerta se o custo estiver alto
   */
  checkCostAlert(threshold: number = GEMINI_PRICING.DEFAULT_COST_ALERT_THRESHOLD): boolean {
    const stats = this.getSessionStats();
    if (stats.totalCost > threshold) {
      console.warn(`⚠️ ALERTA: Custo da sessão (${formatCost(stats.totalCost)}) excedeu o limite de ${formatCost(threshold)}`);
      return true;
    }
    return false;
  }

  /**
   * Análise detalhada de custos com sugestões
   */
  analyzeAndSuggest(): {
    analysis: string;
    suggestions: string[];
    costBreakdown: {
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
  } {
    const stats = this.getSessionStats();
    
    // Calcula breakdown de custos
    const inputCost = (stats.totalInputTokens / 1_000_000) * GEMINI_PRICING.INPUT_COST_PER_1M_TOKENS;
    const outputCost = (stats.totalOutputTokens / 1_000_000) * GEMINI_PRICING.OUTPUT_COST_PER_1M_TOKENS;
    
    // Análise textual
    let analysis = `Sessão atual: ${stats.totalCalls} chamadas, ${formatCost(stats.totalCost)} gasto total.\n`;
    analysis += `Cache salvou ${formatCost(stats.costSaved)} (${(stats.cacheHitRate * 100).toFixed(1)}% hit rate).\n`;
    
    // Sugestões baseadas no uso
    const suggestions: string[] = [];
    
    if (stats.cacheHitRate < 0.3) {
      suggestions.push('📋 Implementar cache mais agressivo - taxa atual muito baixa');
    }
    
    if (stats.totalInputTokens / stats.totalCalls > GEMINI_PRICING.RECOMMENDED_MAX_TOKENS) {
      suggestions.push('✂️ Reduzir tamanho médio das entradas com chunking inteligente');
    }
    
    if (outputCost > inputCost * 2) {
      suggestions.push('🎯 Usar prompts mais específicos para respostas mais concisas');
    }
    
    if (stats.totalCost > GEMINI_PRICING.HIGH_USAGE_THRESHOLD) {
      suggestions.push('⚠️ Alto uso detectado - considere otimizações adicionais');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('✅ Uso eficiente da API - continue assim!');
    }
    
    return {
      analysis,
      suggestions,
      costBreakdown: {
        inputCost,
        outputCost,
        totalCost: stats.totalCost
      }
    };
  }
}

// Instância singleton do monitor
export const costMonitor = new CostMonitor();
