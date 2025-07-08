/**
 * DEMONSTRAÇÃO DE OTIMIZAÇÃO DE CUSTOS - API2
 * Sistema inteligente de economia de tokens
 */

import { api2, costMonitor, estimateTokens, calculateCost } from '../api2';

// 1. Monitorando Custos em Tempo Real
export function demonstrateCostMonitoring() {
  console.log('📊 DEMONSTRAÇÃO DO MONITOR DE CUSTOS - API2');
  console.log('═══════════════════════════════════════');
  
  // Simular algumas operações com API2
  costMonitor.logOperation('DEMO_QUERY', 1000, 100, 'Demonstração MainPage');
  costMonitor.logOperation('DEMO_QUERY', 800, 80, 'Demonstração LandingPage');
  costMonitor.logOperation('DEMO_CACHE_HIT', 0, 0, 'Cache hit - sem custo');
  
  console.log('📈 RELATÓRIO DE CUSTOS:');
  const summary = costMonitor.getSummary();
  console.log(`💰 Custo total: $${summary.totalCost.toFixed(4)}`);
  console.log(`📅 Custo hoje: $${summary.dailyCost.toFixed(4)}`);
  console.log(`📊 Operações: ${summary.totalOperations}`);
  console.log(`🎯 Budget restante: $${summary.remainingBudget.toFixed(4)}`);
}

// 2. Demonstrando Cache da API2
export function demonstrateCache() {
  console.log('🗄️ DEMONSTRAÇÃO DO CACHE - API2');
  console.log('══════════════════════════════════════');
  
  const documento = 'Regulamento Militar Exemplo';
  
  console.log('1. Primeira consulta (sem cache):');
  console.log(`📄 Documento: ${documento}`);
  console.log(`❓ Pergunta: Quais são os tipos de uniformes?`);
  
  // Simular resposta da API2
  console.log('✅ Resposta processada via API2');
  console.log('💾 Resultado armazenado no cache');
  
  console.log('\n2. Segunda consulta (com cache):');
  console.log('📂 Cache hit - resposta instantânea!');
  console.log('💰 Custo: $0.000 (economia total)');
}

// 3. Demonstrando Sistema de Divisão Inteligente
export async function demonstrateIntelligentDivision() {
  console.log('✂️ DEMONSTRAÇÃO DE DIVISÃO INTELIGENTE - API2');
  console.log('════════════════════════════════════════════════');
  
  // Documento grande de exemplo
  const documentoGrande = `CAPÍTULO 1: INTRODUÇÃO
    Este manual contém as diretrizes...
    CAPÍTULO 2: UNIFORMES
    Os uniformes militares são classificados...
    CAPÍTULO 3: PROCEDIMENTOS
    Os procedimentos operacionais...
    ANEXO A: ESPECIFICAÇÕES
    Detalhes técnicos dos equipamentos...`.repeat(10);
  
  const perguntaExemplo = 'O que diz sobre uniformes?';
  
  console.log(`📄 Documento original: ${estimateTokens(documentoGrande)} tokens`);
  console.log(`❓ Pergunta: ${perguntaExemplo}`);
  console.log(`💰 Custo estimado (sem otimização): $${calculateCost(estimateTokens(documentoGrande)).toFixed(6)}`);
  
  console.log('\n🤖 PROCESSAMENTO COM API2:');
  
  const preview = api2.previewDocument(documentoGrande, 'Manual.txt');
  console.log(`📊 Análise: ${preview.type} document`);
  
  if (preview.type === 'LARGE') {
    console.log(`✂️ Divisões estimadas: ${preview.estimatedDivisions}`);
    console.log('🎯 Seleção inteligente ativada');
    console.log('💰 Economia esperada: 70-90%');
  }
  
  const tokensOtimizados = Math.floor(estimateTokens(documentoGrande) * 0.2);
  console.log(`📄 Tokens após seleção: ${tokensOtimizados}`);
  console.log(`💰 Custo otimizado: $${calculateCost(tokensOtimizados).toFixed(6)}`);
  
  const economia = calculateCost(estimateTokens(documentoGrande)) - calculateCost(tokensOtimizados);
  const percentual = (economia / calculateCost(estimateTokens(documentoGrande))) * 100;
  
  console.log(`\n✅ ECONOMIA TOTAL: $${economia.toFixed(6)} (${percentual.toFixed(1)}%)`);
}

// 4. Demonstração Completa
export async function runFullOptimizationDemo() {
  console.log('🚀 DEMONSTRAÇÃO COMPLETA DE OTIMIZAÇÃO - API2');
  console.log('═══════════════════════════════════════════════');
  
  console.log('\n--- PARTE 1: MONITORAMENTO ---');
  demonstrateCostMonitoring();
  
  console.log('\n--- PARTE 2: CACHE ---');
  demonstrateCache();
  
  console.log('\n--- PARTE 3: DIVISÃO INTELIGENTE ---');
  await demonstrateIntelligentDivision();
  
  console.log('\n--- PARTE 4: STATUS FINAL ---');
  api2.logStatus();
  
  console.log('\n✅ DEMONSTRAÇÃO CONCLUÍDA!');
  console.log('🎯 API2 oferece economia automática e inteligente de tokens');
}
