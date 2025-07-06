// DEBUG: Teste direto do costMonitor
console.log('[DEBUG] testCostMonitor.ts - Iniciando teste');

try {
  // Teste direto da importação
  import('./costMonitor').then(module => {
    console.log('[DEBUG] testCostMonitor.ts - Módulo costMonitor carregado:', module);
    console.log('[DEBUG] testCostMonitor.ts - costMonitor presente:', !!module.costMonitor);
    console.log('[DEBUG] testCostMonitor.ts - estimateTokens presente:', !!module.estimateTokens);
    console.log('[DEBUG] testCostMonitor.ts - estimateCost presente:', !!module.estimateCost);
    console.log('[DEBUG] testCostMonitor.ts - calculateCost presente:', !!module.calculateCost);
    console.log('[DEBUG] testCostMonitor.ts - formatCost presente:', !!module.formatCost);
    
    // Listar todas as exports disponíveis
    console.log('[DEBUG] testCostMonitor.ts - Todas as exports:', Object.keys(module));
  }).catch(error => {
    console.error('[DEBUG] testCostMonitor.ts - Erro ao importar costMonitor:', error);
  });
} catch (error) {
  console.error('[DEBUG] testCostMonitor.ts - Erro no teste:', error);
}

export default {};
