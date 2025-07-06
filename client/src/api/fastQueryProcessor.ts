/**
 * FAST QUERY PROCESSOR - Processador rápido com divisão local
 * Usa divisão local instantânea + API só para seleção e resposta
 */

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';
import { localDocumentDivider } from './localDocumentDivider';
import { localDocumentCache } from './localDocumentCache';
import { partSelector } from './partSelector';
import type { LocalDivision, LocalDivisionResult } from './localDocumentDivider';

export interface FastQueryResponse {
  answer: string;
  sectionsUsed: string[];
  totalCost: number;
  processingTime: number;
  fromCache: boolean;
}

/**
 * Prompt otimizado para resposta final
 */
const FAST_FINAL_ANSWER_PROMPT = `Você é o próprio PerguntaProSub, uma IA militar brasileira especializada em regulamentos militares.

PERGUNTA DO USUÁRIO:
{USER_QUERY}

SEÇÕES SELECIONADAS DO DOCUMENTO:
{SELECTED_PARTS}

INSTRUÇÕES:
1. **PRECISÃO**: Use APENAS as seções fornecidas
2. **CITAÇÕES**: Mencione seções específicas quando relevante
3. **OBJETIVIDADE**: Resposta direta e prática
4. **TERMINOLOGIA MILITAR**: Use linguagem adequada
5. **REFERÊNCIAS**: Cite as fontes das informações

RESPONDA DE FORMA CLARA E OBJETIVA:`;

/**
 * Classe responsável pelo processamento rápido de consultas
 */
export class FastQueryProcessor {
  private queryCount = 0;
  private totalCost = 0;

  /**
   * Processa consulta com documento usando divisão local rápida
   */
  async processQueryWithDocument(
    userQuery: string,
    documentContent: string,
    documentName: string
  ): Promise<FastQueryResponse> {
    const startTime = Date.now();
    this.queryCount++;
    
    console.log(`[FAST_PROCESSOR] 🚀 CONSULTA RÁPIDA ${this.queryCount}:`);
    console.log(`[FAST_PROCESSOR] 🚀 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    console.log(`[FAST_PROCESSOR] 🚀 - Documento: ${documentName}`);
    
    try {
      // ETAPA 1: Obter divisões locais (instantâneo)
      console.log(`[FAST_PROCESSOR] ⚡ ETAPA 1: Obtendo divisões locais...`);
      const divisions = await this.getLocalDivisions(documentContent, documentName);
      
      console.log(`[FAST_PROCESSOR] ⚡ ✅ DIVISÕES LOCAIS OBTIDAS:`);
      console.log(`[FAST_PROCESSOR] ⚡ - Total: ${divisions.divisoes.length}`);
      console.log(`[FAST_PROCESSOR] ⚡ - Método: ${divisions.como_dividiu}`);
      
      // ETAPA 2: Seleção rápida de partes via API
      console.log(`[FAST_PROCESSOR] 🎯 ETAPA 2: Seleção rápida de partes...`);
      const selection = await partSelector.selectParts(userQuery, divisions.divisoes);
      
      console.log(`[FAST_PROCESSOR] 🎯 ✅ SELEÇÃO RÁPIDA:`);
      console.log(`[FAST_PROCESSOR] 🎯 - Partes selecionadas: ${selection.partes_necessarias.length}/${divisions.divisoes.length}`);
      
      // Verificar se precisa de documento
      if (selection.partes_necessarias.length === 0) {
        console.log(`[FAST_PROCESSOR] 💬 Pergunta geral - sem documento necessário`);
        return await this.processGeneralQuery(userQuery);
      }
      
      // ETAPA 3: Filtrar partes selecionadas
      console.log(`[FAST_PROCESSOR] 🔍 ETAPA 3: Filtrando partes...`);
      const selectedParts = partSelector.filterSelectedParts(divisions.divisoes, selection.partes_necessarias);
      
      let totalSelectedContent = 0;
      selectedParts.forEach(part => {
        totalSelectedContent += part.conteudo.length;
      });
      
      const economyPercent = ((documentContent.length - totalSelectedContent) / documentContent.length * 100).toFixed(1);
      
      console.log(`[FAST_PROCESSOR] 🔍 ✅ PARTES FILTRADAS:`);
      console.log(`[FAST_PROCESSOR] 🔍 - Partes usadas: ${selectedParts.length}`);
      console.log(`[FAST_PROCESSOR] 🔍 - Conteúdo selecionado: ${totalSelectedContent} chars (${estimateTokens(selectedParts.map(p => p.conteudo).join(''))} tokens)`);
      console.log(`[FAST_PROCESSOR] 🔍 - ECONOMIA: ${economyPercent}% de tokens!`);
      
      // ETAPA 4: Resposta final rápida
      console.log(`[FAST_PROCESSOR] 🤖 ETAPA 4: Gerando resposta final...`);
      const finalAnswer = await this.generateFastAnswer(userQuery, selectedParts);
      
      const processingTime = Date.now() - startTime;
      
      const response: FastQueryResponse = {
        answer: finalAnswer,
        sectionsUsed: selectedParts.map(p => p.nome),
        totalCost: this.totalCost,
        processingTime,
        fromCache: divisions.timestamp < Date.now() - 60000 // Se criado há mais de 1 min
      };
      
      console.log(`[FAST_PROCESSOR] ✅ CONSULTA RÁPIDA CONCLUÍDA:`);
      console.log(`[FAST_PROCESSOR] ✅ - Resposta: ${finalAnswer.length} chars (${estimateTokens(finalAnswer)} tokens)`);
      console.log(`[FAST_PROCESSOR] ✅ - Economia: ${economyPercent}%`);
      console.log(`[FAST_PROCESSOR] ✅ - Custo: $${response.totalCost.toFixed(6)}`);
      console.log(`[FAST_PROCESSOR] ✅ - Tempo: ${response.processingTime}ms`);
      
      // ✅ DISPLAY CHAMATIVO DO CUSTO TOTAL DA CONVERSA
      this.displayConversationCost();
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[FAST_PROCESSOR] ❌ Erro após ${processingTime}ms:`, error);
      
      costMonitor.logOperation(
        'FastProcessor',
        'ERROR',
        0,
        0,
        `Erro: ${error}`
      );
      
      throw error;
    }
  }

  /**
   * Obter divisões locais (cache ou processar instantaneamente)
   */
  private async getLocalDivisions(documentContent: string, documentName: string): Promise<LocalDivisionResult> {
    console.log(`[FAST_PROCESSOR] 📋 Verificando cache local...`);
    
    // Verificar cache primeiro
    if (localDocumentCache.hasDocument(documentContent, documentName)) {
      console.log(`[FAST_PROCESSOR] ⚡ USANDO CACHE LOCAL`);
      const cachedDivisions = localDocumentCache.getDocument(documentContent, documentName);
      
      if (cachedDivisions) {
        return cachedDivisions;
      }
    }
    
    // Criar divisões localmente (instantâneo)
    console.log(`[FAST_PROCESSOR] ⚡ CRIANDO DIVISÕES LOCAIS INSTANTÂNEAS...`);
    const divisions = localDocumentDivider.divideDocumentLocally(documentContent, documentName);
    
    // Armazenar no cache
    console.log(`[FAST_PROCESSOR] ⚡ Armazenando no cache local...`);
    localDocumentCache.setDocument(documentContent, documentName, divisions);
    
    return divisions;
  }

  /**
   * Gerar resposta final otimizada
   */
  private async generateFastAnswer(userQuery: string, selectedParts: LocalDivision[]): Promise<string> {
    console.log(`[FAST_PROCESSOR] 🤖 GERANDO RESPOSTA RÁPIDA:`);
    console.log(`[FAST_PROCESSOR] 🤖 - Pergunta: "${userQuery.substring(0, 80)}..."`);
    console.log(`[FAST_PROCESSOR] 🤖 - Partes: ${selectedParts.length}`);
    
    // Preparar conteúdo otimizado
    const selectedContent = selectedParts.map((part) => {
      return `=== ${part.nome} ===\n${part.conteudo}\n`;
    }).join('\n');
    
    console.log(`[FAST_PROCESSOR] 🤖 - Conteúdo total: ${selectedContent.length} chars (${estimateTokens(selectedContent)} tokens)`);
    
    // Prompt otimizado
    const fullPrompt = FAST_FINAL_ANSWER_PROMPT
      .replace('{USER_QUERY}', userQuery)
      .replace('{SELECTED_PARTS}', selectedContent);
    
    const inputTokens = estimateTokens(fullPrompt);
    console.log(`[FAST_PROCESSOR] 🤖 💰 Tokens entrada: ${inputTokens}`);
    
    console.log(`[FAST_PROCESSOR] 🤖 📤 Enviando para API...`);
    
    const apiResponse = await chatWithAI(fullPrompt, []);
    
    // Calcular custos
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[FAST_PROCESSOR] 🤖 📥 Resposta recebida: ${apiResponse.length} chars (${outputTokens} tokens)`);
    console.log(`[FAST_PROCESSOR] 🤖 💰 Tokens saída: ${outputTokens}`);
    console.log(`[FAST_PROCESSOR] 🤖 💰 Custo: $${totalCost.toFixed(6)}`);
    
    // Registrar custo
    costMonitor.logOperation(
      'FastProcessor',
      'FINAL_ANSWER',
      inputTokens,
      outputTokens,
      `Resposta rápida usando ${selectedParts.length} partes`
    );
    
    this.totalCost += totalCost;
    
    return apiResponse;
  }

  /**
   * Processar pergunta geral (sem documento)
   */
  private async processGeneralQuery(userQuery: string): Promise<FastQueryResponse> {
    const startTime = Date.now();
    
    console.log(`[FAST_PROCESSOR] 💬 PERGUNTA GERAL RÁPIDA:`);
    console.log(`[FAST_PROCESSOR] 💬 - Pergunta: "${userQuery.substring(0, 100)}..."`);
    
    const inputTokens = estimateTokens(userQuery);
    const prompt = 'Você é uma IA militar brasileira especializada em regulamentos militares. Responda de forma precisa e objetiva.';
    
    const apiResponse = await chatWithAI(prompt, [{ autor: 'user', texto: userQuery }]);
    
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    costMonitor.logOperation(
      'FastProcessor',
      'GENERAL_QUERY',
      inputTokens,
      outputTokens,
      'Pergunta geral sem documento'
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[FAST_PROCESSOR] 💬 ✅ Pergunta geral concluída: ${processingTime}ms`);
    
    return {
      answer: apiResponse,
      sectionsUsed: [],
      totalCost,
      processingTime,
      fromCache: false
    };
  }

  /**
   * Estatísticas do processador
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
    console.log(`[FAST_PROCESSOR] 🔄 Estatísticas resetadas`);
  }

  /**
   * Exibir custo total da conversa de forma chamativa
   */
  private displayConversationCost(): void {
    const totalQueries = this.queryCount;
    const totalCost = this.totalCost;
    
    // ✅ DISPLAY CHAMATIVO PARA IDENTIFICAR FACILMENTE NO CONSOLE
    console.log('');
    console.log('🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰');
    console.log('💰                         CUSTO TOTAL DA CONVERSA                         💰');
    console.log('🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰');
    console.log(`💰 📊 CONSULTAS REALIZADAS: ${totalQueries}`);
    console.log(`💰 💵 CUSTO TOTAL: $${totalCost.toFixed(6)}`);
    console.log(`💰 📈 CUSTO MÉDIO POR CONSULTA: $${(totalCost / Math.max(totalQueries, 1)).toFixed(6)}`);
    
    // Aviso se custo está alto
    if (totalCost > 0.10) {
      console.log('💰 ⚠️  ATENÇÃO: CUSTO ALTO DETECTADO!');
    } else if (totalCost > 0.05) {
      console.log('💰 🟡 CUSTO MODERADO');
    } else {
      console.log('💰 ✅ CUSTO BAIXO - ECONOMIA EFICIENTE');
    }
    
    console.log('🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰🎯💰');
    console.log('');
  }
}

// Instância global
export const fastQueryProcessor = new FastQueryProcessor();
