/**
 * NEW MAIN API - Coordenador principal do novo sistema
 * Interface única para todo o fluxo de economia de tokens
 */

import { fastQueryProcessor } from './fastQueryProcessor';
import { localDocumentCache } from './localDocumentCache';
import { localDocumentDivider } from './localDocumentDivider';
import { costMonitor } from './costMonitor';
import type { FastQueryResponse } from './fastQueryProcessor';

/**
 * Interface principal do novo sistema
 */
export class NewMainAPI {
  
  /**
   * Processar consulta da LandingPage
   */
  async processLandingPageQuery(
    userQuery: string,
    documentContent: string | null,
    documentName: string | null
  ): Promise<string> {
    console.log(`[NEW_MAIN_API] 🏠 PROCESSANDO CONSULTA DA LANDING PAGE (RÁPIDA):`);
    console.log(`[NEW_MAIN_API] 🏠 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    console.log(`[NEW_MAIN_API] 🏠 - Documento: ${documentName || 'NENHUM'}`);
    
    try {
      let response: FastQueryResponse;
      
      if (documentContent && documentName) {
        console.log(`[NEW_MAIN_API] 🏠 📄 Processamento RÁPIDO COM documento...`);
        response = await fastQueryProcessor.processQueryWithDocument(
          userQuery,
          documentContent,
          documentName
        );
      } else {
        console.log(`[NEW_MAIN_API] 🏠 💬 Processamento RÁPIDO SEM documento...`);
        response = await fastQueryProcessor.processQueryWithDocument(
          userQuery,
          '',
          ''
        );
      }
      
      console.log(`[NEW_MAIN_API] 🏠 ✅ CONSULTA RÁPIDA CONCLUÍDA:`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Resposta: ${response.answer.length} chars`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Seções usadas: ${response.sectionsUsed.length}`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Custo: $${response.totalCost.toFixed(6)}`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Tempo: ${response.processingTime}ms`);
      
      return response.answer;
      
    } catch (error) {
      console.error(`[NEW_MAIN_API] 🏠 ❌ Erro na consulta da LandingPage:`, error);
      throw error;
    }
  }

  /**
   * Processar consulta da MainPage
   */
  async processMainPageQuery(
    userQuery: string,
    documentContent: string | null,
    documentName: string | null,
    messageHistory: any[] = []
  ): Promise<string> {
    console.log(`[NEW_MAIN_API] 🏠 PROCESSANDO CONSULTA DA MAIN PAGE (RÁPIDA):`);
    console.log(`[NEW_MAIN_API] 🏠 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    console.log(`[NEW_MAIN_API] 🏠 - Documento: ${documentName || 'NENHUM'}`);
    console.log(`[NEW_MAIN_API] 🏠 - Histórico: ${messageHistory.length} mensagens`);
    
    try {
      let response: FastQueryResponse;
      
      if (documentContent && documentName) {
        console.log(`[NEW_MAIN_API] 🏠 📄 Processamento RÁPIDO COM documento...`);
        response = await fastQueryProcessor.processQueryWithDocument(
          userQuery,
          documentContent,
          documentName
        );
      } else {
        console.log(`[NEW_MAIN_API] 🏠 💬 Processamento RÁPIDO SEM documento...`);
        response = await fastQueryProcessor.processQueryWithDocument(
          userQuery,
          '',
          ''
        );
      }
      
      console.log(`[NEW_MAIN_API] 🏠 ✅ CONSULTA RÁPIDA CONCLUÍDA:`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Resposta: ${response.answer.length} chars`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Seções usadas: ${response.sectionsUsed.length}`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Custo: $${response.totalCost.toFixed(6)}`);
      console.log(`[NEW_MAIN_API] 🏠 ✅ - Tempo: ${response.processingTime}ms`);
      
      return response.answer;
      
    } catch (error) {
      console.error(`[NEW_MAIN_API] 🏠 ❌ Erro na consulta da MainPage:`, error);
      throw error;
    }
  }

  /**
   * Pré-processar documento (quando usuário anexa) - VERSÃO RÁPIDA
   */
  async preProcessDocument(documentContent: string, documentName: string): Promise<boolean> {
    console.log(`[NEW_MAIN_API] 📎 PRÉ-PROCESSAMENTO RÁPIDO:`);
    console.log(`[NEW_MAIN_API] 📎 - Nome: ${documentName}`);
    console.log(`[NEW_MAIN_API] 📎 - Tamanho: ${documentContent.length} chars`);
    
    try {
      // Verificar se já está no cache local
      if (localDocumentCache.hasDocument(documentContent, documentName)) {
        console.log(`[NEW_MAIN_API] 📎 ✅ Documento já está no cache local`);
        return true;
      }
      
      // ✅ NOVO: Divisão LOCAL INSTANTÂNEA
      console.log(`[NEW_MAIN_API] 📎 ⚡ Executando divisão LOCAL INSTANTÂNEA...`);
      const startTime = Date.now();
      
      // Usar o divisor local para processar INSTANTANEAMENTE
      const divisions = localDocumentDivider.divideDocumentLocally(documentContent, documentName);
      
      // Armazenar no cache local
      console.log(`[NEW_MAIN_API] 📎 ⚡ Armazenando no cache local...`);
      localDocumentCache.setDocument(documentContent, documentName, divisions);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`[NEW_MAIN_API] 📎 ✅ PRÉ-PROCESSAMENTO RÁPIDO CONCLUÍDO:`);
      console.log(`[NEW_MAIN_API] 📎 ✅ - Divisões: ${divisions.divisoes.length}`);
      console.log(`[NEW_MAIN_API] 📎 ✅ - Método: ${divisions.como_dividiu}`);
      console.log(`[NEW_MAIN_API] 📎 ✅ - Tempo: ${processingTime}ms (INSTANTÂNEO!)`);
      
      return true;
      
    } catch (error) {
      console.error(`[NEW_MAIN_API] 📎 ❌ Erro no pré-processamento rápido:`, error);
      return false;
    }
  }

  /**
   * Obter estatísticas do sistema rápido
   */
  getSystemStats(): {
    cacheStats: any;
    processorStats: any;
    costStats: any;
  } {
    console.log(`[NEW_MAIN_API] 📊 Obtendo estatísticas do sistema rápido...`);
    
    const cacheStats = localDocumentCache.getCacheStats();
    const processorStats = fastQueryProcessor.getStats();
    const costStats = costMonitor.getSessionStats();
    
    console.log(`[NEW_MAIN_API] 📊 ESTATÍSTICAS DO SISTEMA RÁPIDO:`);
    console.log(`[NEW_MAIN_API] 📊 - Cache local: ${cacheStats.totalEntries} documentos`);
    console.log(`[NEW_MAIN_API] 📊 - Consultas rápidas: ${processorStats.totalQueries}`);
    console.log(`[NEW_MAIN_API] 📊 - Custo total: $${costStats.totalCost.toFixed(6)}`);
    
    return {
      cacheStats,
      processorStats,
      costStats
    };
  }

  /**
   * Limpar cache do sistema rápido
   */
  clearSystemCache(): void {
    console.log(`[NEW_MAIN_API] 🗑️ Limpando cache do sistema rápido...`);
    
    localDocumentCache.clearCache();
    fastQueryProcessor.resetStats();
    costMonitor.reset();
    
    console.log(`[NEW_MAIN_API] 🗑️ ✅ Cache do sistema rápido limpo`);
  }

  /**
   * Verificar saúde do sistema rápido
   */
  checkSystemHealth(): {
    status: 'healthy' | 'warning' | 'error';
    details: string[];
  } {
    console.log(`[NEW_MAIN_API] 🏥 Verificando saúde do sistema rápido...`);
    
    const details: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    try {
      // Verificar cache local
      const cacheStats = localDocumentCache.getCacheStats();
      details.push(`Cache local: ${cacheStats.totalEntries} documentos`);
      
      // Verificar custos
      const costStats = costMonitor.getSessionStats();
      details.push(`Custo total: $${costStats.totalCost.toFixed(6)}`);
      
      // Verificar processador rápido
      const processorStats = fastQueryProcessor.getStats();
      details.push(`Consultas rápidas: ${processorStats.totalQueries}`);
      
      if (costStats.totalCost > 1.0) {
        status = 'warning';
        details.push('⚠️ Custo alto detectado');
      }
      
      console.log(`[NEW_MAIN_API] 🏥 Sistema rápido: ${status.toUpperCase()}`);
      
    } catch (error) {
      status = 'error';
      details.push(`❌ Erro na verificação: ${error}`);
      console.error(`[NEW_MAIN_API] 🏥 Erro na verificação:`, error);
    }
    
    return { status, details };
  }
}

// Instância global
export const newMainAPI = new NewMainAPI();

// Expor funções principais para compatibilidade
export const processLandingPageQuery = (userQuery: string, documentContent: string | null, documentName: string | null) => 
  newMainAPI.processLandingPageQuery(userQuery, documentContent, documentName);

export const processMainPageQuery = (userQuery: string, documentContent: string | null, documentName: string | null, messageHistory: any[] = []) => 
  newMainAPI.processMainPageQuery(userQuery, documentContent, documentName, messageHistory);

export const preProcessDocument = (documentContent: string, documentName: string) => 
  newMainAPI.preProcessDocument(documentContent, documentName);

export const getSystemStats = () => newMainAPI.getSystemStats();

export const clearSystemCache = () => newMainAPI.clearSystemCache();

export const checkSystemHealth = () => newMainAPI.checkSystemHealth();
