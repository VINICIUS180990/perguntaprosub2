/**
 * Sistema de pré-processamento inteligente para otimizar documentos
 */

import { chunkDocument, findRelevantChunks, combineRelevantChunks, hybridSearch } from './chunking';
import type { DocumentChunk } from './chunking';
import { compressContext, removeRedundantContent, estimateTokens } from './compression';
import { debugMonitor, createDebugInfo } from './debug';

export interface ProcessingOptions {
  maxTokens?: number;
  enableChunking?: boolean;
  enableCompression?: boolean;
  relevanceThreshold?: number;
  maxChunks?: number;
  chunkOverlap?: boolean;
}

/**
 * Processa documento otimizando para reduzir custos e melhorar relevância
 */
export function preprocessDocument(
  content: string,
  query: string,
  options: ProcessingOptions = {}
): string {
  const {
    maxTokens = 4000,
    enableChunking = true,
    enableCompression = true
  } = options;

  console.log(`[PREPROCESSOR] Documento original: ${estimateTokens(content)} tokens`);
  console.log(`[PREPROCESSOR] Query: "${query}"`);

  let processedContent = content;

  // 1. Remove conteúdo redundante primeiro
  if (enableCompression) {
    processedContent = removeRedundantContent(processedContent);
    console.log(`[PREPROCESSOR] Após limpeza: ${estimateTokens(processedContent)} tokens`);
  }

  // 2. Se ainda está muito grande, usa busca inteligente
  if (enableChunking && estimateTokens(processedContent) > maxTokens) {
    processedContent = intelligentDocumentSearch(processedContent, query, options);
    console.log(`[PREPROCESSOR] Após busca inteligente: ${estimateTokens(processedContent)} tokens`);
  }

  // 3. Se ainda está grande, comprime o contexto
  if (enableCompression && estimateTokens(processedContent) > maxTokens) {
    processedContent = compressContext(processedContent, maxTokens * 4); // *4 por causa da estimativa de tokens
    console.log(`[PREPROCESSOR] Após compressão final: ${estimateTokens(processedContent)} tokens`);
  }

  return processedContent;
}

/**
 * Adiciona contexto adjacente aos chunks relevantes encontrados
 */
function addAdjacentContext(
  currentContent: string, 
  allChunks: DocumentChunk[], 
  selectedChunks: DocumentChunk[], 
  maxTokens: number
): string {
  // Identifica chunks adjacentes que não foram selecionados
  const selectedIds = new Set(selectedChunks.map(c => c.id));
  const adjacentChunks: DocumentChunk[] = [];
  
  selectedChunks.forEach(chunk => {
    const chunkIndex = allChunks.findIndex(c => c.id === chunk.id);
    
    // Chunk anterior
    if (chunkIndex > 0 && !selectedIds.has(allChunks[chunkIndex - 1].id)) {
      adjacentChunks.push(allChunks[chunkIndex - 1]);
    }
    
    // Chunk posterior
    if (chunkIndex < allChunks.length - 1 && !selectedIds.has(allChunks[chunkIndex + 1].id)) {
      adjacentChunks.push(allChunks[chunkIndex + 1]);
    }
  });
  
  // Tenta adicionar chunks adjacentes sem exceder o limite
  let expandedContent = currentContent;
  
  for (const adjacent of adjacentChunks) {
    const testContent = expandedContent + '\n\n[CONTEXTO ADICIONAL]\n' + adjacent.content;
    if (estimateTokens(testContent) <= maxTokens) {
      expandedContent = testContent;
      console.log(`[PREPROCESSOR] Adicionado contexto adjacente do chunk ${adjacent.id}`);
    } else {
      break;
    }
  }
  
  return expandedContent;
}

/**
 * Extrai palavras-chave da pergunta para melhor relevância
 */
export function extractKeywords(query: string): string[] {
  // Remove stop words comuns
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sobre',
    'que', 'qual', 'quais', 'quando', 'onde', 'como', 'por que', 'porque',
    'é', 'são', 'foi', 'foram', 'ser', 'ter', 'tem', 'está', 'estão',
    'me', 'te', 'se', 'nos', 'vos', 'se', 'meu', 'minha', 'seu', 'sua'
  ]);

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter(word => /^[a-záàâãéèêíïóôõöúçñ]+$/.test(word));
}

/**
 * Calcula prioridade de processamento baseada no tipo de pergunta
 */
export function getProcessingPriority(query: string): ProcessingOptions {
  const queryLower = query.toLowerCase();

  // Perguntas específicas sobre artigos/parágrafos precisam de busca precisa
  if (queryLower.includes('artigo') || queryLower.includes('parágrafo') || 
      queryLower.includes('item') || queryLower.includes('inciso') ||
      queryLower.includes('alínea') || queryLower.includes('seção')) {
    return {
      maxTokens: 3000,
      enableChunking: true,
      enableCompression: true,
      relevanceThreshold: 0.8,
      maxChunks: 4,
      chunkOverlap: true
    };
  }

  // Perguntas sobre procedimentos e processos
  if (queryLower.includes('como') || queryLower.includes('procedimento') || 
      queryLower.includes('processo') || queryLower.includes('passo') ||
      queryLower.includes('etapa') || queryLower.includes('requisito')) {
    return {
      maxTokens: 5000,
      enableChunking: true,
      enableCompression: true,
      relevanceThreshold: 0.5,
      maxChunks: 6,
      chunkOverlap: true
    };
  }

  // Perguntas gerais podem precisar de mais contexto
  if (queryLower.includes('resumo') || queryLower.includes('geral') || 
      queryLower.includes('sobre o que') || queryLower.includes('do que trata') ||
      queryLower.includes('quais') || queryLower.includes('todas')) {
    return {
      maxTokens: 6000,
      enableChunking: true,
      enableCompression: true,
      relevanceThreshold: 0.1,
      maxChunks: 8,
      chunkOverlap: true
    };
  }

  // Perguntas sobre definições e conceitos
  if (queryLower.includes('que é') || queryLower.includes('o que é') || 
      queryLower.includes('definição') || queryLower.includes('significa') ||
      queryLower.includes('conceito')) {
    return {
      maxTokens: 3500,
      enableChunking: true,
      enableCompression: true,
      relevanceThreshold: 0.6,
      maxChunks: 5,
      chunkOverlap: true
    };
  }

  // Configuração padrão - mais generosa
  return {
    maxTokens: 4000,
    enableChunking: true,
    enableCompression: true,
    relevanceThreshold: 0.3,
    maxChunks: 5,
    chunkOverlap: true
  };
}

/**
 * Estratégia de busca inteligente com múltiplas tentativas
 */
export function intelligentDocumentSearch(
  content: string,
  query: string,
  options: ProcessingOptions = {}
): string {
  const {
    maxTokens = 4000,
    maxChunks = 5,
    chunkOverlap = true
  } = options;

  const originalTokens = estimateTokens(content);
  console.log(`[INTELLIGENT SEARCH] Iniciando busca inteligente para: "${query}"`);
  
  // Se o documento é pequeno, retorna inteiro
  if (originalTokens <= maxTokens) {
    console.log('[INTELLIGENT SEARCH] Documento pequeno, retornando inteiro');
    
    // Debug info para documento pequeno
    debugMonitor.log(createDebugInfo(
      originalTokens,
      originalTokens,
      0,
      0,
      [],
      [],
      'documento completo',
      query
    ));
    
    return content;
  }
  
  const chunkSize = Math.floor(maxTokens * 4 / maxChunks);
  const chunks = chunkDocument(content, chunkSize);
  console.log(`[INTELLIGENT SEARCH] Documento dividido em ${chunks.length} chunks`);
  
  // Estratégia 1: Busca híbrida
  let selectedChunks = hybridSearch(chunks, query, maxChunks);
  let strategy = 'híbrida';
  
  // Estratégia 2: Se híbrida não funcionou, tenta busca por palavra-chave expandida
  if (selectedChunks.length === 0 || selectedChunks.every(c => (c.metadata.relevanceScore || 0) < 1)) {
    console.log('[INTELLIGENT SEARCH] Tentando busca expandida');
    selectedChunks = expandedKeywordSearch(chunks, query, maxChunks);
    strategy = 'expandida';
  }
  
  // Estratégia 3: Se ainda não funcionou, busca por seções do documento
  if (selectedChunks.length === 0 || selectedChunks.every(c => (c.metadata.relevanceScore || 0) < 1)) {
    console.log('[INTELLIGENT SEARCH] Tentando busca por seções');
    selectedChunks = sectionBasedSearch(chunks, query, maxChunks);
    strategy = 'por seções';
  }
  
  // Estratégia 4: Último recurso - primeiros e últimos chunks
  if (selectedChunks.length === 0) {
    console.log('[INTELLIGENT SEARCH] Usando estratégia de último recurso');
    const firstChunks = chunks.slice(0, Math.ceil(maxChunks / 2));
    const lastChunks = chunks.slice(-Math.floor(maxChunks / 2));
    selectedChunks = [...firstChunks, ...lastChunks];
    strategy = 'primeiro e último';
  }
  
  console.log(`[INTELLIGENT SEARCH] Estratégia usada: ${strategy}, chunks selecionados: ${selectedChunks.length}`);
  
  let result = combineRelevantChunks(selectedChunks);
  
  // Adiciona contexto adjacente se necessário
  if (chunkOverlap && estimateTokens(result) < maxTokens * 0.8) {
    result = addAdjacentContext(result, chunks, selectedChunks, maxTokens);
  }
  
  const finalTokens = estimateTokens(result);
  
  // Log debug info
  debugMonitor.log(createDebugInfo(
    originalTokens,
    finalTokens,
    chunks.length,
    selectedChunks.length,
    selectedChunks.map(c => c.id),
    selectedChunks.map(c => c.metadata.relevanceScore || 0),
    strategy,
    query
  ));
  
  return result;
}

/**
 * Busca expandida usando variações das palavras-chave
 */
function expandedKeywordSearch(
  chunks: DocumentChunk[],
  query: string,
  maxChunks: number
): DocumentChunk[] {
  const expandedQuery = expandQueryTerms(query);
  console.log(`[EXPANDED SEARCH] Query expandida: "${expandedQuery}"`);
  
  return findRelevantChunks(chunks, expandedQuery, maxChunks);
}

/**
 * Expande termos da query com variações comuns
 */
function expandQueryTerms(query: string): string {
  let expanded = query;
  
  // Variações comuns de termos militares
  const variations: Record<string, string[]> = {
    'militar': ['militar', 'militares', 'força', 'forças', 'armada', 'armadas'],
    'licença': ['licença', 'licenciamento', 'afastamento', 'dispensa'],
    'disciplina': ['disciplina', 'disciplinar', 'disciplinares', 'transgressão', 'falta'],
    'promoção': ['promoção', 'progressão', 'ascensão', 'avanço'],
    'pagamento': ['pagamento', 'soldo', 'remuneração', 'vencimento'],
    'saúde': ['saúde', 'médico', 'hospitalar', 'tratamento'],
    'documento': ['documento', 'documentação', 'requerimento', 'formulário']
  };
  
  Object.entries(variations).forEach(([key, variants]) => {
    if (query.toLowerCase().includes(key)) {
      expanded += ' ' + variants.join(' ');
    }
  });
  
  return expanded;
}

/**
 * Busca baseada em seções típicas de documentos
 */
function sectionBasedSearch(
  chunks: DocumentChunk[],
  query: string,
  maxChunks: number
): DocumentChunk[] {
  const queryLower = query.toLowerCase();
  
  // Identifica tipo de informação procurada
  const sectionKeywords: Record<string, string[]> = {
    'introduction': ['introdução', 'finalidade', 'objetivo', 'propósito'],
    'definitions': ['definição', 'conceito', 'significa', 'entende-se'],
    'procedures': ['procedimento', 'processo', 'como', 'etapa', 'passo'],
    'requirements': ['requisito', 'exigência', 'condição', 'critério'],
    'penalties': ['penalidade', 'sanção', 'punição', 'multa'],
    'benefits': ['benefício', 'direito', 'vantagem', 'privilégio']
  };
  
  // Encontra seção mais relevante
  let targetSection = '';
  let maxMatches = 0;
  
  Object.entries(sectionKeywords).forEach(([section, keywords]) => {
    const matches = keywords.filter(keyword => queryLower.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      targetSection = section;
    }
  });
  
  if (targetSection) {
    console.log(`[SECTION SEARCH] Buscando por seção: ${targetSection}`);
    const sectionQuery = sectionKeywords[targetSection].join(' ');
    return findRelevantChunks(chunks, sectionQuery, maxChunks);
  }
  
  return [];
}
