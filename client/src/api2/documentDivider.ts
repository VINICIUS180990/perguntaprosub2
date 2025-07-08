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
    logger.debug(PREFIX, 'Gerando resumo inteligente...');
    
    // === ETAPA 1: ANÁLISE ESTRUTURAL === //
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const structuralInfo = this.extractStructuralInfo(content, lines);
    
    // === ETAPA 2: EXTRAÇÃO DE SENTENÇAS RELEVANTES === //
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const scoredSentences = this.scoreSentences(sentences, structuralInfo);
    
    // === ETAPA 3: CONSTRUÇÃO DO RESUMO === //
    let summary = this.buildSmartSummary(scoredSentences, structuralInfo);
    
    // === ETAPA 4: VALIDAÇÃO E AJUSTES === //
    summary = this.validateAndAdjustSummary(summary);
    
    logger.debug(PREFIX, `Resumo inteligente gerado: ${summary.length} chars`);
    
    return summary;
  }

  /**
   * Extrai informações estruturais do conteúdo
   */
  private extractStructuralInfo(content: string, lines: string[]): any {
    const info = {
      title: '',
      hasNumbering: false,
      hasDefinitions: false,
      hasDates: false,
      hasValues: false,
      keyTerms: [] as string[],
      firstLine: '',
      lastLine: ''
    };

    // Detectar título/primeiro elemento estrutural
    const titlePatterns = [
      /^(art\.|artigo|capítulo|seção|anexo|item)\s+[\w\d]+/i,
      /^[\d\w]+[\.\)]\s/,
      /^[A-Z][^.!?]*$/
    ];

    for (const line of lines.slice(0, 3)) {
      for (const pattern of titlePatterns) {
        if (pattern.test(line.trim())) {
          info.title = line.trim();
          break;
        }
      }
      if (info.title) break;
    }

    // Detectar padrões estruturais
    info.hasNumbering = /\b(art\.|artigo|item|alínea|\d+º|\d+\.|§)\s*\d+/i.test(content);
    info.hasDefinitions = /\b(é definido como|considera-se|entende-se por|define-se|significa)\b/i.test(content);
    info.hasDates = /\b\d{1,2}\/\d{1,2}\/\d{4}|\b\d{4}\b|\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i.test(content);
    info.hasValues = /\b(R\$|US\$|\d+%|\d+,\d+)\b/.test(content);

    // Extrair termos-chave (palavras em maiúsculas, siglas)
    const keyTermMatches = content.match(/\b[A-Z]{2,}[A-Z\d]*\b/g);
    if (keyTermMatches) {
      info.keyTerms = [...new Set(keyTermMatches)].slice(0, 5);
    }

    // Primeira e última linha significativa
    info.firstLine = lines[0]?.trim() || '';
    info.lastLine = lines[lines.length - 1]?.trim() || '';

    return info;
  }

  /**
   * Pontua sentenças por relevância
   */
  private scoreSentences(sentences: string[], structuralInfo: any): Array<{sentence: string, score: number}> {
    return sentences.map(sentence => {
      let score = 0;
      
      // === PONTUAÇÃO POR POSIÇÃO === //
      const index = sentences.indexOf(sentence);
      if (index === 0) score += 3; // Primeira sentença
      if (index === sentences.length - 1) score += 2; // Última sentença
      if (index <= 2) score += 1; // Primeiras 3

      // === PONTUAÇÃO POR ESTRUTURA === //
      if (/^(art\.|artigo|capítulo|seção|item|\d+\.)/i.test(sentence.trim())) score += 4;
      if (/\b(estabelece|determina|regulamenta|define|dispõe)\b/i.test(sentence)) score += 3;
      if (/\b(é vedado|é proibido|é obrigatório|deve|deverá)\b/i.test(sentence)) score += 3;

      // === PONTUAÇÃO POR CONTEÚDO === //
      if (structuralInfo.hasDefinitions && /\b(é definido|considera-se|entende-se)\b/i.test(sentence)) score += 4;
      if (structuralInfo.hasValues && /\b(R\$|US\$|\d+%|\d+,\d+)\b/.test(sentence)) score += 2;
      if (structuralInfo.hasDates && /\b\d{1,2}\/\d{1,2}\/\d{4}|\b\d{4}\b/i.test(sentence)) score += 2;

      // === PONTUAÇÃO POR TERMOS-CHAVE === //
      structuralInfo.keyTerms.forEach((term: string) => {
        if (sentence.includes(term)) score += 1;
      });

      // === PENALIZAÇÃO === //
      if (sentence.length < 20) score -= 2; // Muito curta
      if (sentence.length > 200) score -= 1; // Muito longa
      if (/^(e|ou|mas|porém|contudo|todavia)\b/i.test(sentence.trim())) score -= 1; // Conectores

      return { sentence: sentence.trim(), score };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Constrói resumo inteligente
   */
  private buildSmartSummary(scoredSentences: Array<{sentence: string, score: number}>, structuralInfo: any): string {
    let summary = '';

    // === PRIORIDADE 1: TÍTULO/ESTRUTURA === //
    if (structuralInfo.title && structuralInfo.title.length < 100) {
      summary += structuralInfo.title + '. ';
    }

    // === PRIORIDADE 2: SENTENÇAS MAIS RELEVANTES === //
    const maxSentences = structuralInfo.title ? 2 : 3;
    const selectedSentences = scoredSentences
      .slice(0, maxSentences)
      .filter(item => item.score > 0)
      .map(item => item.sentence);

    for (const sentence of selectedSentences) {
      const toAdd = sentence.endsWith('.') ? sentence + ' ' : sentence + '. ';
      
      if (summary.length + toAdd.length <= DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH) {
        // Evitar duplicação
        if (!summary.toLowerCase().includes(sentence.toLowerCase().substring(0, 30))) {
          summary += toAdd;
        }
      } else {
        break;
      }
    }

    return summary.trim();
  }

  /**
   * Valida e ajusta o resumo final
   */
  private validateAndAdjustSummary(summary: string): string {
    // Garantir tamanho mínimo
    if (summary.length < DOCUMENT_CONFIG.SUMMARY.MIN_LENGTH) {
      // Fallback para método anterior se resumo inteligente falhar
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length === 0) {
        return 'Seção do documento sem resumo disponível.';
      }
      summary = sentences[0].trim() + '.';
    }

    // Garantir tamanho máximo
    if (summary.length > DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH) {
      // Cortar na última sentença completa
      const sentences = summary.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        const toAdd = sentence.trim() + '. ';
        if (truncated.length + toAdd.length <= DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH - 3) {
          truncated += toAdd;
        } else {
          break;
        }
      }
      
      summary = truncated.trim();
      if (!summary.endsWith('.')) {
        summary = summary.substring(0, DOCUMENT_CONFIG.SUMMARY.MAX_LENGTH - 3) + '...';
      }
    }

    // Limpar formatação
    summary = summary.replace(/\s+/g, ' ').trim();
    
    return summary || 'Seção do documento sem resumo disponível.';
  }
}

// Instância global
export const documentDivider = new DocumentDivider();

logger.success(PREFIX, 'Divisor de documentos carregado com sucesso');
