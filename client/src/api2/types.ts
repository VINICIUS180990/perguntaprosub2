/**
 * TIPOS E INTERFACES - API2
 * Definições de tipos para o novo sistema de processamento de documentos
 */

// === DOCUMENTO BASE === //
export interface DocumentInfo {
  id: string;
  name: string;
  content: string;
  tokenCount: number;
  type: 'SMALL' | 'LARGE';
  timestamp: number;
  hash: string;
}

// === DOCUMENTO PEQUENO === //
export interface SmallDocument extends DocumentInfo {
  type: 'SMALL';
  // Documento pequeno não precisa de divisões
}

// === DOCUMENTO GRANDE === //
export interface LargeDocument extends DocumentInfo {
  type: 'LARGE';
  divisions: DocumentDivision[];
  processingMethod: string;
}

export interface DocumentDivision {
  id: string;
  nome: string;
  conteudo: string;
  resumo: string;
  indice: number;
  tokenCount: number;
}

// === CACHE === //
export interface CacheEntry {
  document: SmallDocument | LargeDocument;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

// === QUERY PROCESSING === //
export interface QueryAnalysis {
  needsDocument: boolean;
  confidence: number;
  reasoning: string;
}

export interface PartSelectionResult {
  selectedParts: DocumentDivision[];
  reasoning: string;
  tokensSaved: number;
}

export interface QueryResponse {
  answer: string;
  documentUsed: boolean;
  sectionsUsed: string[];
  processingTime: number;
  tokenCost: {
    input: number;
    output: number;
    total: number;
  };
  fromCache: boolean;
}

// === STATUS === //
export interface ProcessingStatus {
  stage: 'EXTRACTING' | 'ANALYZING' | 'DIVIDING' | 'CACHING' | 'READY' | 'ERROR';
  message: string;
  progress?: number;
}

export interface SystemStats {
  totalDocuments: number;
  smallDocuments: number;
  largeDocuments: number;
  cacheSize: number;
  totalQueries: number;
  totalCost: number;
}
