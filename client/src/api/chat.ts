import { AI_API_URL } from './config';

export type MessageHistory = {
  autor: 'user' | 'bot';
  texto: string;
};

/**
 * Função genérica para comunicação com API de IA
 * @param prompt - Prompt do usuário
 * @param historico - Histórico de mensagens
 * @returns Resposta da API de IA
 */
export async function chatWithAI(prompt: string, historico: MessageHistory[]): Promise<string> {
  // Monta o histórico no formato esperado pela API
  const history = historico.map(m => ({
    role: m.autor === 'user' ? 'user' : 'model',
    parts: [{ text: m.texto }]
  }));

  const body = {
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ]
  };

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error(data.error?.message || 'Erro ao consultar API de IA');
}
