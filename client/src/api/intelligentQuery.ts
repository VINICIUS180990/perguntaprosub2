/**
 * Sistema de Consulta Inteligente
 * Gerencia consultas do usuário, determina quais partes do documento são necessárias
 */

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';
import type { DocumentDivision } from './documentProcessor';

export interface QueryAnalysisResult {
  needsDocument: boolean;
  sectionsNeeded: string[];
  reasoning: string;
  queryType: 'document-related' | 'general' | 'mixed';
}

export interface QueryResponse {
  answer: string;
  sectionsUsed: string[];
  totalCost: number;
  processingTime: number;
}

/**
 * Prompt para análise de consulta
 */
const QUERY_ANALYSIS_PROMPT = `Você é um especialista em análise de consultas sobre documentos militares brasileiros.

TAREFA: Analisar a pergunta do usuário e determinar quais seções do documento são necessárias para responder.

SEÇÕES DISPONÍVEIS:
{SECTIONS_SUMMARY}

PERGUNTA DO USUÁRIO:
{USER_QUERY}

INSTRUÇÕES:
1. Analise se a pergunta está relacionada ao documento ou é uma pergunta geral
2. Se for relacionada ao documento, identifique EXATAMENTE quais seções são necessárias
3. Se for uma pergunta geral, indique que não precisa de nenhuma seção
4. Seja preciso - não solicite seções desnecessárias para economizar tokens

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "needsDocument": true/false,
  "sectionsNeeded": ["nome_da_secao1", "nome_da_secao2"],
  "reasoning": "Explicação de por que essas seções são necessárias",
  "queryType": "document-related" | "general" | "mixed"
}

RESPOSTA:`;

/**
 * Prompt para resposta final
 */
const FINAL_ANSWER_PROMPT = `Você é o PerguntaProSub, uma IA militar brasileira especializada em regulamentos militares.

SEÇÕES RELEVANTES DO DOCUMENTO:
{RELEVANT_SECTIONS}

PERGUNTA DO USUÁRIO:
{USER_QUERY}

INSTRUÇÕES:
1. Use APENAS as seções fornecidas para responder
2. Seja preciso e cite as seções específicas
3. Use terminologia militar adequada
4. Não invente informações que não estão nas seções fornecidas

RESPOSTA:`;

/**
 * Classe principal para gerenciar consultas inteligentes
 */
export class IntelligentQuery {
  private queryCount = 0;
  private totalCost = 0;

  /**
   * Processa uma consulta completa do usuário
   */
  async processQuery(
    userQuery: string,
    documentDivisions: DocumentDivision[],
    systemPrompt: string
  ): Promise<QueryResponse> {
    const startTime = Date.now();
    this.queryCount++;
    
    console.log(`[INTELLIGENT_QUERY] 🔍 INICIANDO CONSULTA ${this.queryCount}:`);
    console.log(`[INTELLIGENT_QUERY] 🔍 - Pergunta: "${userQuery.substring(0, 150)}..."`);
    console.log(`[INTELLIGENT_QUERY] � - Divisões disponíveis: ${documentDivisions.length}`);
    
    // Log das divisões disponíveis
    documentDivisions.forEach((div, index) => {
      console.log(`[INTELLIGENT_QUERY] 📚 ${index + 1}. "${div.nome}" (${div.conteudo.length} chars)`);
    });
    
    try {
      // Etapa 1: Analisar a consulta
      console.log(`[INTELLIGENT_QUERY] 🔍 ETAPA 1: Analisando consulta...`);
      const analysis = await this.analyzeQuery(userQuery, documentDivisions);
      
      console.log(`[INTELLIGENT_QUERY] 🔍 ✅ ANÁLISE CONCLUÍDA:`);
      console.log(`[INTELLIGENT_QUERY] 🔍 - Precisa de documento: ${analysis.needsDocument}`);
      console.log(`[INTELLIGENT_QUERY] 🔍 - Tipo da consulta: ${analysis.queryType}`);
      console.log(`[INTELLIGENT_QUERY] 🔍 - Seções necessárias: ${analysis.sectionsNeeded.length}`);
      
      if (analysis.sectionsNeeded.length > 0) {
        console.log(`[INTELLIGENT_QUERY] 🎯 SEÇÕES SELECIONADAS PELA ANÁLISE:`);
        analysis.sectionsNeeded.forEach((sectionName, index) => {
          console.log(`[INTELLIGENT_QUERY] 🎯 ${index + 1}. "${sectionName}"`);
        });
      }
      
      // Etapa 2: Gerar resposta baseada na análise
      console.log(`[INTELLIGENT_QUERY] 🔍 ETAPA 2: Gerando resposta...`);
      const response = await this.generateResponse(userQuery, analysis, documentDivisions, systemPrompt);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`[INTELLIGENT_QUERY] ✅ Consulta processada em ${processingTime}ms`);
      console.log(`[INTELLIGENT_QUERY] 💰 Custo total da consulta: $${response.totalCost.toFixed(6)}`);
      console.log(`[INTELLIGENT_QUERY] 📊 Seções utilizadas: ${response.sectionsUsed.join(', ')}`);
      
      return response;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[INTELLIGENT_QUERY] ❌ Erro durante processamento após ${processingTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Analisa a consulta do usuário para determinar quais seções são necessárias
   */
  private async analyzeQuery(userQuery: string, divisions: DocumentDivision[]): Promise<QueryAnalysisResult> {
    console.log(`[INTELLIGENT_QUERY] 🔍 Analisando consulta...`);
    
    // Cria resumo das seções disponíveis
    const sectionsummary = divisions.map(div => 
      `- ${div.nome}: ${div.resumo}`
    ).join('\n');

    // Monta prompt de análise
    const analysisPrompt = QUERY_ANALYSIS_PROMPT
      .replace('{SECTIONS_SUMMARY}', sectionsummary)
      .replace('{USER_QUERY}', userQuery);

    // Calcula custos
    const inputTokens = estimateTokens(analysisPrompt);
    const estimatedCost = estimateCost(inputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Análise - Tokens: ${inputTokens}, Custo: $${estimatedCost.toFixed(6)}`);
    
    // Chama API para análise
    const apiResponse = await chatWithAI(analysisPrompt, []);
    
    // Calcula custo final
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Análise - Resposta: ${outputTokens} tokens, Custo final: $${totalCost.toFixed(6)}`);
    
    // Registra custo
    costMonitor.logOperation(
      'IntelligentQuery',
      'ANALYSIS',
      inputTokens,
      outputTokens,
      `Análise da pergunta: ${userQuery.substring(0, 50)}...`
    );
    this.totalCost += totalCost;
    
    // Parseia resposta
    try {
      const cleanResponse = apiResponse.replace(/```json|```/g, '').trim();
      const analysis: QueryAnalysisResult = JSON.parse(cleanResponse);
      
      console.log(`[INTELLIGENT_QUERY] ✅ Análise concluída:`);
      console.log(`[INTELLIGENT_QUERY] 📋 Precisa documento: ${analysis.needsDocument}`);
      console.log(`[INTELLIGENT_QUERY] 📋 Tipo de consulta: ${analysis.queryType}`);
      console.log(`[INTELLIGENT_QUERY] 📋 Seções necessárias: ${analysis.sectionsNeeded.join(', ')}`);
      console.log(`[INTELLIGENT_QUERY] 📋 Reasoning: ${analysis.reasoning}`);
      
      return analysis;
      
    } catch (parseError) {
      console.error(`[INTELLIGENT_QUERY] ❌ Erro ao parsear análise:`, parseError);
      console.log(`[INTELLIGENT_QUERY] 📝 Resposta original:`, apiResponse);
      
      // Fallback: assumir que precisa de todas as seções
      return {
        needsDocument: true,
        sectionsNeeded: divisions.map(div => div.nome),
        reasoning: 'Erro no parse - usando todas as seções como fallback',
        queryType: 'document-related'
      };
    }
  }

  /**
   * Gera resposta final baseada na análise
   */
  private async generateResponse(
    userQuery: string,
    analysis: QueryAnalysisResult,
    divisions: DocumentDivision[],
    systemPrompt: string
  ): Promise<QueryResponse> {
    console.log(`[INTELLIGENT_QUERY] 🤖 Gerando resposta final...`);
    
    let finalPrompt: string;
    let sectionsUsed: string[] = [];
    
    if (!analysis.needsDocument) {
      // Pergunta geral - não precisa de seções do documento
      console.log(`[INTELLIGENT_QUERY] 📝 Pergunta geral - sem seções do documento`);
      finalPrompt = systemPrompt + `\n\nPERGUNTA: ${userQuery}`;
      
    } else {
      // Pergunta relacionada ao documento - usar seções específicas
      console.log(`[INTELLIGENT_QUERY] 📚 Pergunta sobre documento - usando seções específicas`);
      
      // Filtra seções necessárias
      const relevantSections = divisions.filter(div => 
        analysis.sectionsNeeded.includes(div.nome)
      );
      
      if (relevantSections.length === 0) {
        console.warn(`[INTELLIGENT_QUERY] ⚠️ Nenhuma seção encontrada, usando todas como fallback`);
        relevantSections.push(...divisions);
      }
      
      sectionsUsed = relevantSections.map(div => div.nome);
      
      // Monta conteúdo das seções
      const sectionsContent = relevantSections.map(div => 
        `=== ${div.nome} ===\n${div.conteudo}\n`
      ).join('\n');
      
      finalPrompt = FINAL_ANSWER_PROMPT
        .replace('{RELEVANT_SECTIONS}', sectionsContent)
        .replace('{USER_QUERY}', userQuery);
      
      console.log(`[INTELLIGENT_QUERY] 📊 Seções utilizadas: ${sectionsUsed.join(', ')}`);
      console.log(`[INTELLIGENT_QUERY] 📊 Conteúdo total: ${sectionsContent.length} caracteres`);
    }
    
    // Calcula custos
    const inputTokens = estimateTokens(finalPrompt);
    const estimatedCost = estimateCost(inputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Resposta - Tokens: ${inputTokens}, Custo: $${estimatedCost.toFixed(6)}`);
    
    // Chama API para resposta final
    const apiResponse = await chatWithAI(finalPrompt, []);
    
    // Calcula custo final
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Resposta - Saída: ${outputTokens} tokens, Custo: $${totalCost.toFixed(6)}`);
    
    // Registra custo
    costMonitor.logOperation(
      'IntelligentQuery',
      'FINAL_ANSWER',
      inputTokens,
      outputTokens,
      `Resposta final usando ${sectionsUsed.length} seções`
    );
    this.totalCost += totalCost;
    
    return {
      answer: apiResponse,
      sectionsUsed,
      totalCost: this.totalCost,
      processingTime: Date.now()
    };
  }

  /**
   * Processa pergunta simples sem análise prévia (para compatibilidade)
   */
  async processSimpleQuery(
    userQuery: string,
    systemPrompt: string
  ): Promise<QueryResponse> {
    console.log(`[INTELLIGENT_QUERY] 🔍 Processando pergunta simples (sem documento)`);
    
    const startTime = Date.now();
    const inputTokens = estimateTokens(systemPrompt + userQuery);
    const estimatedCost = estimateCost(inputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Pergunta simples - Tokens: ${inputTokens}, Custo: $${estimatedCost.toFixed(6)}`);
    
    const apiResponse = await chatWithAI(systemPrompt, [{ autor: 'user', texto: userQuery }]);
    
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[INTELLIGENT_QUERY] 💰 Pergunta simples - Resposta: ${outputTokens} tokens, Custo: $${totalCost.toFixed(6)}`);
    
    costMonitor.logOperation(
      'IntelligentQuery',
      'SIMPLE_QUERY',
      inputTokens,
      outputTokens,
      `Pergunta simples sem documento`
    );
    
    return {
      answer: apiResponse,
      sectionsUsed: [],
      totalCost,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Obtém estatísticas da sessão atual
   */
  getStats(): {
    totalQueries: number;
    totalCost: number;
    averageCostPerQuery: number;
  } {
    const stats = {
      totalQueries: this.queryCount,
      totalCost: this.totalCost,
      averageCostPerQuery: this.queryCount > 0 ? this.totalCost / this.queryCount : 0
    };
    
    console.log(`[INTELLIGENT_QUERY] 📊 Estatísticas da sessão:`, stats);
    return stats;
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    console.log(`[INTELLIGENT_QUERY] 🔄 Resetando estatísticas...`);
    this.queryCount = 0;
    this.totalCost = 0;
  }
}

// Instância global
export const intelligentQuery = new IntelligentQuery();

// Debug functions
if (typeof window !== 'undefined') {
  (window as any).intelligentQuery = {
    stats: () => intelligentQuery.getStats(),
    reset: () => intelligentQuery.resetStats()
  };
}
