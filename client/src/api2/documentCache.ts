/**
 * CACHE UNIFICADO - API2
 * Sistema de cache para documentos pequenos e grandes
 */

import { CACHE_CONFIG, DEBUG_CONFIG } from './config';
import { logger, PerformanceTimer } from './utils';
import type { CacheEntry, SmallDocument, LargeDocument } from './types';

const PREFIX = DEBUG_CONFIG.PREFIXES.CACHE;

logger.info(PREFIX, 'Inicializando sistema de cache...');

export class DocumentCache {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    logger.debug(PREFIX, 'Configurando cache...');
    logger.debug(PREFIX, `Duração: ${CACHE_CONFIG.DURATION / 1000 / 60} minutos`);
    logger.debug(PREFIX, `Máximo de entradas: ${CACHE_CONFIG.MAX_ENTRIES}`);
    
    // Configurar limpeza automática
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredEntries();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
    
    logger.success(PREFIX, 'Cache inicializado com sucesso');
  }
  
  /**
   * Verifica se um documento está no cache
   */
  has(hash: string): boolean {
    const timer = new PerformanceTimer('Cache Check');
    
    logger.debug(PREFIX, `Verificando cache para hash: ${hash}`);
    
    const entry = this.cache.get(hash);
    const exists = !!entry && !this.isExpired(entry);
    
    if (exists && entry) {
      logger.success(PREFIX, `Cache HIT para: ${entry.document.name}`);
      // Atualizar estatísticas de acesso
      entry.lastAccessed = Date.now();
      entry.accessCount++;
    } else {
      logger.info(PREFIX, `Cache MISS para hash: ${hash}`);
      if (entry && this.isExpired(entry)) {
        logger.debug(PREFIX, 'Entrada expirada encontrada, removendo...');
        this.cache.delete(hash);
      }
    }
    
    timer.end();
    return exists;
  }
  
  /**
   * Recupera um documento do cache
   */
  get(hash: string): SmallDocument | LargeDocument | null {
    const timer = new PerformanceTimer('Cache Get');
    
    logger.debug(PREFIX, `Recuperando documento do cache: ${hash}`);
    
    if (!this.has(hash)) {
      logger.warn(PREFIX, 'Tentativa de recuperar documento não encontrado');
      timer.end();
      return null;
    }
    
    const entry = this.cache.get(hash)!;
    
    logger.success(PREFIX, `Documento recuperado: ${entry.document.name}`);
    logger.debug(PREFIX, `Tipo: ${entry.document.type}`);
    logger.debug(PREFIX, `Tokens: ${entry.document.tokenCount}`);
    logger.debug(PREFIX, `Acessos: ${entry.accessCount}`);
    
    if (entry.document.type === 'LARGE') {
      logger.debug(PREFIX, `Divisões: ${(entry.document as LargeDocument).divisions.length}`);
    }
    
    timer.end();
    return entry.document;
  }
  
  /**
   * Armazena um documento no cache
   */
  set(hash: string, document: SmallDocument | LargeDocument): void {
    const timer = new PerformanceTimer('Cache Set');
    
    logger.processing(PREFIX, `Armazenando documento no cache: ${document.name}`);
    logger.debug(PREFIX, `Hash: ${hash}`);
    logger.debug(PREFIX, `Tipo: ${document.type}`);
    logger.debug(PREFIX, `Tokens: ${document.tokenCount}`);
    
    // Verificar limite de entradas
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      logger.warn(PREFIX, 'Cache cheio, removendo entradas antigas...');
      this.removeOldestEntries();
    }
    
    const entry: CacheEntry = {
      document,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
    };
    
    this.cache.set(hash, entry);
    
    logger.success(PREFIX, `Documento armazenado com sucesso`);
    logger.debug(PREFIX, `Total em cache: ${this.cache.size}/${CACHE_CONFIG.MAX_ENTRIES}`);
    
    if (document.type === 'LARGE') {
      const largeDoc = document as LargeDocument;
      logger.debug(PREFIX, `Divisões armazenadas: ${largeDoc.divisions.length}`);
    }
    
    timer.end();
  }
  
  /**
   * Remove um documento do cache
   */
  remove(hash: string): boolean {
    logger.debug(PREFIX, `Removendo documento do cache: ${hash}`);
    
    const entry = this.cache.get(hash);
    if (entry) {
      logger.info(PREFIX, `Removendo: ${entry.document.name}`);
      this.cache.delete(hash);
      return true;
    }
    
    logger.warn(PREFIX, 'Tentativa de remover documento inexistente');
    return false;
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    
    logger.info(PREFIX, `Cache limpo: ${previousSize} entradas removidas`);
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    totalEntries: number;
    smallDocuments: number;
    largeDocuments: number;
    totalSizeKB: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    
    const stats = {
      totalEntries: entries.length,
      smallDocuments: entries.filter(e => e.document.type === 'SMALL').length,
      largeDocuments: entries.filter(e => e.document.type === 'LARGE').length,
      totalSizeKB: entries.reduce((acc, e) => acc + e.document.content.length, 0) / 1024,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.createdAt))) : undefined,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.createdAt))) : undefined,
    };
    
    logger.debug(PREFIX, 'Estatísticas do cache:', stats);
    
    return stats;
  }
  
  /**
   * Lista todos os documentos no cache
   */
  listDocuments(): Array<{name: string, type: string, tokenCount: number, accessCount: number}> {
    const documents = Array.from(this.cache.values()).map(entry => ({
      name: entry.document.name,
      type: entry.document.type,
      tokenCount: entry.document.tokenCount,
      accessCount: entry.accessCount,
    }));
    
    logger.debug(PREFIX, `Listando ${documents.length} documentos em cache`);
    
    return documents;
  }
  
  // === MÉTODOS PRIVADOS === //
  
  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.createdAt;
    const expired = age > CACHE_CONFIG.DURATION;
    
    if (expired) {
      logger.debug(PREFIX, `Entrada expirada: ${entry.document.name} (${Math.round(age / 1000 / 60)} min)`);
    }
    
    return expired;
  }
  
  private cleanExpiredEntries(): void {
    logger.debug(PREFIX, 'Executando limpeza de entradas expiradas...');
    
    const before = this.cache.size;
    let removed = 0;
    
    for (const [hash, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        logger.debug(PREFIX, `Removendo entrada expirada: ${entry.document.name}`);
        this.cache.delete(hash);
        removed++;
      }
    }
    
    if (removed > 0) {
      logger.info(PREFIX, `Limpeza concluída: ${removed} entradas removidas (${before} → ${this.cache.size})`);
    } else {
      logger.debug(PREFIX, 'Nenhuma entrada expirada encontrada');
    }
  }
  
  private removeOldestEntries(): void {
    logger.debug(PREFIX, 'Removendo entradas mais antigas...');
    
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por data de criação (mais antigas primeiro)
    entries.sort(([, a], [, b]) => a.createdAt - b.createdAt);
    
    // Remover as mais antigas até ficar abaixo do limite
    const toRemove = Math.max(1, entries.length - CACHE_CONFIG.MAX_ENTRIES + 5); // Remove 5 extras
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [hash, entry] = entries[i];
      logger.debug(PREFIX, `Removendo entrada antiga: ${entry.document.name}`);
      this.cache.delete(hash);
    }
    
    logger.info(PREFIX, `${toRemove} entradas antigas removidas`);
  }
  
  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    logger.info(PREFIX, 'Destruindo cache...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.clear();
    logger.success(PREFIX, 'Cache destruído');
  }
}

// Instância global
export const documentCache = new DocumentCache();

logger.success(PREFIX, 'Sistema de cache carregado com sucesso');
