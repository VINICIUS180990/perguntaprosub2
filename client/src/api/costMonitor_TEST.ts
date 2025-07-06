// Teste simples para verificar exports
export const costMonitor = {
  logOperation: (op: string, phase: string, input: number, output: number, _details: string) => {
    console.log(`[COST] ${op} - ${phase}: ${input}/${output} tokens`);
  },
  showDetailedReport: () => console.log("Relatório de custos"),
  reset: () => console.log("Monitor resetado")
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(inputTokens: number, outputTokens: number = 0): number {
  return (inputTokens * 0.00000125) + (outputTokens * 0.00000375);
}

export function calculateCost(inputTokens: number, outputTokens: number): number {
  return estimateCost(inputTokens, outputTokens);
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(8)}`;
}
