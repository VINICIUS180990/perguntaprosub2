/**
 * PROCESSADOR DE DOCUMENTOS - API2
 * Processamento principal quando documento é anexado/selecionado
 */

import { DOCUMENT_CONFIG, DEBUG_CONFIG } from './config';
import { logger, generateHash, estimateTokens, cleanText, generateId, PerformanceTimer } from './utils';
import { documentCache } from './documentCache';
import { documentDivider } from './documentDivider';
import { costMonitor } from './costMonitor';
import type { SmallDocument, LargeDocument, ProcessingStatus } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.PROCESSOR;

logger.info(PREFIX, 'Inicializando processador de documentos...');

export class DocumentProcessor {
  private currentStatus: ProcessingStatus = {
    stage: 'READY',
    message: 'Pronto para processar documentos'
  };
  
  /**
   * Processa documento anexado/selecionado
   */
  async processDocument(
    content: string,
    name: string,
    source: 'ATTACHED' | 'SELECTED' = 'ATTACHED'
  ): Promise<SmallDocument | LargeDocument> {
    const timer = new PerformanceTimer('Document Processing');
    
    this.updateStatus('EXTRACTING', `Processando documento: ${name}`);
    
    logger.processing(PREFIX, `🚀 INICIANDO PROCESSAMENTO: ${name}`);
    logger.debug(PREFIX, `Fonte: ${source}`);
    logger.debug(PREFIX, `Tamanho original: ${content.length} chars`);
    
    try {
      // ETAPA 1: Limpeza e normalização
      this.updateStatus('EXTRACTING', 'Limpando e normalizando texto...');
      
      const cleanedContent = cleanText(content);
      logger.debug(PREFIX, `Texto limpo: ${cleanedContent.length} chars`);
      
      // ETAPA 2: Gerar hash para cache
      const documentHash = generateHash(cleanedContent, name);
      logger.debug(PREFIX, `Hash gerado: ${documentHash}`);
      
      // ETAPA 3: Verificar cache
      this.updateStatus('ANALYZING', 'Verificando cache...');
      
      if (documentCache.has(documentHash)) {
        logger.success(PREFIX, '📂 DOCUMENTO ENCONTRADO NO CACHE!');
        
        const cachedDoc = documentCache.get(documentHash)!;
        
        this.updateStatus('READY', `Documento "${name}" carregado do cache`);
        timer.end();
        
        logger.success(PREFIX, `Cache hit: ${cachedDoc.type} document recuperado`);
        return cachedDoc;
      }
      
      // ETAPA 4: Análise de tamanho
      this.updateStatus('ANALYZING', 'Analisando tamanho do documento...');
      
      const tokenCount = estimateTokens(cleanedContent);
      logger.info(PREFIX, `📊 ANÁLISE DE TAMANHO: ${tokenCount} tokens`);
      
      let processedDocument: SmallDocument | LargeDocument;
      
      if (tokenCount <= DOCUMENT_CONFIG.SMALL_DOCUMENT_MAX_TOKENS) {
        // DOCUMENTO PEQUENO
        logger.info(PREFIX, '📄 DOCUMENTO PEQUENO - Processamento simples');
        processedDocument = this.processSmallDocument(cleanedContent, name, documentHash, tokenCount);
        
      } else {
        // DOCUMENTO GRANDE
        logger.info(PREFIX, '📚 DOCUMENTO GRANDE - Processamento completo');
        processedDocument = this.processLargeDocument(cleanedContent, name, documentHash);
      }
      
      // ETAPA 5: Armazenar no cache
      this.updateStatus('CACHING', 'Armazenando no cache...');
      
      documentCache.set(documentHash, processedDocument);
      
      this.updateStatus('READY', `Documento "${name}" processado e pronto para uso`);
      
      const processingTime = timer.end();
      
      // Log de conclusão
      logger.success(PREFIX, '✅ PROCESSAMENTO CONCLUÍDO!');
      logger.info(PREFIX, `📄 Tipo: ${processedDocument.type}`);
      logger.info(PREFIX, `🔢 Tokens: ${processedDocument.tokenCount}`);
      logger.info(PREFIX, `⏱️  Tempo: ${processingTime.toFixed(0)}ms`);
      
      if (processedDocument.type === 'LARGE') {
        const largeDoc = processedDocument as LargeDocument;
        logger.info(PREFIX, `📋 Divisões: ${largeDoc.divisions.length}`);
        logger.info(PREFIX, `🔧 Método: ${largeDoc.processingMethod}`);
      }
      
      // Registrar no monitor de custos (processamento local = sem custo)
      costMonitor.logOperation(
        'DOCUMENT_PROCESSING',
        0, // Sem tokens de entrada para API
        0, // Sem tokens de saída da API
        `Processamento local: ${name} (${processedDocument.type})`
      );
      
      return processedDocument;
      
    } catch (error) {
      this.updateStatus('ERROR', `Erro ao processar documento: ${error}`);
      
      const processingTime = timer.end();
      
      logger.error(PREFIX, `❌ ERRO NO PROCESSAMENTO após ${processingTime.toFixed(0)}ms:`);
      logger.error(PREFIX, String(error));
      
      costMonitor.logOperation(
        'DOCUMENT_PROCESSING_ERROR',
        0,
        0,
        `Erro no processamento: ${name} - ${error}`
      );
      
      throw new Error(`Falha no processamento do documento: ${error}`);
    }
  }
  
  /**
   * Processa documento pequeno (≤5000 tokens)
   */
  private processSmallDocument(
    content: string,
    name: string,
    hash: string,
    tokenCount: number
  ): SmallDocument {
    logger.processing(PREFIX, '📄 Processando documento pequeno...');
    
    const document: SmallDocument = {
      id: generateId(),
      name,
      content,
      tokenCount,
      type: 'SMALL',
      timestamp: Date.now(),
      hash
    };
    
    logger.success(PREFIX, '📄 Documento pequeno processado');
    logger.debug(PREFIX, `- ID: ${document.id}`);
    logger.debug(PREFIX, `- Tokens: ${document.tokenCount}`);
    
    return document;
  }
  
  /**
   * Processa documento grande (>5000 tokens)
   */
  private processLargeDocument(
    content: string,
    name: string,
    hash: string
  ): LargeDocument {
    logger.processing(PREFIX, '📚 Processando documento grande...');
    
    this.updateStatus('DIVIDING', 'Dividindo documento em seções...');
    
    // Usar o divisor para criar seções
    const largeDocument = documentDivider.divideDocument(content, name, hash);
    
    logger.success(PREFIX, '📚 Documento grande processado');
    logger.debug(PREFIX, `- ID: ${largeDocument.id}`);
    logger.debug(PREFIX, `- Tokens: ${largeDocument.tokenCount}`);
    logger.debug(PREFIX, `- Divisões: ${largeDocument.divisions.length}`);
    logger.debug(PREFIX, `- Método: ${largeDocument.processingMethod}`);
    
    return largeDocument;
  }
  
  /**
   * Atualiza status do processamento
   */
  private updateStatus(stage: ProcessingStatus['stage'], message: string, progress?: number): void {
    this.currentStatus = { stage, message, progress };
    
    logger.info(PREFIX, `📋 STATUS: ${stage} - ${message}`);
    if (progress !== undefined) {
      logger.debug(PREFIX, `Progress: ${progress}%`);
    }
  }
  
  /**
   * Obtém status atual
   */
  getStatus(): ProcessingStatus {
    return { ...this.currentStatus };
  }
  
  /**
   * Verifica se pode processar documento
   */
  canProcess(): boolean {
    return this.currentStatus.stage === 'READY' || this.currentStatus.stage === 'ERROR';
  }
  
  /**
   * Força limpeza de cache
   */
  clearCache(): void {
    logger.info(PREFIX, 'Limpando cache de documentos...');
    documentCache.clear();
    logger.success(PREFIX, 'Cache limpo');
  }
  
  /**
   * Obtém estatísticas do processador
   */
  getStats(): {
    cacheStats: any;
    currentStatus: ProcessingStatus;
    canProcess: boolean;
  } {
    return {
      cacheStats: documentCache.getStats(),
      currentStatus: this.getStatus(),
      canProcess: this.canProcess()
    };
  }
  
  /**
   * Pré-visualização de documento (sem processar)
   */
  previewDocument(content: string, name: string): {
    name: string;
    size: number;
    tokenCount: number;
    type: 'SMALL' | 'LARGE';
    estimatedDivisions?: number;
  } {
    logger.debug(PREFIX, `Pré-visualizando documento: ${name}`);
    
    const cleanedContent = cleanText(content);
    const tokenCount = estimateTokens(cleanedContent);
    const type: 'SMALL' | 'LARGE' = tokenCount <= DOCUMENT_CONFIG.SMALL_DOCUMENT_MAX_TOKENS ? 'SMALL' : 'LARGE';
    
    const preview = {
      name,
      size: cleanedContent.length,
      tokenCount,
      type,
      estimatedDivisions: type === 'LARGE' ? 
        Math.ceil(tokenCount / (DOCUMENT_CONFIG.DIVISION.MAX_SECTION_SIZE / 4)) : undefined
    };
    
    logger.debug(PREFIX, 'Preview gerado:', preview);
    
    return preview;
  }
  
  /**
   * Lista documentos em cache
   */
  listCachedDocuments(): Array<{name: string, type: string, tokenCount: number}> {
    const documents = documentCache.listDocuments();
    
    logger.debug(PREFIX, `Documentos em cache: ${documents.length}`);
    
    return documents;
  }
}

// Instância global
export const documentProcessor = new DocumentProcessor();

logger.success(PREFIX, 'Processador de documentos carregado com sucesso');
