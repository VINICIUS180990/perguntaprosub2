/**
 * SELETOR DE PARTES - API2
 * Seleciona seções relevantes de documentos grandes usando IA
 */

import { DEBUG_CONFIG } from './config';
import { logger, PerformanceTimer } from './utils';
import { callChatAPI } from './chat';
import type { DocumentDivision, PartSelectionResult } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.SELECTOR;

logger.info(PREFIX, 'Inicializando seletor de partes...');

export class PartSelector {
  
  /**
   * Seleciona partes relevantes do documento para uma pergunta
   */
  async selectRelevantParts(
    query: string,
    divisions: DocumentDivision[]
  ): Promise<PartSelectionResult> {
    const timer = new PerformanceTimer('Part Selection');
    
    logger.processing(PREFIX, `Selecionando partes para: "${query.substring(0, 100)}..."`);
    logger.debug(PREFIX, `Divisões disponíveis: ${divisions.length}`);
    
    // Log das divisões disponíveis
    divisions.forEach((div, index) => {
      logger.debug(PREFIX, `${index + 1}. "${div.nome}" - ${div.tokenCount} tokens`);
      logger.debug(PREFIX, `   Resumo: ${div.resumo}`);
    });
    
    // Criar prompt para seleção
    const selectionPrompt = this.createSelectionPrompt(query, divisions);
    logger.debug(PREFIX, `Prompt criado: ${selectionPrompt.length} chars`);
    
    try {
      logger.processing(PREFIX, 'Enviando para IA analisar relevância...');
      
      const response = await callChatAPI([
        {
          role: 'system',
          content: 'Você é um especialista em análise de documentos que seleciona seções relevantes para responder perguntas específicas.'
        },
        {
          role: 'user',
          content: selectionPrompt
        }
      ]);
      
      logger.success(PREFIX, 'Resposta da IA recebida');
      logger.debug(PREFIX, `Resposta: ${response.content.substring(0, 200)}...`);
      
      // Parsear resposta
      const selection = this.parseSelectionResponse(response.content, divisions);
      
      timer.end();
      
      // Calcular economia de tokens
      const totalTokens = divisions.reduce((acc, div) => acc + div.tokenCount, 0);
      const selectedTokens = selection.selectedParts.reduce((acc, div) => acc + div.tokenCount, 0);
      const tokensSaved = totalTokens - selectedTokens;
      const percentageSaved = ((tokensSaved / totalTokens) * 100).toFixed(1);
      
      logger.success(PREFIX, `Seleção concluída: ${selection.selectedParts.length}/${divisions.length} partes`);
      logger.info(PREFIX, `Economia: ${tokensSaved} tokens (${percentageSaved}%)`);
      
      selection.selectedParts.forEach((part, index) => {
        logger.debug(PREFIX, `Selecionado ${index + 1}: "${part.nome}"`);
      });
      
      const result: PartSelectionResult = {
        selectedParts: selection.selectedParts,
        reasoning: selection.reasoning,
        tokensSaved
      };
      
      return result;
      
    } catch (error) {
      timer.end();
      logger.error(PREFIX, 'Erro na seleção de partes:', error);
      
      // Fallback: retornar todas as partes
      logger.warn(PREFIX, 'Usando fallback: retornando todas as partes');
      
      return {
        selectedParts: divisions,
        reasoning: 'Erro na seleção automática - usando todas as seções',
        tokensSaved: 0
      };
    }
  }
  
  /**
   * Cria o prompt para seleção de partes
   */
  private createSelectionPrompt(query: string, divisions: DocumentDivision[]): string {
    logger.debug(PREFIX, 'Criando prompt de seleção...');
    
    const sectionsText = divisions.map((div, index) => {
      return `${index + 1}. "${div.nome}": ${div.resumo}`;
    }).join('\n');
    
    const prompt = `Analise a pergunta do usuário e selecione APENAS as seções do documento que são necessárias para responder adequadamente.

PERGUNTA DO USUÁRIO:
"${query}"

SEÇÕES DISPONÍVEIS:
${sectionsText}

INSTRUÇÕES:
1. Selecione apenas as seções estritamente necessárias
2. Evite selecionar seções desnecessárias para economizar tokens
3. Se a pergunta for muito geral, selecione no máximo 3-4 seções mais relevantes
4. Se for específica, selecione apenas 1-2 seções relacionadas

Responda no formato JSON:
{
  "secoes_selecionadas": [1, 3, 5],
  "justificativa": "Explicação de por que essas seções foram escolhidas"
}`;

    logger.debug(PREFIX, `Prompt criado com ${sectionsText.split('\n').length} seções`);
    
    return prompt;
  }
  
  /**
   * Parseia a resposta da IA para extrair seleção
   */
  private parseSelectionResponse(
    response: string,
    divisions: DocumentDivision[]
  ): { selectedParts: DocumentDivision[], reasoning: string } {
    logger.debug(PREFIX, 'Parseando resposta da seleção...');
    
    try {
      // Limpar resposta
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      logger.debug(PREFIX, 'JSON parseado com sucesso');
      logger.debug(PREFIX, `Seções selecionadas: ${parsed.secoes_selecionadas || []}`);
      
      const selectedIndices = parsed.secoes_selecionadas || [];
      const reasoning = parsed.justificativa || 'Seleção automática baseada na relevância';
      
      // Filtrar divisões selecionadas
      const selectedParts = selectedIndices
        .filter((index: number) => index >= 1 && index <= divisions.length)
        .map((index: number) => divisions[index - 1]) // Converter para índice baseado em 0
        .filter(Boolean);
      
      if (selectedParts.length === 0) {
        logger.warn(PREFIX, 'Nenhuma seção válida selecionada, usando primeira seção');
        return {
          selectedParts: [divisions[0]],
          reasoning: 'Fallback: primeira seção por falta de seleção válida'
        };
      }
      
      logger.success(PREFIX, `${selectedParts.length} seções selecionadas com sucesso`);
      
      return {
        selectedParts,
        reasoning
      };
      
    } catch (error) {
      logger.error(PREFIX, 'Erro ao parsear resposta:', error);
      logger.debug(PREFIX, 'Resposta problemática:', response.substring(0, 500));
      
      // Fallback inteligente: tentar extrair números
      const numbers = response.match(/\b(\d+)\b/g);
      if (numbers && numbers.length > 0) {
        logger.debug(PREFIX, 'Tentando fallback com extração de números...');
        
        const selectedIndices = numbers
          .map(n => parseInt(n))
          .filter(n => n >= 1 && n <= divisions.length)
          .slice(0, 3); // Máximo 3 seções
        
        if (selectedIndices.length > 0) {
          const selectedParts = selectedIndices.map(index => divisions[index - 1]);
          
          logger.success(PREFIX, `Fallback bem-sucedido: ${selectedParts.length} seções`);
          
          return {
            selectedParts,
            reasoning: 'Seleção extraída por fallback numérico'
          };
        }
      }
      
      // Último fallback: seções iniciais
      logger.warn(PREFIX, 'Usando fallback final: primeiras 2 seções');
      
      return {
        selectedParts: divisions.slice(0, 2),
        reasoning: 'Fallback final por erro na seleção automática'
      };
    }
  }
  
  /**
   * Análise rápida sem IA (para casos simples)
   */
  quickSelection(query: string, divisions: DocumentDivision[]): PartSelectionResult {
    logger.debug(PREFIX, 'Executando seleção rápida sem IA...');
    
    const queryLower = query.toLowerCase();
    const scoredDivisions = divisions.map(div => {
      const titleScore = this.calculateRelevanceScore(queryLower, div.nome.toLowerCase());
      const summaryScore = this.calculateRelevanceScore(queryLower, div.resumo.toLowerCase());
      
      return {
        division: div,
        score: titleScore * 2 + summaryScore // Título tem peso maior
      };
    });
    
    // Ordenar por relevância
    scoredDivisions.sort((a, b) => b.score - a.score);
    
    // Selecionar top 3 ou todas se score > 0
    const relevant = scoredDivisions.filter(item => item.score > 0);
    const selectedParts = relevant.length > 0 
      ? relevant.slice(0, 3).map(item => item.division)
      : divisions.slice(0, 2); // Fallback
    
    const totalTokens = divisions.reduce((acc, div) => acc + div.tokenCount, 0);
    const selectedTokens = selectedParts.reduce((acc, div) => acc + div.tokenCount, 0);
    
    logger.success(PREFIX, `Seleção rápida: ${selectedParts.length} seções`);
    
    return {
      selectedParts,
      reasoning: 'Seleção rápida baseada em palavras-chave',
      tokensSaved: totalTokens - selectedTokens
    };
  }
  
  private calculateRelevanceScore(query: string, text: string): number {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    let score = 0;
    
    for (const word of queryWords) {
      if (text.includes(word)) {
        score += 1;
      }
    }
    
    return score / queryWords.length;
  }
}

// Instância global
export const partSelector = new PartSelector();

logger.success(PREFIX, 'Seletor de partes carregado com sucesso');
