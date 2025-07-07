/**
 * PROCESSADOR DE QUERIES - API2
 * Processa perguntas do usuário com lógica inteligente
 */

import { DEBUG_CONFIG } from './config';
import { logger, PerformanceTimer } from './utils';
import { partSelector } from './partSelector';
import { costMonitor } from './costMonitor';
import { callChatAPI, simpleChat } from './chat';
import { createSmallDocumentPrompt, createLargeDocumentPrompt, createAnalysisPrompt, createGeneralPrompt, formatSelectedSections } from './prompts';
import type { QueryResponse, QueryAnalysis, SmallDocument, LargeDocument } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.QUERY;

logger.info(PREFIX, 'Inicializando processador de queries...');

export class QueryProcessor {
  private queryCount = 0;
  private activeDocument: SmallDocument | LargeDocument | null = null;
  
  /**
   * Define documento ativo para queries
   */
  setActiveDocument(document: SmallDocument | LargeDocument): void {
    this.activeDocument = document;
    
    logger.info(PREFIX, `📄 Documento ativo definido: ${document.name}`);
    logger.debug(PREFIX, `Tipo: ${document.type}, Tokens: ${document.tokenCount}`);
    
    if (document.type === 'LARGE') {
      const largeDoc = document as LargeDocument;
      logger.debug(PREFIX, `Divisões: ${largeDoc.divisions.length}`);
    }
  }
  
  /**
   * Processa uma query do usuário
   */
  async processQuery(query: string): Promise<QueryResponse> {
    const timer = new PerformanceTimer('Query Processing');
    this.queryCount++;
    
    logger.processing(PREFIX, `🚀 PROCESSANDO QUERY ${this.queryCount}:`);
    logger.debug(PREFIX, `Pergunta: "${query.substring(0, 150)}..."`);
    logger.debug(PREFIX, `Documento ativo: ${this.activeDocument?.name || 'Nenhum'}`);
    
    try {
      // ETAPA 1: Análise da necessidade de documento
      const needsDocument = await this.analyzeDocumentNeed(query);
      
      logger.info(PREFIX, `🤔 ANÁLISE: Precisa documento = ${needsDocument.needsDocument}`);
      logger.debug(PREFIX, `Confiança: ${(needsDocument.confidence * 100).toFixed(1)}%`);
      logger.debug(PREFIX, `Reasoning: ${needsDocument.reasoning}`);
      
      let response: QueryResponse;
      
      if (!needsDocument.needsDocument) {
        // RESPOSTA SEM DOCUMENTO
        response = await this.processGeneralQuery(query);
        
      } else if (!this.activeDocument) {
        // PRECISA DE DOCUMENTO MAS NÃO TEM
        response = await this.processNoDocumentError();
        
      } else if (this.activeDocument.type === 'SMALL') {
        // DOCUMENTO PEQUENO
        response = await this.processSmallDocumentQuery(query, this.activeDocument);
        
      } else {
        // DOCUMENTO GRANDE
        response = await this.processLargeDocumentQuery(query, this.activeDocument as LargeDocument);
      }
      
      const processingTime = timer.end();
      response.processingTime = processingTime;
      
      logger.success(PREFIX, '✅ QUERY PROCESSADA COM SUCESSO!');
      logger.info(PREFIX, `📝 Resposta: ${response.answer.length} chars`);
      logger.info(PREFIX, `💰 Custo: $${response.tokenCost.total.toFixed(6)}`);
      logger.info(PREFIX, `⏱️  Tempo: ${response.processingTime.toFixed(0)}ms`);
      logger.info(PREFIX, `📄 Documento usado: ${response.documentUsed}`);
      
      if (response.sectionsUsed.length > 0) {
        logger.debug(PREFIX, `📋 Seções usadas: ${response.sectionsUsed.join(', ')}`);
      }
      
      return response;
      
    } catch (error) {
      const processingTime = timer.end();
      
      logger.error(PREFIX, `❌ ERRO NO PROCESSAMENTO após ${processingTime.toFixed(0)}ms:`);
      logger.error(PREFIX, String(error));
      
      // Registrar erro
      costMonitor.logOperation(
        'QUERY_ERROR',
        0,
        0,
        `Erro na query: ${query.substring(0, 100)}... - ${error}`
      );
      
      // Retornar resposta de erro
      return {
        answer: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente ou reformule a pergunta.',
        documentUsed: false,
        sectionsUsed: [],
        processingTime,
        tokenCost: { input: 0, output: 0, total: 0 },
        fromCache: false
      };
    }
  }
  
  /**
   * Analisa se a query precisa do documento
   */
  private async analyzeDocumentNeed(query: string): Promise<QueryAnalysis> {
    logger.debug(PREFIX, '🤔 Analisando necessidade de documento...');
    
    // Análise rápida local primeiro
    const quickAnalysis = this.quickDocumentNeedAnalysis(query);
    
    if (quickAnalysis.confidence >= 0.8) {
      logger.debug(PREFIX, `Análise rápida suficiente (${quickAnalysis.confidence * 100}%)`);
      return quickAnalysis;
    }
    
    // Análise com IA se não tiver certeza
    try {
      logger.debug(PREFIX, 'Usando IA para análise mais precisa...');
      
      const prompt = createAnalysisPrompt(query, 'DOCUMENT_NEED_ANALYSIS');
      const response = await simpleChat(prompt);
      
      const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
      
      const aiAnalysis: QueryAnalysis = {
        needsDocument: parsed.precisa_documento || false,
        confidence: parsed.confianca || 0.5,
        reasoning: parsed.justificativa || 'Análise via IA'
      };
      
      logger.debug(PREFIX, 'Análise IA concluída:', aiAnalysis);
      
      // Registrar custo da análise
      costMonitor.logOperation(
        'DOCUMENT_NEED_ANALYSIS',
        100, // Estimativa
        50,  // Estimativa
        'Análise de necessidade de documento via IA'
      );
      
      return aiAnalysis;
      
    } catch (error) {
      logger.warn(PREFIX, 'Falha na análise IA, usando análise rápida:', error);
      return quickAnalysis;
    }
  }
  
  /**
   * Análise rápida sem IA
   */
  private quickDocumentNeedAnalysis(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Padrões que NÃO precisam de documento
    const noDocumentPatterns = [
      /^(oi|olá|hello|hi)\b/,
      /^(obrigad|thanks|thank you)/,
      /^(tchau|bye|goodbye)/,
      /^(como está|how are)/,
      /^(que horas|what time)/,
      /^(clima|weather)/,
      /^(como funciona|how does.*work)/,
      /^(o que é|what is).*\b(em geral|in general)\b/,
    ];
    
    // Padrões que PRECISAM de documento
    const needDocumentPatterns = [
      /\b(documento|document|texto|text|arquivo|file)\b/,
      /\b(capítulo|chapter|seção|section|parte|part)\b/,
      /\b(artigo|article|anexo|appendix)\b/,
      /\b(página|page|parágrafo|paragraph)\b/,
      /\b(cita|cite|menciona|mention|fala sobre|talks about)\b/,
      /\b(segundo|according to|conforme|as per)\b/,
      /\b(onde|where.*diz|says.*where)\b/,
      /\b(que diz|what does.*say|o que.*diz)\b/,
    ];
    
    // Verificar padrões de não-documento
    for (const pattern of noDocumentPatterns) {
      if (pattern.test(lowerQuery)) {
        return {
          needsDocument: false,
          confidence: 0.9,
          reasoning: 'Pergunta geral identificada por padrão'
        };
      }
    }
    
    // Verificar padrões de documento
    for (const pattern of needDocumentPatterns) {
      if (pattern.test(lowerQuery)) {
        return {
          needsDocument: true,
          confidence: 0.85,
          reasoning: 'Pergunta sobre documento identificada por padrão'
        };
      }
    }
    
    // Análise de contexto
    if (lowerQuery.length < 10) {
      return {
        needsDocument: false,
        confidence: 0.7,
        reasoning: 'Pergunta muito curta, provavelmente geral'
      };
    }
    
    if (lowerQuery.includes('?') && lowerQuery.length > 50) {
      return {
        needsDocument: true,
        confidence: 0.6,
        reasoning: 'Pergunta longa e específica, provavelmente sobre documento'
      };
    }
    
    // Fallback: assumir que precisa de documento se tiver um ativo
    return {
      needsDocument: !!this.activeDocument,
      confidence: 0.5,
      reasoning: 'Análise inconclusiva, baseando na presença de documento ativo'
    };
  }
  
  /**
   * Processa query geral (sem documento)
   */
  private async processGeneralQuery(query: string): Promise<QueryResponse> {
    logger.processing(PREFIX, '💬 Processando query geral...');
    
    const prompt = createGeneralPrompt(query, 'NO_DOCUMENT');
    const response = await callChatAPI([
      { role: 'user', content: prompt }
    ]);
    
    // Registrar custo
    costMonitor.logOperation(
      'GENERAL_QUERY',
      response.tokensUsed.input,
      response.tokensUsed.output,
      'Query geral sem documento'
    );
    
    return {
      answer: response.content,
      documentUsed: false,
      sectionsUsed: [],
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.tokensUsed.total
      },
      fromCache: false
    };
  }
  
  /**
   * Erro quando precisa de documento mas não tem
   */
  private async processNoDocumentError(): Promise<QueryResponse> {
    logger.warn(PREFIX, '⚠️ Query precisa de documento mas nenhum está ativo');
    
    const errorMessage = 'Para responder essa pergunta, você precisa anexar ou selecionar um documento primeiro. Por favor, anexe um documento e tente novamente.';
    
    return {
      answer: errorMessage,
      documentUsed: false,
      sectionsUsed: [],
      processingTime: 0,
      tokenCost: { input: 0, output: 0, total: 0 },
      fromCache: false
    };
  }
  
  /**
   * Processa query com documento pequeno
   */
  private async processSmallDocumentQuery(query: string, document: SmallDocument): Promise<QueryResponse> {
    logger.processing(PREFIX, '📄 Processando query com documento pequeno...');
    
    const prompt = createSmallDocumentPrompt(document.content, query, 'COMPLETE_DOCUMENT');
    const response = await callChatAPI([
      { role: 'user', content: prompt }
    ]);
    
    // Registrar custo
    costMonitor.logOperation(
      'SMALL_DOCUMENT_QUERY',
      response.tokensUsed.input,
      response.tokensUsed.output,
      `Query com documento pequeno: ${document.name}`
    );
    
    return {
      answer: response.content,
      documentUsed: true,
      sectionsUsed: ['Documento Completo'],
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.tokensUsed.total
      },
      fromCache: false
    };
  }
  
  /**
   * Processa query com documento grande
   */
  private async processLargeDocumentQuery(query: string, document: LargeDocument): Promise<QueryResponse> {
    logger.processing(PREFIX, '📚 Processando query com documento grande...');
    
    // Selecionar partes relevantes
    const selection = await partSelector.selectRelevantParts(query, document.divisions);
    
    logger.info(PREFIX, `🎯 Selecionadas: ${selection.selectedParts.length}/${document.divisions.length} seções`);
    logger.debug(PREFIX, `Economia: ${selection.tokensSaved} tokens`);
    
    // Formatar seções para o prompt
    const formattedSections = formatSelectedSections(
      selection.selectedParts.map(part => ({
        nome: part.nome,
        conteudo: part.conteudo
      }))
    );
    
    const prompt = createLargeDocumentPrompt(formattedSections, query, 'SELECTED_SECTIONS');
    const response = await callChatAPI([
      { role: 'user', content: prompt }
    ]);
    
    // Registrar custo
    costMonitor.logOperation(
      'LARGE_DOCUMENT_QUERY',
      response.tokensUsed.input,
      response.tokensUsed.output,
      `Query com documento grande: ${document.name} (${selection.selectedParts.length} seções)`
    );
    
    return {
      answer: response.content,
      documentUsed: true,
      sectionsUsed: selection.selectedParts.map(part => part.nome),
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.tokensUsed.total
      },
      fromCache: false
    };
  }
  
  /**
   * Obtém documento ativo
   */
  getActiveDocument(): SmallDocument | LargeDocument | null {
    return this.activeDocument;
  }
  
  /**
   * Remove documento ativo
   */
  clearActiveDocument(): void {
    logger.info(PREFIX, 'Removendo documento ativo');
    this.activeDocument = null;
  }
  
  /**
   * Obtém estatísticas
   */
  getStats(): {
    totalQueries: number;
    activeDocument: string | null;
    hasActiveDocument: boolean;
  } {
    return {
      totalQueries: this.queryCount,
      activeDocument: this.activeDocument?.name || null,
      hasActiveDocument: !!this.activeDocument
    };
  }
  
  /**
   * Reset estatísticas
   */
  resetStats(): void {
    logger.info(PREFIX, 'Resetando estatísticas');
    this.queryCount = 0;
  }
}

// Instância global
export const queryProcessor = new QueryProcessor();

logger.success(PREFIX, 'Processador de queries carregado com sucesso');
