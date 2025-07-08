/**
 * PROCESSADOR DE QUERIES    // Se mudou de documento, limpar contexto anterior
    if (isDocumentChange) {
      logger.info(PREFIX, `🔄 MUDANÇA DE DOCUMENTO DETECTADA:`);
      logger.info(PREFIX, `   📄 De: "${previousDocumentName}"`);
      logger.info(PREFIX, `   📄 Para: "${document.name}"`);
      logger.info(PREFIX, `💰 Encerrando conversa anterior - Custo total: $${this.totalConversationCost.toFixed(6)}`);
      logger.info(PREFIX, `📝 Limpando ${this.conversationHistory.length} mensagens do histórico`);
      
      // Limpar histórico e custos da conversa anterior
      this.conversationHistory = [];
      this.totalConversationCost = 0;
      
      logger.success(PREFIX, '🆕 Nova conversa iniciada com documento diferente');
    }rocessa perguntas do usuário com lógica inteligente
 */

import { DEBUG_CONFIG } from './config';
import { logger, PerformanceTimer } from './utils';
import { partSelector } from './partSelector';
import { costMonitor } from './costMonitor';
import { callChatAPI } from './chat';
import { createSmallDocumentPrompt, formatSelectedSections } from './prompts';
import type { QueryResponse, QueryAnalysis, SmallDocument, LargeDocument, DocumentDivision } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.QUERY;

logger.info(PREFIX, 'Inicializando processador de queries...');

export class QueryProcessor {
  private queryCount = 0;
  private activeDocument: SmallDocument | LargeDocument | null = null;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  private totalConversationCost = 0; // 💰 Custo total acumulado da conversa
  
  /**
   * Define documento ativo para queries
   */
  setActiveDocument(document: SmallDocument | LargeDocument): void {
    const previousDocumentName = this.activeDocument?.name;
    const isDocumentChange = previousDocumentName && previousDocumentName !== document.name;
    
    logger.debug(PREFIX, `🔍 DEBUG TROCA DE DOCUMENTO:`);
    logger.debug(PREFIX, `   📄 Documento anterior: ${previousDocumentName || 'Nenhum'}`);
    logger.debug(PREFIX, `   📄 Novo documento: ${document.name}`);
    logger.debug(PREFIX, `   🔄 É mudança?: ${isDocumentChange}`);
    logger.debug(PREFIX, `   📝 Histórico atual: ${this.conversationHistory.length} mensagens`);
    logger.debug(PREFIX, `   💰 Custo atual: $${this.totalConversationCost.toFixed(6)}`);
    
    // Se mudou de documento, limpar contexto anterior
    if (isDocumentChange) {
      logger.info(PREFIX, `🔄 MUDANÇA DE DOCUMENTO DETECTADA:`);
      logger.info(PREFIX, `   📄 De: "${previousDocumentName}"`);
      logger.info(PREFIX, `   📄 Para: "${document.name}"`);
      logger.info(PREFIX, `💰 Encerrando conversa anterior - Custo total: $${this.totalConversationCost.toFixed(6)}`);
      logger.info(PREFIX, `📝 Limpando ${this.conversationHistory.length} mensagens do histórico`);
      
      // Limpar histórico e custos da conversa anterior
      this.conversationHistory = [];
      this.totalConversationCost = 0;
      
      logger.success(PREFIX, '🆕 Nova conversa iniciada com documento diferente');
    } else if (previousDocumentName) {
      logger.info(PREFIX, `📄 Mesmo documento mantido: "${document.name}"`);
    } else {
      logger.info(PREFIX, `📄 Primeiro documento carregado: "${document.name}"`);
    }
    
    this.activeDocument = document;
    
    logger.info(PREFIX, `📄 Documento ativo definido: ${document.name}`);
    logger.debug(PREFIX, `Tipo: ${document.type}, Tokens: ${document.tokenCount}`);
    
    if (document.type === 'LARGE') {
      const largeDoc = document as LargeDocument;
      logger.debug(PREFIX, `Divisões: ${largeDoc.divisions.length}`);
    }
    
    if (isDocumentChange) {
      logger.info(PREFIX, '✅ Contexto resetado - pronto para nova conversa');
    }
  }
  
  /**
   * Define documento ativo para queries com opção de manter contexto
   */
  setActiveDocumentWithContext(document: SmallDocument | LargeDocument, keepContext: boolean = false): void {
    const previousDocumentName = this.activeDocument?.name;
    const isDocumentChange = previousDocumentName && previousDocumentName !== document.name;
    
    // Se mudou de documento e não quer manter contexto, limpar
    if (isDocumentChange && !keepContext) {
      logger.info(PREFIX, `🔄 MUDANÇA DE DOCUMENTO (forçada):`);
      logger.info(PREFIX, `   📄 Anterior: ${previousDocumentName}`);
      logger.info(PREFIX, `   📄 Novo: ${document.name}`);
      logger.info(PREFIX, `💰 Finalizando contexto anterior - Custo total: $${this.totalConversationCost.toFixed(6)}`);
      
      // Limpar histórico e custos da conversa anterior
      this.conversationHistory = [];
      this.totalConversationCost = 0;
      
      logger.info(PREFIX, '🆕 Iniciando nova conversa (contexto forçadamente limpo)');
    } else if (isDocumentChange && keepContext) {
      logger.info(PREFIX, `🔄 MUDANÇA DE DOCUMENTO (mantendo contexto):`);
      logger.info(PREFIX, `   📄 Anterior: ${previousDocumentName}`);
      logger.info(PREFIX, `   📄 Novo: ${document.name}`);
      logger.info(PREFIX, '📝 Mantendo histórico da conversa anterior');
    }
    
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
    logger.debug(PREFIX, `Histórico de conversa: ${this.conversationHistory.length} mensagens`);
    
    try {
      // Adicionar pergunta do usuário ao histórico
      this.addToConversationHistory('user', query);
      
      // ETAPA 1: Análise do contexto da pergunta (apenas informativa)
      const needsDocument = await this.analyzeDocumentNeed(query);
      
      logger.info(PREFIX, `🤔 CONTEXTO: ${needsDocument.reasoning}`);
      logger.debug(PREFIX, `Tipo: ${needsDocument.needsDocument ? 'Específica' : 'Geral'} (${(needsDocument.confidence * 100).toFixed(1)}%)`);
      
      let response: QueryResponse;
      
      if (!this.activeDocument) {
        // NÃO TEM DOCUMENTO - sempre avisar que seria melhor ter um documento
        logger.info(PREFIX, '📋 Nenhum documento carregado - processando como query geral com recomendação');
        response = await this.processGeneralQueryWithDocumentRecommendation(query, needsDocument.reasoning);
        
      } else if (this.activeDocument.type === 'SMALL') {
        // DOCUMENTO PEQUENO - sempre usar o documento completo
        logger.info(PREFIX, '� Usando documento pequeno completo');
        response = await this.processSmallDocumentQuery(query, this.activeDocument);
        
      } else {
        // DOCUMENTO GRANDE - sempre seguir fluxo completo (resumo → seções → completo)
        logger.info(PREFIX, '� Iniciando fluxo completo com documento grande');
        response = await this.processLargeDocumentWithSummary(query, this.activeDocument as LargeDocument, needsDocument.needsDocument);
      }
      
      // Adicionar resposta da API ao histórico
      this.addToConversationHistory('assistant', response.answer);
      
      const processingTime = timer.end();
      response.processingTime = processingTime;
      
      // Somar custo ao total da conversa
      this.totalConversationCost += response.tokenCost.total;
      
      logger.success(PREFIX, '✅ QUERY PROCESSADA COM SUCESSO!');
      logger.info(PREFIX, `📝 Resposta: ${response.answer.length} chars`);
      logger.info(PREFIX, `🔢 Tokens: ${response.tokenCost.input} input + ${response.tokenCost.output} output`);
      logger.info(PREFIX, `💰 Custo: $${response.tokenCost.total.toFixed(6)}`);
      logger.info(PREFIX, `💵 CUSTO TOTAL DA CONVERSA: $${this.totalConversationCost.toFixed(6)}`);
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
   * Analisa se a query precisa do documento (simplificado - apenas para logs e contexto)
   */
  private async analyzeDocumentNeed(query: string): Promise<QueryAnalysis> {
    logger.debug(PREFIX, '🤔 Analisando contexto da pergunta...');
    
    // Análise simplificada apenas para contexto
    const analysis = this.quickDocumentNeedAnalysis(query);
    
    logger.debug(PREFIX, `Análise concluída: ${analysis.reasoning}`);
    
    return analysis;
  }
  
  /**
   * Análise rápida do contexto da pergunta (apenas para logs e informação)
   */
  private quickDocumentNeedAnalysis(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Categorizar tipos de pergunta para contexto
    if (/^(oi|olá|hello|hi|obrigad|thanks|tchau|bye)\b/.test(lowerQuery)) {
      return {
        needsDocument: false,
        confidence: 0.9,
        reasoning: 'Pergunta de cumprimento ou agradecimento'
      };
    }
    
    if (/\b(formulário|procedimento|incluir.*dependente|aposentadoria|regulamento)\b/.test(lowerQuery)) {
      return {
        needsDocument: true,
        confidence: 0.9,
        reasoning: 'Pergunta específica sobre procedimentos/regulamentos'
      };
    }
    
    if (lowerQuery.length < 10) {
      return {
        needsDocument: false,
        confidence: 0.7,
        reasoning: 'Pergunta muito curta'
      };
    }
    
    // Contexto geral
    return {
      needsDocument: true,
      confidence: 0.6,
      reasoning: 'Pergunta geral - beneficiaria de documento específico'
    };
  }
  
  /**
   * Processa query quando não há documento carregado
   */
  private async processGeneralQueryWithDocumentRecommendation(query: string, reasoning: string): Promise<QueryResponse> {
    logger.processing(PREFIX, '📋 Processando query sem documento - sempre recomendando carregar documento...');
    
    const systemPrompt = `Você é um assistente especializado. O usuário fez uma pergunta mas nenhum documento foi carregado no sistema.

PERGUNTA DO USUÁRIO: ${query}

ANÁLISE: ${reasoning}

INSTRUÇÕES:
1. Responda à pergunta da melhor forma possível com conhecimento geral
2. SEMPRE mencione que a resposta seria muito mais precisa e detalhada com um documento específico carregado
3. Sugira fortemente que o usuário carregue o documento apropriado (manual, regulamento, formulário, política, etc.) para obter:
   - Informações específicas e atualizadas
   - Procedimentos detalhados
   - Regras e critérios precisos
   - Referências exatas
4. Explique que com um documento carregado, você poderia dar uma resposta muito mais completa e confiável
5. Mantenha tom profissional e útil

Resposta:`;
    
    const messages = this.prepareMessagesWithHistory(systemPrompt);
    
    const response = await callChatAPI(messages);
    
    // Registrar custo
    costMonitor.logOperation(
      'GENERAL_QUERY_WITH_RECOMMENDATION',
      response.tokensUsed.input,
      response.tokensUsed.output,
      'Query geral com recomendação forte para carregar documento'
    );
    
    return {
      answer: response.content,
      documentUsed: false,
      sectionsUsed: [],
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.cost
      },
      fromCache: false
    };
  }
  
  /**
   * Processa query com documento pequeno
   */
  private async processSmallDocumentQuery(query: string, document: SmallDocument): Promise<QueryResponse> {
    logger.processing(PREFIX, '📄 Processando query com documento pequeno...');
    
    const systemPrompt = createSmallDocumentPrompt(document.content, query, 'COMPLETE_DOCUMENT');
    const messages = this.prepareMessagesWithHistory(systemPrompt);
    
    const response = await callChatAPI(messages);
    
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
        total: response.cost  // ✅ Usar o custo em dólares, não tokens!
      },
      fromCache: false
    };
  }
  
  /**
   * Processa query com documento grande sempre enviando resumo
   * Permite que a API decida se quer partes específicas
   */
  private async processLargeDocumentWithSummary(
    query: string, 
    document: LargeDocument, 
    analysisNeedsDocument: boolean
  ): Promise<QueryResponse> {
    logger.processing(PREFIX, '📚 Processando query com documento grande (com resumo)...');
    
    // Criar resumo do documento a partir das divisões
    const summaryParts = document.divisions.map(div => ({
      nome: div.nome,
      resumo: div.resumo
    }));
    
    const documentSummary = summaryParts.map((part, index) => 
      `${index + 1}. **${part.nome}**: ${part.resumo}`
    ).join('\n');
    
    // Criar prompt que inclui resumo e pergunta, deixando API decidir
    const systemPrompt = this.createDocumentSummaryPrompt(documentSummary, query, analysisNeedsDocument);
    const messages = this.prepareMessagesWithHistory(systemPrompt);
    
    const response = await callChatAPI(messages);
    
    // Se a resposta indicar que precisa de partes específicas, processar normalmente
    const needsMoreSections = response.content.includes('[NEED_MORE_SECTIONS]');
    
    if (needsMoreSections) {
      logger.info(PREFIX, '🎯 API solicitou seções específicas, processando seleção...');
      logger.debug(PREFIX, `Conteúdo da resposta: ${response.content.substring(0, 300)}...`);
      return await this.processLargeDocumentQuery(query, document, [], 1, []);
    }
    
    // Registrar custo
    costMonitor.logOperation(
      'LARGE_DOCUMENT_SUMMARY',
      response.tokensUsed.input,
      response.tokensUsed.output,
      `Query com documento grande (resumo): ${document.name}`
    );
    
    return {
      answer: response.content,
      documentUsed: true,
      sectionsUsed: ['Resumo do Documento'],
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.cost  // ✅ Usar o custo em dólares, não tokens!
      },
      fromCache: false
    };
  }

  /**
   * Cria prompt para documento com resumo
   */
  private createDocumentSummaryPrompt(
    documentSummary: string, 
    userQuery: string, 
    analysisNeedsDocument: boolean
  ): string {
    return `Você é um assistente especializado em análise de documentos. Você tem acesso ao resumo de um documento e deve responder à pergunta do usuário.

ANÁLISE PRÉVIA: ${analysisNeedsDocument ? 'A pergunta parece estar relacionada ao documento' : 'A pergunta pode não estar diretamente relacionada ao documento'}

RESUMO DO DOCUMENTO DISPONÍVEL:
${documentSummary}

PERGUNTA DO USUÁRIO:
${userQuery}

INSTRUÇÕES OBRIGATÓRIAS:
1. Se você pode responder adequadamente com base no resumo, responda diretamente SEM usar nenhum código especial
2. Se a pergunta requer informações específicas que não estão no resumo, responda EXATAMENTE assim: "[NEED_MORE_SECTIONS]" seguido de uma linha explicando quais seções específicas você precisa
3. Se a pergunta não tem relação com o documento, responda normalmente explicando isso
4. IMPORTANTE: Use EXATAMENTE o código "[NEED_MORE_SECTIONS]" se precisar de mais informações - não use outras variações

FORMATO OBRIGATÓRIO para solicitar mais seções:
[NEED_MORE_SECTIONS]
Preciso de acesso aos anexos X, Y, Z para detalhar [explicação específica]

Resposta:`;
  }

  /**
   * Processa query com documento grande (método de fallback para seleção de seções)
   */
  private async processLargeDocumentQuery(
    query: string, 
    document: LargeDocument, 
    excludedSections: string[] = [],
    attemptNumber: number = 1,
    previousSections: DocumentDivision[] = []
  ): Promise<QueryResponse> {
    logger.processing(PREFIX, `📚 Processando query com documento grande (tentativa ${attemptNumber})...`);
    
    // Selecionar partes relevantes (excluindo seções já tentadas)
    const availableDivisions = document.divisions.filter(div => 
      !excludedSections.includes(div.nome) && 
      !previousSections.some(prev => prev.nome === div.nome)
    );
    
    if (availableDivisions.length === 0) {
      logger.warn(PREFIX, '⚠️ Todas as seções foram tentadas sem sucesso');
      return this.createNoContentFoundResponse(query, document, excludedSections);
    }
    
    const selection = await partSelector.selectRelevantParts(query, availableDivisions);
    
    // COMBINANDO SEÇÕES: Seções anteriores + novas seções selecionadas
    const allSections = [...previousSections, ...selection.selectedParts];
    
    logger.info(PREFIX, `🎯 Selecionadas: ${selection.selectedParts.length} novas + ${previousSections.length} anteriores = ${allSections.length} total (tentativa ${attemptNumber})`);
    logger.debug(PREFIX, `Economia: ${selection.tokensSaved} tokens`);
    
    if (previousSections.length > 0) {
      logger.info(PREFIX, `📋 CONTEXTO ACUMULATIVO:`);
      logger.debug(PREFIX, `   Seções anteriores: [${previousSections.map(s => s.nome).join(', ')}]`);
      logger.debug(PREFIX, `   Seções novas: [${selection.selectedParts.map(s => s.nome).join(', ')}]`);
      logger.info(PREFIX, `   Total de seções enviadas para API: ${allSections.length}`);
    } else {
      logger.debug(PREFIX, `Seções selecionadas: [${selection.selectedParts.map(s => s.nome).join(', ')}]`);
    }
    
    // Formatar TODAS as seções (anteriores + novas) para o prompt
    const formattedSections = formatSelectedSections(
      allSections.map(part => ({
        nome: part.nome,
        conteudo: part.conteudo
      }))
    );
    
    const systemPrompt = this.createAdvancedDocumentPrompt(formattedSections, query, attemptNumber, excludedSections, previousSections.length);
    const messages = this.prepareMessagesWithHistory(systemPrompt);
    
    const response = await callChatAPI(messages);
    
    // Verificar se API solicita mais seções (detecção precisa)
    const needsMoreSections = response.content.includes('[NEED_MORE_SECTIONS]');
    
    if (needsMoreSections && attemptNumber < 3) {
      logger.info(PREFIX, '🔄 API solicitou mais seções, fazendo nova tentativa MANTENDO contexto anterior...');
      
      const usedSections = [...excludedSections, ...selection.selectedParts.map(part => part.nome)];
      // IMPORTANTE: Passa allSections como previousSections para manter o contexto
      return await this.processLargeDocumentQuery(query, document, usedSections, attemptNumber + 1, allSections);
    }
    
    // Verificar se API não encontrou resposta OU se chegou ao limite de tentativas
    const notFound = response.content.includes('[NO_RELEVANT_INFO]') || needsMoreSections;
    
    if (notFound) {
      logger.info(PREFIX, `📄 ${needsMoreSections ? 'Limite de tentativas atingido' : 'API não encontrou resposta'}, tentando com documento completo...`);
      return await this.processWithFullDocument(query, document);
    }
    
    // Registrar custo
    costMonitor.logOperation(
      'LARGE_DOCUMENT_QUERY',
      response.tokensUsed.input,
      response.tokensUsed.output,
      `Query com documento grande: ${document.name} (${allSections.length} seções total, tentativa ${attemptNumber})`
    );
    
    const allUsedSectionNames = allSections.map(section => section.nome);
    
    // IMPORTANTE: Verificar se a resposta contém códigos de controle que não deveriam chegar ao usuário
    if (response.content.includes('[NEED_MORE_SECTIONS]') || response.content.includes('[NO_RELEVANT_INFO]')) {
      logger.warn(PREFIX, '⚠️ Resposta contém códigos de controle - redirecionando para documento completo');
      return await this.processWithFullDocument(query, document);
    }
    
    return {
      answer: response.content,
      documentUsed: true,
      sectionsUsed: allUsedSectionNames,
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.cost  // ✅ Usar o custo em dólares, não tokens!
      },
      fromCache: false
    };
  }

  /**
   * Cria prompt avançado com opções de iteração
   */
  private createAdvancedDocumentPrompt(
    formattedSections: string, 
    query: string, 
    attemptNumber: number,
    excludedSections: string[],
    previousSectionsCount: number = 0
  ): string {
    const excludedInfo = excludedSections.length > 0 
      ? `\n\nNOTA: Já foram analisadas as seguintes seções sem sucesso: ${excludedSections.join(', ')}`
      : '';

    const contextInfo = previousSectionsCount > 0
      ? `\n\nCONTEXTO: Este prompt inclui ${previousSectionsCount} seções da tentativa anterior MAIS as novas seções selecionadas. Você tem acesso a TODAS as informações das tentativas anteriores.`
      : '';

    return `Você é um assistente especializado em análise de documentos. Você tem acesso a seções específicas de um documento e deve responder à pergunta do usuário.

SEÇÕES DISPONÍVEIS:
${formattedSections}

PERGUNTA DO USUÁRIO:
${query}${excludedInfo}${contextInfo}

INSTRUÇÕES OBRIGATÓRIAS (TENTATIVA ${attemptNumber}/3):
1. Se você pode responder adequadamente com as seções fornecidas, responda diretamente SEM usar nenhum código especial
2. Se a informação está incompleta mas você suspeita que há mais conteúdo relevante no documento, responda EXATAMENTE assim: "[NEED_MORE_SECTIONS]" seguido de uma linha explicando o que precisa
3. Se você não encontrou nenhuma informação relevante nas seções, responda EXATAMENTE assim: "[NO_RELEVANT_INFO]" seguido de uma explicação
4. IMPORTANTE: Use EXATAMENTE os códigos especificados - não use outras variações
5. LEMBRE-SE: Você tem acesso a TODAS as seções das tentativas anteriores - use todas as informações disponíveis para dar uma resposta completa

FORMATOS OBRIGATÓRIOS:
Para solicitar mais seções: [NEED_MORE_SECTIONS]
Para indicar que não encontrou: [NO_RELEVANT_INFO]

Resposta:`;
  }

  /**
   * Processa com documento completo como último recurso
   */
  private async processWithFullDocument(query: string, document: LargeDocument): Promise<QueryResponse> {
    logger.processing(PREFIX, '📋 Usando documento completo como último recurso...');
    
    // Criar versão condensada do documento completo
    const condensedContent = document.divisions.map(div => 
      `=== ${div.nome} ===\n${div.resumo}\n\nConteúdo: ${div.conteudo.substring(0, 500)}...`
    ).join('\n\n');
    
    const systemPrompt = `Você é um assistente especializado. Esta é uma consulta final usando o documento completo (condensado).

DOCUMENTO COMPLETO (CONDENSADO):
${condensedContent}

PERGUNTA DO USUÁRIO:
${query}

INSTRUÇÕES:
- Esta é a tentativa final com o documento completo
- Responda baseado em toda a informação disponível
- Se não encontrar resposta, seja claro sobre isso
- Indique quais partes do documento foram mais relevantes

Resposta:`;
    
    const messages = this.prepareMessagesWithHistory(systemPrompt);
    const response = await callChatAPI(messages);
    
    // Registrar custo
    costMonitor.logOperation(
      'FULL_DOCUMENT_FALLBACK',
      response.tokensUsed.input,
      response.tokensUsed.output,
      `Query com documento completo: ${document.name}`
    );
    
    return {
      answer: response.content,
      documentUsed: true,
      sectionsUsed: ['Documento Completo (Condensado)'],
      processingTime: response.processingTime,
      tokenCost: {
        input: response.tokensUsed.input,
        output: response.tokensUsed.output,
        total: response.cost  // ✅ Usar o custo em dólares, não tokens!
      },
      fromCache: false
    };
  }

  /**
   * Cria resposta quando nenhum conteúdo relevante é encontrado
   */
  private createNoContentFoundResponse(
    query: string, 
    document: LargeDocument, 
    excludedSections: string[]
  ): QueryResponse {
    const answer = `Busquei por informações relacionadas à sua pergunta "${query}" em todo o documento "${document.name}", mas não encontrei conteúdo relevante. 

Analisei as seguintes seções: ${excludedSections.join(', ')}.

Possíveis razões:
- A informação pode não estar presente no documento
- A pergunta pode estar formulada de forma diferente do que está no texto
- O conteúdo pode estar em uma seção não identificada pelo sistema

Sugestão: Tente reformular a pergunta ou verificar se a informação realmente está no documento.`;

    return {
      answer,
      documentUsed: true,
      sectionsUsed: excludedSections,
      processingTime: 0,
      tokenCost: { input: 0, output: 0, total: 0 },
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
    logger.info(PREFIX, 'Removendo documento ativo e limpando histórico da conversa');
    this.activeDocument = null;
    this.clearConversationHistory();
  }
  
  /**
   * Obtém estatísticas
   */
  getStats(): {
    totalQueries: number;
    activeDocument: string | null;
    hasActiveDocument: boolean;
    conversationLength: number;
    totalConversationCost: number;
  } {
    return {
      totalQueries: this.queryCount,
      activeDocument: this.activeDocument?.name || null,
      hasActiveDocument: !!this.activeDocument,
      conversationLength: this.conversationHistory.length,
      totalConversationCost: this.totalConversationCost
    };
  }
  
  /**
   * Reset estatísticas
   */
  resetStats(): void {
    logger.info(PREFIX, 'Resetando estatísticas e limpando histórico');
    logger.info(PREFIX, `💰 Custo total da conversa resetado: $${this.totalConversationCost.toFixed(6)}`);
    this.queryCount = 0;
    this.totalConversationCost = 0;
    this.clearConversationHistory();
  }

  /**
   * Adiciona mensagem ao histórico da conversa
   */
  private addToConversationHistory(role: 'user' | 'assistant', content: string): void {
    // Manter apenas as últimas 10 mensagens para evitar crescimento excessivo
    if (this.conversationHistory.length >= 10) {
      this.conversationHistory = this.conversationHistory.slice(-8);
    }
    
    this.conversationHistory.push({ role, content });
    logger.debug(PREFIX, `Histórico atualizado: ${this.conversationHistory.length} mensagens`);
  }

  /**
   * Prepara mensagens para API incluindo histórico de conversa
   */
  private prepareMessagesWithHistory(systemPrompt: string): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Adicionar histórico completo da conversa
    messages.push(...this.conversationHistory);
    
    logger.debug(PREFIX, `Preparadas ${messages.length} mensagens para API (1 system + ${this.conversationHistory.length} histórico)`);
    
    return messages;
  }

  /**
   * Limpa histórico da conversa
   */
  clearConversationHistory(): void {
    if (this.totalConversationCost > 0) {
      logger.info(PREFIX, `💰 Finalizando conversa - Custo total: $${this.totalConversationCost.toFixed(6)}`);
    }
    logger.info(PREFIX, 'Limpando histórico da conversa');
    this.conversationHistory = [];
    this.totalConversationCost = 0; // Reset do custo ao limpar conversa
  }

  /**
   * Verifica se há mudança de documento que pode afetar o contexto
   */
  hasDocumentContextChange(newDocument: SmallDocument | LargeDocument): boolean {
    return !!(this.activeDocument && this.activeDocument.name !== newDocument.name);
  }

  /**
   * Força limpeza do contexto da conversa
   */
  forceContextReset(): void {
    const previousCost = this.totalConversationCost;
    const previousHistoryLength = this.conversationHistory.length;
    
    if (previousCost > 0 || previousHistoryLength > 0) {
      logger.info(PREFIX, '🔄 RESET DE CONTEXTO FORÇADO:');
      logger.info(PREFIX, `💰 Custo anterior: $${previousCost.toFixed(6)}`);
      logger.info(PREFIX, `📝 Mensagens anteriores: ${previousHistoryLength}`);
      
      this.conversationHistory = [];
      this.totalConversationCost = 0;
      
      logger.info(PREFIX, '✅ Contexto resetado com sucesso');
    } else {
      logger.info(PREFIX, '💭 Contexto já estava limpo');
    }
  }
}

// Instância global
export const queryProcessor = new QueryProcessor();

logger.success(PREFIX, 'Processador de queries carregado com sucesso');
