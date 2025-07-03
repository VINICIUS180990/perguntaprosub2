/**
 * Sistema de debug para monitorar o processamento de chunks e contexto
 */

export interface DebugInfo {
  originalTokens: number;
  processedTokens: number;
  chunksCreated: number;
  chunksSelected: number;
  selectedChunkIds: string[];
  relevanceScores: number[];
  processingStrategy: string;
  query: string;
  timestamp: Date;
}

class DebugMonitor {
  private debugHistory: DebugInfo[] = [];
  private isEnabled: boolean = true;

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  log(info: DebugInfo) {
    if (!this.isEnabled) return;
    
    this.debugHistory.push(info);
    
    // Mantém apenas os últimos 50 registros
    if (this.debugHistory.length > 50) {
      this.debugHistory = this.debugHistory.slice(-50);
    }
    
    // Log detalhado no console
    console.group(`[CHUNK DEBUG] ${info.timestamp.toLocaleTimeString()}`);
    console.log(`Query: "${info.query}"`);
    console.log(`Estratégia: ${info.processingStrategy}`);
    console.log(`Tokens: ${info.originalTokens} → ${info.processedTokens} (${((info.processedTokens/info.originalTokens)*100).toFixed(1)}%)`);
    console.log(`Chunks: ${info.chunksCreated} criados, ${info.chunksSelected} selecionados`);
    console.log(`IDs selecionados: [${info.selectedChunkIds.join(', ')}]`);
    console.log(`Pontuações de relevância: [${info.relevanceScores.map(s => s.toFixed(2)).join(', ')}]`);
    console.groupEnd();
  }

  getHistory(): DebugInfo[] {
    return [...this.debugHistory];
  }

  getLastDebugInfo(): DebugInfo | null {
    return this.debugHistory.length > 0 ? this.debugHistory[this.debugHistory.length - 1] : null;
  }

  exportDebugReport(): string {
    const report = this.debugHistory.map(info => ({
      timestamp: info.timestamp.toISOString(),
      query: info.query,
      strategy: info.processingStrategy,
      compression: `${info.originalTokens} → ${info.processedTokens}`,
      chunks: `${info.chunksSelected}/${info.chunksCreated}`,
      avgRelevance: info.relevanceScores.length > 0 ? 
        (info.relevanceScores.reduce((a, b) => a + b, 0) / info.relevanceScores.length).toFixed(2) : '0'
    }));

    return JSON.stringify(report, null, 2);
  }

  analyzePerfomance(): {
    avgCompressionRatio: number;
    avgChunkSelection: number;
    avgRelevanceScore: number;
    strategiesUsed: Record<string, number>;
  } {
    if (this.debugHistory.length === 0) {
      return {
        avgCompressionRatio: 0,
        avgChunkSelection: 0,
        avgRelevanceScore: 0,
        strategiesUsed: {}
      };
    }

    const compressionRatios = this.debugHistory.map(info => info.processedTokens / info.originalTokens);
    const chunkSelectionRatios = this.debugHistory.map(info => 
      info.chunksCreated > 0 ? info.chunksSelected / info.chunksCreated : 0
    );
    const allRelevanceScores = this.debugHistory.flatMap(info => info.relevanceScores);
    
    const strategiesUsed: Record<string, number> = {};
    this.debugHistory.forEach(info => {
      strategiesUsed[info.processingStrategy] = (strategiesUsed[info.processingStrategy] || 0) + 1;
    });

    return {
      avgCompressionRatio: compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length,
      avgChunkSelection: chunkSelectionRatios.reduce((a, b) => a + b, 0) / chunkSelectionRatios.length,
      avgRelevanceScore: allRelevanceScores.length > 0 ? 
        allRelevanceScores.reduce((a, b) => a + b, 0) / allRelevanceScores.length : 0,
      strategiesUsed
    };
  }
}

export const debugMonitor = new DebugMonitor();

/**
 * Função utilitária para criar informações de debug
 */
export function createDebugInfo(
  originalTokens: number,
  processedTokens: number,
  chunksCreated: number,
  chunksSelected: number,
  selectedChunkIds: string[],
  relevanceScores: number[],
  processingStrategy: string,
  query: string
): DebugInfo {
  return {
    originalTokens,
    processedTokens,
    chunksCreated,
    chunksSelected,
    selectedChunkIds,
    relevanceScores,
    processingStrategy,
    query,
    timestamp: new Date()
  };
}

/**
 * Hook para debugging que pode ser usado em desenvolvimento
 */
export function useChunkDebug() {
  return {
    getHistory: () => debugMonitor.getHistory(),
    getLastInfo: () => debugMonitor.getLastDebugInfo(),
    exportReport: () => debugMonitor.exportDebugReport(),
    analyzePerformance: () => debugMonitor.analyzePerfomance(),
    enable: () => debugMonitor.enable(),
    disable: () => debugMonitor.disable()
  };
}
