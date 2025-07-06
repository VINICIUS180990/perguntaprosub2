/**
 * LOCAL DOCUMENT DIVIDER - Divisão local instantânea de documentos
 * Divide documentos localmente em 20 partes detalhadas sem depender da API
 */

import { estimateTokens } from './costMonitor';

export interface LocalDivision {
  nome: string;
  conteudo: string;
  resumo: string;
  indice: number;
}

export interface LocalDivisionResult {
  divisoes: LocalDivision[];
  como_dividiu: string;
  timestamp: number;
  tamanho_original: number;
}

/**
 * Classe responsável pela divisão local instantânea
 */
export class LocalDocumentDivider {
  
  /**
   * Divide documento localmente em 20 partes inteligentes
   */
  divideDocumentLocally(documentContent: string, documentName: string): LocalDivisionResult {
    const startTime = Date.now();
    
    console.log(`[LOCAL_DIVIDER] ⚡ INICIANDO DIVISÃO LOCAL:`);
    console.log(`[LOCAL_DIVIDER] ⚡ - Documento: ${documentName}`);
    console.log(`[LOCAL_DIVIDER] ⚡ - Tamanho: ${documentContent.length} chars (${estimateTokens(documentContent)} tokens)`);
    
    // Dividir por parágrafos/seções naturais
    const divisions = this.createIntelligentDivisions(documentContent, documentName);
    
    const processingTime = Date.now() - startTime;
    
    const result: LocalDivisionResult = {
      divisoes: divisions,
      como_dividiu: "Divisão local automática em 20 seções baseada em parágrafos e quebras naturais",
      timestamp: Date.now(),
      tamanho_original: documentContent.length
    };
    
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ DIVISÃO LOCAL CONCLUÍDA:`);
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ - Divisões criadas: ${divisions.length}`);
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ - Tempo: ${processingTime}ms (INSTANTÂNEO!)`);
    
    // Log detalhado das divisões em tokens
    divisions.forEach((div, index) => {
      const tokens = estimateTokens(div.conteudo);
      console.log(`[LOCAL_DIVIDER] 📋 ${index + 1}. "${div.nome}" (${tokens} tokens)`);
      console.log(`[LOCAL_DIVIDER] 📋    Resumo: ${div.resumo.substring(0, 80)}...`);
    });
    
    return result;
  }
  
  /**
   * Cria divisões inteligentes baseadas na estrutura do documento
   */
  private createIntelligentDivisions(content: string, _documentName: string): LocalDivision[] {
    console.log(`[LOCAL_DIVIDER] 🧠 Criando divisões inteligentes...`);
    
    // Limpar e normalizar o conteúdo
    const cleanContent = this.cleanContent(content);
    
    // Tentar divisão por seções/capítulos primeiro
    let divisions = this.divideByChapters(cleanContent);
    
    // Se não encontrou capítulos, dividir por parágrafos
    if (divisions.length === 0) {
      divisions = this.divideByParagraphs(cleanContent);
    }
    
    // Se ainda não tem divisões suficientes, forçar divisão em 20 partes
    if (divisions.length < 20) {
      divisions = this.forceEqualDivisions(cleanContent, 20);
    }
    
    // Limitar a 20 divisões máximo
    if (divisions.length > 20) {
      divisions = divisions.slice(0, 20);
    }
    
    // Gerar resumos para cada divisão
    const finalDivisions = divisions.map((div, index) => ({
      ...div,
      indice: index,
      resumo: this.generateSummary(div.conteudo, div.nome)
    }));
    
    console.log(`[LOCAL_DIVIDER] 🧠 ✅ Divisões inteligentes criadas: ${finalDivisions.length}`);
    
    return finalDivisions;
  }
  
  /**
   * Limpar e normalizar conteúdo
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')  // Normalizar quebras de linha
      .replace(/\n{3,}/g, '\n\n')  // Reduzir múltiplas quebras
      .trim();
  }
  
  /**
   * Tentar dividir por capítulos/seções
   */
  private divideByChapters(content: string): Omit<LocalDivision, 'resumo' | 'indice'>[] {
    console.log(`[LOCAL_DIVIDER] 📖 Tentando divisão por capítulos...`);
    
    const divisions: Omit<LocalDivision, 'resumo' | 'indice'>[] = [];
    
    // Padrões para identificar capítulos/seções
    const chapterPatterns = [
      /(?:^|\n)\s*(CAPÍTULO|CAPÍTULO|SEÇÃO|SEÇÃO|ANEXO|TÍTULO|PARTE)\s+([IVX\d]+|[A-Z])\s*[-–—]?\s*([^\n]+)/gim,
      /(?:^|\n)\s*(\d+\.?\s*[-–—]?\s*[A-ZÁÊÇÕ][^\n]+)/gim,
      /(?:^|\n)\s*(ARTIGO|ART\.?)\s*(\d+)[^\n]*/gim
    ];
    
    for (const pattern of chapterPatterns) {
      const matches = [...content.matchAll(pattern)];
      
      if (matches.length >= 3) {  // Mínimo 3 seções para ser válido
        console.log(`[LOCAL_DIVIDER] 📖 ✅ Encontrou ${matches.length} seções com padrão`);
        
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const nextMatch = matches[i + 1];
          
          const startIndex = match.index || 0;
          const endIndex = nextMatch ? (nextMatch.index || content.length) : content.length;
          
          const sectionContent = content.slice(startIndex, endIndex).trim();
          
          if (sectionContent.length > 100) {  // Mínimo de conteúdo
            divisions.push({
              nome: `Parte ${divisions.length + 1}`, // ✅ NOME PADRONIZADO
              conteudo: sectionContent
            });
          }
        }
        
        if (divisions.length >= 3) {
          break;  // Encontrou divisões válidas
        } else {
          divisions.length = 0;  // Limpar tentativa falha
        }
      }
    }
    
    console.log(`[LOCAL_DIVIDER] 📖 Resultado: ${divisions.length} capítulos encontrados`);
    return divisions;
  }
  
  /**
   * Dividir por parágrafos grandes
   */
  private divideByParagraphs(content: string): Omit<LocalDivision, 'resumo' | 'indice'>[] {
    console.log(`[LOCAL_DIVIDER] 📄 Dividindo por parágrafos...`);
    
    const divisions: Omit<LocalDivision, 'resumo' | 'indice'>[] = [];
    
    // Dividir por parágrafos duplos
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    
    // Agrupar parágrafos pequenos
    const targetSize = Math.ceil(content.length / 20);
    let currentDivision = '';
    let divisionCount = 1;
    
    for (const paragraph of paragraphs) {
      currentDivision += paragraph + '\n\n';
      
      if (currentDivision.length >= targetSize || divisions.length === 19) {
        divisions.push({
          nome: `Parte ${divisions.length + 1}`, // ✅ NOME PADRONIZADO
          conteudo: currentDivision.trim()
        });
        
        currentDivision = '';
        divisionCount++;
        
        if (divisions.length >= 20) break;
      }
    }
    
    // Adicionar último conteúdo se houver
    if (currentDivision.trim() && divisions.length < 20) {
      divisions.push({
        nome: `Parte ${divisions.length + 1}`, // ✅ NOME PADRONIZADO
        conteudo: currentDivision.trim()
      });
    }
    
    console.log(`[LOCAL_DIVIDER] 📄 ✅ Criadas ${divisions.length} divisões por parágrafos`);
    return divisions;
  }
  
  /**
   * Forçar divisão em partes iguais
   */
  private forceEqualDivisions(content: string, targetCount: number): Omit<LocalDivision, 'resumo' | 'indice'>[] {
    console.log(`[LOCAL_DIVIDER] ✂️ Forçando divisão em ${targetCount} partes iguais...`);
    
    const divisions: Omit<LocalDivision, 'resumo' | 'indice'>[] = [];
    const chunkSize = Math.ceil(content.length / targetCount);
    
    for (let i = 0; i < targetCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, content.length);
      
      if (start >= content.length) break;
      
      let chunk = content.slice(start, end);
      
      // Tentar quebrar em uma quebra de linha natural
      if (i < targetCount - 1) {  // Não é a última parte
        const lastNewline = chunk.lastIndexOf('\n');
        if (lastNewline > chunkSize * 0.7) {  // Se quebra natural está nos últimos 30%
          chunk = content.slice(start, start + lastNewline);
        }
      }
      
      divisions.push({
        nome: `Parte ${i + 1}`, // ✅ NOME PADRONIZADO
        conteudo: chunk.trim()
      });
    }
    
    console.log(`[LOCAL_DIVIDER] ✂️ ✅ Criadas ${divisions.length} divisões iguais`);
    return divisions;
  }
  
  /**
   * Gerar resumo detalhado e limpo para uma divisão
   */
  private generateSummary(content: string, name: string): string {
    // Limpar caracteres especiais que aparecem como quadrados
    const step1 = this.cleanSpecialCharacters(content);
    const cleanContent = this.fixReplacedCharacters(step1);
    
    // Debug: verificar se ainda há caracteres problemáticos
    const problematicChars = cleanContent.match(/[\uFFFD\u25A0\u25A1]/g);
    if (problematicChars) {
      console.log(`[LOCAL_DIVIDER] ⚠️ Caracteres problemáticos ainda presentes:`, problematicChars);
    }
    
    // Pegar primeiras 5-7 linhas significativas para resumo mais detalhado
    const lines = cleanContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 15)  // Linhas com conteúdo substancial
      .slice(0, 7);  // Mais linhas para resumo mais completo
    
    let summary = '';
    
    if (lines.length > 0) {
      // Criar resumo baseado no conteúdo real
      const firstLine = lines[0];
      const otherLines = lines.slice(1, 4);
      
      // Identificar tipo de conteúdo
      const contentType = this.identifyContentType(firstLine, cleanContent);
      
      summary = `${contentType}: ${firstLine}`;
      
      if (otherLines.length > 0) {
        const additionalInfo = otherLines.join(' ').substring(0, 200);
        summary += ` - ${additionalInfo}`;
      }
      
      // Adicionar informações sobre tamanho e temas
      const themes = this.extractKeyThemes(cleanContent);
      if (themes.length > 0) {
        summary += ` [Temas: ${themes.join(', ')}]`;
      }
      
    } else {
      summary = `Seção com ${content.length} caracteres sobre ${name}`;
    }
    
    // Limitar tamanho final do resumo
    if (summary.length > 400) {
      summary = summary.substring(0, 400) + '...';
    }
    
    return summary;
  }
  
  /**
   * Limpar caracteres especiais que aparecem como quadrados - VERSÃO CONSERVADORA
   */
  private cleanSpecialCharacters(text: string): string {
    return text
      // Apenas os caracteres mais problemáticos que claramente não são letras
      .replace(/\uFFFD/g, '') // Replacement character específico (quadrado principal)
      .replace(/\u00A0/g, ' ') // Non-breaking space → espaço normal
      
      // Aspas inteligentes → aspas normais
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes simples
      .replace(/[\u201C\u201D]/g, '"') // Smart quotes duplas
      
      // Traços especiais → traço normal
      .replace(/[\u2013\u2014]/g, '-') // En dash, Em dash
      
      // Espaços especiais → espaço normal
      .replace(/[\u2000-\u200B]/g, ' ') // Various spaces
      .replace(/\u2028/g, '\n') // Line separator
      .replace(/\u2029/g, '\n\n') // Paragraph separator
      
      // Símbolos específicos que aparecem como quadrados
      .replace(/[\u25A0\u25A1]/g, '') // Quadrados preto e branco específicos
      .replace(/[\u2610-\u2612]/g, '') // Checkboxes específicos
      
      // Limpar apenas espaços múltiplos
      .replace(/[ \t]+/g, ' ') // Múltiplos espaços → espaço único
      .replace(/\n{3,}/g, '\n\n') // Múltiplas quebras → dupla
      .trim();
  }
  
  /**
   * Corrigir apenas caracteres específicos problemáticos (conservador)
   */
  private fixReplacedCharacters(text: string): string {
    return text
      // Apenas replacement characters específicos
      .replace(/\uFFFD/g, '') // Character replacement principal
      .replace(/\u0000/g, '') // NULL character
      
      // Normalizar espaços não-padrão
      .replace(/\u00A0/g, ' ') // Non-breaking space
      .replace(/\u2009/g, ' ') // Thin space
      .replace(/\u200A/g, ' ') // Hair space
      
      // Converter caracteres de formatação comuns
      .replace(/\u2026/g, '...') // Ellipsis
      .replace(/\u2022/g, '-') // Bullet point
      
      // Manter todas as letras e números intactos
      // Não mexer em ranges de letras: A-Z, a-z, 0-9, acentos, etc.
      ;
  }

  /**
   * Identificar tipo de conteúdo
   */
  private identifyContentType(firstLine: string, content: string): string {
    const lowerFirst = firstLine.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerFirst.includes('artigo') || lowerFirst.includes('art.')) {
      return 'Artigo';
    } else if (lowerFirst.includes('capítulo') || lowerFirst.includes('capitulo')) {
      return 'Capítulo';
    } else if (lowerFirst.includes('seção') || lowerFirst.includes('secao')) {
      return 'Seção';
    } else if (lowerFirst.includes('anexo')) {
      return 'Anexo';
    } else if (lowerContent.includes('dependente') || lowerContent.includes('beneficiário')) {
      return 'Regulamento sobre Dependentes';
    } else if (lowerContent.includes('documento') && lowerContent.includes('necessário')) {
      return 'Documentação Necessária';
    } else if (lowerContent.includes('procedimento') || lowerContent.includes('como')) {
      return 'Procedimentos';
    } else if (lowerContent.includes('prazo') || lowerContent.includes('tempo')) {
      return 'Prazos e Cronogramas';
    } else {
      return 'Informações Gerais';
    }
  }
  
  /**
   * Extrair temas-chave do conteúdo
   */
  private extractKeyThemes(content: string): string[] {
    const themes: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Temas relacionados a dependentes
    if (lowerContent.includes('dependente')) themes.push('dependentes');
    if (lowerContent.includes('beneficiário')) themes.push('beneficiários');
    if (lowerContent.includes('cônjuge') || lowerContent.includes('esposa') || lowerContent.includes('marido')) themes.push('cônjuge');
    if (lowerContent.includes('filho') || lowerContent.includes('filha')) themes.push('filhos');
    if (lowerContent.includes('mãe') || lowerContent.includes('pai') || lowerContent.includes('genitores')) themes.push('pais');
    if (lowerContent.includes('documento') || lowerContent.includes('certidão')) themes.push('documentação');
    if (lowerContent.includes('prazo') || lowerContent.includes('tempo')) themes.push('prazos');
    if (lowerContent.includes('procedimento') || lowerContent.includes('processo')) themes.push('procedimentos');
    if (lowerContent.includes('declaração')) themes.push('declaração');
    if (lowerContent.includes('idade') || lowerContent.includes('anos')) themes.push('critérios idade');
    
    return themes.slice(0, 3); // Máximo 3 temas
  }
}

// Instância global
export const localDocumentDivider = new LocalDocumentDivider();
