# 🔐 Configuração de Variáveis de Ambiente

## Configuração Inicial

Para que a aplicação funcione corretamente, você precisa configurar a chave da API do Google Gemini.

### 1. Criar arquivo de ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

### 2. Configurar a chave da API

1. Vá para [Google AI Studio](https://ai.google.dev/)
2. Crie uma conta ou faça login
3. Gere uma nova API Key
4. Abra o arquivo `.env.local` 
5. Substitua `sua_chave_aqui` pela sua chave real:

```env
VITE_GEMINI_API_KEY=sua_chave_real_aqui
```

### 3. Variáveis disponíveis

- `VITE_GEMINI_API_KEY`: Chave da API do Google Gemini (obrigatória)
- `VITE_GEMINI_MODEL`: Modelo a ser usado (padrão: gemini-1.5-pro)
- `VITE_DEBUG_ENABLED`: Habilitar logs de debug (padrão: true)

## ⚠️ Segurança

- **NUNCA** comite arquivos `.env.local` ou `.env` no Git
- Mantenha suas chaves de API privadas
- Use diferentes chaves para desenvolvimento e produção

## 🚀 Deploy

Para produção, configure as variáveis de ambiente na sua plataforma de deploy:

### Vercel
```bash
vercel env add VITE_GEMINI_API_KEY
```

### Netlify
Configure em: Site settings → Environment variables

### Outras plataformas
Consulte a documentação da sua plataforma para configurar variáveis de ambiente.
