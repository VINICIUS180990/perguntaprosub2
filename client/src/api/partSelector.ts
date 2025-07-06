/**
 * PART SELECTOR - Seleção inteligente de partes do documento
 * Envia pergunta + resumos para API decidir quais partes são necessárias
 */

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';
import type { LocalDivision } from './localDocumentDivider';

export interface PartSelectionResult {
  partes_necessarias: string[];
  reasoning: string;
}

/**
 * Prompt para seleção de partes
 */
const PART_SELECTION_PROMPT = `Você é um especialista em análise de consultas sobre documentos militares brasileiros.

TAREFA: Baseado na pergunta do usuário e nos resumos das partes disponíveis, determine EXATAMENTE quais partes do documento são necessárias para responder adequadamente.

PERGUNTA DO USUÁRIO:
{USER_QUERY}

PARTES DISPONÍVEIS E SEUS RESUMOS:
{PARTS_SUMMARY}

INSTRUÇÕES:
1. ANALISE CUIDADOSAMENTE a pergunta do usuário
2. VERIFIQUE quais partes têm informações relevantes para responder
3. SELECIONE APENAS as partes estritamente necessárias
4. USE OS NOMES EXATOS das partes (ex: "Parte 1", "Parte 2", etc.)
5. Se a pergunta não estiver relacionada ao documento, responda com lista vazia

FORMATO DE RESPOSTA (JSON):
{
  "partes_necessarias": ["nome_da_parte1", "nome_da_parte2"],
  "reasoning": "Explicação detalhada de por que essas partes foram selecionadas"
}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`;

/**
 * Classe responsável pela seleção inteligente de partes
 */
export class PartSelector {
  
  /**
   * Seleciona partes necessárias baseado na pergunta do usuário
   */
  async selectParts(userQuery: string, documentDivisions: LocalDivision[]): Promise<PartSelectionResult> {
    const startTime = Date.now();
    
    console.log(`[PART_SELECTOR] 🎯 INICIANDO SELEÇÃO DE PARTES:`);
    console.log(`[PART_SELECTOR] 🎯 - Pergunta: "${userQuery.substring(0, 150)}..."`);
    console.log(`[PART_SELECTOR] 🎯 - Partes disponíveis: ${documentDivisions.length}`);
    
    // Criar resumo das partes disponíveis
    const partsSummary = documentDivisions.map((div, index) => {
      return `${index + 1}. "${div.nome}": ${div.resumo}`;
    }).join('\n');
    
    console.log(`[PART_SELECTOR] 📋 RESUMOS DAS PARTES PREPARADOS:`);
    documentDivisions.forEach((div, index) => {
      console.log(`[PART_SELECTOR] 📋 ${index + 1}. "${div.nome}"`);
      console.log(`[PART_SELECTOR] 📋    Resumo: ${div.resumo.substring(0, 100)}...`);
    });
    
    // Preparar prompt completo
    const fullPrompt = PART_SELECTION_PROMPT
      .replace('{USER_QUERY}', userQuery)
      .replace('{PARTS_SUMMARY}', partsSummary);
    
    const inputTokens = estimateTokens(fullPrompt);
    
    console.log(`[PART_SELECTOR] 💰 Tokens de entrada: ${inputTokens}`);
    console.log(`[PART_SELECTOR] 💰 Custo estimado: $${estimateCost(inputTokens).toFixed(6)}`);
    
    try {
      // Enviar para API decidir quais partes são necessárias
      console.log(`[PART_SELECTOR] 📤 ENVIANDO PERGUNTA + RESUMOS PARA API...`);
      console.log(`[PART_SELECTOR] 📤 - Prompt length: ${fullPrompt.length}`);
      console.log(`[PART_SELECTOR] 📤 - Aguardando seleção de partes...`);
      
      const apiResponse = await chatWithAI(fullPrompt, []);
      
      console.log(`[PART_SELECTOR] 📥 RESPOSTA DA API RECEBIDA:`);
      console.log(`[PART_SELECTOR] 📥 - Response length: ${apiResponse.length}`);
      console.log(`[PART_SELECTOR] 📥 - Response preview: ${apiResponse.substring(0, 200)}...`);
      
      // Calcular custos
      const outputTokens = estimateTokens(apiResponse);
      const totalCost = estimateCost(inputTokens, outputTokens);
      
      console.log(`[PART_SELECTOR] 💰 Tokens de saída: ${outputTokens}`);
      console.log(`[PART_SELECTOR] 💰 Custo total: $${totalCost.toFixed(6)}`);
      
      // Registrar custo
      costMonitor.logOperation(
        'PartSelector',
        'SELECTION',
        inputTokens,
        outputTokens,
        `Seleção de partes para: ${userQuery.substring(0, 50)}...`
      );
      
      // Parsear resposta JSON
      let parsedResponse;
      try {
        console.log(`[PART_SELECTOR] 🧹 PARSEANDO RESPOSTA JSON...`);
        const cleanResponse = apiResponse.replace(/```json|```/g, '').trim();
        
        console.log(`[PART_SELECTOR] 🧹 - Original length: ${apiResponse.length}`);
        console.log(`[PART_SELECTOR] 🧹 - Clean length: ${cleanResponse.length}`);
        
        parsedResponse = JSON.parse(cleanResponse);
        
        console.log(`[PART_SELECTOR] ✅ JSON parseado com sucesso`);
        console.log(`[PART_SELECTOR] ✅ Partes selecionadas: ${parsedResponse.partes_necessarias?.length || 0}`);
        
      } catch (parseError) {
        console.error(`[PART_SELECTOR] ❌ Erro ao parsear JSON:`, parseError);
        console.error(`[PART_SELECTOR] ❌ Resposta problemática:`, apiResponse.substring(0, 500));
        throw new Error(`Erro ao parsear resposta da seleção: ${parseError}`);
      }
      
      // Validar resposta
      if (!parsedResponse.partes_necessarias || !Array.isArray(parsedResponse.partes_necessarias)) {
        throw new Error('Resposta da API não contém partes_necessarias válidas');
      }
      
      const result: PartSelectionResult = {
        partes_necessarias: parsedResponse.partes_necessarias,
        reasoning: parsedResponse.reasoning || 'Não fornecido'
      };
      
      const processingTime = Date.now() - startTime;
      console.log(`[PART_SELECTOR] ⏱️ Seleção concluída em ${processingTime}ms`);
      console.log(`[PART_SELECTOR] ✅ RESULTADO DA SELEÇÃO:`);
      console.log(`[PART_SELECTOR] ✅ - Partes selecionadas: ${result.partes_necessarias.length}/${documentDivisions.length}`);
      console.log(`[PART_SELECTOR] ✅ - Reasoning: ${result.reasoning}`);
      
      if (result.partes_necessarias.length > 0) {
        console.log(`[PART_SELECTOR] 🎯 PARTES SELECIONADAS PELA API:`);
        result.partes_necessarias.forEach((partName, index) => {
          console.log(`[PART_SELECTOR] 🎯 ${index + 1}. "${partName}"`);
        });
      } else {
        console.log(`[PART_SELECTOR] 🚫 NENHUMA PARTE SELECIONADA - Pergunta não relacionada ao documento`);
      }
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[PART_SELECTOR] ❌ Erro durante seleção após ${processingTime}ms:`, error);
      
      // Registrar erro no monitor
      costMonitor.logOperation(
        'PartSelector',
        'ERROR',
        0,
        0,
        `Erro na seleção: ${error}`
      );
      
      throw error;
    }
  }
  
  /**
   * Filtra as divisões do documento baseado nas partes selecionadas
   */
  filterSelectedParts(documentDivisions: LocalDivision[], selectedPartNames: string[]): LocalDivision[] {
    console.log(`[PART_SELECTOR] 🔍 FILTRANDO PARTES SELECIONADAS:`);
    console.log(`[PART_SELECTOR] 🔍 - Partes solicitadas: ${selectedPartNames.length}`);
    console.log(`[PART_SELECTOR] 🔍 - Partes disponíveis: ${documentDivisions.length}`);
    
    // Debug: Mostrar nomes disponíveis
    console.log(`[PART_SELECTOR] 🔍 NOMES DISPONÍVEIS:`);
    documentDivisions.forEach((div, index) => {
      console.log(`[PART_SELECTOR] 🔍   ${index + 1}. "${div.nome}"`);
    });
    
    // Debug: Mostrar nomes solicitados
    console.log(`[PART_SELECTOR] 🔍 NOMES SOLICITADOS:`);
    selectedPartNames.forEach((name, index) => {
      console.log(`[PART_SELECTOR] 🔍   ${index + 1}. "${name}"`);
    });
    
    const filteredParts = documentDivisions.filter(division => {
      const isSelected = selectedPartNames.includes(division.nome);
      if (isSelected) {
        console.log(`[PART_SELECTOR] ✅ Incluída: "${division.nome}" (${division.conteudo.length} chars)`);
      }
      return isSelected;
    });
    
    console.log(`[PART_SELECTOR] 📊 RESULTADO DO FILTRO:`);
    console.log(`[PART_SELECTOR] 📊 - Partes encontradas: ${filteredParts.length}/${selectedPartNames.length}`);
    
    // Verificar se alguma parte solicitada não foi encontrada
    const foundNames = filteredParts.map(p => p.nome);
    const missingParts = selectedPartNames.filter(name => !foundNames.includes(name));
    
    if (missingParts.length > 0) {
      console.warn(`[PART_SELECTOR] ⚠️ PARTES NÃO ENCONTRADAS:`);
      missingParts.forEach(name => {
        console.warn(`[PART_SELECTOR] ⚠️ - "${name}"`);
      });
    }
    
    return filteredParts;
  }
}

// Instância global
export const partSelector = new PartSelector();
