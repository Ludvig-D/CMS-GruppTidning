# Artikelsajt (grupp) — design

Storyblok + Next.js sajt: artiklar kopplade till författare via Reference,
kategorifiltrering via datasource + innehållsdriven routing. Mål: G + VG.

## 1. Storyblok — innehållsmodell och setup

Nytt space (skapas av gruppen). Innehåll och struktur sätts upp av
`scripts/setup-storyblok.mjs`, körs en gång lokalt med Management API.

**Behövs innan körning:** `STORYBLOK_MGMT_TOKEN` (personal OAuth-token,
Storyblok → My account → Personal access tokens) och `STORYBLOK_ORG_ID` i
`.env`, plus ett skapat (tomt) space eller låt scriptet skapa spacet.

Content types (components, `component_group` `content types` i Storyblok):

- `author` — `name` (text), `bio` (textarea), `photo` (asset)
- `article` — `title` (text), `summary` (textarea), `content` (richtext),
  `category` (single-option, datasource `article-categories`), `author`
  (reference → `author`)
- `category` — `title` (text), `body` (blocks, innehåller `filtered-posts`)
- `filtered-posts` — nested block, inget fält behövs (slug hämtas från URL i
  komponenten som renderar den)
- `nav-link` — `label` (text), `link` (link), `sub_links` (blocks →
  `nav-link`, för flernivåmeny)
- `config` — singleton, `header` (blocks → `nav-link`), `footer_text` (text)

Datasource `article-categories` (slug `article-categories`), entries:
Nyheter/nyheter, Guide/guide, Sverige/sverige, Ekonomi/ekonomi,
Teknik/teknik — matchar mockupens kategorier, uppfyller "minst två".

Stories som skapas (idempotent — scriptet kollar slug innan skapande):

- `home` (content type `page`, från blueprinten)
- `config` (root, singleton)
- `authors/` mapp + 2 författare
- `articles/` mapp + 4 artiklar (blandade författare och kategorier, `author`
  fältet sätts till respektive författares uuid)
- `categories/` mapp + 1 story per datasource-entry (slug = entry-value),
  content type `category`, body innehåller en `filtered-posts`-block

Scriptet skapar även en preview delivery-token och skriver ut den —
kopieras manuellt till `.env` som `STORYBLOK_DELIVERY_API_TOKEN`.

`storyblok-js-client` läggs till som devDependency (Management API-klient,
inget stdlib-alternativ).

## 2. Next.js — routes och komponenter

```
src/app/
  layout.js              — hämtar config-storyn, renderar Header/Footer
  page.js                — enkel startsida, länk till /articles
  articles/
    page.js               — lista: getStories content_type article,
                             resolve_relations "article.author"
    [slug]/page.js         — detalj: getStory + resolve_relations,
                             generateMetadata, generateStaticParams
  authors/
    [slug]/page.js         — getStory(author), lista artiklar via
                             filter_query { author: { in: uuid } },
                             generateStaticParams
  categories/
    [slug]/page.js         — getStory('categories/'+slug), renderas med
                             StoryblokServerComponent
  robots.js               — SITE_URL
  sitemap.js              — getStories() över articles/ + authors/, SITE_URL

src/components/
  Header.jsx              — flernivåmeny från config.header
  Footer.jsx               — copyright-text från config.footer_text
  FilteredPosts.jsx        — filter_query på category = slug ur URL
  Author.jsx, Article.jsx  — minimala block-renderers (Visual Editor-stöd)
```

`lib/storyblok.js` components-map utökas med `category`, `filtered-posts`,
`config`, `nav-link`, `author`, `article`.

Catch-all `[[...slug]]` behålls oförändrad för `home` och ev. framtida
sidor — Next.js prioriterar de explicita routarna ovan för sina segment.

## 3. Styling

Ren CSS i `globals.css`, ingen ny styling-dependency. Kort/pill-badges,
blå accentfärg, sidopanel "Kategorier" enbart på `/articles`-listan.
Newsletter-box och "Populärt"-widget från mockupen exkluderas — påhittat
innehåll utan Storyblok-källa, inget i kravspecen kräver det.

## 4. Deploy + webhook (VG)

GitHub-repo finns redan (`Ludvig-D/CMS-GruppTidning`). Checklista
(manuell, kräver ert Vercel/Storyblok-login):

1. Importera repo i Vercel
2. Env vars i Vercel: `STORYBLOK_DELIVERY_API_TOKEN`, `STORYBLOK_REGION`,
   `SITE_URL`
3. Deploy → kopiera Deploy Hook-URL (Project Settings → Git → Deploy Hooks)
4. Storyblok → Settings → Webhooks → lägg till URL, trigger "Story
   published/unpublished"
5. Storyblok → Settings → Visual Editor → Location = prod-URL

## Ur scope

Ingen fungerande newsletter-signup, ingen sök, ingen kommentarsfunktion —
inget av det efterfrågas i kravspecen.
