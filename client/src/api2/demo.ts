/**
 * DEMONSTRADOR API2
 * Arquivo para testar e demonstrar o funcionamento da API2
 */

import { api2 } from './index';
import { logger } from './utils';

const PREFIX = '[DEMO]';

logger.info(PREFIX, 'Iniciando demonstração da API2...');

/**
 * Documento de exemplo pequeno
 */
const SMALL_DOCUMENT = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Entre as partes:
CONTRATANTE: João Silva
CONTRATADO: Maria Santos

CLÁUSULA 1: O serviço será de consultoria em marketing digital.
CLÁUSULA 2: O prazo de execução é de 30 dias.
CLÁUSULA 3: O valor total é de R$ 5.000,00.
CLÁUSULA 4: O pagamento será realizado em 2 parcelas iguais.

Data: 15/12/2024
Assinaturas: _______________  _______________
`;

/**
 * Documento de exemplo grande
 */
const LARGE_DOCUMENT = `
MANUAL DE OPERAÇÃO DO SISTEMA

CAPÍTULO 1: INTRODUÇÃO
Este manual descreve o funcionamento completo do sistema de gestão empresarial.
O sistema foi desenvolvido para atender empresas de pequeno e médio porte.
Possui módulos integrados de vendas, estoque, financeiro e recursos humanos.
A interface é intuitiva e permite operação por usuários com diferentes níveis técnicos.

CAPÍTULO 2: INSTALAÇÃO
2.1 REQUISITOS MÍNIMOS
- Sistema operacional: Windows 10 ou superior
- Memória RAM: 8GB mínimo, 16GB recomendado
- Espaço em disco: 50GB livres
- Processador: Intel i5 ou equivalente AMD
- Conexão com internet para atualizações

2.2 PROCESSO DE INSTALAÇÃO
Baixe o arquivo instalador do site oficial da empresa.
Execute como administrador e siga as instruções na tela.
Configure a conexão com o banco de dados durante a instalação.
Reinicie o computador após a conclusão do processo.

CAPÍTULO 3: CONFIGURAÇÃO INICIAL
3.1 CRIAÇÃO DE USUÁRIOS
Acesse o módulo administrativo com as credenciais padrão.
Crie usuários para cada funcionário que utilizará o sistema.
Configure permissões específicas para cada perfil de usuário.
Teste o acesso com cada conta criada.

3.2 CONFIGURAÇÃO DE EMPRESA
Cadastre os dados básicos da empresa: razão social, CNPJ, endereço.
Configure parâmetros fiscais específicos do seu estado.
Defina as formas de pagamento aceitas pela empresa.
Configure os impostos e taxas aplicáveis.

CAPÍTULO 4: MÓDULO DE VENDAS
4.1 CADASTRO DE CLIENTES
O sistema permite cadastro completo de pessoas físicas e jurídicas.
Campos obrigatórios incluem nome, documento e contato.
Histórico de compras fica disponível na ficha do cliente.
Sistema de pontuação e fidelidade pode ser ativado.

4.2 REGISTRO DE VENDAS
Vendas podem ser registradas via PDV ou manualmente.
Sistema calcula automaticamente impostos e descontos.
Permite parcelamento e diferentes formas de pagamento.
Emite cupom fiscal eletrônico automaticamente.

CAPÍTULO 5: CONTROLE DE ESTOQUE
5.1 CADASTRO DE PRODUTOS
Cada produto deve ter código único no sistema.
Descrição detalhada facilita localização e vendas.
Controle de estoque mínimo gera alertas automáticos.
Fotos dos produtos melhoram apresentação nas vendas.

5.2 MOVIMENTAÇÃO DE ESTOQUE
Entradas são registradas via nota fiscal ou manualmente.
Saídas são automaticamente registradas nas vendas.
Relatórios mostram giro de estoque por período.
Inventário permite ajustes e conferências periódicas.

ANEXO A: TROUBLESHOOTING
A.1 PROBLEMAS COMUNS
Sistema lento: Verifique espaço em disco e memória RAM.
Erro de conexão: Teste conectividade com banco de dados.
Falha na impressão: Configure drivers da impressora fiscal.
Backup falhou: Verifique permissões da pasta de destino.

A.2 CONTATO SUPORTE
Email: suporte@empresa.com
Telefone: (11) 1234-5678
Horário: Segunda a sexta, 8h às 18h
Site: www.empresa.com/suporte
`;

/**
 * Exemplos de perguntas
 */
const EXAMPLE_QUERIES = {
  general: [
    'Oi, como está?',
    'O que é inteligência artificial?',
    'Que horas são?'
  ],
  smallDoc: [
    'Qual o valor do contrato?',
    'Quem são as partes do contrato?',
    'Qual o prazo de execução?'
  ],
  largeDoc: [
    'Como instalar o sistema?',
    'Quais os requisitos mínimos?',
    'Como cadastrar produtos?',
    'O que fazer se o sistema estiver lento?'
  ]
};

/**
 * Demonstração completa do sistema
 */
export class API2Demo {
  
  /**
   * Executa demonstração completa
   */
  async runFullDemo(): Promise<void> {
    logger.info(PREFIX, '🚀 INICIANDO DEMONSTRAÇÃO COMPLETA');
    
    try {
      // 1. Status inicial
      await this.showInitialStatus();
      
      // 2. Teste com documento pequeno
      await this.testSmallDocument();
      
      // 3. Teste com documento grande
      await this.testLargeDocument();
      
      // 4. Teste de queries gerais
      await this.testGeneralQueries();
      
      // 5. Estatísticas finais
      await this.showFinalStats();
      
      logger.success(PREFIX, '✅ DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!');
      
    } catch (error) {
      logger.error(PREFIX, 'Erro na demonstração:', error);
    }
  }
  
  /**
   * Mostra status inicial
   */
  private async showInitialStatus(): Promise<void> {
    logger.info(PREFIX, '📊 STATUS INICIAL DO SISTEMA:');
    api2.logStatus();
  }
  
  /**
   * Testa documento pequeno
   */
  private async testSmallDocument(): Promise<void> {
    logger.info(PREFIX, '📄 TESTANDO DOCUMENTO PEQUENO...');
    
    // Pré-visualização
    const preview = api2.previewDocument(SMALL_DOCUMENT, 'Contrato.txt');
    logger.info(PREFIX, `Preview: ${preview.type} - ${preview.tokenCount} tokens`);
    
    // Processamento
    const processResult = await api2.processDocument(SMALL_DOCUMENT, 'Contrato.txt', 'ATTACHED');
    
    if (processResult.success) {
      logger.success(PREFIX, 'Documento pequeno processado!');
      
      // Testar queries
      for (const query of EXAMPLE_QUERIES.smallDoc) {
        await this.testQuery(query);
        await this.sleep(1000); // Pausa entre queries
      }
    } else {
      logger.error(PREFIX, 'Falha no documento pequeno:', processResult.error);
    }
  }
  
  /**
   * Testa documento grande
   */
  private async testLargeDocument(): Promise<void> {
    logger.info(PREFIX, '📚 TESTANDO DOCUMENTO GRANDE...');
    
    // Pré-visualização
    const preview = api2.previewDocument(LARGE_DOCUMENT, 'Manual.txt');
    logger.info(PREFIX, `Preview: ${preview.type} - ${preview.tokenCount} tokens - ${preview.estimatedDivisions} divisões estimadas`);
    
    // Processamento
    const processResult = await api2.processDocument(LARGE_DOCUMENT, 'Manual.txt', 'ATTACHED');
    
    if (processResult.success) {
      logger.success(PREFIX, 'Documento grande processado!');
      
      // Testar queries
      for (const query of EXAMPLE_QUERIES.largeDoc) {
        await this.testQuery(query);
        await this.sleep(1500); // Pausa maior para documento grande
      }
    } else {
      logger.error(PREFIX, 'Falha no documento grande:', processResult.error);
    }
  }
  
  /**
   * Testa queries gerais
   */
  private async testGeneralQueries(): Promise<void> {
    logger.info(PREFIX, '💬 TESTANDO QUERIES GERAIS...');
    
    for (const query of EXAMPLE_QUERIES.general) {
      await this.testQuery(query);
      await this.sleep(1000);
    }
  }
  
  /**
   * Testa uma query individual
   */
  private async testQuery(query: string): Promise<void> {
    logger.info(PREFIX, `❓ Testando: "${query}"`);
    
    const result = await api2.processQuery(query);
    
    if (result.success) {
      const response = result.response!;
      logger.success(PREFIX, `✅ Resposta (${response.answer.length} chars):`);
      logger.info(PREFIX, `📄 Documento usado: ${response.documentUsed}`);
      logger.info(PREFIX, `💰 Custo: $${response.tokenCost.total.toFixed(6)}`);
      logger.info(PREFIX, `⏱️ Tempo: ${response.processingTime.toFixed(0)}ms`);
      
      if (response.sectionsUsed.length > 0) {
        logger.info(PREFIX, `📋 Seções: ${response.sectionsUsed.join(', ')}`);
      }
      
      // Mostrar início da resposta
      const preview = response.answer.length > 100 
        ? response.answer.substring(0, 100) + '...'
        : response.answer;
      logger.info(PREFIX, `💬 "${preview}"`);
      
    } else {
      logger.error(PREFIX, '❌ Falha na query:', result.error);
    }
  }
  
  /**
   * Mostra estatísticas finais
   */
  private async showFinalStats(): Promise<void> {
    logger.info(PREFIX, '📊 ESTATÍSTICAS FINAIS:');
    
    const stats = api2.getSystemStats();
    const costSummary = api2.getCostSummary();
    
    logger.info(PREFIX, `📄 Documentos processados: ${stats.totalDocuments}`);
    logger.info(PREFIX, `📄 - Pequenos: ${stats.smallDocuments}`);
    logger.info(PREFIX, `📚 - Grandes: ${stats.largeDocuments}`);
    logger.info(PREFIX, `❓ Queries processadas: ${stats.totalQueries}`);
    logger.info(PREFIX, `💰 Custo total: $${stats.totalCost.toFixed(4)}`);
    logger.info(PREFIX, `💾 Cache usado: ${stats.cacheSize.toFixed(1)} KB`);
    logger.info(PREFIX, `💰 Budget restante hoje: $${costSummary.remainingBudget.toFixed(4)}`);
    
    // Mostrar documentos em cache
    const cachedDocs = api2.getCachedDocuments();
    logger.info(PREFIX, `📂 Documentos em cache: ${cachedDocs.length}`);
    cachedDocs.forEach(doc => {
      logger.info(PREFIX, `   - ${doc.name} (${doc.type}, ${doc.tokenCount} tokens)`);
    });
  }
  
  /**
   * Utilitário para pausas
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Demonstração rápida
   */
  async quickDemo(): Promise<void> {
    logger.info(PREFIX, '⚡ DEMONSTRAÇÃO RÁPIDA');
    
    // Só documento pequeno e uma query
    const processResult = await api2.processDocument(SMALL_DOCUMENT, 'Contrato.txt');
    
    if (processResult.success) {
      await this.testQuery('Qual o valor do contrato?');
      api2.logStatus();
    }
  }
  
  /**
   * Teste de performance
   */
  async performanceTest(): Promise<void> {
    logger.info(PREFIX, '🚀 TESTE DE PERFORMANCE');
    
    const startTime = Date.now();
    
    // Processar documento grande
    await api2.processDocument(LARGE_DOCUMENT, 'Manual_Performance.txt');
    
    // Fazer várias queries
    const queries = [
      'Como instalar?',
      'Requisitos do sistema?',
      'Como fazer backup?',
      'Contato do suporte?'
    ];
    
    for (const query of queries) {
      await api2.processQuery(query);
    }
    
    const totalTime = Date.now() - startTime;
    
    logger.success(PREFIX, `⚡ Performance test concluído em ${totalTime}ms`);
    
    const stats = api2.getSystemStats();
    logger.info(PREFIX, `📊 Total de queries: ${stats.totalQueries}`);
    logger.info(PREFIX, `💰 Custo total: $${stats.totalCost.toFixed(4)}`);
  }
  
  /**
   * Limpa sistema para nova demonstração
   */
  reset(): void {
    logger.info(PREFIX, '🧹 Resetando sistema para nova demonstração...');
    api2.clearAll();
    logger.success(PREFIX, '✅ Sistema resetado');
  }
}

// Instância global para uso
export const api2Demo = new API2Demo();

// Exportar para uso direto
export { SMALL_DOCUMENT, LARGE_DOCUMENT, EXAMPLE_QUERIES };

logger.success(PREFIX, 'Demonstrador API2 carregado e pronto para uso!');
logger.info(PREFIX, 'Use api2Demo.runFullDemo() para demonstração completa');
logger.info(PREFIX, 'Use api2Demo.quickDemo() para teste rápido');
logger.info(PREFIX, 'Use api2Demo.performanceTest() para teste de performance');
