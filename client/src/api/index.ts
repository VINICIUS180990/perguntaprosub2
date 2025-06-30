// Exportações principais da API
export { chatWithAI } from './chat';
export type { MessageHistory } from './chat';
export { 
  sendMainPageMessage, 
  sendLandingPageMessage, 
  sendCustomMessage 
} from './messaging';
export { 
  MAIN_PAGE_SYSTEM_PROMPT, 
  LANDING_PAGE_SYSTEM_PROMPT, 
  createContextPrompt 
} from './prompts';
export { AI_API_KEY, AI_MODEL, AI_API_URL } from './config';
