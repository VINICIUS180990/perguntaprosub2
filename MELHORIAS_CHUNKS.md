# Melhorias no Sistema de Chunks e Busca de Contexto

## Problemas Identificados e Soluções

### 1. **Limitação de Chunks**
**Problema**: O sistema estava limitado a apenas 3 chunks, podendo perder informações relevantes.

**Solução**: 
- Aumentado o número padrão de chunks para 5-8 dependendo do tipo de pergunta
- Implementado sistema dinâmico que ajusta o número de chunks baseado na complexidade da query
- Adicionado sistema de overlap para incluir contexto adjacente quando há espaço disponível

### 2. **Busca por Palavras-chave Limitada**
**Problema**: Busca simples por palavras exatas, perdendo variações e sinônimos.

**Solução**:
- **Busca Híbrida**: Combina busca por palavra-chave (70%) com busca semântica (30%)
- **Busca Expandida**: Inclui variações comuns de termos militares
- **Busca por Proximidade**: Prioriza chunks onde palavras-chave aparecem próximas
- **Busca por Seções**: Identifica tipo de informação (procedimentos, definições, etc.)

### 3. **Algoritmo de Relevância Melhorado**
**Implementações**:
- Pontuação por palavras-chave exatas (peso 3)
- Pontuação por palavras parciais (peso 1)
- Bonus por densidade de palavras-chave
- Bonus por proximidade entre termos da query
- Filtro de chunks com relevância muito baixa

### 4. **Sistema de Fallback Inteligente**
**Estratégias em cascata**:
1. **Busca Híbrida** (palavra-chave + semântica)
2. **Busca Expandida** (com variações de termos)
3. **Busca por Seções** (baseada no tipo de pergunta)
4. **Último recurso** (primeiros e últimos chunks)

### 5. **Configurações Adaptativas por Tipo de Pergunta**

| Tipo de Pergunta | Max Tokens | Max Chunks | Estratégia |
|------------------|------------|------------|------------|
| Artigos específicos | 3000 | 4 | Alta precisão |
| Procedimentos | 5000 | 6 | Contexto amplo |
| Perguntas gerais | 6000 | 8 | Máxima cobertura |
| Definições | 3500 | 5 | Foco conceitual |

### 6. **Sistema de Debug e Monitoramento**
**Funcionalidades**:
- Log detalhado de processamento de chunks
- Rastreamento de estratégias usadas
- Análise de performance e eficiência
- Relatórios exportáveis para análise

**Como usar no browser**:
```javascript
// Abra o console do navegador e digite:
debugChunks()
```

### 7. **Melhorias nos Prompts**
- Instruções mais claras sobre quando informações não estão disponíveis
- Orientações específicas para lidar com contexto parcial
- Formatação melhorada do contexto enviado para a IA

## Como Testar as Melhorias

### 1. **Teste Básico**
- Faça uma pergunta específica sobre um artigo ou parágrafo
- Observe no console se múltiplos chunks relevantes foram encontrados
- Verifique se a resposta contém informações mais completas

### 2. **Teste de Fallback**
- Faça uma pergunta com termos que não aparecem literalmente no documento
- O sistema deve encontrar informações relacionadas usando busca expandida

### 3. **Teste de Debug**
- Abra o console do navegador
- Digite `debugChunks()` após fazer algumas perguntas
- Analise o relatório de performance

### 4. **Teste de Diferentes Tipos de Pergunta**
- **Específica**: "O que diz o artigo 15 sobre licenças?"
- **Procedural**: "Como solicitar uma licença médica?"
- **Geral**: "Quais são os tipos de licença disponíveis?"
- **Conceitual**: "O que é uma transgressão disciplinar?"

## Configurações Recomendadas

### Para Documentos Grandes (>10k tokens)
```typescript
{
  maxTokens: 6000,
  maxChunks: 8,
  enableChunking: true,
  enableCompression: true,
  chunkOverlap: true
}
```

### Para Documentos Médios (5k-10k tokens)
```typescript
{
  maxTokens: 4000,
  maxChunks: 5,
  enableChunking: true,
  enableCompression: true,
  chunkOverlap: true
}
```

### Para Documentos Pequenos (<5k tokens)
```typescript
{
  maxTokens: 5000,
  enableChunking: false,
  enableCompression: true
}
```

## Monitoramento de Performance

O sistema agora registra:
- **Taxa de Compressão**: Redução de tokens original → processado
- **Eficiência de Seleção**: % de chunks selecionados vs criados
- **Pontuação Média de Relevância**: Qualidade dos chunks encontrados
- **Estratégias Mais Usadas**: Quais métodos de busca são mais eficazes

## Próximos Passos Sugeridos

1. **Análise de Logs**: Monitore os logs por uma semana para identificar padrões
2. **Ajuste Fino**: Ajuste pesos e thresholds baseado na performance real
3. **Feedback do Usuário**: Colete feedback sobre a qualidade das respostas
4. **Otimização Contínua**: Use dados de debug para melhorar algoritmos

## Impacto Esperado

- ✅ **Redução de "informação não encontrada"**
- ✅ **Melhor cobertura de contexto relevante**
- ✅ **Respostas mais completas e precisas**
- ✅ **Balanceamento custo vs qualidade**
- ✅ **Visibilidade do que está acontecendo internamente**
