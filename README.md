# Portfólio — Emanuel Medeiros

Portfólio pessoal/profissional com visual dark premium, currículo online e assistente de portfólio.

## O que foi ajustado

- Identidade padronizada para **Emanuel Medeiros**.
- Página de currículo online em `/curriculo`.
- Botão de LinkedIn mantido, mas bloqueado/discreto como **Em breve**.
- Chatbot mantido e refeito com respostas controladas sobre formação, habilidades, currículo, contato e oportunidades.
- Fallback local no frontend: se a API cair, o chat ainda responde de forma controlada.
- Endpoint serverless para Vercel em `/api/chat`.
- SEO básico corrigido: idioma `pt-BR`, título e descrição do site.
- HTML público limpo, sem badge de plataforma ou scripts de gravação de sessão.

## Deploy recomendado na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Entre na Vercel e escolha **Add New Project**.
3. Importe o repositório.
4. A Vercel deve usar automaticamente o `vercel.json`:
   - Install Command: `cd frontend && npm install --legacy-peer-deps`
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/build`
5. Publique.

## Rotas

- `/` — Portfólio principal.
- `/curriculo` — Currículo online.
- `/api/chat` — Backend serverless do chatbot.

## Desenvolvimento local

Frontend:

```bash
cd frontend
npm install
npm start
```

Backend serverless da Vercel localmente:

```bash
npm i -g vercel
vercel dev
```

## Observação de revisão

O botão de WhatsApp não exibe número no site. Ele abre uma conversa direta usando o link configurado no código.
