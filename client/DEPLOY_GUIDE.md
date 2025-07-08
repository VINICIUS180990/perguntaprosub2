# 🚀 Guia de Deploy - Como Configurar API Keys em Produção

## 📋 Resumo do Processo

1. **Local:** Você desenvolve com `.env.local`
2. **GitHub:** Código vai sem chaves (seguro)
3. **Deploy:** Plataforma recebe código + você configura as chaves separadamente
4. **Produção:** Site funciona com as chaves configuradas na plataforma

---

## 🔧 **Configuração por Plataforma:**

### 📊 **Vercel (Recomendado)**

#### Via Dashboard Web:
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Conecte seu repositório GitHub
3. Vá em **Project Settings** → **Environment Variables**
4. Adicione:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** `sua_chave_real_aqui`
   - **Environment:** Production, Preview, Development

#### Via CLI:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy e configurar
vercel
vercel env add VITE_GEMINI_API_KEY
# Cole sua chave quando solicitado
```

---

### 🌐 **Netlify**

#### Via Dashboard:
1. Acesse [netlify.com](https://netlify.com)
2. Conecte seu repositório
3. **Site Settings** → **Environment Variables**
4. Adicione: `VITE_GEMINI_API_KEY` = `sua_chave`

#### Via CLI:
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
netlify env:set VITE_GEMINI_API_KEY sua_chave_aqui
```

---

### ☁️ **Outras Plataformas**

- **Railway:** Settings → Variables
- **Render:** Environment → Environment Variables  
- **DigitalOcean App Platform:** App Settings → App-Level Environment Variables
- **AWS Amplify:** Environment variables section

---

## 🔐 **Vantagens Desta Abordagem:**

✅ **Segurança Total:** Chaves nunca ficam expostas no código
✅ **Colaboração Segura:** Outros devs podem contribuir sem suas chaves
✅ **Ambientes Separados:** Chaves diferentes para dev/staging/prod
✅ **Rotação de Chaves:** Mude apenas na plataforma, sem tocar no código

---

## 🔄 **Fluxo de Trabalho Diário:**

```bash
# 1. Desenvolver localmente (usa .env.local)
npm run dev

# 2. Fazer commit (sem chaves!)
git add .
git commit -m "Nova feature"
git push

# 3. Deploy automático
# A plataforma pega o código + suas variáveis configuradas
# Site funciona em produção! 🎉
```

---

## ⚡ **Setup Rápido - Vercel:**

1. Conecte seu GitHub à Vercel
2. Import seu repositório
3. Na tela de deploy, clique em "Environment Variables"
4. Adicione `VITE_GEMINI_API_KEY` com sua chave
5. Deploy! 🚀

**O site vai funcionar automaticamente com sua chave de API!**
