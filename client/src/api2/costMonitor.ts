/**
 * MONITOR DE CUSTOS - API2
 * Monitora e registra custos de API com alertas
 */

import { COST_CONFIG, DEBUG_CONFIG } from './config';
import { logger } from './utils';

const PREFIX = DEBUG_CONFIG.PREFIXES.COST;

logger.info(PREFIX, 'Inicializando monitor de custos...');

export interface CostEntry {
  id: string;
  timestamp: number;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  description: string;
}

export interface CostSummary {
  totalOperations: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageCostPerOperation: number;
  costByOperation: Record<string, number>;
  dailyCost: number;
  remainingBudget: number;
}

export class CostMonitor {
  private entries: CostEntry[] = [];
  private dailyReset: number = 0;
  
  constructor() {
    logger.debug(PREFIX, 'Configurando monitor...');
    logger.debug(PREFIX, `Budget diário: $${COST_CONFIG.DAILY_BUDGET}`);
    logger.debug(PREFIX, `Alerta em: ${COST_CONFIG.WARNING_THRESHOLD * 100}% do budget`);
    
    this.resetDailyIfNeeded();
    
    logger.success(PREFIX, 'Monitor de custos inicializado');
  }
  
  /**
   * Registra uma operação e seu custo
   */
  logOperation(
    operation: string,
    inputTokens: number,
    outputTokens: number,
    description: string = ''
  ): number {
    const cost = this.calculateCost(inputTokens, outputTokens);
    
    const entry: CostEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      operation,
      inputTokens,
      outputTokens,
      cost,
      description
    };
    
    this.entries.push(entry);
    
    // Log detalhado
    logger.info(PREFIX, `Operação registrada: ${operation}`);
    logger.debug(PREFIX, `- Input tokens: ${inputTokens}`);
    logger.debug(PREFIX, `- Output tokens: ${outputTokens}`);
    logger.debug(PREFIX, `- Custo: $${cost.toFixed(6)}`);
    logger.debug(PREFIX, `- Descrição: ${description}`);
    
    // Verificar alertas
    this.checkBudgetAlert();
    
    // Limpeza automática (manter apenas últimos 1000 registros)
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-1000);
      logger.debug(PREFIX, 'Limpeza automática: mantendo últimos 1000 registros');
    }
    
    return cost;
  }
  
  /**
   * Calcula custo baseado em tokens
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * COST_CONFIG.INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1000) * COST_CONFIG.OUTPUT_COST_PER_1K;
    return inputCost + outputCost;
  }
  
  /**
   * Obtém resumo de custos
   */
  getSummary(): CostSummary {
    this.resetDailyIfNeeded();
    
    const today = new Date().toDateString();
    const todayEntries = this.entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
    
    const totalCost = this.entries.reduce((acc, entry) => acc + entry.cost, 0);
    const dailyCost = todayEntries.reduce((acc, entry) => acc + entry.cost, 0);
    
    const totalInputTokens = this.entries.reduce((acc, entry) => acc + entry.inputTokens, 0);
    const totalOutputTokens = this.entries.reduce((acc, entry) => acc + entry.outputTokens, 0);
    
    // Agrupar por operação
    const costByOperation: Record<string, number> = {};
    this.entries.forEach(entry => {
      costByOperation[entry.operation] = (costByOperation[entry.operation] || 0) + entry.cost;
    });
    
    const summary: CostSummary = {
      totalOperations: this.entries.length,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      averageCostPerOperation: this.entries.length > 0 ? totalCost / this.entries.length : 0,
      costByOperation,
      dailyCost,
      remainingBudget: Math.max(0, COST_CONFIG.DAILY_BUDGET - dailyCost)
    };
    
    logger.debug(PREFIX, 'Resumo de custos calculado:', summary);
    
    return summary;
  }
  
  /**
   * Obtém custos do dia atual
   */
  getDailyCosts(): CostEntry[] {
    const today = new Date().toDateString();
    const dailyEntries = this.entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
    
    logger.debug(PREFIX, `Registros do dia: ${dailyEntries.length}`);
    
    return dailyEntries;
  }
  
  /**
   * Obtém últimas operações
   */
  getRecentOperations(limit: number = 10): CostEntry[] {
    const recent = this.entries.slice(-limit).reverse();
    
    logger.debug(PREFIX, `Últimas ${recent.length} operações`);
    
    return recent;
  }
  
  /**
   * Verifica se está próximo do limite de budget
   */
  private checkBudgetAlert(): void {
    const summary = this.getSummary();
    const usagePercentage = summary.dailyCost / COST_CONFIG.DAILY_BUDGET;
    
    if (usagePercentage >= COST_CONFIG.WARNING_THRESHOLD) {
      logger.warn(PREFIX, `⚠️  ALERTA DE BUDGET: ${(usagePercentage * 100).toFixed(1)}% usado hoje`);
      logger.warn(PREFIX, `💰 Gasto hoje: $${summary.dailyCost.toFixed(4)} / $${COST_CONFIG.DAILY_BUDGET}`);
      
      if (usagePercentage >= 1.0) {
        logger.error(PREFIX, '🚨 BUDGET DIÁRIO EXCEDIDO! 🚨');
      }
    }
  }
  
  /**
   * Reset diário automático
   */
  private resetDailyIfNeeded(): void {
    const today = new Date().toDateString();
    const resetDate = new Date(this.dailyReset).toDateString();
    
    if (today !== resetDate) {
      logger.info(PREFIX, 'Novo dia detectado - reset de budget');
      this.dailyReset = Date.now();
      
      // Log do reset
      const previousDayCost = this.entries
        .filter(entry => new Date(entry.timestamp).toDateString() === resetDate)
        .reduce((acc, entry) => acc + entry.cost, 0);
      
      if (previousDayCost > 0) {
        logger.info(PREFIX, `Custo do dia anterior: $${previousDayCost.toFixed(4)}`);
      }
    }
  }
  
  /**
   * Exporta dados para análise
   */
  exportData(): {
    summary: CostSummary;
    entries: CostEntry[];
    exportTime: string;
  } {
    logger.debug(PREFIX, 'Exportando dados de custo...');
    
    return {
      summary: this.getSummary(),
      entries: this.entries,
      exportTime: new Date().toISOString()
    };
  }
  
  /**
   * Limpa histórico antigo
   */
  cleanOldEntries(daysToKeep: number = 30): number {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const beforeCount = this.entries.length;
    
    this.entries = this.entries.filter(entry => entry.timestamp >= cutoffTime);
    
    const removed = beforeCount - this.entries.length;
    
    if (removed > 0) {
      logger.info(PREFIX, `Limpeza de histórico: ${removed} registros antigos removidos`);
    }
    
    return removed;
  }
  
  /**
   * Estatísticas detalhadas
   */
  getDetailedStats(): {
    hourlyDistribution: Record<string, number>;
    operationStats: Record<string, {count: number, totalCost: number, avgCost: number}>;
    tokenEfficiency: {
      avgInputTokens: number;
      avgOutputTokens: number;
      costPerInputToken: number;
      costPerOutputToken: number;
    };
  } {
    logger.debug(PREFIX, 'Calculando estatísticas detalhadas...');
    
    // Distribuição por hora
    const hourlyDistribution: Record<string, number> = {};
    this.entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + entry.cost;
    });
    
    // Estatísticas por operação
    const operationStats: Record<string, {count: number, totalCost: number, avgCost: number}> = {};
    this.entries.forEach(entry => {
      if (!operationStats[entry.operation]) {
        operationStats[entry.operation] = {count: 0, totalCost: 0, avgCost: 0};
      }
      operationStats[entry.operation].count++;
      operationStats[entry.operation].totalCost += entry.cost;
    });
    
    Object.keys(operationStats).forEach(op => {
      operationStats[op].avgCost = operationStats[op].totalCost / operationStats[op].count;
    });
    
    // Eficiência de tokens
    const totalInputTokens = this.entries.reduce((acc, entry) => acc + entry.inputTokens, 0);
    const totalOutputTokens = this.entries.reduce((acc, entry) => acc + entry.outputTokens, 0);
    const totalCost = this.entries.reduce((acc, entry) => acc + entry.cost, 0);
    
    const tokenEfficiency = {
      avgInputTokens: this.entries.length > 0 ? totalInputTokens / this.entries.length : 0,
      avgOutputTokens: this.entries.length > 0 ? totalOutputTokens / this.entries.length : 0,
      costPerInputToken: totalInputTokens > 0 ? totalCost / totalInputTokens : 0,
      costPerOutputToken: totalOutputTokens > 0 ? totalCost / totalOutputTokens : 0,
    };
    
    return {
      hourlyDistribution,
      operationStats,
      tokenEfficiency
    };
  }
  
  /**
   * Log de status atual
   */
  logStatus(): void {
    const summary = this.getSummary();
    
    logger.info(PREFIX, '📊 STATUS DO MONITOR DE CUSTOS:');
    logger.info(PREFIX, `💰 Custo total: $${summary.totalCost.toFixed(4)}`);
    logger.info(PREFIX, `📅 Custo hoje: $${summary.dailyCost.toFixed(4)} / $${COST_CONFIG.DAILY_BUDGET}`);
    logger.info(PREFIX, `🔢 Operações: ${summary.totalOperations}`);
    logger.info(PREFIX, `📈 Média por operação: $${summary.averageCostPerOperation.toFixed(6)}`);
    logger.info(PREFIX, `🎯 Budget restante: $${summary.remainingBudget.toFixed(4)}`);
  }
}

// Instância global
export const costMonitor = new CostMonitor();

logger.success(PREFIX, 'Monitor de custos carregado com sucesso');
