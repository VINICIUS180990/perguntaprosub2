/**
 * Sistema de cache para reduzir chamadas à API
 */

interface CacheEntry {
  key: string;
  response: string;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_EXPIRY = 30 * 60 * 1000; // 30 minutos

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
  }

  /**
   * Estatísticas do cache
   */
  getStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length
    };
  }
}

// Instância singleton do cache
export const apiCache = new APICache();
