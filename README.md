<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Negociei.app - Marketplace de Demanda Reversa

Este projeto foi preparado para ser hospedado na Vercel.

## 🚀 Como subir na Vercel

1. **Repositório**: Certifique-se de que o código está em um repositório Git (GitHub, GitLab ou Bitbucket).
2. **Importar**: Acesse o painel da Vercel e clique em "Add New" -> "Project" e importe o seu repositório.
3. **Build Settings**: O Vite será detectado automaticamente.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**: Adicione as seguintes variáveis de ambiente no painel da Vercel:
   - `VITE_SUPABASE_URL`: Sua URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Sua Anon Key do Supabase.
   - `GEMINI_API_KEY`: Sua chave da API do Google Gemini.
5. **Deploy**: Clique em "Deploy".

## 💻 Rodando Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env.local` com suas chaves baseando-se no que está no painel da Vercel ou Supabase.
3. Rode o app:
   ```bash
   npm run dev
   ```

## 🛠️ Configurações de Rota (SPA)
O arquivo `vercel.json` foi incluído para garantir que o roteamento do React (SPA) funcione corretamente em produção, redirecionando todas as requisições para o `index.html`.
