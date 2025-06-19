// Integração com Gemini API (Google)
// https://ai.google.dev/gemini-api/docs/get-started

const GEMINI_API_KEY = "AIzaSyAPx6__sK5MRLXYTs6IZpKf5tyeIRxBcuA";
// Corrigido para usar o endpoint v1 e modelo gemini-1.5-pro
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

export async function geminiChat(prompt: string, historico: {autor: 'user'|'bot', texto: string}[]) {
  // Monta o histórico no formato esperado pela Gemini
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

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error(data.error?.message || 'Erro ao consultar Gemini');
}
