/**
 * Exemplo de uso das otimizações de custo da API
 * 
 * Este arquivo demonstra como usar as novas funcionalidades para reduzir custos.
 * Execute no console do navegador para ver as funcionalidades em ação.
 */

import { 
  costMonitor, 
  apiCache, 
  estimateTokens, 
  estimateCost, 
  preprocessDocument,
  getProcessingPriority 
} from '../api';

// 1. Monitorando Custos em Tempo Real
export function demonstrateCostMonitoring() {
  console.log('📊 DEMONSTRAÇÃO DO MONITOR DE CUSTOS');
  console.log('═══════════════════════════════════════');
  
  // Simula algumas chamadas da API
  costMonitor.logCall(1000, 100, 0.004, 'MainPage', false);
  costMonitor.logCall(800, 80, 0.003, 'LandingPage', false);
  costMonitor.logCall(1200, 120, 0.000, 'MainPage', true); // Cache hit
  
  // Exibe relatório
  costMonitor.printReport();
}

// 2. Demonstrando Cache
export function demonstrateCache() {
  console.log('⚡ DEMONSTRAÇÃO DO CACHE');
  console.log('═══════════════════════════');
  
  const documento = "Este é um documento de exemplo sobre normas militares...";
  const pergunta = "O que diz sobre uniformes?";
  
  // Primeira chamada - não há cache
  const cached1 = apiCache.get(documento, pergunta);
  console.log('Primeira busca no cache:', cached1 ? 'HIT' : 'MISS');
  
  // Salva no cache
  apiCache.set(documento, pergunta, "Resposta sobre uniformes...");
  
  // Segunda chamada - deve ter cache
  const cached2 = apiCache.get(documento, pergunta);
  console.log('Segunda busca no cache:', cached2 ? 'HIT' : 'MISS');
  console.log('Resposta do cache:', cached2);
}

// 3. Demonstrando Pré-processamento
export function demonstratePreprocessing() {
  console.log('🔄 DEMONSTRAÇÃO DO PRÉ-PROCESSAMENTO');
  console.log('═════════════════════════════════════');
  
  const documentoGrande = `
  Este é um documento muito longo sobre regulamentos militares.
  Contém muitas informações sobre diferentes tópicos como uniformes,
  procedimentos, hierarquia, disciplina, e muitos outros assuntos.
  O documento tem milhares de palavras e seria muito caro para processar
  inteiramente a cada consulta. Por isso, usamos técnicas de otimização
  para reduzir os custos sem perder a qualidade das respostas.
  `.repeat(100); // Simula documento muito grande
  
  const pergunta = "O que diz sobre uniformes?";
  
  console.log(`Documento original: ${estimateTokens(documentoGrande)} tokens`);
  console.log(`Custo estimado original: $${estimateCost(estimateTokens(documentoGrande)).toFixed(6)}`);
  
  // Otimiza o documento
  const options = getProcessingPriority(pergunta);
  const documentoOtimizado = preprocessDocument(documentoGrande, pergunta, options);
  
  console.log(`Documento otimizado: ${estimateTokens(documentoOtimizado)} tokens`);
  console.log(`Custo estimado otimizado: $${estimateCost(estimateTokens(documentoOtimizado)).toFixed(6)}`);
  
  const economia = estimateCost(estimateTokens(documentoGrande)) - estimateCost(estimateTokens(documentoOtimizado));
  console.log(`💰 Economia: $${economia.toFixed(6)} (${((economia / estimateCost(estimateTokens(documentoGrande))) * 100).toFixed(1)}%)`);
}

// 4. Função para executar todas as demonstrações
export function runAllDemonstrations() {
  demonstrateCostMonitoring();
  demonstrateCache();
  demonstratePreprocessing();
  
  console.log('\n🎉 DEMONSTRAÇÕES CONCLUÍDAS!');
  console.log('Para usar essas funcionalidades no seu código:');
  console.log('1. O cache funciona automaticamente');
  console.log('2. O pré-processamento é aplicado automaticamente');
  console.log('3. O monitor de custos registra todas as chamadas');
  console.log('4. Use costMonitor.printReport() para ver estatísticas');
}

// Para usar no console do navegador:
// import { runAllDemonstrations } from './utils/costOptimizationDemo';
// runAllDemonstrations();
