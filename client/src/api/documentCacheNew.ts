/**
 * DOCUMENT CACHE NEW - Cache das divisões de documentos
 * Armazena as divisões feitas pela API para evitar reprocessamento
 */

import type { DivisionResult } from './documentDivider';

interface CacheEntry {
  divisions: DivisionResult;
  documentHash: string;
  documentName: string;
  createdAt: number;
}

/**
 * Classe responsável pelo cache de divisões de documentos
 */
export class DocumentCacheNew {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas em ms

  /**
   * Gera hash único para o documento baseado no conteúdo e nome
   */
  private generateDocumentHash(documentContent: string, documentName: string): string {
    // Usar conteúdo + nome + tamanho para gerar hash único
    const contentHash = this.simpleHash(documentContent);
    const nameHash = this.simpleHash(documentName);
    const sizeHash = documentContent.length;
    
    const finalHash = `doc_${contentHash}_${nameHash}_${sizeHash}`;
    
    console.log(`[DOCUMENT_CACHE_NEW] 🔧 Gerando hash para documento: ${documentName}`);
    console.log(`[DOCUMENT_CACHE_NEW] ✅ Hash gerado: ${finalHash}`);
    
    return finalHash;
  }

  /**
   * Hash simples para strings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Verifica se documento está no cache e é válido
   */
  hasDocument(documentContent: string, documentName: string): boolean {
    const hash = this.generateDocumentHash(documentContent, documentName);
    const entry = this.cache.get(hash);
    
    if (!entry) {
      console.log(`[DOCUMENT_CACHE_NEW] ❌ Documento não encontrado no cache: ${documentName}`);
      return false;
    }

    const isExpired = Date.now() - entry.createdAt > this.CACHE_DURATION;
    if (isExpired) {
      console.log(`[DOCUMENT_CACHE_NEW] ⏰ Cache expirado para documento: ${documentName}`);
      this.cache.delete(hash);
      return false;
    }

    console.log(`[DOCUMENT_CACHE_NEW] ✅ Documento encontrado no cache: ${documentName}`);
    console.log(`[DOCUMENT_CACHE_NEW] ✅ - Divisões em cache: ${entry.divisions.divisoes.length}`);
    
    return true;
  }

  /**
   * Recupera documento do cache
   */
  getDocument(documentContent: string, documentName: string): DivisionResult | null {
    const hash = this.generateDocumentHash(documentContent, documentName);
    const entry = this.cache.get(hash);
    
    if (!entry) {
      console.log(`[DOCUMENT_CACHE_NEW] ❌ Tentativa de recuperar documento não encontrado: ${documentName}`);
      return null;
    }

    console.log(`[DOCUMENT_CACHE_NEW] 📂 RECUPERANDO DO CACHE:`);
    console.log(`[DOCUMENT_CACHE_NEW] 📂 - Documento: ${documentName}`);
    console.log(`[DOCUMENT_CACHE_NEW] 📂 - Divisões: ${entry.divisions.divisoes.length}`);
    
    return entry.divisions;
  }

  /**
   * Armazena divisões no cache
   */
  setDocument(documentContent: string, documentName: string, divisions: DivisionResult): void {
    const hash = this.generateDocumentHash(documentContent, documentName);
    
    const entry: CacheEntry = {
      divisions,
      documentHash: hash,
      documentName,
      createdAt: Date.now()
    };

    this.cache.set(hash, entry);
    
    console.log(`[DOCUMENT_CACHE_NEW] 💾 ARMAZENANDO NO CACHE:`);
    console.log(`[DOCUMENT_CACHE_NEW] 💾 - Documento: ${documentName}`);
    console.log(`[DOCUMENT_CACHE_NEW] 💾 - Divisões: ${divisions.divisoes.length}`);
    
    // Limpar cache antigo se necessário
    this.cleanExpiredEntries();
  }

  /**
   * Remove entradas expiradas do cache
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
      console.log(`[DOCUMENT_CACHE_NEW] 🧹 Cache limpo: ${removedCount} entradas expiradas removidas`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    console.log(`[DOCUMENT_CACHE_NEW] 🗑️ Cache completamente limpo: ${previousSize} entradas removidas`);
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    totalEntries: number;
    totalDocuments: string[];
  } {
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: this.cache.size,
      totalDocuments: entries.map(e => e.documentName)
    };
  }
}

// Instância global
export const documentCacheNew = new DocumentCacheNew();
