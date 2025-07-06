/**
 * Sistema de monitoramento de custos para nova lógica
 */

// DEBUG: Log de inicialização do arquivo
console.log('[DEBUG] costMonitor.ts - Arquivo carregado');

// Preços do Gemini (exemplo - ajustar conforme necessário)
const GEMINI_PRICING = {
  INPUT_TOKENS: 0.00000125,  // $0.00000125 por token de entrada
  OUTPUT_TOKENS: 0.00000375  // $0.00000375 por token de saída
};

interface CostRecord {
  timestamp: number;
  operation: string;
  phase: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  details: string;
}

class CostMonitor {
  private records: CostRecord[] = [];
  private sessionStartTime: number = Date.now();

  /**
   * Registra custo de uma operação
   */
  logOperation(
    operation: string,
    phase: string,
    inputTokens: number,
    outputTokens: number,
    details: string = ''
  ): void {
    const cost = this.calculateCost(inputTokens, outputTokens);
    
    const record: CostRecord = {
      timestamp: Date.now(),
      operation,
      phase,
      inputTokens,
      outputTokens,
      cost,
      details
    };

    this.records.push(record);

    // Log detalhado no console
    console.log(`[COST] 💰 ${operation} - ${phase}`);
    console.log(`  📊 Tokens IN: ${inputTokens} | OUT: ${outputTokens}`);
    console.log(`  💵 Custo: $${cost.toFixed(8)}`);
    console.log(`  📝 ${details}`);
    console.log(`  📈 Total acumulado: $${this.getTotalCost().toFixed(8)}`);
  }

  /**
   * Calcula custo baseado em tokens
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * GEMINI_PRICING.INPUT_TOKENS) + (outputTokens * GEMINI_PRICING.OUTPUT_TOKENS);
  }

  /**
   * Estima tokens baseado no texto (aproximação)
   */
  estimateTokens(text: string): number {
    // Aproximação: 1 token ≈ 4 caracteres
    return Math.ceil(text.length / 4);
  }

  /**
   * Obtém custo total da sessão
   */
  getTotalCost(): number {
    return this.records.reduce((total, record) => total + record.cost, 0);
  }

  /**
   * Obtém estatísticas da sessão
   */
  getSessionStats(): {
    totalOperations: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    sessionDuration: number;
    operationsByPhase: Record<string, number>;
    costByPhase: Record<string, number>;
  } {
    const totalInputTokens = this.records.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = this.records.reduce((sum, r) => sum + r.outputTokens, 0);
    
    const operationsByPhase: Record<string, number> = {};
    const costByPhase: Record<string, number> = {};
    
    this.records.forEach(record => {
      operationsByPhase[record.phase] = (operationsByPhase[record.phase] || 0) + 1;
      costByPhase[record.phase] = (costByPhase[record.phase] || 0) + record.cost;
    });

    return {
      totalOperations: this.records.length,
      totalCost: this.getTotalCost(),
      totalInputTokens,
      totalOutputTokens,
      sessionDuration: Date.now() - this.sessionStartTime,
      operationsByPhase,
      costByPhase
    };
  }

  /**
   * Exibe relatório detalhado no console
   */
  showDetailedReport(): void {
    const stats = this.getSessionStats();
    
    console.log('\n=== 📊 RELATÓRIO DETALHADO DE CUSTOS ===');
    console.log(`⏱️  Duração da sessão: ${(stats.sessionDuration / 1000 / 60).toFixed(1)} minutos`);
    console.log(`🔢 Total de operações: ${stats.totalOperations}`);
    console.log(`📊 Tokens totais: ${stats.totalInputTokens} IN + ${stats.totalOutputTokens} OUT`);
    console.log(`💰 Custo total: $${stats.totalCost.toFixed(8)}`);
    
    console.log('\n📈 CUSTOS POR FASE:');
    Object.entries(stats.costByPhase).forEach(([phase, cost]) => {
      const operations = stats.operationsByPhase[phase];
      console.log(`  ${phase}: ${operations} ops, $${cost.toFixed(8)}`);
    });

    console.log('\n📝 ÚLTIMAS 10 OPERAÇÕES:');
    this.records.slice(-10).forEach((record, index) => {
      const time = new Date(record.timestamp).toLocaleTimeString();
      console.log(`  ${index + 1}. [${time}] ${record.operation} - ${record.phase}: $${record.cost.toFixed(8)}`);
    });
    
    console.log('=== FIM DO RELATÓRIO ===\n');
  }

  /**
   * Limpa registros antigos
   */
  clearOldRecords(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.records = this.records.filter(record => record.timestamp > oneHourAgo);
    console.log(`[COST] 🧹 Registros antigos limpos`);
  }

  /**
   * Reseta o monitor
   */
  reset(): void {
    this.records = [];
    this.sessionStartTime = Date.now();
    console.log(`[COST] 🔄 Monitor de custos resetado`);
  }
}

// DEBUG: Preparando exports
console.log('[DEBUG] costMonitor.ts - Preparando exports');

// Instância global
export const costMonitor = new CostMonitor();
console.log('[DEBUG] costMonitor.ts - costMonitor exportado:', typeof costMonitor);

// Função para formatar valores de custo
export function formatCost(cost: number): string {
  return `$${cost.toFixed(8)}`;
}
console.log('[DEBUG] costMonitor.ts - formatCost exportado:', typeof formatCost);

// Função para calcular custo
export function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * GEMINI_PRICING.INPUT_TOKENS) + (outputTokens * GEMINI_PRICING.OUTPUT_TOKENS);
}
console.log('[DEBUG] costMonitor.ts - calculateCost exportado:', typeof calculateCost);

// Função para estimar tokens
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
console.log('[DEBUG] costMonitor.ts - estimateTokens exportado:', typeof estimateTokens);

// Função para estimar custo total
export function estimateCost(inputTokens: number, outputTokens: number = 0): number {
  return calculateCost(inputTokens, outputTokens);
}
console.log('[DEBUG] costMonitor.ts - estimateCost exportado:', typeof estimateCost);

console.log('[DEBUG] costMonitor.ts - Todos os exports configurados');

// Expõe funções de debug no console
if (typeof window !== 'undefined') {
  (window as any).showCostReport = () => costMonitor.showDetailedReport();
  (window as any).resetCostMonitor = () => costMonitor.reset();
}
