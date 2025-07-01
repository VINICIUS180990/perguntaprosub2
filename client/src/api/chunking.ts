/**
 * Sistema de chunking inteligente para reduzir custos da API
 */

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
    pageNumber?: number;
    relevanceScore?: number;
  };
}

/**
 * Divide um documento em chunks menores
 */
export function chunkDocument(content: string, chunkSize: number = 2000): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let currentIndex = 0;
  let chunkId = 0;

  for (const sentence of sentences) {
    const proposedChunk = currentChunk + sentence + '.';
    
    if (proposedChunk.length > chunkSize && currentChunk.length > 0) {
      // Salva o chunk atual
      chunks.push({
        id: `chunk_${chunkId}`,
        content: currentChunk.trim(),
        metadata: {
          startIndex: currentIndex - currentChunk.length,
          endIndex: currentIndex
        }
      });
      
      // Inicia novo chunk
      currentChunk = sentence + '.';
      chunkId++;
    } else {
      currentChunk = proposedChunk;
    }
    
    currentIndex += sentence.length + 1;
  }

  // Adiciona o último chunk se não estiver vazio
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `chunk_${chunkId}`,
      content: currentChunk.trim(),
      metadata: {
        startIndex: currentIndex - currentChunk.length,
        endIndex: currentIndex
      }
    });
  }

  return chunks;
}

/**
 * Busca chunks relevantes baseado na pergunta do usuário com algoritmo melhorado
 */
export function findRelevantChunks(
  chunks: DocumentChunk[],
  query: string,
  maxChunks: number = 5
): DocumentChunk[] {
  const queryWords = extractAdvancedKeywords(query);
  console.log(`[CHUNKING] Palavras-chave extraídas: ${queryWords.join(', ')}`);
  
  // Calcula relevância baseada em múltiplos fatores
  const chunksWithScore = chunks.map(chunk => {
    const chunkWords = chunk.content.toLowerCase();
    let score = 0;
    
    // 1. Pontuação por palavras-chave exatas
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = (chunkWords.match(regex) || []).length;
      score += matches * 3; // Peso maior para matches exatos
    });
    
    // 2. Pontuação por palavras parciais
    queryWords.forEach(word => {
      if (word.length >= 4) {
        const partialRegex = new RegExp(word, 'gi');
        const matches = (chunkWords.match(partialRegex) || []).length;
        score += matches * 1; // Peso menor para matches parciais
      }
    });
    
    // 3. Pontuação por densidade de palavras-chave
    const totalWords = chunkWords.split(/\s+/).length;
    const density = score / Math.max(totalWords, 1);
    score += density * 100; // Bonus por densidade
    
    // 4. Pontuação por proximidade de palavras-chave
    const proximityBonus = calculateProximityBonus(chunkWords, queryWords);
    score += proximityBonus;
    
    return {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        relevanceScore: score
      }
    };
  });

  // Ordena por relevância
  const sortedChunks = chunksWithScore
    .sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0));
  
  // Filtra chunks com pontuação muito baixa (menos de 1)
  const relevantChunks = sortedChunks.filter(chunk => (chunk.metadata.relevanceScore || 0) >= 1);
  
  // Se não encontrou chunks relevantes, retorna os primeiros chunks do documento
  if (relevantChunks.length === 0) {
    console.log('[CHUNKING] Nenhum chunk relevante encontrado, retornando primeiros chunks');
    return chunks.slice(0, Math.min(maxChunks, chunks.length));
  }
  
  console.log(`[CHUNKING] Encontrados ${relevantChunks.length} chunks relevantes, retornando ${Math.min(maxChunks, relevantChunks.length)}`);
  return relevantChunks.slice(0, maxChunks);
}

/**
 * Extrai palavras-chave avançadas da query
 */
function extractAdvancedKeywords(query: string): string[] {
  // Remove stop words mais compreensivas
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sobre',
    'que', 'qual', 'quais', 'quando', 'onde', 'como', 'por', 'porque',
    'é', 'são', 'foi', 'foram', 'ser', 'ter', 'tem', 'está', 'estão',
    'me', 'te', 'se', 'nos', 'vos', 'meu', 'minha', 'seu', 'sua',
    'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela',
    'muito', 'mais', 'menos', 'também', 'já', 'ainda', 'só', 'apenas',
    'pode', 'posso', 'fazer', 'dizer', 'falar', 'ver', 'saber', 'quero'
  ]);

  // Extrai palavras principais
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word))
    .filter(word => /^[a-záàâãéèêíïóôõöúçñ]+$/.test(word));
  
  // Remove duplicatas
  return [...new Set(words)];
}

/**
 * Calcula bonus por proximidade de palavras-chave
 */
function calculateProximityBonus(text: string, keywords: string[]): number {
  if (keywords.length < 2) return 0;
  
  let bonus = 0;
  const words = text.toLowerCase().split(/\s+/);
  
  // Para cada par de palavras-chave
  for (let i = 0; i < keywords.length; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      const word1 = keywords[i];
      const word2 = keywords[j];
      
      // Encontra posições das palavras
      const positions1 = words.map((w, idx) => w.includes(word1) ? idx : -1).filter(idx => idx !== -1);
      const positions2 = words.map((w, idx) => w.includes(word2) ? idx : -1).filter(idx => idx !== -1);
      
      // Calcula menor distância entre as palavras
      for (const pos1 of positions1) {
        for (const pos2 of positions2) {
          const distance = Math.abs(pos1 - pos2);
          if (distance <= 10) { // Dentro de 10 palavras
            bonus += Math.max(0, 10 - distance); // Maior bonus para menor distância
          }
        }
      }
    }
  }
  
  return bonus;
}

/**
 * Combina chunks relevantes em um contexto único com melhor formatação
 */
export function combineRelevantChunks(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) return '';
  
  // Ordena chunks por posição no documento original para manter sequência lógica
  const sortedChunks = chunks.sort((a, b) => a.metadata.startIndex - b.metadata.startIndex);
  
  let combined = '';
  
  // Se há mais de um chunk, adiciona contexto sobre a estrutura
  if (sortedChunks.length > 1) {
    combined += `[DOCUMENTO DIVIDIDO EM ${sortedChunks.length} SEÇÕES RELEVANTES]\n\n`;
  }
  
  sortedChunks.forEach((chunk, index) => {
    const relevanceScore = chunk.metadata.relevanceScore || 0;
    combined += `=== SEÇÃO ${index + 1} (Relevância: ${relevanceScore.toFixed(1)}) ===\n`;
    combined += chunk.content.trim();
    
    // Adiciona separador entre chunks (exceto no último)
    if (index < sortedChunks.length - 1) {
      combined += '\n\n---\n\n';
    } else {
      combined += '\n\n';
    }
  });
  
  return combined;
}

/**
 * Busca híbrida combinando palavra-chave e similaridade semântica simples
 */
export function hybridSearch(
  chunks: DocumentChunk[],
  query: string,
  maxChunks: number = 5
): DocumentChunk[] {
  // Primeiro, aplica busca por palavra-chave
  const keywordResults = findRelevantChunks(chunks, query, chunks.length);
  
  // Depois, aplica busca semântica simples
  const semanticResults = findSemanticRelevantChunks(chunks, query);
  
  // Combina os resultados, dando peso maior para matches de palavra-chave
  const combinedScores = new Map<string, number>();
  
  keywordResults.forEach((chunk, index) => {
    const keywordScore = chunk.metadata.relevanceScore || 0;
    const keywordWeight = Math.max(0, maxChunks - index) / maxChunks; // Peso decrescente por posição
    combinedScores.set(chunk.id, keywordScore * keywordWeight * 0.7); // 70% peso para palavra-chave
  });
  
  semanticResults.forEach((chunk, index) => {
    const semanticScore = chunk.metadata.relevanceScore || 0;
    const semanticWeight = Math.max(0, maxChunks - index) / maxChunks;
    const currentScore = combinedScores.get(chunk.id) || 0;
    combinedScores.set(chunk.id, currentScore + (semanticScore * semanticWeight * 0.3)); // 30% peso para semântica
  });
  
  // Ordena por pontuação combinada
  const allChunks = [...keywordResults, ...semanticResults];
  const uniqueChunks = allChunks.filter((chunk, index, self) => 
    self.findIndex(c => c.id === chunk.id) === index
  );
  
  const sortedChunks = uniqueChunks
    .map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        relevanceScore: combinedScores.get(chunk.id) || 0
      }
    }))
    .sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0))
    .slice(0, maxChunks);
  
  console.log(`[HYBRID SEARCH] Selecionados ${sortedChunks.length} chunks de ${chunks.length} disponíveis`);
  return sortedChunks;
}

/**
 * Busca semântica simples baseada em conceitos relacionados
 */
function findSemanticRelevantChunks(
  chunks: DocumentChunk[],
  query: string
): DocumentChunk[] {
  const concepts = extractConcepts(query);
  
  const chunksWithScore = chunks.map(chunk => {
    let score = 0;
    const chunkLower = chunk.content.toLowerCase();
    
    concepts.forEach(concept => {
      // Busca por conceitos relacionados
      concept.related.forEach(related => {
        if (chunkLower.includes(related.toLowerCase())) {
          score += concept.weight * 0.5; // Peso menor para conceitos relacionados
        }
      });
    });
    
    return {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        relevanceScore: score
      }
    };
  });
  
  return chunksWithScore
    .filter(chunk => (chunk.metadata.relevanceScore || 0) > 0)
    .sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0));
}

/**
 * Extrai conceitos e seus termos relacionados da query
 */
function extractConcepts(query: string): Array<{weight: number, related: string[]}> {
  const concepts: Array<{weight: number, related: string[]}> = [];
  const queryLower = query.toLowerCase();
  
  // Conceitos militares
  if (queryLower.includes('disciplina') || queryLower.includes('disciplinar')) {
    concepts.push({
      weight: 2,
      related: ['punição', 'transgressão', 'falta', 'sanção', 'penalidade', 'correção']
    });
  }
  
  if (queryLower.includes('licença') || queryLower.includes('licenciamento')) {
    concepts.push({
      weight: 2,
      related: ['afastamento', 'dispensa', 'autorização', 'permissão', 'férias']
    });
  }
  
  if (queryLower.includes('promoção') || queryLower.includes('progressão')) {
    concepts.push({
      weight: 2,
      related: ['ascensão', 'avanço', 'posto', 'graduação', 'carreira']
    });
  }
  
  if (queryLower.includes('saúde') || queryLower.includes('médico')) {
    concepts.push({
      weight: 2,
      related: ['hospitalar', 'tratamento', 'doença', 'enfermidade', 'inspeção']
    });
  }
  
  if (queryLower.includes('pagamento') || queryLower.includes('soldo')) {
    concepts.push({
      weight: 2,
      related: ['remuneração', 'vencimento', 'salário', 'adicional', 'gratificação']
    });
  }
  
  // Conceitos administrativos
  if (queryLower.includes('documento') || queryLower.includes('documentação')) {
    concepts.push({
      weight: 1.5,
      related: ['requerimento', 'formulário', 'certidão', 'declaração', 'atestado']
    });
  }
  
  if (queryLower.includes('prazo') || queryLower.includes('tempo')) {
    concepts.push({
      weight: 1.5,
      related: ['período', 'duração', 'vencimento', 'cronograma', 'calendário']
    });
  }
  
  return concepts;
}
