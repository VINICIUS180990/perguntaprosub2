/**
 * Sistema de cache para reduzir chamadas à API
 */

interface CacheEntry {
  key: string;
  response: string;
  timestamp: number;
  expiry: number;
}

interface DocumentCacheEntry {
  key: string;
  divisions: Array<{
    name: string;
    content: string;
    summary: string;
  }>;
  metadata: {
    divisionMethod: string;
    totalDivisions: number;
    documentName: string;
  };
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();
  private documentCache: Map<string, DocumentCacheEntry> = new Map();
  private readonly DEFAULT_EXPIRY = 30 * 60 * 1000; // 30 minutos
  private readonly DOCUMENT_EXPIRY = 2 * 60 * 60 * 1000; // 2 horas para documentos

  /**
   * Gera chave de cache baseada no contexto e pergunta
   */
  private generateCacheKey(context: string, query: string): string {
    const contextHash = this.simpleHash(context.substring(0, 1000)); // Primeiros 1000 chars
    const queryHash = this.simpleHash(query);
    return `${contextHash}_${queryHash}`;
  }

  /**
   * Hash simples para gerar chaves
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Busca resposta no cache
   */
  get(context: string, query: string): string | null {
    const key = this.generateCacheKey(context, query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Verifica se expirou
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Armazena resposta no cache
   */
  set(context: string, query: string, response: string, customExpiry?: number): void {
    const key = this.generateCacheKey(context, query);
    const expiry = Date.now() + (customExpiry || this.DEFAULT_EXPIRY);

    this.cache.set(key, {
      key,
      response,
      timestamp: Date.now(),
      expiry
    });

    // Limpa cache antigo automaticamente
    this.cleanup();
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.documentCache.clear();
    console.log(`[CACHE] 🧹 Todo o cache limpo (respostas + documentos)`);
  }

  /**
   * Limpa apenas cache de documentos
   */
  clearDocuments(): void {
    this.documentCache.clear();
    console.log(`[CACHE] 🧹 Cache de documentos limpo`);
  }

  /**
   * Estatísticas do cache
   */
  getStats(): { 
    responses: { size: number; entries: number };
    documents: { size: number; entries: number };
    total: number;
  } {
    return {
      responses: {
        size: this.cache.size,
        entries: Array.from(this.cache.values()).length
      },
      documents: {
        size: this.documentCache.size,
        entries: Array.from(this.documentCache.values()).length
      },
      total: this.cache.size + this.documentCache.size
    };
  }

  /**
   * Cache para documentos processados (divisões e resumos)
   */
  private generateDocumentCacheKey(documentContent: string, documentName: string): string {
    const contentHash = this.simpleHash(documentContent);
    const nameHash = this.simpleHash(documentName);
    return `doc_${contentHash}_${nameHash}`;
  }

  /**
   * Busca divisões de documento no cache
   */
  getDocumentDivisions(documentContent: string, documentName: string): DocumentCacheEntry | null {
    const key = this.generateDocumentCacheKey(documentContent, documentName);
    const entry = this.documentCache.get(key);

    if (!entry) {
      console.log(`[CACHE] ❌ Documento não encontrado no cache: ${documentName}`);
      return null;
    }

    // Verifica se expirou
    if (Date.now() > entry.expiry) {
      this.documentCache.delete(key);
      console.log(`[CACHE] ⏰ Cache do documento expirado: ${documentName}`);
      return null;
    }

    console.log(`[CACHE] ✅ Documento encontrado no cache: ${documentName} (${entry.metadata.totalDivisions} divisões)`);
    return entry;
  }

  /**
   * Armazena divisões de documento no cache
   */
  setDocumentDivisions(
    documentContent: string, 
    documentName: string, 
    divisions: Array<{name: string; content: string; summary: string}>,
    metadata: {divisionMethod: string; totalDivisions: number; documentName: string}
  ): void {
    const key = this.generateDocumentCacheKey(documentContent, documentName);
    const expiry = Date.now() + this.DOCUMENT_EXPIRY;

    this.documentCache.set(key, {
      key,
      divisions,
      metadata,
      timestamp: Date.now(),
      expiry
    });

    console.log(`[CACHE] 💾 Documento salvo no cache: ${documentName} (${metadata.totalDivisions} divisões)`);
    
    // Limpa cache antigo automaticamente
    this.cleanupDocumentCache();
  }

  /**
   * Limpa entradas de documentos expiradas
   */
  private cleanupDocumentCache(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.documentCache.entries()) {
      if (now > entry.expiry) {
        this.documentCache.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[CACHE] 🧹 ${removed} documentos expirados removidos do cache`);
    }
  }
}

// Instância singleton do cache
export const apiCache = new APICache();
