/**
 * QUERY PROCESSOR - Processamento das perguntas do usuário
 * Coordena todo o fluxo: seleção de partes → resposta final
 */

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';
import { documentDivider } from './documentDivider';
import { documentCacheNew } from './documentCacheNew';
import { partSelector } from './partSelector';
import type { DocumentDivision, DivisionResult } from './documentDivider';
import type { LocalDivision } from './localDocumentDivider';

export interface QueryResponse {
  answer: string;
  sectionsUsed: string[];
  totalCost: number;
  processingTime: number;
  fromCache: boolean;
}

/**
 * Prompt para resposta final
 */
const FINAL_ANSWER_PROMPT = `Você é o próprio PerguntaProSub, uma IA militar brasileira especializada em regulamentos militares.

CONTEXTO: Você recebeu partes específicas de um documento que foram selecionadas como relevantes para responder a pergunta do usuário.

PERGUNTA DO USUÁRIO:
{USER_QUERY}

PARTES SELECIONADAS DO DOCUMENTO:
{SELECTED_PARTS}

INSTRUÇÕES:
1. **PRECISÃO**: Responda usando EXCLUSIVAMENTE as partes fornecidas
2. **CITAÇÕES**: Mencione seções, artigos e parágrafos específicos
3. **DETALHES**: Inclua procedimentos, prazos e requisitos quando disponíveis
4. **TERMINOLOGIA**: Use linguagem militar adequada
5. **REFERÊNCIAS**: Cite as fontes das informações
6. **NÃO INVENTE**: Nunca crie informações que não estão nas partes fornecidas

FORMATO DE RESPOSTA:
- Resposta direta e objetiva
- Detalhes técnicos quando necessários
- Referências às seções consultadas
- Orientações práticas quando aplicável

RESPONDA:`;

/**
 * Classe responsável pelo processamento completo de consultas
 */
export class QueryProcessor {
  private queryCount = 0;
  private totalCost = 0;

  /**
   * Processa uma consulta completa do usuário com documento
   */
  async processQueryWithDocument(
    userQuery: string,
    documentContent: string,
    documentName: string,
    systemPrompt?: string
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    this.queryCount++;
    
    console.log(`[QUERY_PROCESSOR] 🚀 INICIANDO CONSULTA ${this.queryCount}:`);
    console.log(`[QUERY_PROCESSOR] 🚀 - Pergunta: "${userQuery.substring(0, 150)}..."`);
    console.log(`[QUERY_PROCESSOR] 🚀 - Documento: ${documentName}`);
    console.log(`[QUERY_PROCESSOR] 🚀 - Tamanho do documento: ${documentContent.length} chars`);
    
    try {
      // ETAPA 1: Obter divisões do documento (cache ou processar)
      console.log(`[QUERY_PROCESSOR] 📚 ETAPA 1: Obtendo divisões do documento...`);
      const divisions = await this.getDocumentDivisions(documentContent, documentName);
      
      console.log(`[QUERY_PROCESSOR] 📚 ✅ DIVISÕES OBTIDAS:`);
      console.log(`[QUERY_PROCESSOR] 📚 - Total de divisões: ${divisions.divisoes.length}`);
      console.log(`[QUERY_PROCESSOR] 📚 - Como foi dividido: ${divisions.como_dividiu}`);
      
      // Log detalhado das divisões
      divisions.divisoes.forEach((div, index) => {
        console.log(`[QUERY_PROCESSOR] 📚 ${index + 1}. "${div.nome}" (${div.conteudo.length} chars)`);
      });
      
      // ETAPA 2: Selecionar partes necessárias
      console.log(`[QUERY_PROCESSOR] 🎯 ETAPA 2: Selecionando partes necessárias...`);
      const localDivisions = this.convertToLocalDivisions(divisions.divisoes);
      const selection = await partSelector.selectParts(userQuery, localDivisions);
      
      console.log(`[QUERY_PROCESSOR] 🎯 ✅ SELEÇÃO CONCLUÍDA:`);
      console.log(`[QUERY_PROCESSOR] 🎯 - Partes selecionadas: ${selection.partes_necessarias.length}/${divisions.divisoes.length}`);
      console.log(`[QUERY_PROCESSOR] 🎯 - Reasoning: ${selection.reasoning}`);
      
      // Verificar se alguma parte foi selecionada
      if (selection.partes_necessarias.length === 0) {
        console.log(`[QUERY_PROCESSOR] 🚫 NENHUMA PARTE SELECIONADA - Processando como pergunta geral...`);
        return await this.processGeneralQuery(userQuery, systemPrompt);
      }
      
      // ETAPA 3: Filtrar partes selecionadas
      console.log(`[QUERY_PROCESSOR] 🔍 ETAPA 3: Filtrando partes selecionadas...`);
      const selectedParts = partSelector.filterSelectedParts(localDivisions, selection.partes_necessarias);
      
      console.log(`[QUERY_PROCESSOR] 🔍 ✅ PARTES FILTRADAS:`);
      console.log(`[QUERY_PROCESSOR] 🔍 - Partes encontradas: ${selectedParts.length}`);
      
      let totalSelectedContent = 0;
      selectedParts.forEach((part, index) => {
        console.log(`[QUERY_PROCESSOR] 🔍 ${index + 1}. "${part.nome}" (${part.conteudo.length} chars)`);
        totalSelectedContent += part.conteudo.length;
      });
      
      console.log(`[QUERY_PROCESSOR] 🔍 - Total de conteúdo selecionado: ${totalSelectedContent} chars`);
      console.log(`[QUERY_PROCESSOR] 🔍 - Economia: ${((documentContent.length - totalSelectedContent) / documentContent.length * 100).toFixed(1)}%`);
      
      // ETAPA 4: Gerar resposta final
      console.log(`[QUERY_PROCESSOR] 🤖 ETAPA 4: Gerando resposta final...`);
      const finalAnswer = await this.generateFinalAnswer(userQuery, selectedParts);
      
      const processingTime = Date.now() - startTime;
      
      const response: QueryResponse = {
        answer: finalAnswer,
        sectionsUsed: selectedParts.map(p => p.nome),
        totalCost: this.totalCost,
        processingTime,
        fromCache: false // Será definido na função getDocumentDivisions
      };
      
      console.log(`[QUERY_PROCESSOR] ✅ CONSULTA PROCESSADA COM SUCESSO:`);
      console.log(`[QUERY_PROCESSOR] ✅ - Resposta length: ${finalAnswer.length} chars`);
      console.log(`[QUERY_PROCESSOR] ✅ - Seções utilizadas: ${response.sectionsUsed.length}`);
      console.log(`[QUERY_PROCESSOR] ✅ - Custo total: $${response.totalCost.toFixed(6)}`);
      console.log(`[QUERY_PROCESSOR] ✅ - Tempo total: ${response.processingTime}ms`);
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[QUERY_PROCESSOR] ❌ Erro durante processamento após ${processingTime}ms:`, error);
      
      // Registrar erro
      costMonitor.logOperation(
        'QueryProcessor',
        'ERROR',
        0,
        0,
        `Erro no processamento: ${error}`
      );
      
      throw error;
    }
  }

  /**
   * Obter divisões do documento (cache ou processar)
   */
  private async getDocumentDivisions(documentContent: string, documentName: string): Promise<DivisionResult> {
    console.log(`[QUERY_PROCESSOR] 📋 Verificando cache para documento: ${documentName}`);
    
    // Verificar cache primeiro
    if (documentCacheNew.hasDocument(documentContent, documentName)) {
      console.log(`[QUERY_PROCESSOR] 💾 DOCUMENTO ENCONTRADO NO CACHE`);
      const cachedDivisions = documentCacheNew.getDocument(documentContent, documentName);
      
      if (cachedDivisions) {
        console.log(`[QUERY_PROCESSOR] 💾 ✅ Utilizando divisões do cache`);
        return cachedDivisions;
      }
    }
    
    // Não está no cache, processar documento
    console.log(`[QUERY_PROCESSOR] 🔄 DOCUMENTO NÃO ENCONTRADO NO CACHE - Processando...`);
    const divisions = await documentDivider.divideDocument(documentContent, documentName);
    
    // Armazenar no cache
    console.log(`[QUERY_PROCESSOR] 💾 Armazenando no cache...`);
    documentCacheNew.setDocument(documentContent, documentName, divisions);
    
    return divisions;
  }

  /**
   * Gerar resposta final usando partes selecionadas
   */
  private async generateFinalAnswer(userQuery: string, selectedParts: LocalDivision[]): Promise<string> {
    console.log(`[QUERY_PROCESSOR] 🤖 GERANDO RESPOSTA FINAL:`);
    console.log(`[QUERY_PROCESSOR] 🤖 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    console.log(`[QUERY_PROCESSOR] 🤖 - Partes selecionadas: ${selectedParts.length}`);
    
    // Preparar conteúdo das partes selecionadas
    const selectedContent = selectedParts.map((part) => {
      return `=== ${part.nome} ===\n${part.conteudo}\n`;
    }).join('\n');
    
    console.log(`[QUERY_PROCESSOR] 🤖 - Conteúdo total das partes: ${selectedContent.length} chars`);
    
    // Preparar prompt final
    const fullPrompt = FINAL_ANSWER_PROMPT
      .replace('{USER_QUERY}', userQuery)
      .replace('{SELECTED_PARTS}', selectedContent);
    
    const inputTokens = estimateTokens(fullPrompt);
    console.log(`[QUERY_PROCESSOR] 🤖 💰 Tokens de entrada: ${inputTokens}`);
    console.log(`[QUERY_PROCESSOR] 🤖 💰 Custo estimado: $${estimateCost(inputTokens).toFixed(6)}`);
    
    console.log(`[QUERY_PROCESSOR] 🤖 📤 ENVIANDO PERGUNTA + PARTES PARA API...`);
    
    const apiResponse = await chatWithAI(fullPrompt, []);
    
    console.log(`[QUERY_PROCESSOR] 🤖 📥 RESPOSTA FINAL RECEBIDA:`);
    console.log(`[QUERY_PROCESSOR] 🤖 📥 - Length: ${apiResponse.length} chars`);
    console.log(`[QUERY_PROCESSOR] 🤖 📥 - Preview: ${apiResponse.substring(0, 200)}...`);
    
    // Calcular custos finais
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[QUERY_PROCESSOR] 🤖 💰 Tokens de saída: ${outputTokens}`);
    console.log(`[QUERY_PROCESSOR] 🤖 💰 Custo final: $${totalCost.toFixed(6)}`);
    
    // Registrar custo
    costMonitor.logOperation(
      'QueryProcessor',
      'FINAL_ANSWER',
      inputTokens,
      outputTokens,
      `Resposta final usando ${selectedParts.length} partes`
    );
    
    this.totalCost += totalCost;
    
    return apiResponse;
  }

  /**
   * Processar pergunta geral (sem documento)
   */
  private async processGeneralQuery(userQuery: string, systemPrompt?: string): Promise<QueryResponse> {
    const startTime = Date.now();
    
    console.log(`[QUERY_PROCESSOR] 💬 PROCESSANDO PERGUNTA GERAL (sem documento):`);
    console.log(`[QUERY_PROCESSOR] 💬 - Pergunta: "${userQuery.substring(0, 150)}..."`);
    
    const inputTokens = estimateTokens(userQuery);
    const estimatedCost = estimateCost(inputTokens);
    
    console.log(`[QUERY_PROCESSOR] 💬 💰 Tokens: ${inputTokens}, Custo estimado: $${estimatedCost.toFixed(6)}`);
    
    const prompt = systemPrompt || 'Você é uma IA militar brasileira especializada em regulamentos militares. Responda de forma precisa e objetiva.';
    const apiResponse = await chatWithAI(prompt, [{ autor: 'user', texto: userQuery }]);
    
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[QUERY_PROCESSOR] 💬 📥 Resposta recebida: ${apiResponse.length} chars`);
    console.log(`[QUERY_PROCESSOR] 💬 💰 Custo final: $${totalCost.toFixed(6)}`);
    
    costMonitor.logOperation(
      'QueryProcessor',
      'GENERAL_QUERY',
      inputTokens,
      outputTokens,
      'Pergunta geral sem documento'
    );
    
    const processingTime = Date.now() - startTime;
    
    return {
      answer: apiResponse,
      sectionsUsed: [],
      totalCost,
      processingTime,
      fromCache: false
    };
  }

  /**
   * Obter estatísticas do processador
   */
  getStats(): {
    totalQueries: number;
    totalCost: number;
  } {
    return {
      totalQueries: this.queryCount,
      totalCost: this.totalCost
    };
  }

  /**
   * Resetar estatísticas
   */
  resetStats(): void {
    this.queryCount = 0;
    this.totalCost = 0;
    console.log(`[QUERY_PROCESSOR] 🔄 Estatísticas resetadas`);
  }

  /**
   * Converte DocumentDivision para LocalDivision para compatibilidade
   */
  private convertToLocalDivisions(documentDivisions: DocumentDivision[]): LocalDivision[] {
    return documentDivisions.map((div, index) => ({
      nome: div.nome,
      conteudo: div.conteudo,
      resumo: div.resumo,
      indice: index
    }));
  }
}

// Instância global
export const queryProcessor = new QueryProcessor();
