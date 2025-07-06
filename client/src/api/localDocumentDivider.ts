/**
 * LOCAL DOCUMENT DIVIDER - Divisão local instantânea de documentos
 * Divide documentos localmente em 10 partes sem depender da API
 */

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
   * Divide documento localmente em 10 partes inteligentes
   */
  divideDocumentLocally(documentContent: string, documentName: string): LocalDivisionResult {
    const startTime = Date.now();
    
    console.log(`[LOCAL_DIVIDER] ⚡ INICIANDO DIVISÃO LOCAL:`);
    console.log(`[LOCAL_DIVIDER] ⚡ - Documento: ${documentName}`);
    console.log(`[LOCAL_DIVIDER] ⚡ - Tamanho: ${documentContent.length} chars`);
    
    // Dividir por parágrafos/seções naturais
    const divisions = this.createIntelligentDivisions(documentContent, documentName);
    
    const processingTime = Date.now() - startTime;
    
    const result: LocalDivisionResult = {
      divisoes: divisions,
      como_dividiu: "Divisão local automática em seções baseada em parágrafos e quebras naturais",
      timestamp: Date.now(),
      tamanho_original: documentContent.length
    };
    
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ DIVISÃO LOCAL CONCLUÍDA:`);
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ - Divisões criadas: ${divisions.length}`);
    console.log(`[LOCAL_DIVIDER] ⚡ ✅ - Tempo: ${processingTime}ms (INSTANTÂNEO!)`);
    
    // Log detalhado das divisões
    divisions.forEach((div, index) => {
      console.log(`[LOCAL_DIVIDER] 📋 ${index + 1}. "${div.nome}" (${div.conteudo.length} chars)`);
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
    
    // Se ainda não tem divisões suficientes, forçar divisão em 10 partes
    if (divisions.length < 10) {
      divisions = this.forceEqualDivisions(cleanContent, 10);
    }
    
    // Limitar a 10 divisões máximo
    if (divisions.length > 10) {
      divisions = divisions.slice(0, 10);
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
    const targetSize = Math.ceil(content.length / 10);
    let currentDivision = '';
    let divisionCount = 1;
    
    for (const paragraph of paragraphs) {
      currentDivision += paragraph + '\n\n';
      
      if (currentDivision.length >= targetSize || divisions.length === 9) {
        divisions.push({
          nome: `Parte ${divisions.length + 1}`, // ✅ NOME PADRONIZADO
          conteudo: currentDivision.trim()
        });
        
        currentDivision = '';
        divisionCount++;
        
        if (divisions.length >= 10) break;
      }
    }
    
    // Adicionar último conteúdo se houver
    if (currentDivision.trim() && divisions.length < 10) {
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
   * Gerar resumo automático para uma divisão
   */
  private generateSummary(content: string, name: string): string {
    // Pegar primeiras 3 linhas significativas
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20)  // Só linhas com conteúdo
      .slice(0, 3);
    
    let summary = lines.join(' ').substring(0, 200);
    
    // Se muito curto, adicionar informação básica
    if (summary.length < 50) {
      summary = `Esta seção contém ${content.length} caracteres de conteúdo sobre ${name}`;
    }
    
    // Finalizar com reticências se cortado
    if (summary.length === 200) {
      summary += '...';
    }
    
    return summary;
  }
}

// Instância global
export const localDocumentDivider = new LocalDocumentDivider();
