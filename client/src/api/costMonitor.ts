/**
 * Monitor de custos em tempo real
 */

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
        // Estima o custo que teria se não fosse cache
        const estimatedCost = (c.inputTokens / 1_000_000) * 3.50 + (c.outputTokens / 1_000_000) * 10.50;
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
    
    console.log('\n📊 RELATÓRIO DE CUSTOS DA API');
    console.log('═══════════════════════════════');
    console.log(`💸 Custo total da sessão: $${stats.totalCost.toFixed(6)}`);
    console.log(`💰 Economia com cache: $${stats.costSaved.toFixed(6)}`);
    console.log(`📞 Total de chamadas: ${stats.totalCalls}`);
    console.log(`⚡ Chamadas em cache: ${stats.cachedCalls} (${(stats.cacheHitRate * 100).toFixed(1)}%)`);
    console.log(`🔤 Tokens de entrada: ${stats.totalInputTokens.toLocaleString()}`);
    console.log(`🔤 Tokens de saída: ${stats.totalOutputTokens.toLocaleString()}`);
    console.log(`📈 Custo médio por chamada: $${stats.averageCostPerCall.toFixed(6)}`);
    console.log('═══════════════════════════════\n');
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
  checkCostAlert(threshold: number = 0.01): boolean {
    const stats = this.getSessionStats();
    if (stats.totalCost > threshold) {
      console.warn(`⚠️ ALERTA: Custo da sessão (${stats.totalCost.toFixed(6)}) excedeu o limite de $${threshold}`);
      return true;
    }
    return false;
  }
}

// Instância singleton do monitor
export const costMonitor = new CostMonitor();
