João, este é um projeto grande. Vou entregá-lo em **fases**, cada uma testável e funcional por conta própria, para não quebrar o site e para você poder revisar conforme avança. Abaixo o plano completo; ao aprovar, começo pela Fase 1.

## Visão geral

Objetivo: nenhum texto/imagem/vídeo/link/dado institucional fixo no código — tudo vindo do banco e editável no painel, com fallback visual quando vazio.

A estrutura final do admin terá as abas: Dashboard, Produtos, Marcas, Categorias, Banners e Heros, Páginas do Site, Home Page, Configurações da Empresa, Footer, Menu/Navegação, Mídia, Orçamentos, Leads, Usuários, SEO.

## Fase 1 — Fundação institucional (maior impacto imediato)
Tabelas: `company_settings`, `footer_settings`, `footer_link_groups`, `footer_links`, `navigation_items`.
- Aba **Configurações da Empresa**: nome, slogan, descrições, endereço, horário, WhatsApp, telefone, e-mail, redes sociais, Maps embed, textos de garantia/procedência/teste, logos e favicon. Pré-preenchida com os dados da NL Foto e Vídeo que você passou.
- Aba **Footer**: logo, descrição, toggles do que aparece, grupos/links, copyright, selos. Sincronizado de `company_settings`.
- Aba **Menu/Navegação**: links do header, ordem, ativo/inativo, botão principal.
- Frontend: `SiteHeader`, `CinematicFooter`/`SiteFooter` e `WhatsAppDock` passam a ler do banco (com fallback aos valores atuais em `src/lib/site.ts`).

## Fase 2 — Biblioteca de Mídia
- Tabela `media_assets` + bucket de storage (`media`) com upload de imagens/vídeos/logos.
- Aba **Mídia**: upload, preview, copiar URL, alt text, descrição, pastas (banners, produtos, marcas, vídeos, logos, institucional, categorias), excluir/substituir.
- Reusável: um seletor de mídia para todos os formulários das outras abas.

## Fase 3 — Banners/Heros + Home Page dinâmica
Tabelas: `hero_banners`, `site_pages`, `page_sections`.
- Aba **Banners e Heros**: todos os campos pedidos (mídia desktop/mobile, vídeo/imagem, overlay, botões primário/secundário, datas, ordem, status, vínculo a página/marca).
- Aba **Home Page**: hero ativo + seções (Canon, DJI, Sony, GoPro, drones, “por que comprar”, localização, CTA WhatsApp, blocos promocionais) com título/subtítulo/ordem/ativo.
- Frontend: `src/routes/index.tsx` montado dinamicamente pelas seções ativas; heros vindos de `hero_banners`.

## Fase 4 — Páginas de Marca dinâmicas
Tabela: `brand_page_settings` (+ uso de `hero_banners`, `page_sections`).
- Edição por marca: logo, descrições, cores, hero/vídeo, banners desktop/mobile, botões, categorias/produtos em destaque, texto institucional, ordem dos blocos, SEO, status.
- Frontend: `marca.$slug.tsx` e os `*Showcase` passam a ler do banco (sem hero/título/vídeo fixos).

## Fase 5 — Páginas do Site + SEO
Tabela: `site_pages` (expandida) + `site_settings`.
- Aba **Páginas do Site**: Home, marcas, Sobre, Contato, Garantia, Privacidade, Termos, Categoria, Produto — com slug, SEO title/description/imagem, conteúdo, status publicado/rascunho.
- Aba **SEO**: gerencia metadados por página; `__root.tsx`/rotas passam a ler SEO do banco.
- Botão **Pré-visualizar** e fluxo rascunho/publicado.

## Fase 6 — Permissões e refino
- Usa as roles existentes (`admin`, `editor`, `vendedor`): admin edita tudo; editor edita banners/páginas/produtos/categorias/mídia; vendedor só vê leads/orçamentos.
- Validações: slug obrigatório, hero ativo exige título, media_type vídeo exige vídeo etc.
- Aba **Usuários** para gerenciar papéis.

## Detalhes técnicos
- Cada `CREATE TABLE` no schema `public` virá com `GRANT` + RLS (leitura pública para conteúdo publicado; escrita só `is_staff`/`has_role`). Migrações via tool de migração; nunca edito `types.ts`.
- Leituras públicas via hooks TanStack Query novos em `src/lib/` (ex.: `useCompanySettings`, `useHeroBanner`, `useHomeSections`, `useBrandPage`, `useNavigation`, `useFooter`).
- Storage para mídia com políticas de leitura pública e escrita por staff.
- Cada tela admin: formulário claro, preview, salvar/cancelar, status, toasts, validação.
- Mantenho `src/lib/site.ts` como fallback até o banco estar preenchido.

## Sobre o tamanho
Cada fase é várias migrações + várias telas. Vou implementar **uma fase por vez**, validando o build e o preview antes de seguir. Se preferir uma ordem diferente (ex.: começar por Banners/Home em vez de Footer), me diga.

Ao aprovar, inicio pela **Fase 1**.
---

## Progresso

- ✅ **Fase 1 concluída** — Tabelas `company_settings`, `footer_settings`, `footer_link_groups`, `footer_links`, `navigation_items`. Abas Configurações da Empresa, Footer e Menu/Navegação. Frontend `SiteHeader`, `CinematicFooter` e `WhatsAppDock` lendo do banco com fallback.
- ✅ **Fase 2 concluída** — Tabela `media_assets` + bucket `media`. Aba Biblioteca de Mídia com upload de imagens/vídeos, pastas, copiar URL, editar alt/descrição/pasta e excluir.
- ✅ **Fase 3 concluída** — Tabelas `hero_banners` e `home_sections`. Abas Banners e Heros (hero/vídeo, imagens desktop/mobile, overlay, botões, ordem, status, local home/marca) e Home Page (ligar/desligar, reordenar e editar textos das seções). `src/routes/index.tsx` agora monta o hero e as seções dinamicamente a partir do banco com fallback.
- ✅ **Fase 4 concluída** — Tabela `brand_page_settings` (introdução, botões, SEO, mostrar/ocultar categorias e produtos, status publicado) com aba Páginas de Marca. O hero por marca vem de `hero_banners` (Local da marca). `marca.$slug.tsx` agora lê hero, texto institucional, botões e visibilidade do banco com fallback ao conteúdo atual.
- ✅ **Fase 5 concluída** — Tabela `site_pages` (chapéu, título, subtítulo, parágrafos, SEO title/description/imagem, noindex, publicado/rascunho, ordem) com aba Páginas do Site. Hooks `useSitePages`/`useSitePage`. Páginas `sobre` e `contato` agora leem chapéu/título/subtítulo/conteúdo do banco com fallback.
- ✅ **Fase 6 concluída** — Permissões por papel (admin/editor/vendedor). `useAuth` agora expõe `roles`, `isAdmin` e `hasRole`. O menu lateral filtra abas por papel: vendedor vê só Dashboard/Orçamentos/Leads; editor cuida de todo o conteúdo; admin vê tudo, incluindo a nova aba **Usuários**, onde define os papéis de cada usuário (admin não pode remover o próprio papel de admin). Telas continuam protegidas por `is_staff` e RLS.
