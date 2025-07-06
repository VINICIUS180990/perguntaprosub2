/**
 * API Principal - Sistema de Documentos Inteligente
 * Coordena processamento de documentos e consultas do usuário
 */

import { processDocument, validateProcessedDocument } from './documentProcessor';
import { documentCache } from './documentCache';
import { intelligentQuery } from './intelligentQuery';
import type { DocumentProcessingResult } from './documentProcessor';
import type { QueryResponse } from './intelligentQuery';
import type { MessageHistory } from './chat';

/**
 * Interface principal para processar documentos
 */
export async function processDocumentContent(
  documentContent: string,
  documentName: string
): Promise<DocumentProcessingResult> {
  console.log(`[MAIN_API] 🚀 Iniciando processamento completo do documento: ${documentName}`);
  console.log(`[MAIN_API] 📊 Tamanho do documento: ${documentContent.length} caracteres`);
  
  try {
    // Verifica se já está em cache
    if (documentCache.hasDocument(documentContent, documentName)) {
      console.log(`[MAIN_API] ⚡ Documento encontrado no cache, recuperando...`);
      const cachedResult = documentCache.getDocument(documentContent, documentName);
      
      if (cachedResult && validateProcessedDocument(cachedResult)) {
        console.log(`[MAIN_API] ✅ Documento válido recuperado do cache`);
        console.log(`[MAIN_API] 📊 Divisões em cache: ${cachedResult.divisoes.length}`);
        return cachedResult;
      } else {
        console.warn(`[MAIN_API] ⚠️ Documento em cache inválido, reprocessando...`);
      }
    }

    // Processa o documento pela primeira vez
    console.log(`[MAIN_API] 🔄 Processando documento pela primeira vez...`);
    const result = await processDocument(documentContent, documentName);
    
    console.log(`[MAIN_API] ✅ DOCUMENTO PROCESSADO COM SUCESSO:`);
    console.log(`[MAIN_API] ✅ - Divisões criadas: ${result.divisoes.length}`);
    console.log(`[MAIN_API] ✅ - Como foi dividido: ${result.metadados.como_foi_dividido}`);
    
    // Valida resultado
    if (!validateProcessedDocument(result)) {
      console.error(`[MAIN_API] ❌ DOCUMENTO PROCESSADO INVÁLIDO`);
      throw new Error('Documento processado é inválido');
    }
    
    console.log(`[MAIN_API] ✅ Validação do documento: PASSOU`);

    // Armazena no cache
    console.log(`[MAIN_API] 💾 Armazenando resultado no cache...`);
    documentCache.setDocument(documentContent, documentName, result);
    console.log(`[MAIN_API] 💾 ✅ Documento armazenado no cache com sucesso`);
    
    console.log(`[MAIN_API] 🎯 PROCESSAMENTO COMPLETO FINALIZADO`);
    
    console.log(`[MAIN_API] 🎉 Processamento concluído com sucesso!`);
    console.log(`[MAIN_API] 📊 Total de divisões: ${result.divisoes.length}`);
    console.log(`[MAIN_API] 📊 Método de divisão: ${result.metadados.como_foi_dividido}`);
    
    return result;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ Erro durante processamento do documento:`, error);
    throw error;
  }
}

/**
 * Interface principal para processar consultas do usuário
 */
export async function processUserQuery(
  userQuery: string,
  documentContent: string | null,
  documentName: string | null,
  systemPrompt: string,
  messageHistory: MessageHistory[] = []
): Promise<QueryResponse> {
  console.log(`[MAIN_API] 🔍 Processando consulta do usuário: "${userQuery.substring(0, 100)}..."`);
  console.log(`[MAIN_API] 📄 Documento disponível: ${documentContent ? 'SIM' : 'NÃO'}`);
  console.log(`[MAIN_API] 📚 Histórico de mensagens: ${messageHistory.length}`);
  
  try {
    // Se não há documento, processa como consulta simples
    if (!documentContent || !documentName) {
      console.log(`[MAIN_API] 💬 Processando como consulta simples (sem documento)`);
      return await intelligentQuery.processSimpleQuery(userQuery, systemPrompt);
    }

    // Obtém documento processado (cache ou processamento)
    console.log(`[MAIN_API] 📚 Obtendo divisões do documento...`);
    const processedDoc = await processDocumentContent(documentContent, documentName);
    
    console.log(`[MAIN_API] 📚 ✅ DIVISÕES OBTIDAS:`);
    console.log(`[MAIN_API] 📚 - Total de divisões: ${processedDoc.divisoes.length}`);
    processedDoc.divisoes.forEach((div, index) => {
      console.log(`[MAIN_API] 📚 ${index + 1}. "${div.nome}" (${div.conteudo.length} chars)`);
    });
    
    // Processa consulta com documento
    console.log(`[MAIN_API] 🧠 Processando consulta inteligente com documento...`);
    console.log(`[MAIN_API] 🧠 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    console.log(`[MAIN_API] 🧠 - Divisões disponíveis: ${processedDoc.divisoes.length}`);
    
    const response = await intelligentQuery.processQuery(
      userQuery,
      processedDoc.divisoes,
      systemPrompt
    );
    
    console.log(`[MAIN_API] ✅ CONSULTA PROCESSADA COM SUCESSO:`);
    console.log(`[MAIN_API] ✅ - Resposta length: ${response.answer.length} chars`);
    console.log(`[MAIN_API] ✅ - Custo total: $${response.totalCost.toFixed(6)}`);
    console.log(`[MAIN_API] ✅ - Tempo de processamento: ${response.processingTime}ms`);
    console.log(`[MAIN_API] ✅ - Seções utilizadas: ${response.sectionsUsed.length}/${processedDoc.divisoes.length}`);
    
    // Log das seções utilizadas
    if (response.sectionsUsed.length > 0) {
      console.log(`[MAIN_API] 🎯 SEÇÕES SELECIONADAS:`);
      response.sectionsUsed.forEach((sectionName, index) => {
        console.log(`[MAIN_API] 🎯 ${index + 1}. "${sectionName}"`);
      });
    }
    
    return response;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ Erro durante processamento da consulta:`, error);
    throw error;
  }
}

/**
 * Função específica para LandingPage
 */
export async function processLandingPageQuery(
  userQuery: string,
  documentContent: string | null,
  documentName: string | null,
  systemPrompt: string,
  messageHistory: MessageHistory[] = []
): Promise<string> {
  console.log(`[MAIN_API] 🏠 Processando consulta da LandingPage`);
  
  try {
    const response = await processUserQuery(
      userQuery,
      documentContent,
      documentName,
      systemPrompt,
      messageHistory
    );
    
    console.log(`[MAIN_API] ✅ LandingPage - Resposta gerada com sucesso`);
    return response.answer;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ LandingPage - Erro:`, error);
    throw error;
  }
}

/**
 * Função específica para MainPage
 */
export async function processMainPageQuery(
  userQuery: string,
  documentContent: string | null,
  documentName: string | null,
  systemPrompt: string,
  messageHistory: MessageHistory[] = []
): Promise<string> {
  console.log(`[MAIN_API] 🏢 Processando consulta da MainPage`);
  
  try {
    const response = await processUserQuery(
      userQuery,
      documentContent,
      documentName,
      systemPrompt,
      messageHistory
    );
    
    console.log(`[MAIN_API] ✅ MainPage - Resposta gerada com sucesso`);
    return response.answer;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ MainPage - Erro:`, error);
    throw error;
  }
}

/**
 * Função para pré-carregar um documento (otimização)
 */
export async function preloadDocument(
  documentContent: string,
  documentName: string
): Promise<boolean> {
  console.log(`[MAIN_API] ⚡ Pré-carregando documento: ${documentName}`);
  
  try {
    await processDocumentContent(documentContent, documentName);
    console.log(`[MAIN_API] ✅ Documento pré-carregado com sucesso`);
    return true;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ Erro ao pré-carregar documento:`, error);
    return false;
  }
}

/**
 * Função para obter estatísticas do sistema
 */
export function getSystemStats(): {
  cache: any;
  queries: any;
  costs: any;
} {
  console.log(`[MAIN_API] 📊 Obtendo estatísticas do sistema...`);
  
  const stats = {
    cache: documentCache.getStats(),
    queries: intelligentQuery.getStats(),
    costs: {
      // Adicionar estatísticas de custo se necessário
    }
  };
  
  console.log(`[MAIN_API] 📊 Estatísticas:`, stats);
  return stats;
}

/**
 * Função para limpar cache do sistema
 */
export function clearSystemCache(): void {
  console.log(`[MAIN_API] 🧹 Limpando cache do sistema...`);
  
  documentCache.clear();
  intelligentQuery.resetStats();
  
  console.log(`[MAIN_API] ✅ Cache do sistema limpo`);
}

/**
 * Função para verificar saúde do sistema
 */
export function checkSystemHealth(): {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: any;
} {
  console.log(`[MAIN_API] 🏥 Verificando saúde do sistema...`);
  
  try {
    const cacheStats = documentCache.getStats();
    const queryStats = intelligentQuery.getStats();
    
    // Verificações básicas
    const checks = {
      cacheWorking: cacheStats.totalDocuments >= 0,
      queryWorking: queryStats.totalQueries >= 0,
      memoryUsage: cacheStats.totalDocuments < 50 // Limite arbitrário
    };
    
    const allHealthy = Object.values(checks).every(check => check);
    
    const result = {
      status: allHealthy ? 'healthy' as const : 'warning' as const,
      message: allHealthy ? 'Sistema funcionando normalmente' : 'Sistema com avisos',
      details: {
        checks,
        cache: cacheStats,
        queries: queryStats
      }
    };
    
    console.log(`[MAIN_API] 🏥 Status do sistema: ${result.status}`);
    return result;
    
  } catch (error) {
    console.error(`[MAIN_API] ❌ Erro ao verificar saúde do sistema:`, error);
    return {
      status: 'error',
      message: `Erro ao verificar sistema: ${error}`,
      details: { error }
    };
  }
}

// Expõe funções de debug globalmente
if (typeof window !== 'undefined') {
  (window as any).perguntaProSubAPI = {
    stats: getSystemStats,
    clear: clearSystemCache,
    health: checkSystemHealth,
    preload: preloadDocument
  };
}
