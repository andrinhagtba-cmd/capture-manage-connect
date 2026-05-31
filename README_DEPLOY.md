# Deploy — NL Foto e Vídeo (TanStack Start SSR no VPS)

Guia de deploy do projeto **TanStack Start (SSR Node)** em **VPS com CloudPanel + PM2 + Nginx**.

- **Domínio:** `nl.orbitsmartcodes.com`
- **Porta Node:** `3006`
- **App PM2:** `orbitsmartcodes-nl`
- **Stack:** TanStack Start (React 19, SSR) — **não é SPA**, mantém rotas, server functions, Supabase/Lovable Cloud e autenticação.

> O build de produção Node usa `vite.config.node.ts` (sem Cloudflare/Nitro).
> A configuração padrão `vite.config.ts` continua intacta para Lovable Cloud / dev.

---

## 1. Pré-requisitos no VPS

- Node.js 20+ (definido no CloudPanel Node.js Site)
- PM2 instalado globalmente: `npm install -g pm2`
- Acesso SSH ao servidor

---

## 2. Criar o site no CloudPanel (Node.js Site)

1. CloudPanel → **Sites** → **Add Site** → **Create a Node.js Site**.
2. **Domain Name:** `nl.orbitsmartcodes.com`
3. **App Port:** `3006`
4. **Node.js Version:** 20 (ou superior).
5. Finalize a criação. O CloudPanel cria o diretório do site, algo como:
   ```
   /home/<site-user>/htdocs/nl.orbitsmartcodes.com
   ```
   > Anote esse caminho — ele deve bater com o `cwd` em `ecosystem.config.cjs`.

---

## 3. Enviar o código e variáveis de ambiente

Envie o projeto para o diretório do site (git clone, rsync ou upload).

Crie o arquivo **`.env.production`** (ou `.env`) na raiz do projeto, no servidor, com as variáveis necessárias:

```bash
NODE_ENV=production
PORT=3006

# Públicas (embutidas no build — precisam existir no momento do build:vps)
VITE_SUPABASE_URL=https://wzorbpovrwqwbotegkma.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...                # anon/publishable key
VITE_SUPABASE_PROJECT_ID=wzorbpovrwqwbotegkma

# Servidor (lidas em runtime pelo bootstrap-env.mjs)
SUPABASE_URL=https://wzorbpovrwqwbotegkma.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...                    # NUNCA exponha no client
```

> **Importante:** as variáveis `VITE_*` são embutidas no bundle durante o
> `npm run build:vps`, então precisam estar presentes **antes** do build.
> As variáveis de servidor (ex.: `SUPABASE_SERVICE_ROLE_KEY`) são carregadas
> em runtime pelo `bootstrap-env.mjs` (sem sobrescrever variáveis já definidas
> no shell/PM2).

---

## 4. Build e start (comandos de deploy)

No diretório do site, no servidor:

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Build de produção para Node (gera dist/client + dist/server/server.node.js)
npm run build:vps

# 3. (Teste manual opcional) rodar diretamente
npm run start
# -> [server.node] SSR server listening on http://0.0.0.0:3006
```

`npm run start` executa:
```
NODE_ENV=production node --import ./bootstrap-env.mjs dist/server/server.node.js
```

---

## 5. Subir com PM2

Edite `ecosystem.config.cjs` e ajuste o `cwd` para o caminho real do site,
depois:

```bash
# Iniciar
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs orbitsmartcodes-nl

# Reiniciar após novo deploy
pm2 reload orbitsmartcodes-nl

# Salvar para reiniciar no boot
pm2 save
pm2 startup   # siga o comando que ele imprimir
```

**Fluxo de re-deploy:**
```bash
git pull                       # ou rsync do novo código
npm install --legacy-peer-deps
npm run build:vps
pm2 reload orbitsmartcodes-nl
```

---

## 6. Nginx (proxy reverso para a porta 3006)

O CloudPanel gerencia o vhost do site. Garanta que o tráfego seja
encaminhado para o app Node na porta **3006**. Trecho de referência do
`location` no vhost:

```nginx
location / {
    proxy_pass http://127.0.0.1:3006;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
}
```

> Em CloudPanel Node.js Site a porta configurada (3006) normalmente já é
> usada no proxy automaticamente. Use o trecho acima apenas se precisar
> customizar o vhost.

Recarregar o Nginx após mudanças:
```bash
sudo systemctl reload nginx
```

---

## 7. Cloudflare (se o domínio estiver atrás do Cloudflare)

- **SSL/TLS:** `Full (strict)`
- **Auto Minify:** **OFF** (HTML/CSS/JS)
- **Rocket Loader:** **OFF**
- Após cada deploy: **Caching → Purge Everything**

Esses ajustes evitam que o Cloudflare quebre o HTML do SSR e os assets
hashados do TanStack Start.

---

## 8. Verificação final

```bash
curl -I https://nl.orbitsmartcodes.com/        # 200, HTML SSR
curl -I https://nl.orbitsmartcodes.com/catalogo
pm2 status                                      # orbitsmartcodes-nl online
```

- A home deve retornar HTML renderizado no servidor (não uma casca vazia de SPA).
- Assets em `/assets/*` retornam `Cache-Control: public, max-age=31536000, immutable`.
- Rotas, server functions, Supabase/Lovable Cloud e login continuam funcionando.
