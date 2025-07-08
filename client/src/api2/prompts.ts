/**
 * PROMPTS - API2
 * Prompts otimizados para diferentes cenários
 */

import { logger } from './utils';

const PREFIX = '[PROMPTS]';

logger.info(PREFIX, 'Carregando prompts...');

// === PROMPTS PARA DOCUMENTOS PEQUENOS === //
export const SMALL_DOCUMENT_PROMPTS = {
  
  /**
   * Prompt para resposta com documento completo
   */
  COMPLETE_DOCUMENT: `Você é um assistente especializado em análise de documentos que responde perguntas com base no conteúdo fornecido.

INSTRUÇÕES:
- Responda baseado EXCLUSIVAMENTE no documento fornecido
- Seja preciso e objetivo
- Se a informação não estiver no documento, informe claramente
- Use citações diretas quando apropriado
- Mantenha tom profissional e neutro

DOCUMENTO COMPLETO:
{DOCUMENT_CONTENT}

PERGUNTA DO USUÁRIO:
{USER_QUERY}

Responda baseado no conteúdo do documento:`,

  /**
   * Prompt para análise rápida
   */
  QUICK_ANALYSIS: `Analise o documento e responda objetivamente à pergunta do usuário.

Documento: {DOCUMENT_CONTENT}

Pergunta: {USER_QUERY}

Resposta:`
} as const;

// === PROMPTS PARA DOCUMENTOS GRANDES === //
export const LARGE_DOCUMENT_PROMPTS = {
  
  /**
   * Prompt para resposta com seções selecionadas
   */
  SELECTED_SECTIONS: `Você é um especialista em análise de documentos que responde perguntas baseado em seções específicas selecionadas de um documento maior.

INSTRUÇÕES:
- Use APENAS as seções fornecidas para responder
- Seja preciso e relate apenas informações presentes nas seções
- Se a resposta requer informações não presentes nas seções, mencione essa limitação
- Mantenha contexto entre as seções quando relevante
- Use tom profissional e objetivo

SEÇÕES SELECIONADAS DO DOCUMENTO:
{SELECTED_SECTIONS}

PERGUNTA DO USUÁRIO:
{USER_QUERY}

Responda baseado exclusivamente nas seções fornecidas:`,

  /**
   * Prompt para análise contextual
   */
  CONTEXTUAL_ANALYSIS: `Com base nas seções do documento fornecidas, analise e responda à pergunta mantendo o contexto.

Seções relevantes:
{SELECTED_SECTIONS}

Pergunta: {USER_QUERY}

Análise:`,

  /**
   * Prompt para síntese de informações
   */
  SYNTHESIS: `Sintetize informações das seções fornecidas para responder à pergunta do usuário.

{SELECTED_SECTIONS}

Pergunta: {USER_QUERY}

Síntese:`
} as const;

// === PROMPTS PARA ANÁLISE === //
export const ANALYSIS_PROMPTS = {
  
  /**
   * Prompt para análise de necessidade de documento
   */
  DOCUMENT_NEED_ANALYSIS: `Analise se a pergunta do usuário requer informações específicas de um documento ou se pode ser respondida de forma geral.

PERGUNTA: "{USER_QUERY}"

Responda no formato JSON:
{
  "precisa_documento": true/false,
  "confianca": 0.0-1.0,
  "justificativa": "Explicação da decisão"
}

Considere que perguntas sobre conteúdo específico, dados, citações, análises detalhadas precisam do documento.
Perguntas gerais, cumprimentos, definições básicas não precisam.`,

  /**
   * Prompt para classificação de query
   */
  QUERY_CLASSIFICATION: `Classifique o tipo da pergunta do usuário:

PERGUNTA: "{USER_QUERY}"

TIPOS:
- ESPECÍFICA: Requer informação específica do documento
- GERAL: Pergunta geral que pode ser respondida sem documento
- CUMPRIMENTO: Saudação, agradecimento, despedida
- NAVEGAÇÃO: Pergunta sobre como usar o sistema

Responda apenas com: ESPECÍFICA, GERAL, CUMPRIMENTO ou NAVEGAÇÃO`
} as const;

// === PROMPTS PARA RESPOSTAS GERAIS === //
export const GENERAL_PROMPTS = {
  
  /**
   * Prompt para respostas sem documento
   */
  NO_DOCUMENT: `Você é um assistente útil que responde perguntas gerais de forma clara e objetiva.

PERGUNTA: {USER_QUERY}

Responda de forma concisa e útil:`,

  /**
   * Prompt para cumprimentos
   */
  GREETING: `Você é um assistente amigável especializado em análise de documentos.

Responda de forma cordial e profissional:`,

  /**
   * Prompt para ajuda sobre o sistema
   */
  SYSTEM_HELP: `Você é um assistente que ajuda usuários a entender como usar o sistema de análise de documentos.

Explique de forma clara e prática como o usuário pode usar o sistema.`
} as const;

// === FUNÇÕES PARA PROCESSAR PROMPTS === //

/**
 * Processa prompt substituindo variáveis
 */
export function processPrompt(
  template: string,
  variables: Record<string, string>
): string {
  logger.debug(PREFIX, 'Processando prompt...');
  logger.debug(PREFIX, `Template: ${template.substring(0, 100)}...`);
  logger.debug(PREFIX, `Variáveis: ${Object.keys(variables).join(', ')}`);
  
  let processed = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    processed = processed.replace(new RegExp(placeholder, 'g'), value);
  }
  
  logger.debug(PREFIX, `Prompt processado: ${processed.length} chars`);
  
  return processed;
}

/**
 * Cria prompt para documento pequeno
 */
export function createSmallDocumentPrompt(
  documentContent: string,
  userQuery: string,
  type: 'COMPLETE_DOCUMENT' | 'QUICK_ANALYSIS' = 'COMPLETE_DOCUMENT'
): string {
  logger.debug(PREFIX, `Criando prompt para documento pequeno: ${type}`);
  
  return processPrompt(SMALL_DOCUMENT_PROMPTS[type], {
    DOCUMENT_CONTENT: documentContent,
    USER_QUERY: userQuery
  });
}

/**
 * Cria prompt para documento grande
 */
export function createLargeDocumentPrompt(
  selectedSections: string,
  userQuery: string,
  type: 'SELECTED_SECTIONS' | 'CONTEXTUAL_ANALYSIS' | 'SYNTHESIS' = 'SELECTED_SECTIONS'
): string {
  logger.debug(PREFIX, `Criando prompt para documento grande: ${type}`);
  
  return processPrompt(LARGE_DOCUMENT_PROMPTS[type], {
    SELECTED_SECTIONS: selectedSections,
    USER_QUERY: userQuery
  });
}

/**
 * Cria prompt para análise de necessidade
 */
export function createAnalysisPrompt(
  userQuery: string,
  type: 'DOCUMENT_NEED_ANALYSIS' | 'QUERY_CLASSIFICATION' = 'DOCUMENT_NEED_ANALYSIS'
): string {
  logger.debug(PREFIX, `Criando prompt de análise: ${type}`);
  
  return processPrompt(ANALYSIS_PROMPTS[type], {
    USER_QUERY: userQuery
  });
}

/**
 * Cria prompt para resposta geral
 */
export function createGeneralPrompt(
  userQuery: string,
  type: 'NO_DOCUMENT' | 'GREETING' | 'SYSTEM_HELP' = 'NO_DOCUMENT'
): string {
  logger.debug(PREFIX, `Criando prompt geral: ${type}`);
  
  return processPrompt(GENERAL_PROMPTS[type], {
    USER_QUERY: userQuery
  });
}

/**
 * Formata seções selecionadas para prompt
 */
export function formatSelectedSections(sections: Array<{nome: string, conteudo: string}>): string {
  logger.debug(PREFIX, `Formatando ${sections.length} seções selecionadas`);
  
  return sections.map((section, index) => {
    return `=== SEÇÃO ${index + 1}: ${section.nome} ===\n${section.conteudo}\n`;
  }).join('\n');
}

logger.success(PREFIX, 'Sistema de prompts carregado com sucesso');
