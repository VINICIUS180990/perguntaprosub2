/**
 * DIVISOR DE DOCUMENTOS - API2
 * Divide documentos grandes em seções lógicas localmente
 */

import { DOCUMENT_CONFIG, DEBUG_CONFIG } from './config';
import { logger, generateId, estimateTokens, cleanText, PerformanceTimer } from './utils';
import type { DocumentDivision, LargeDocument } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.DIVIDER;

logger.info(PREFIX, 'Inicializando divisor de documentos...');

export class DocumentDivider {
  
  /**
   * Divide um documento grande em seções
   */
  divideDocument(content: string, name: string, hash: string): LargeDocument {
    const timer = new PerformanceTimer('Document Division');
    
    logger.processing(PREFIX, `Iniciando divisão do documento: ${name}`);
    logger.debug(PREFIX, `Tamanho original: ${content.length} chars`);
    
    // Limpar o texto
    const cleanedContent = cleanText(content);
    logger.debug(PREFIX, `Tamanho após limpeza: ${cleanedContent.length} chars`);
    
    // Detectar tipo de divisão baseado no conteúdo
    const divisionStrategy = this.detectDivisionStrategy(cleanedContent);
    logger.info(PREFIX, `Estratégia de divisão: ${divisionStrategy}`);
    
    // Dividir o documento
    let divisions: DocumentDivision[] = [];
    
    switch (divisionStrategy) {
      case 'CHAPTERS':
        divisions = this.divideByChapters(cleanedContent);
        break;
      case 'SECTIONS':
        divisions = this.divideBySections(cleanedContent);
        break;
      case 'PARAGRAPHS':
        divisions = this.divideByParagraphs(cleanedContent);
        break;
      default:
        divisions = this.divideBySize(cleanedContent);
    }
    
    logger.success(PREFIX, `Documento dividido em ${divisions.length} seções`);
    
    // Log detalhado das divisões
    divisions.forEach((div, index) => {
      logger.debug(PREFIX, `${index + 1}. "${div.nome}" - ${div.tokenCount} tokens`);
      logger.debug(PREFIX, `   Resumo: ${div.resumo.substring(0, 100)}...`);
    });
    
    const totalTokens = divisions.reduce((acc, div) => acc + div.tokenCount, 0);
    logger.info(PREFIX, `Total de tokens nas divisões: ${totalTokens}`);
    
    const processingTime = timer.end();
    
    // Criar documento processado
    const largeDocument: LargeDocument = {
      id: generateId(),
      name,
      content: cleanedContent,
      tokenCount: estimateTokens(cleanedContent),
      type: 'LARGE',
      timestamp: Date.now(),
      hash,
      divisions,
      processingMethod: divisionStrategy,
    };
    
    logger.success(PREFIX, `Documento processado em ${processingTime.toFixed(0)}ms`);
    
    return largeDocument;
  }
  
  // === ESTRATÉGIAS DE DIVISÃO === //
  
  private detectDivisionStrategy(content: string): string {
    logger.debug(PREFIX, 'Detectando estratégia de divisão...');
    
    // Verificar padrões de capítulos
    const chapterPatterns = [
      /capítulo\s+\d+/gi,
      /chapter\s+\d+/gi,
      /cap\.\s*\d+/gi,
    ];
    
    let chapterMatches = 0;
    chapterPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) chapterMatches += matches.length;
    });
    
    if (chapterMatches >= 3) {
      logger.debug(PREFIX, `${chapterMatches} capítulos detectados`);
      return 'CHAPTERS';
    }
    
    // Verificar padrões de seções
    const sectionPatterns = [
      /seção\s+\d+/gi,
      /section\s+\d+/gi,
      /artigo\s+\d+/gi,
      /art\.\s*\d+/gi,
      /anexo\s+[a-z\d]/gi,
    ];
    
    let sectionMatches = 0;
    sectionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) sectionMatches += matches.length;
    });
    
    if (sectionMatches >= 5) {
      logger.debug(PREFIX, `${sectionMatches} seções detectadas`);
      return 'SECTIONS';
    }
    
    // Verificar densidade de parágrafos
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 100);
    
    if (paragraphs.length >= 10) {
      logger.debug(PREFIX, `${paragraphs.length} parágrafos detectados`);
      return 'PARAGRAPHS';
    }
    
    logger.debug(PREFIX, 'Usando divisão por tamanho como fallback');
    return 'SIZE';
  }
  
  private divideByChapters(content: string): DocumentDivision[] {
    logger.debug(PREFIX, 'Dividindo por capítulos...');
    
    const chapterRegex = /(capítulo\s+\d+|chapter\s+\d+|cap\.\s*\d+)/gi;
    const divisions: DocumentDivision[] = [];
    
    const parts = content.split(chapterRegex);
    let currentChapter = '';
    let chapterNumber = 1;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part.match(chapterRegex)) {
        currentChapter = part;
      } else if (part.length > 100) {
        const fullContent = currentChapter ? `${currentChapter}\n\n${part}` : part;
        
        if (fullContent.length > DOCUMENT_CONFIG.DIVISION.MIN_SECTION_SIZE) {
          divisions.push(this.createDivision(
            currentChapter || `Capítulo ${chapterNumber}`,
            fullContent,
            divisions.length
          ));
          chapterNumber++;
        }
      }
    }
    
    // Se não encontrou divisões suficientes, usar fallback
    if (divisions.length < 2) {
      logger.warn(PREFIX, 'Poucos capítulos encontrados, usando divisão por tamanho');
      return this.divideBySize(content);
    }
    
    return divisions;
  }
  
  private divideBySections(content: string): DocumentDivision[] {
    logger.debug(PREFIX, 'Dividindo por seções...');
    
    const sectionRegex = /(seção\s+\d+|section\s+\d+|artigo\s+\d+|art\.\s*\d+|anexo\s+[a-z\d])/gi;
    const divisions: DocumentDivision[] = [];
    
    const parts = content.split(sectionRegex);
    let currentSection = '';
    let sectionNumber = 1;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      if (part.match(sectionRegex)) {
        currentSection = part;
      } else if (part.length > 100) {
        const fullContent = currentSection ? `${currentSection}\n\n${part}` : part;
        
        if (fullContent.length > DOCUMENT_CONFIG.DIVISION.MIN_SECTION_SIZE) {
          divisions.push(this.createDivision(
            currentSection || `Seção ${sectionNumber}`,
            fullContent,
            divisions.length
          ));
          sectionNumber++;
        }
      }
    }
    
    if (divisions.length < 2) {
      logger.warn(PREFIX, 'Poucas seções encontradas, usando divisão por tamanho');
      return this.divideBySize(content);
    }
    
    return divisions;
  }
  
  private divideByParagraphs(content: string): DocumentDivision[] {
    logger.debug(PREFIX, 'Dividindo por parágrafos...');
    
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    const divisions: DocumentDivision[] = [];
    
    let currentGroup = '';
    let groupNumber = 1;
    
    for (const paragraph of paragraphs) {
      currentGroup += paragraph + '\n\n';
      
      if (currentGroup.length >= DOCUMENT_CONFIG.DIVISION.MAX_SECTION_SIZE) {
        divisions.push(this.createDivision(
          `Seção ${groupNumber}`,
          currentGroup.trim(),
          divisions.length
        ));
        
        currentGroup = '';
        groupNumber++;
      }
    }
    
    // Adicionar último grupo se não estiver vazio
    if (currentGroup.trim().length > DOCUMENT_CONFIG.DIVISION.MIN_SECTION_SIZE) {
      divisions.push(this.createDivision(
        `Seção ${groupNumber}`,
        currentGroup.trim(),
        divisions.length
      ));
    }
    
    return divisions;
  }
  
  private divideBySize(content: string): DocumentDivision[] {
    logger.debug(PREFIX, 'Dividindo por tamanho...');
    
    const divisions: DocumentDivision[] = [];
    const maxSize = DOCUMENT_CONFIG.DIVISION.MAX_SECTION_SIZE;
    const minSize = DOCUMENT_CONFIG.DIVISION.MIN_SECTION_SIZE;
    
    let start = 0;
    let sectionNumber = 1;
    
    while (start < content.length) {
      let end = Math.min(start + maxSize, content.length);
      
      // Tentar quebrar em uma quebra de linha próxima
      if (end < content.length) {
        const nearbyNewline = content.lastIndexOf('\n', end);
        if (nearbyNewline > start + minSize) {
          end = nearbyNewline;
        }
      }
      
      const sectionContent = content.slice(start, end).trim();
      
      if (sectionContent.length >= minSize) {
        divisions.push(this.createDivision(
          `Parte ${sectionNumber}`,
          sectionContent,
          divisions.length
        ));
        sectionNumber++;
      }
      
      start = end;
    }
    
    return divisions;
  }
  
  private createDivision(name: string, content: string, index: number): DocumentDivision {
    const cleanedContent = cleanText(content);
    const summary = this.generateSummary(cleanedContent);
    const tokenCount = estimateTokens(cleanedContent);
    
    logger.debug(PREFIX, `Criando divisão: "${name}" - ${tokenCount} tokens`);
    
    return {
      id: generateId(),
      nome: name,
      conteudo: cleanedContent,
      resumo: summary,
      indice: index,
      tokenCount,
    };
  }
  
  private generateSummary(content: string): string {
    logger.debug(PREFIX, 'Gerando resumo local...');
    
    // Pegar primeiras sentenças significativas
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let summary = '';
    for (const sentence of sentences.slice(0, 3)) {
      summary += sentence.trim() + '. ';
      if (summary.length >= DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH) {
        break;
      }
    }
    
    // Garantir tamanho mínimo e máximo
    if (summary.length < DOCUMENT_CONFIG.SUMMARY.MIN_LENGTH && sentences.length > 0) {
      summary = sentences[0].trim() + '. ';
    }
    
    if (summary.length > DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH) {
      summary = summary.substring(0, DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH - 3) + '...';
    }
    
    logger.debug(PREFIX, `Resumo gerado: ${summary.length} chars`);
    
    return summary || 'Seção do documento sem resumo disponível.';
  }
}

// Instância global
export const documentDivider = new DocumentDivider();

logger.success(PREFIX, 'Divisor de documentos carregado com sucesso');
