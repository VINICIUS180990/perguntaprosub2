/**
 * DOCUMENT DIVIDER - Envio integral e divisão de documentos
 * Responsável pela primeira etapa: enviar documento completo para API dividir
 */

import { chatWithAI } from './chat';
import { costMonitor, estimateTokens, estimateCost } from './costMonitor';

export interface DocumentDivision {
  nome: string;
  conteudo: string;
  resumo: string;
}

export interface DivisionResult {
  divisoes: DocumentDivision[];
  como_dividiu: string;
  timestamp: number;
}

/**
 * Prompt para divisão de documento
 */
const DOCUMENT_DIVISION_PROMPT = `Você é um especialista em análise e organização de documentos militares brasileiros.

TAREFA: Analise o documento fornecido e divida-o em seções lógicas (capítulos, anexos, seções), nomeie cada parte e crie um resumo conciso de cada divisão.

INSTRUÇÕES:
1. DIVISÃO INTELIGENTE: Divida por capítulos, seções, artigos, anexos ou temas principais
2. NOMEAÇÃO CLARA: Dê nomes descritivos e específicos para cada divisão  
3. RESUMOS CONCISOS: Crie resumos de 2-3 linhas explicando o conteúdo de cada divisão
4. MANTER INTEGRIDADE: Não divida conceitos relacionados entre diferentes seções
5. JSON VÁLIDO: Certifique-se de que o JSON seja válido, sem strings quebradas

FORMATO DE RESPOSTA (JSON VÁLIDO):
{
  "divisoes": [
    {
      "nome": "Nome descritivo da divisão",
      "conteudo": "Conteúdo completo da divisão (escape caracteres especiais)",
      "resumo": "Resumo conciso explicando o que contém esta divisão"
    }
  ],
  "como_dividiu": "Explicação de como e por que dividiu dessa forma"
}

IMPORTANTE: 
- Responda APENAS com o JSON válido, sem texto adicional
- Escape caracteres especiais nas strings (", \n, \t, etc.)
- Não quebre strings no meio
- Limite divisões a no máximo 10 seções para evitar JSONs muito grandes

DOCUMENTO PARA DIVIDIR:
`;

/**
 * Classe responsável pela divisão de documentos
 */
export class DocumentDivider {
  
  /**
   * Envia documento integral para API e obtém divisões
   */
  async divideDocument(documentContent: string, documentName: string): Promise<DivisionResult> {
    const startTime = Date.now();
    
    console.log(`[DOCUMENT_DIVIDER] 🚀 Iniciando divisão do documento: ${documentName}`);
    console.log(`[DOCUMENT_DIVIDER] 📄 Tamanho do documento: ${documentContent.length} caracteres`);
    
    // Preparar prompt completo
    const fullPrompt = DOCUMENT_DIVISION_PROMPT + documentContent;
    const inputTokens = estimateTokens(fullPrompt);
    
    console.log(`[DOCUMENT_DIVIDER] 💰 Tokens de entrada: ${inputTokens}`);
    console.log(`[DOCUMENT_DIVIDER] 💰 Custo estimado: $${estimateCost(inputTokens).toFixed(6)}`);
    
    try {
      // Enviar documento completo para API
      console.log(`[DOCUMENT_DIVIDER] 📤 ENVIANDO DOCUMENTO INTEGRAL PARA API...`);
      console.log(`[DOCUMENT_DIVIDER] 📤 - Prompt length: ${fullPrompt.length}`);
      console.log(`[DOCUMENT_DIVIDER] 📤 - Aguardando resposta da divisão...`);
      
      const apiResponse = await chatWithAI(fullPrompt, []);
      
      console.log(`[DOCUMENT_DIVIDER] 📥 RESPOSTA DA API RECEBIDA:`);
      console.log(`[DOCUMENT_DIVIDER] 📥 - Response length: ${apiResponse.length}`);
      console.log(`[DOCUMENT_DIVIDER] 📥 - Response preview: ${apiResponse.substring(0, 200)}...`);
      
      // Calcular custos
      const outputTokens = estimateTokens(apiResponse);
      const totalCost = estimateCost(inputTokens, outputTokens);
      
      console.log(`[DOCUMENT_DIVIDER] 💰 Tokens de saída: ${outputTokens}`);
      console.log(`[DOCUMENT_DIVIDER] 💰 Custo total: $${totalCost.toFixed(6)}`);
      
      // Registrar custo
      costMonitor.logOperation(
        'DocumentDivider',
        'DIVISION',
        inputTokens,
        outputTokens,
        `Divisão integral do documento: ${documentName}`
      );
      
      // Parsear resposta JSON
      let parsedResponse;
      try {
        console.log(`[DOCUMENT_DIVIDER] 🧹 PARSEANDO RESPOSTA JSON...`);
        const cleanResponse = apiResponse.replace(/```json|```/g, '').trim();
        
        console.log(`[DOCUMENT_DIVIDER] 🧹 - Original length: ${apiResponse.length}`);
        console.log(`[DOCUMENT_DIVIDER] 🧹 - Clean length: ${cleanResponse.length}`);
        
        // ✅ NOVO: Parser JSON robusto
        parsedResponse = this.parseRobustJSON(cleanResponse);
        
        console.log(`[DOCUMENT_DIVIDER] ✅ JSON parseado com sucesso`);
        console.log(`[DOCUMENT_DIVIDER] ✅ Divisões encontradas: ${parsedResponse.divisoes?.length || 0}`);
        
      } catch (parseError) {
        console.error(`[DOCUMENT_DIVIDER] ❌ Erro ao parsear JSON:`, parseError);
        console.error(`[DOCUMENT_DIVIDER] ❌ Resposta problemática:`, apiResponse.substring(0, 500));
        throw new Error(`Erro ao parsear resposta da divisão: ${parseError}`);
      }
      
      // Validar e processar divisões
      if (!parsedResponse.divisoes || !Array.isArray(parsedResponse.divisoes)) {
        throw new Error('Resposta da API não contém divisões válidas');
      }
      
      console.log(`[DOCUMENT_DIVIDER] 📋 PROCESSANDO DIVISÕES:`);
      
      const divisoes: DocumentDivision[] = parsedResponse.divisoes.map((div: any, index: number) => {
        console.log(`[DOCUMENT_DIVIDER] 📋 ${index + 1}. "${div.nome}" - ${div.conteudo?.length || 0} chars`);
        console.log(`[DOCUMENT_DIVIDER] 📋    Resumo: ${div.resumo?.substring(0, 100)}...`);
        
        return {
          nome: div.nome || `Seção ${index + 1}`,
          conteudo: div.conteudo || '',
          resumo: div.resumo || 'Resumo não disponível'
        };
      });
      
      const result: DivisionResult = {
        divisoes,
        como_dividiu: parsedResponse.como_dividiu || 'Divisão automática',
        timestamp: Date.now()
      };
      
      const processingTime = Date.now() - startTime;
      console.log(`[DOCUMENT_DIVIDER] ⏱️ Divisão concluída em ${processingTime}ms`);
      console.log(`[DOCUMENT_DIVIDER] ✅ RESULTADO FINAL:`);
      console.log(`[DOCUMENT_DIVIDER] ✅ - Total de divisões: ${divisoes.length}`);
      console.log(`[DOCUMENT_DIVIDER] ✅ - Como foi dividido: ${result.como_dividiu}`);
      
      return result;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[DOCUMENT_DIVIDER] ❌ Erro durante divisão após ${processingTime}ms:`, error);
      
      // Registrar erro no monitor
      costMonitor.logOperation(
        'DocumentDivider',
        'ERROR',
        0,
        0,
        `Erro na divisão: ${error}`
      );
      
      throw error;
    }
  }
  
  /**
   * Parser JSON robusto que tenta corrigir erros comuns
   */
  private parseRobustJSON(jsonString: string): any {
    console.log(`[DOCUMENT_DIVIDER] 🔧 Tentando parser JSON robusto...`);
    
    // Tentativa 1: Parser normal
    try {
      const result = JSON.parse(jsonString);
      console.log(`[DOCUMENT_DIVIDER] 🔧 ✅ Parser normal funcionou`);
      return result;
    } catch (error) {
      console.log(`[DOCUMENT_DIVIDER] 🔧 ⚠️ Parser normal falhou:`, error);
    }
    
    // Tentativa 2: Corrigir strings não terminadas
    try {
      console.log(`[DOCUMENT_DIVIDER] 🔧 Tentando corrigir strings não terminadas...`);
      let fixedJson = jsonString;
      
      // Encontrar onde o JSON quebrou e tentar corrigir
      const lines = fixedJson.split('\n');
      let fixedLines = [];
      let insideString = false;
      let stringChar = '';
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let fixedLine = '';
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const prevChar = j > 0 ? line[j-1] : '';
          
          if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!insideString) {
              insideString = true;
              stringChar = char;
            } else if (char === stringChar) {
              insideString = false;
              stringChar = '';
            }
          }
          
          fixedLine += char;
        }
        
        // Se linha terminou no meio de uma string, fechar a string
        if (insideString && i === lines.length - 1) {
          fixedLine += stringChar;
          insideString = false;
        }
        
        fixedLines.push(fixedLine);
      }
      
      fixedJson = fixedLines.join('\n');
      
      // Se ainda estiver dentro de uma string, tentar fechar estruturas
      if (insideString) {
        fixedJson += '"';
      }
      
      // Tentar fechar objetos/arrays abertos
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Fechar objetos abertos
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      
      // Fechar arrays abertos
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      
      console.log(`[DOCUMENT_DIVIDER] 🔧 JSON corrigido, tentando parser...`);
      const result = JSON.parse(fixedJson);
      console.log(`[DOCUMENT_DIVIDER] 🔧 ✅ Parser com correção funcionou!`);
      return result;
      
    } catch (error) {
      console.log(`[DOCUMENT_DIVIDER] 🔧 ⚠️ Parser com correção falhou:`, error);
    }
    
    // Tentativa 3: Extrair apenas a parte válida do JSON
    try {
      console.log(`[DOCUMENT_DIVIDER] 🔧 Tentando extrair parte válida do JSON...`);
      
      // Encontrar o início das divisões
      const divisoesStart = jsonString.indexOf('"divisoes"');
      if (divisoesStart === -1) {
        throw new Error('Não encontrou seção divisoes');
      }
      
      // Tentar extrair apenas a estrutura básica
      const basicStructure: {
        divisoes: Array<{nome: string, conteudo: string, resumo: string}>;
        como_dividiu: string;
      } = {
        divisoes: [],
        como_dividiu: "Divisão extraída com parser robusto"
      };
      
      // Usar regex para extrair nomes das divisões
      const nomeRegex = /"nome":\s*"([^"]+)"/g;
      let match;
      let divisionIndex = 0;
      
      while ((match = nomeRegex.exec(jsonString)) !== null && divisionIndex < 10) {
        const nome = match[1];
        
        // Tentar extrair conteúdo básico
        const conteudoRegex = new RegExp(`"nome":\\s*"${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*"conteudo":\\s*"([^"]*(?:\\.[^"]*)*)"`);
        const conteudoMatch = conteudoRegex.exec(jsonString);
        
        const resumoRegex = new RegExp(`"nome":\\s*"${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*"resumo":\\s*"([^"]*(?:\\.[^"]*)*)"`);
        const resumoMatch = resumoRegex.exec(jsonString);
        
        basicStructure.divisoes.push({
          nome: nome,
          conteudo: conteudoMatch ? conteudoMatch[1] : `Conteúdo da seção: ${nome}`,
          resumo: resumoMatch ? resumoMatch[1] : `Resumo da seção: ${nome}`
        });
        
        divisionIndex++;
      }
      
      if (basicStructure.divisoes.length > 0) {
        console.log(`[DOCUMENT_DIVIDER] 🔧 ✅ Extração parcial funcionou! ${basicStructure.divisoes.length} divisões extraídas`);
        return basicStructure;
      }
      
    } catch (error) {
      console.log(`[DOCUMENT_DIVIDER] 🔧 ⚠️ Extração parcial falhou:`, error);
    }
    
    // Se tudo falhou, criar estrutura mínima
    console.log(`[DOCUMENT_DIVIDER] 🔧 ⚠️ Todos os parsers falharam, criando estrutura básica...`);
    return {
      divisoes: [
        {
          nome: "Documento Completo",
          conteudo: "Erro no parsing - usando documento inteiro",
          resumo: "Não foi possível dividir o documento adequadamente"
        }
      ],
      como_dividiu: "Erro no parsing JSON - estrutura de fallback"
    };
  }
}

// Instância global
export const documentDivider = new DocumentDivider();
