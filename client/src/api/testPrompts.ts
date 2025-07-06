// DEBUG: Teste direto do prompts.ts
console.log('[DEBUG] testPrompts.ts - Iniciando teste');

try {
  // Teste direto da importação
  import('./prompts').then(module => {
    console.log('[DEBUG] testPrompts.ts - Módulo prompts carregado:', module);
    console.log('[DEBUG] testPrompts.ts - MAIN_PAGE_SYSTEM_PROMPT presente:', !!module.MAIN_PAGE_SYSTEM_PROMPT);
    console.log('[DEBUG] testPrompts.ts - LANDING_PAGE_SYSTEM_PROMPT presente:', !!module.LANDING_PAGE_SYSTEM_PROMPT);
    console.log('[DEBUG] testPrompts.ts - createContextPrompt presente:', !!module.createContextPrompt);
    
    // Listar todas as exports disponíveis
    console.log('[DEBUG] testPrompts.ts - Todas as exports:', Object.keys(module));
    
    // Verificar o tipo de cada export
    console.log('[DEBUG] testPrompts.ts - Tipos:');
    console.log('  - MAIN_PAGE_SYSTEM_PROMPT:', typeof module.MAIN_PAGE_SYSTEM_PROMPT);
    console.log('  - LANDING_PAGE_SYSTEM_PROMPT:', typeof module.LANDING_PAGE_SYSTEM_PROMPT);
    console.log('  - createContextPrompt:', typeof module.createContextPrompt);
  }).catch(error => {
    console.error('[DEBUG] testPrompts.ts - Erro ao importar prompts:', error);
  });
} catch (error) {
  console.error('[DEBUG] testPrompts.ts - Erro no teste:', error);
}

export default {};
