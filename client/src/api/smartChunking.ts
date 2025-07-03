/**
 * Sistema Híbrido de Análise Contextual - Estratégia Avançada para Documentos Grandes
 * 
 * Este sistema resolve os problemas do chunking tradicional através de:
 * 1. Análise semântica prévia dos documentos
 * 2. Seleção adaptativa de contexto baseada na pergunta
 * 3. Agregação inteligente de seções relacionadas
 * 4. Cache semântico para reduzir custos
 */

export interface SemanticSection {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  concepts: string[];
  startIndex: number;
  endIndex: number;
  relatedSections: string[];
  importance: number;
}

export interface QueryAnalysis {
  mainTopic: string;
  subtopics: string[];
  questionType: 'specific' | 'general' | 'comparison' | 'procedure';
  complexity: 'simple' | 'medium' | 'complex';
  requiredSections: number;
}

export interface ContextStrategy {
  maxTokens: number;
  prioritySections: string[];
  includeRelated: boolean;
  compressionLevel: 'none' | 'light' | 'medium' | 'aggressive';
}

/**
 * Classe principal do sistema híbrido
 */
export class SmartContextManager {
  private sections: SemanticSection[] = [];
  private queryCache = new Map<string, string>();
  private sectionCache = new Map<string, SemanticSection[]>();

  constructor(documentContent: string) {
    this.analyzeSections(documentContent);
    this.buildRelationships();
  }

  /**
   * Análise inteligente do documento em seções semânticas
   */
  private analyzeSections(content: string): void {
    // Identifica seções naturais do documento
    const sectionPatterns = [
      /^#{1,3}\s+(.+)$/gm, // Headers markdown
      /^([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][^.]{10,80}):?\s*$/gm, // Títulos em maiúscula
      /^(\d+\.?\d*\.?\s+[^.]{10,80})$/gm, // Numeração
      /^([IVX]+\.?\s+[^.]{10,80})$/gm, // Numeração romana
      /^(Art\.?\s*\d+|Artigo\s*\d+)/gm, // Artigos legais
      /^(Capítulo|CAPÍTULO|Seção|SEÇÃO)\s+/gm // Capítulos e seções
    ];

    let currentSection: Partial<SemanticSection> = {};
    let sectionContent = '';
    let sectionId = 0;
    let currentIndex = 0;

    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Verifica se é um novo título de seção
      const isNewSection = sectionPatterns.some(pattern => {
        const match = line.match(pattern);
        if (match) {
          // Salva seção anterior se existir
          if (currentSection.title && sectionContent.trim()) {
            this.finalizeSection(currentSection, sectionContent, sectionId++, currentIndex - sectionContent.length);
          }
          
          // Inicia nova seção
          currentSection = {
            title: match[1] || line,
            startIndex: currentIndex
          };
          sectionContent = line + '\n';
          return true;
        }
        return false;
      });

      if (!isNewSection) {
        sectionContent += line + '\n';
      }
      
      currentIndex += line.length + 1;
    }

    // Salva última seção
    if (currentSection.title && sectionContent.trim()) {
      this.finalizeSection(currentSection, sectionContent, sectionId, currentIndex - sectionContent.length);
    }

    console.log(`[SMART_CONTEXT] Documento analisado em ${this.sections.length} seções semânticas`);
  }

  /**
   * Finaliza uma seção com análise de palavras-chave e conceitos
   */
  private finalizeSection(
    section: Partial<SemanticSection>, 
    content: string, 
    id: number, 
    startIndex: number
  ): void {
    const keywords = this.extractKeywords(content);
    const concepts = this.extractConcepts(content);
    const importance = this.calculateImportance(content, keywords, concepts);

    this.sections.push({
      id: `section_${id}`,
      title: section.title || `Seção ${id + 1}`,
      content: content.trim(),
      keywords,
      concepts,
      startIndex,
      endIndex: startIndex + content.length,
      relatedSections: [], // Será preenchido em buildRelationships
      importance
    });
  }

  /**
   * Extrai palavras-chave relevantes de uma seção
   */
  private extractKeywords(content: string): string[] {
    const text = content.toLowerCase();
    
    // Termos técnicos militares importantes (expandido)
    const militaryTerms = [
      'disciplinar', 'transgressão', 'punição', 'sanção', 'licença', 'promoção', 
      'graduação', 'posto', 'soldo', 'remuneração', 'saúde', 'inspeção',
      'regulamento', 'estatuto', 'norma', 'procedimento', 'prazo', 'documento',
      'requerimento', 'autorização', 'dispensa', 'afastamento', 'férias',
      'tratamento', 'hospitalar', 'médico', 'enfermidade', 'pagamento',
      'vencimento', 'adicional', 'gratificação', 'carreira', 'progressão',
      'dependente', 'beneficiário', 'pensão', 'auxílio', 'indenização',
      'transferência', 'movimentação', 'lotação', 'designação', 'nomeação',
      'exoneração', 'demissão', 'exclusão', 'reforma', 'reserva',
      'ativo', 'inativo', 'aposentadoria', 'pensionista', 'militar',
      'civil', 'servidor', 'funcionário', 'oficial', 'praça'
    ];

    // Padrões específicos de documentos militares
    const militaryPatterns = [
      /art\w*\s*\d+/g,     // artigo, art
      /§\s*\d+/g,          // parágrafos
      /inciso\s*[ivx\d]+/g, // incisos
      /alínea\s*[a-z]/g,   // alíneas
      /item\s*\d+/g,       // itens
      /capítulo\s*[ivx\d]+/g, // capítulos
      /seção\s*[ivx\d]+/g, // seções
      /título\s*[ivx\d]+/g, // títulos
      /anexo\s*[ivx\d]+/g, // anexos
      /portaria\s*\d+/g,   // portarias
      /decreto\s*\d+/g,    // decretos
      /lei\s*\d+/g,        // leis
      /resolução\s*\d+/g,  // resoluções
      /instrução\s*\d+/g   // instruções
    ];

    const keywords = new Set<string>();
    
    // Adiciona termos militares encontrados
    militaryTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.add(term);
      }
    });

    // Adiciona padrões encontrados
    militaryPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => keywords.add(match.trim()));
    });

    // Palavras técnicas com alta frequência
    const technicalWords = content
      .match(/\b[a-záàâãéèêíïóôõöúçñ]{4,}\b/gi) || [];

    const wordFreq = new Map<string, number>();
    technicalWords.forEach(word => {
      const normalized = word.toLowerCase();
      if (normalized.length >= 4 && !this.isStopWord(normalized)) {
        wordFreq.set(normalized, (wordFreq.get(normalized) || 0) + 1);
      }
    });

    // Seleciona palavras mais frequentes
    Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Aumentado de 15 para 20
      .forEach(([word]) => keywords.add(word));

    return Array.from(keywords);
  }

  /**
   * Extrai conceitos de alto nível de uma seção
   */
  private extractConcepts(content: string): string[] {
    const concepts = new Set<string>();
    const text = content.toLowerCase();

    // Mapa de conceitos militares
    const conceptMap = new Map([
      ['disciplina', ['disciplinar', 'transgressão', 'punição', 'falta', 'sanção']],
      ['licenciamento', ['licença', 'afastamento', 'dispensa', 'autorização', 'férias']],
      ['carreira', ['promoção', 'progressão', 'posto', 'graduação', 'ascensão']],
      ['remuneração', ['soldo', 'pagamento', 'vencimento', 'salário', 'gratificação']],
      ['saúde', ['médico', 'hospitalar', 'tratamento', 'doença', 'inspeção']],
      ['documentação', ['documento', 'requerimento', 'formulário', 'certidão']],
      ['regulamentação', ['regulamento', 'norma', 'estatuto', 'lei', 'decreto']],
      ['temporal', ['prazo', 'período', 'duração', 'cronograma', 'calendário']]
    ]);

    conceptMap.forEach((keywords, concept) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        concepts.add(concept);
      }
    });

    return Array.from(concepts);
  }

  /**
   * Calcula importância de uma seção baseada em vários fatores
   */
  private calculateImportance(content: string, keywords: string[], concepts: string[]): number {
    let score = 0;
    
    // Tamanho da seção (seções muito pequenas ou muito grandes são menos importantes)
    const length = content.length;
    if (length >= 200 && length <= 3000) score += 2;
    else if (length >= 100 && length <= 5000) score += 1;
    
    // Densidade de palavras-chave
    score += Math.min(keywords.length * 0.5, 5);
    
    // Presença de conceitos
    score += Math.min(concepts.length * 1, 5);
    
    // Indicadores de importância no texto
    const importanceIndicators = [
      'importante', 'fundamental', 'obrigatório', 'necessário', 'essencial',
      'artigo', 'parágrafo', 'inciso', 'lei', 'decreto', 'portaria'
    ];
    
    importanceIndicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator)) score += 1;
    });
    
    return Math.min(score, 10); // Máximo 10
  }

  /**
   * Constrói relacionamentos entre seções
   */
  private buildRelationships(): void {
    this.sections.forEach(section => {
      section.relatedSections = this.findRelatedSections(section);
    });
  }

  /**
   * Encontra seções relacionadas baseado em similaridade de conteúdo
   */
  private findRelatedSections(targetSection: SemanticSection): string[] {
    const related: Array<{id: string, score: number}> = [];
    
    this.sections.forEach(section => {
      if (section.id === targetSection.id) return;
      
      let similarity = 0;
      
      // Similaridade por palavras-chave
      const keywordIntersection = targetSection.keywords.filter(k => 
        section.keywords.includes(k)
      );
      similarity += keywordIntersection.length * 2;
      
      // Similaridade por conceitos
      const conceptIntersection = targetSection.concepts.filter(c => 
        section.concepts.includes(c)
      );
      similarity += conceptIntersection.length * 3;
      
      // Proximidade física no documento
      const distance = Math.abs(section.startIndex - targetSection.startIndex);
      if (distance < 5000) similarity += 1;
      
      if (similarity >= 2) {
        related.push({ id: section.id, score: similarity });
      }
    });
    
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.id);
  }

  /**
   * Analisa uma pergunta para determinar estratégia de contexto
   */
  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Determina tipo da pergunta
    let questionType: QueryAnalysis['questionType'] = 'general';
    if (lowerQuery.includes('como') || lowerQuery.includes('procedimento')) {
      questionType = 'procedure';
    } else if (lowerQuery.includes('diferença') || lowerQuery.includes('comparar')) {
      questionType = 'comparison';
    } else if (lowerQuery.includes('artigo') || lowerQuery.includes('valor') || lowerQuery.includes('prazo')) {
      questionType = 'specific';
    }
    
    // Determina complexidade (mais generoso)
    let complexity: QueryAnalysis['complexity'] = 'medium'; // Padrão mudou de 'simple' para 'medium'
    const complexityIndicators = ['detalhado', 'completo', 'todos', 'tudo', 'explicar', 'como', 'procedimento', 'processo'];
    const simpleIndicators = ['qual', 'quanto', 'quando', 'onde'];
    
    if (complexityIndicators.some(ind => lowerQuery.includes(ind))) {
      complexity = 'complex';
    } else if (simpleIndicators.some(ind => lowerQuery.includes(ind)) && query.split(' ').length <= 5) {
      complexity = 'simple';
    }
    
    // Extrai tópico principal e subtópicos
    const keywords = this.extractKeywords(query);
    const mainTopic = keywords[0] || 'geral';
    const subtopics = keywords.slice(1, 4);
    
    // Determina número de seções necessárias (mais generoso)
    let requiredSections = 3; // Mínimo aumentado de 2 para 3
    if (complexity === 'complex') requiredSections = 8; // Aumentado de 5 para 8
    else if (complexity === 'medium') requiredSections = 5; // Aumentado de 3 para 5
    if (questionType === 'comparison') requiredSections += 2; // Aumentado bonus
    if (questionType === 'procedure') requiredSections += 1; // Bonus para procedimentos
    
    return {
      mainTopic,
      subtopics,
      questionType,
      complexity,
      requiredSections
    };
  }

  /**
   * Seleciona o melhor contexto para uma pergunta
   */
  public getOptimalContext(query: string, maxTokens: number = 6000): string {
    // Verifica cache primeiro
    const cacheKey = `${query.substring(0, 100)}_${maxTokens}`;
    if (this.queryCache.has(cacheKey)) {
      console.log('[SMART_CONTEXT] Resposta encontrada no cache');
      return this.queryCache.get(cacheKey)!;
    }
    
    const analysis = this.analyzeQuery(query);
    console.log(`[SMART_CONTEXT] Análise da pergunta:`, analysis);
    
    // Encontra seções mais relevantes
    const relevantSections = this.findRelevantSections(query, analysis);
    
    // Seleciona estratégia de contexto
    const strategy = this.determineStrategy(analysis, maxTokens);
    
    // Constrói contexto otimizado
    let context = this.buildOptimizedContext(relevantSections, strategy);
    
    // Verifica se o contexto é muito pequeno e compensa
    const contextTokens = this.estimateTokens(context);
    if (contextTokens < maxTokens * 0.3) { // Se usar menos de 30% do limite
      console.log(`[SMART_CONTEXT] Contexto pequeno (${contextTokens} tokens), expandindo...`);
      
      // Adiciona mais seções por importância
      const additionalSections = this.sections
        .filter(s => !relevantSections.includes(s))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, Math.ceil(analysis.requiredSections * 0.5)); // Adiciona 50% mais seções
      
      const expandedSections = [...relevantSections, ...additionalSections];
      context = this.buildOptimizedContext(expandedSections, strategy);
      
      console.log(`[SMART_CONTEXT] Contexto expandido para ${expandedSections.length} seções`);
    }
    
    // Aplica compressão se necessário
    if (this.estimateTokens(context) > maxTokens) {
      context = this.compressContext(context, strategy.compressionLevel, maxTokens);
    }
    
    // Salva no cache
    this.queryCache.set(cacheKey, context);
    
    console.log(`[SMART_CONTEXT] Contexto gerado: ${this.estimateTokens(context)} tokens estimados`);
    return context;
  }

  /**
   * Encontra seções mais relevantes para a pergunta
   */
  private findRelevantSections(query: string, analysis: QueryAnalysis): SemanticSection[] {
    const queryKeywords = this.extractKeywords(query);
    const queryLower = query.toLowerCase();
    
    const sectionScores = this.sections.map(section => {
      let score = 0;
      
      // Pontuação por palavras-chave
      queryKeywords.forEach(keyword => {
        if (section.content.toLowerCase().includes(keyword)) {
          score += 3;
        }
        if (section.keywords.includes(keyword)) {
          score += 2;
        }
        if (section.title.toLowerCase().includes(keyword)) {
          score += 4;
        }
      });
      
      // Pontuação por conceitos
      section.concepts.forEach(concept => {
        if (queryLower.includes(concept)) {
          score += 3;
        }
      });
      
      // Bonus por importância da seção
      score += section.importance * 0.5;
      
      // Bonus por tamanho adequado
      if (section.content.length >= 200 && section.content.length <= 2000) {
        score += 1;
      }
      
      return { section, score };
    });
    
    // Ordena por relevância
    const sortedSections = sectionScores
      .sort((a, b) => b.score - a.score);
    
    // Seleciona seções principais (mais generoso com pontuação baixa)
    let selectedSections = sortedSections
      .filter(item => item.score > 0)
      .slice(0, analysis.requiredSections)
      .map(item => item.section);
    
    // Se não encontrou seções suficientes, inclui as mais importantes mesmo com pontuação baixa
    if (selectedSections.length < analysis.requiredSections) {
      const additionalSections = this.sections
        .filter(s => !selectedSections.includes(s))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, analysis.requiredSections - selectedSections.length);
      
      selectedSections = [...selectedSections, ...additionalSections];
      console.log(`[SMART_CONTEXT] Adicionadas ${additionalSections.length} seções por importância`);
    }
    
    // Adiciona seções relacionadas sempre (não só para complexas)
    if (analysis.complexity !== 'simple') {
      const relatedIds = new Set<string>();
      selectedSections.forEach(section => {
        section.relatedSections.forEach(id => relatedIds.add(id));
      });
      
      const relatedSections = Array.from(relatedIds)
        .map(id => this.sections.find(s => s.id === id))
        .filter(s => s && !selectedSections.includes(s))
        .slice(0, 3) as SemanticSection[]; // Aumentado de 2 para 3
      
      selectedSections.push(...relatedSections);
    }
    
    console.log(`[SMART_CONTEXT] Selecionadas ${selectedSections.length} seções relevantes`);
    return selectedSections;
  }

  /**
   * Determina estratégia baseada na análise da pergunta
   */
  private determineStrategy(analysis: QueryAnalysis, maxTokens: number): ContextStrategy {
    let compressionLevel: ContextStrategy['compressionLevel'] = 'none';
    
    // Mais generoso com compressão - só comprime se realmente necessário
    if (maxTokens < 4000) compressionLevel = 'aggressive';
    else if (maxTokens < 7000) compressionLevel = 'medium';
    else if (maxTokens < 10000 && analysis.complexity === 'complex') compressionLevel = 'light';
    
    return {
      maxTokens,
      prioritySections: [], // Será preenchido dinamicamente
      includeRelated: analysis.complexity !== 'simple',
      compressionLevel
    };
  }

  /**
   * Constrói contexto otimizado
   */
  private buildOptimizedContext(sections: SemanticSection[], strategy: ContextStrategy): string {
    let context = `[DOCUMENTO ANALISADO - ${sections.length} SEÇÕES RELEVANTES]\n\n`;
    
    // Ordena seções por importância e relevância
    const orderedSections = sections.sort((a, b) => b.importance - a.importance);
    
    orderedSections.forEach((section, index) => {
      context += `=== ${section.title.toUpperCase()} ===\n`;
      
      let sectionContent = section.content;
      
      // Aplica compressão por seção se necessário
      if (strategy.compressionLevel !== 'none') {
        sectionContent = this.compressSectionContent(sectionContent, strategy.compressionLevel);
      }
      
      context += sectionContent;
      
      if (index < orderedSections.length - 1) {
        context += '\n\n---\n\n';
      }
    });
    
    return context;
  }

  /**
   * Comprime conteúdo de uma seção
   */
  private compressSectionContent(content: string, level: ContextStrategy['compressionLevel']): string {
    if (level === 'none') return content;
    
    let compressed = content;
    
    // Nível light: remove espaços extras e linhas vazias
    if (level === 'light') {
      compressed = compressed
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
    }
    
    // Nível medium: remove também repetições e exemplos menos importantes
    else if (level === 'medium') {
      compressed = compressed
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/(por exemplo|exemplo|isto é|ou seja)[^.]*\./gi, '')
        .replace(/\([^)]{50,}\)/g, '')
        .trim();
    }
    
    // Nível aggressive: mantém apenas informações essenciais
    else if (level === 'aggressive') {
      // Mantém apenas frases com palavras-chave importantes
      const sentences = compressed.split(/[.!?]+/);
      const importantSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('deve') || lower.includes('é') || 
               lower.includes('será') || lower.includes('pode') ||
               lower.includes('artigo') || lower.includes('prazo') ||
               lower.length < 200; // Frases curtas são geralmente mais importantes
      });
      
      compressed = importantSentences.join('. ').trim() + '.';
    }
    
    return compressed;
  }

  /**
   * Comprime contexto geral para caber no limite de tokens
   */
  private compressContext(context: string, level: ContextStrategy['compressionLevel'], maxTokens: number): string {
    let compressed = this.compressSectionContent(context, level);
    
    // Se ainda está muito grande, remove seções menos importantes
    if (this.estimateTokens(compressed) > maxTokens) {
      const sections = compressed.split('===').slice(1); // Remove header
      const reducedSections = sections.slice(0, Math.ceil(sections.length * 0.7));
      compressed = '[DOCUMENTO ANALISADO - VERSÃO COMPRIMIDA]\n\n===' + reducedSections.join('===');
    }
    
    return compressed;
  }

  /**
   * Estima número de tokens (aproximação simples)
   */
  private estimateTokens(text: string): number {
    // Estimativa: 1 token ≈ 4 caracteres para português
    return Math.ceil(text.length / 4);
  }

  /**
   * Verifica se uma palavra é stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'que', 'para', 'com', 'por', 'uma', 'ser', 'ter', 'fazer',
      'como', 'mais', 'sobre', 'este', 'esta', 'quando', 'onde',
      'muito', 'bem', 'seu', 'sua', 'meu', 'minha', 'nosso'
    ]);
    return stopWords.has(word);
  }

  /**
   * Obtém estatísticas do sistema
   */
  public getStats(): {
    totalSections: number;
    averageImportance: number;
    cacheSize: number;
    concepts: string[];
  } {
    const averageImportance = this.sections.reduce((sum, s) => sum + s.importance, 0) / this.sections.length;
    const allConcepts = [...new Set(this.sections.flatMap(s => s.concepts))];
    
    return {
      totalSections: this.sections.length,
      averageImportance: Math.round(averageImportance * 100) / 100,
      cacheSize: this.queryCache.size,
      concepts: allConcepts
    };
  }

  /**
   * Limpa cache para otimizar memória
   */
  public clearCache(): void {
    this.queryCache.clear();
    this.sectionCache.clear();
    console.log('[SMART_CONTEXT] Cache limpo');
  }
}
