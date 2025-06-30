// Configurações da API de IA
const AI_API_KEY = "AIzaSyAPx6__sK5MRLXYTs6IZpKf5tyeIRxBcuA";
const AI_MODEL = "gemini-1.5-pro";
const AI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;

export { AI_API_KEY, AI_MODEL, AI_API_URL };
