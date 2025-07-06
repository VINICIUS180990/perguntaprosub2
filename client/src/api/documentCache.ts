/**
 * Sistema de Cache para Documentos Processados
 * Armazena divisões e resumos de documentos para evitar reprocessamento
 */

import type { DocumentProcessingResult } from './documentProcessor';

interface CachedDocument {
  hash: string;
  documentName: string;
  processedResult: DocumentProcessingResult;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

class DocumentCache {
  private cache: Map<string, CachedDocument> = new Map();
  private readonly MAX_CACHE_SIZE = 10; // Máximo 10 documentos em cache
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas

  /**
   * Gera hash único para o documento baseado no conteúdo
   */
  private generateDocumentHash(content: string, name: string): string {
    console.log(`[DOCUMENT_CACHE] 🔧 Gerando hash para documento: ${name}`);
    
    let hash = 0;
    const combined = content + name;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte para 32bit
    }
    
    const result = `doc_${Math.abs(hash)}_${content.length}`;
    console.log(`[DOCUMENT_CACHE] ✅ Hash gerado: ${result}`);
    return result;
  }

  /**
   * Verifica se um documento já está processado no cache
   */
  hasDocument(content: string, name: string): boolean {
    const hash = this.generateDocumentHash(content, name);
    const cached = this.cache.get(hash);
    
    if (!cached) {
      console.log(`[DOCUMENT_CACHE] ❌ Documento não encontrado no cache: ${name}`);
      return false;
    }

    // Verifica se não expirou
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      console.log(`[DOCUMENT_CACHE] ⏰ Cache expirado para documento: ${name}`);
      this.cache.delete(hash);
      return false;
    }

    console.log(`[DOCUMENT_CACHE] ✅ Documento encontrado no cache: ${name}`);
    console.log(`[DOCUMENT_CACHE] 📊 Acessado ${cached.accessCount} vezes`);
    return true;
  }

  /**
   * Recupera um documento processado do cache
   */
  getDocument(content: string, name: string): DocumentProcessingResult | null {
    const hash = this.generateDocumentHash(content, name);
    const cached = this.cache.get(hash);

    if (!cached) {
      console.log(`[DOCUMENT_CACHE] ❌ Documento não encontrado: ${name}`);
      return null;
    }

    // Verifica expiração
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      console.log(`[DOCUMENT_CACHE] ⏰ Cache expirado, removendo: ${name}`);
      this.cache.delete(hash);
      return null;
    }

    // Atualiza estatísticas de acesso
    cached.accessCount++;
    cached.lastAccess = Date.now();

    console.log(`[DOCUMENT_CACHE] ✅ Documento recuperado do cache: ${name}`);
    console.log(`[DOCUMENT_CACHE] 📊 Total de divisões: ${cached.processedResult.divisoes.length}`);
    console.log(`[DOCUMENT_CACHE] 📊 Método de divisão: ${cached.processedResult.metadados.como_foi_dividido}`);

    return cached.processedResult;
  }

  /**
   * Armazena um documento processado no cache
   */
  setDocument(content: string, name: string, result: DocumentProcessingResult): void {
    console.log(`[DOCUMENT_CACHE] 💾 Armazenando documento no cache: ${name}`);
    
    const hash = this.generateDocumentHash(content, name);
    
    // Remove cache antigo se já existe
    if (this.cache.has(hash)) {
      console.log(`[DOCUMENT_CACHE] 🔄 Atualizando documento existente no cache`);
    }

    // Limpa cache se estiver muito cheio
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(hash)) {
      this.cleanOldEntries();
    }

    const cached: CachedDocument = {
      hash,
      documentName: name,
      processedResult: result,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };

    this.cache.set(hash, cached);
    
    console.log(`[DOCUMENT_CACHE] ✅ Documento armazenado com sucesso`);
    console.log(`[DOCUMENT_CACHE] 📊 Cache size: ${this.cache.size}/${this.MAX_CACHE_SIZE}`);
    console.log(`[DOCUMENT_CACHE] 📋 Divisões armazenadas: ${result.divisoes.length}`);
  }

  /**
   * Remove entradas antigas do cache para liberar espaço
   */
  private cleanOldEntries(): void {
    console.log(`[DOCUMENT_CACHE] 🧹 Limpando cache antigas...`);
    
    // Converte para array e ordena por último acesso
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      return a[1].lastAccess - b[1].lastAccess;
    });

    // Remove as mais antigas até ficar dentro do limite
    const toRemove = this.cache.size - this.MAX_CACHE_SIZE + 1;
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [hash, cached] = entries[i];
      console.log(`[DOCUMENT_CACHE] 🗑️ Removendo documento antigo: ${cached.documentName}`);
      this.cache.delete(hash);
    }
    
    console.log(`[DOCUMENT_CACHE] ✅ Limpeza concluída. Cache size: ${this.cache.size}`);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    console.log(`[DOCUMENT_CACHE] 🧹 Limpando todo o cache...`);
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[DOCUMENT_CACHE] ✅ Cache limpo. ${size} documentos removidos`);
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    totalDocuments: number;
    cacheHits: number;
    totalAccesses: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    let totalAccesses = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    let oldestDoc = null;
    let newestDoc = null;

    for (const cached of this.cache.values()) {
      totalAccesses += cached.accessCount;
      
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestDoc = cached.documentName;
      }
      
      if (cached.timestamp > newestTime) {
        newestTime = cached.timestamp;
        newestDoc = cached.documentName;
      }
    }

    const stats = {
      totalDocuments: this.cache.size,
      cacheHits: this.cache.size,
      totalAccesses,
      oldestEntry: oldestDoc,
      newestEntry: newestDoc
    };

    console.log(`[DOCUMENT_CACHE] 📊 Estatísticas do cache:`, stats);
    return stats;
  }

  /**
   * Lista todos os documentos no cache
   */
  listCachedDocuments(): Array<{
    name: string;
    divisoes: number;
    timestamp: number;
    accessCount: number;
    lastAccess: number;
  }> {
    console.log(`[DOCUMENT_CACHE] 📋 Listando documentos em cache...`);
    
    const documents = Array.from(this.cache.values()).map(cached => ({
      name: cached.documentName,
      divisoes: cached.processedResult.divisoes.length,
      timestamp: cached.timestamp,
      accessCount: cached.accessCount,
      lastAccess: cached.lastAccess
    }));

    documents.forEach(doc => {
      console.log(`[DOCUMENT_CACHE] 📄 ${doc.name}: ${doc.divisoes} divisões, ${doc.accessCount} acessos`);
    });

    return documents;
  }
}

// Instância global do cache
export const documentCache = new DocumentCache();

// Expõe funções úteis para debug
if (typeof window !== 'undefined') {
  (window as any).documentCache = {
    stats: () => documentCache.getStats(),
    list: () => documentCache.listCachedDocuments(),
    clear: () => documentCache.clear()
  };
}
