/**
 * LOCAL DOCUMENT CACHE - Cache otimizado para divisões locais
 * Cache instantâneo das divisões feitas localmente
 */

import type { LocalDivisionResult } from './localDocumentDivider';

interface LocalCacheEntry {
  divisions: LocalDivisionResult;
  documentHash: string;
  documentName: string;
  createdAt: number;
}

/**
 * Classe responsável pelo cache local de divisões
 */
export class LocalDocumentCache {
  private cache: Map<string, LocalCacheEntry> = new Map();
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 horas

  /**
   * Gera hash simples e rápido para o documento
   */
  private generateFastHash(documentContent: string, documentName: string): string {
    // Hash super simples para performance
    const combined = documentName + documentContent.length + documentContent.substring(0, 100);
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer
    }
    
    const finalHash = `local_${Math.abs(hash)}_${documentContent.length}`;
    
    console.log(`[LOCAL_CACHE] ⚡ Hash rápido gerado: ${finalHash}`);
    return finalHash;
  }

  /**
   * Verifica se documento está no cache
   */
  hasDocument(documentContent: string, documentName: string): boolean {
    const hash = this.generateFastHash(documentContent, documentName);
    const entry = this.cache.get(hash);
    
    if (!entry) {
      console.log(`[LOCAL_CACHE] ❌ Documento não encontrado no cache: ${documentName}`);
      return false;
    }

    const isExpired = Date.now() - entry.createdAt > this.CACHE_DURATION;
    if (isExpired) {
      console.log(`[LOCAL_CACHE] ⏰ Cache expirado: ${documentName}`);
      this.cache.delete(hash);
      return false;
    }

    console.log(`[LOCAL_CACHE] ✅ DOCUMENTO ENCONTRADO NO CACHE: ${documentName}`);
    console.log(`[LOCAL_CACHE] ✅ - Divisões: ${entry.divisions.divisoes.length}`);
    console.log(`[LOCAL_CACHE] ✅ - Idade: ${Math.round((Date.now() - entry.createdAt) / 1000 / 60)} min`);
    
    return true;
  }

  /**
   * Recupera documento do cache
   */
  getDocument(documentContent: string, documentName: string): LocalDivisionResult | null {
    const hash = this.generateFastHash(documentContent, documentName);
    const entry = this.cache.get(hash);
    
    if (!entry) {
      console.log(`[LOCAL_CACHE] ❌ Falha ao recuperar: ${documentName}`);
      return null;
    }

    console.log(`[LOCAL_CACHE] 📂 RECUPERANDO DO CACHE LOCAL:`);
    console.log(`[LOCAL_CACHE] 📂 - Documento: ${documentName}`);
    console.log(`[LOCAL_CACHE] 📂 - Divisões: ${entry.divisions.divisoes.length}`);
    console.log(`[LOCAL_CACHE] 📂 - Como dividiu: ${entry.divisions.como_dividiu}`);
    
    return entry.divisions;
  }

  /**
   * Armazena divisões no cache instantaneamente
   */
  setDocument(documentContent: string, documentName: string, divisions: LocalDivisionResult): void {
    const hash = this.generateFastHash(documentContent, documentName);
    
    const entry: LocalCacheEntry = {
      divisions,
      documentHash: hash,
      documentName,
      createdAt: Date.now()
    };

    this.cache.set(hash, entry);
    
    console.log(`[LOCAL_CACHE] ⚡ ARMAZENADO INSTANTANEAMENTE:`);
    console.log(`[LOCAL_CACHE] ⚡ - Documento: ${documentName}`);
    console.log(`[LOCAL_CACHE] ⚡ - Divisões: ${divisions.divisoes.length}`);
    console.log(`[LOCAL_CACHE] ⚡ - Cache size: ${this.cache.size}`);
    
    // Limpeza automática
    this.cleanExpiredEntries();
  }

  /**
   * Limpar entradas expiradas
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [hash, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.CACHE_DURATION) {
        this.cache.delete(hash);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`[LOCAL_CACHE] 🧹 Cache limpo: ${removedCount} entradas removidas`);
    }
  }

  /**
   * Limpar todo o cache
   */
  clearCache(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    console.log(`[LOCAL_CACHE] 🗑️ Cache limpo: ${previousSize} entradas removidas`);
  }

  /**
   * Estatísticas do cache
   */
  getCacheStats(): {
    totalEntries: number;
    totalDocuments: string[];
  } {
    return {
      totalEntries: this.cache.size,
      totalDocuments: Array.from(this.cache.values()).map(e => e.documentName)
    };
  }
}

// Instância global
export const localDocumentCache = new LocalDocumentCache();
