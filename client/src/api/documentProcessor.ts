/**
 * Sistema de Processamento de Documentos
 * Responsável por processar documentos completos e solicitar divisão à API
 */

// DEBUG: Log de inicialização
console.log('[DEBUG] documentProcessor.ts - Iniciando importações');

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';

// DEBUG: Verificar se as importações funcionaram
console.log('[DEBUG] documentProcessor.ts - Importações carregadas:');
console.log('[DEBUG] - chatWithAI:', typeof chatWithAI);
console.log('[DEBUG] - costMonitor:', typeof costMonitor);
console.log('[DEBUG] - estimateTokens:', typeof estimateTokens);
console.log('[DEBUG] - estimateCost:', typeof estimateCost);

export interface DocumentDivision {
  nome: string;
  conteudo: string;
  resumo: string;
  indice: number;
}

export interface DocumentProcessingResult {
  divisoes: DocumentDivision[];
  metadados: {
    como_foi_dividido: string;
    total_divisoes: number;
    documento_original: string;
    timestamp: number;
  };
}

/**
 * Prompt para a API dividir o documento
 */
const DOCUMENT_DIVISION_PROMPT = `Você é um especialista em análise de documentos militares brasileiros.

TAREFA: Analisar o documento completo e dividi-lo em partes lógicas.

INSTRUÇÕES OBRIGATÓRIAS:
1. Divida o documento em seções lógicas (capítulos, artigos, anexos, etc.)
2. Cada divisão deve ter entre 1000-3000 caracteres
3. Mantenha o contexto completo de cada seção
4. Nomeie cada divisão de forma clara e descritiva
5. Crie um resumo conciso (máximo 200 caracteres) para cada divisão

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
  "como_foi_dividido": "Descrição de como foi dividido (ex: 'Por capítulos e anexos')",
  "divisoes": [
    {
      "nome": "Nome da seção",
      "conteudo": "Conteúdo completo da seção",
      "resumo": "Resumo conciso da seção"
    }
  ]
}

DOCUMENTO PARA ANÁLISE:
`;

/**
 * Processa um documento completo e solicita divisão à API
 */
export async function processDocument(
  documentContent: string,
  documentName: string
): Promise<DocumentProcessingResult> {
  console.log(`[DOCUMENT_PROCESSOR] 🔄 Iniciando processamento do documento: ${documentName}`);
  console.log(`[DOCUMENT_PROCESSOR] 📄 Tamanho do documento: ${documentContent.length} caracteres`);
  
  const startTime = Date.now();
  
  try {
    // Monta o prompt completo
    const fullPrompt = DOCUMENT_DIVISION_PROMPT + documentContent;
    
    // Calcula custos estimados
    const inputTokens = estimateTokens(fullPrompt);
    const estimatedCost = estimateCost(inputTokens);
    
    console.log(`[DOCUMENT_PROCESSOR] 💰 Tokens de entrada: ${inputTokens}`);
    console.log(`[DOCUMENT_PROCESSOR] 💰 Custo estimado: $${estimatedCost.toFixed(6)}`);
    
    // Chama a API para dividir o documento
    console.log(`[DOCUMENT_PROCESSOR] 🤖 Enviando documento para API...`);
    
    // LOG DETALHADO: Capturar resposta da API
    let apiResponse;
    try {
      console.log('[DOCUMENT_PROCESSOR] 📤 ENVIANDO PARA API:');
      console.log('[DOCUMENT_PROCESSOR] 📤 - Prompt length:', fullPrompt.length);
      console.log('[DOCUMENT_PROCESSOR] 📤 - Document name:', documentName);
      console.log('[DOCUMENT_PROCESSOR] 📤 - Aguardando resposta...');
      
      apiResponse = await chatWithAI(fullPrompt, []);
      
      console.log('[DOCUMENT_PROCESSOR] 📥 RESPOSTA DA API RECEBIDA:');
      console.log('[DOCUMENT_PROCESSOR] 📥 - Response length:', apiResponse.length);
      console.log('[DOCUMENT_PROCESSOR] 📥 - Response preview:', apiResponse.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('[DOCUMENT_PROCESSOR] ❌ ERRO NA API:', error);
      throw error;
    }
    
    console.log(`[DOCUMENT_PROCESSOR] ✅ Resposta recebida da API`);
    console.log(`[DOCUMENT_PROCESSOR] 📝 Tamanho da resposta: ${apiResponse.length} caracteres`);
    
    // Calcula custos finais
    const outputTokens = estimateTokens(apiResponse);
    const totalCost = estimateCost(inputTokens, outputTokens);
    
    console.log(`[DOCUMENT_PROCESSOR] 💰 Tokens de saída: ${outputTokens}`);
    console.log(`[DOCUMENT_PROCESSOR] 💰 Custo total: $${totalCost.toFixed(6)}`);
    
    // Registra no monitor de custos
    costMonitor.logOperation(
      'DocumentProcessor',
      'DIVISION',
      inputTokens,
      outputTokens,
      `Divisão do documento: ${documentName}`
    );
    
    // Parseia a resposta JSON
    let parsedResponse;
    try {
      // Remove possíveis marcadores de código
      const cleanResponse = apiResponse.replace(/```json|```/g, '').trim();
      
      console.log('[DOCUMENT_PROCESSOR] 🧹 LIMPANDO RESPOSTA:');
      console.log('[DOCUMENT_PROCESSOR] 🧹 - Original length:', apiResponse.length);
      console.log('[DOCUMENT_PROCESSOR] 🧹 - Clean length:', cleanResponse.length);
      console.log('[DOCUMENT_PROCESSOR] 🧹 - Clean preview:', cleanResponse.substring(0, 300) + '...');
      
      parsedResponse = JSON.parse(cleanResponse);
      
      console.log(`[DOCUMENT_PROCESSOR] ✅ JSON parseado com sucesso`);
      console.log(`[DOCUMENT_PROCESSOR] ✅ Divisões encontradas:`, parsedResponse.divisions?.length || 0);
      
      // Validar estrutura da resposta
      if (parsedResponse.divisions && Array.isArray(parsedResponse.divisions)) {
        console.log('[DOCUMENT_PROCESSOR] 📋 DIVISÕES DETALHADAS:');
        parsedResponse.divisions.forEach((div: any, index: number) => {
          console.log(`[DOCUMENT_PROCESSOR] 📋 ${index + 1}. "${div.name}" - ${div.content?.length || 0} chars`);
        });
      } else {
        console.warn('[DOCUMENT_PROCESSOR] ⚠️  ESTRUTURA INESPERADA:', Object.keys(parsedResponse));
      }
      
    } catch (parseError) {
      console.error(`[DOCUMENT_PROCESSOR] ❌ Erro ao parsear JSON:`, parseError);
      console.error(`[DOCUMENT_PROCESSOR] ❌ Resposta problemática:`, apiResponse.substring(0, 500));
      throw new Error(`Erro ao parsear resposta da API: ${parseError}`);
    }
    
    // Valida a estrutura da resposta
    if (!parsedResponse.divisoes || !Array.isArray(parsedResponse.divisoes)) {
      console.error(`[DOCUMENT_PROCESSOR] ❌ Estrutura inválida na resposta da API`);
      throw new Error('Resposta da API não contém divisões válidas');
    }
    
    // Processa e valida cada divisão
    const divisoes: DocumentDivision[] = parsedResponse.divisoes.map((div: any, index: number) => {
      if (!div.nome || !div.conteudo || !div.resumo) {
        console.warn(`[DOCUMENT_PROCESSOR] ⚠️ Divisão ${index} incompleta, tentando corrigir`);
      }
      
      return {
        nome: div.nome || `Seção ${index + 1}`,
        conteudo: div.conteudo || '',
        resumo: div.resumo || 'Resumo não disponível',
        indice: index
      };
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`[DOCUMENT_PROCESSOR] ⏱️ Processamento concluído em ${processingTime}ms`);
    console.log(`[DOCUMENT_PROCESSOR] 📊 Total de divisões criadas: ${divisoes.length}`);
    
    // Log detalhado das divisões
    divisoes.forEach((div, index) => {
      console.log(`[DOCUMENT_PROCESSOR] 📋 Divisão ${index + 1}: "${div.nome}"`);
      console.log(`[DOCUMENT_PROCESSOR] 📋 Tamanho: ${div.conteudo.length} chars`);
      console.log(`[DOCUMENT_PROCESSOR] 📋 Resumo: ${div.resumo.substring(0, 100)}...`);
    });
    
    const result: DocumentProcessingResult = {
      divisoes,
      metadados: {
        como_foi_dividido: parsedResponse.como_foi_dividido || 'Divisão automática',
        total_divisoes: divisoes.length,
        documento_original: documentName,
        timestamp: Date.now()
      }
    };
    
    console.log(`[DOCUMENT_PROCESSOR] 🎉 Processamento finalizado com sucesso!`);
    return result;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[DOCUMENT_PROCESSOR] ❌ Erro durante processamento após ${processingTime}ms:`, error);
    
    // Registra erro no monitor de custos
    costMonitor.logOperation(
      'DocumentProcessor',
      'ERROR',
      0,
      0,
      `Erro no processamento: ${error}`
    );
    
    throw error;
  }
}

/**
 * Valida se um documento processado está válido
 */
export function validateProcessedDocument(result: DocumentProcessingResult): boolean {
  console.log(`[DOCUMENT_PROCESSOR] 🔍 Validando documento processado...`);
  
  if (!result.divisoes || result.divisoes.length === 0) {
    console.error(`[DOCUMENT_PROCESSOR] ❌ Nenhuma divisão encontrada`);
    return false;
  }
  
  for (const div of result.divisoes) {
    if (!div.nome || !div.conteudo) {
      console.error(`[DOCUMENT_PROCESSOR] ❌ Divisão inválida encontrada:`, div.nome);
      return false;
    }
  }
  
  console.log(`[DOCUMENT_PROCESSOR] ✅ Documento válido com ${result.divisoes.length} divisões`);
  return true;
}
