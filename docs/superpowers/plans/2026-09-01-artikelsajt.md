# Artikelsajt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Article site on Next.js + Storyblok: `author`/`article` content
types linked via Reference, category filtering via datasource +
content-driven routing, deployed to Vercel with a publish webhook.

**Architecture:** Storyblok content model + sample content created once via
a Management API script (`scripts/setup-storyblok.mjs`). Next.js App Router
reads it via the Delivery API: explicit routes for `/articles`,
`/articles/[slug]`, `/authors/[slug]`, `/categories/[slug]`; the existing
`[[...slug]]` catch-all keeps handling `home` and generic pages. Tailwind
for styling.

**Tech Stack:** Next.js 16 (App Router, RSC), `@storyblok/react`,
`storyblok-js-client` (Management API, setup script only), Tailwind CSS.

## Global Constraints

- Content types exactly as spec'd: `author` (name text, bio textarea, photo
  asset), `article` (title text, summary textarea, content richtext,
  category single-option → datasource `article-categories`, author
  reference → `author`).
- Datasource `article-categories` (slug `article-categories`) — entries
  Nyheter/nyheter, Guide/guide, Sverige/sverige, Ekonomi/ekonomi,
  Teknik/teknik.
- ≥2 authors, ≥4 articles (mixed authors and categories), `articles/`
  folder, `categories/` folder with one `category` story per datasource
  value (slug = value), each with a `filtered-posts` block.
- List/detail article API calls use `resolve_relations: 'article.author'`.
- Author page filters with `filter_query: { author: { in: authorStory.uuid } }`.
- `generateMetadata` on `/articles/[slug]`; `generateStaticParams` on
  `/articles/[slug]` and `/authors/[slug]`.
- Header: ≥ Start, Artiklar, kategori-länkar, flernivåmeny (Artiklar →
  undermeny). Footer: copyright text.
- `robots.js` / `sitemap.js` use `SITE_URL` env var.
- No test framework is installed in this project and none is being added
  (YAGNI — this is a thin CMS-glue app, not a library). "Test" steps below
  run the dev server or a one-off `node -e` / `curl` check against the real
  Storyblok API instead of unit tests.

---

## File Structure

```
scripts/setup-storyblok.mjs        — one-off Management API setup script
.env                                — STORYBLOK_* tokens (gitignored)
src/lib/storyblok.js                — components map (edit)
src/app/globals.css                 — Tailwind import (edit)
postcss.config.mjs                  — new
src/app/layout.js                   — fetch config story, render Header/Footer (edit)
src/app/page.js                     — new, simple home
src/app/articles/page.js            — new, list
src/app/articles/[slug]/page.js     — new, detail
src/app/authors/[slug]/page.js      — new
src/app/categories/[slug]/page.js   — new
src/app/robots.js                   — new
src/app/sitemap.js                  — new
src/components/Header.jsx           — new
src/components/Footer.jsx           — new
src/components/FilteredPosts.jsx    — new
src/components/ArticleCard.jsx      — new (shared list-card, used by list + FilteredPosts + author page)
```

---

### Task 1: Tailwind setup

**Files:**
- Modify: `package.json`
- Create: `postcss.config.mjs`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes usable in any component from Task 4 onward.

- [ ] **Step 1: Install Tailwind**

```bash
npm install -D tailwindcss @tailwindcss/postcss
```

- [ ] **Step 2: Create PostCSS config**

`postcss.config.mjs`:
```js
export default {
	plugins: {
		'@tailwindcss/postcss': {},
	},
};
```

- [ ] **Step 3: Replace globals.css content with Tailwind import**

Read the existing `src/app/globals.css` first, then replace its content
with:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: exits 0, no PostCSS/Tailwind errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json postcss.config.mjs src/app/globals.css
git commit -m "chore: add Tailwind CSS"
```

---

### Task 2: Storyblok setup script — space, content types, datasource

**Files:**
- Create: `scripts/setup-storyblok.mjs`
- Modify: `package.json` (devDependency + `setup:storyblok` script)

**Interfaces:**
- Consumes: env vars `STORYBLOK_MGMT_TOKEN` (personal OAuth token),
  `STORYBLOK_ORG_ID`, optional `STORYBLOK_SPACE_ID` (reuse existing space
  instead of creating one), optional `STORYBLOK_SPACE_NAME` (default
  `"Artikelsajt"`).
- Produces: exported async functions `getOrCreateSpace(client)`,
  `upsertComponent(client, spaceId, schema)`,
  `upsertDatasource(client, spaceId)` — reused by Task 3.
- Produces (side effect): space with components `author`, `article`,
  `category`, `filtered-posts`, `nav-link`, `config` and datasource
  `article-categories` with 5 entries.

- [ ] **Step 1: Add storyblok-js-client**

```bash
npm install -D storyblok-js-client
```

- [ ] **Step 2: Write the script's client bootstrap + space handling**

`scripts/setup-storyblok.mjs`:
```js
import StoryblokClient from 'storyblok-js-client';

const MGMT_TOKEN = process.env.STORYBLOK_MGMT_TOKEN;
const ORG_ID = process.env.STORYBLOK_ORG_ID;
if (!MGMT_TOKEN) throw new Error('STORYBLOK_MGMT_TOKEN is required');

const client = new StoryblokClient({ oauthToken: MGMT_TOKEN });

export async function getOrCreateSpace() {
	if (process.env.STORYBLOK_SPACE_ID) {
		return Number(process.env.STORYBLOK_SPACE_ID);
	}
	if (!ORG_ID) throw new Error('STORYBLOK_ORG_ID is required to create a space');
	const name = process.env.STORYBLOK_SPACE_NAME || 'Artikelsajt';
	const { data } = await client.post('spaces', {
		space: { name, org_id: Number(ORG_ID) },
	});
	console.log(`Created space ${data.space.id} (${name})`);
	return data.space.id;
}

export async function upsertComponent(spaceId, schema) {
	const { data } = await client.get(`spaces/${spaceId}/components`);
	const existing = data.components.find((c) => c.name === schema.name);
	if (existing) {
		await client.put(`spaces/${spaceId}/components/${existing.id}`, { component: schema });
		console.log(`Updated component ${schema.name}`);
		return existing.id;
	}
	const { data: created } = await client.post(`spaces/${spaceId}/components`, { component: schema });
	console.log(`Created component ${schema.name}`);
	return created.component.id;
}

const CATEGORY_ENTRIES = [
	{ name: 'Nyheter', value: 'nyheter' },
	{ name: 'Guide', value: 'guide' },
	{ name: 'Sverige', value: 'sverige' },
	{ name: 'Ekonomi', value: 'ekonomi' },
	{ name: 'Teknik', value: 'teknik' },
];

export async function upsertDatasource(spaceId) {
	const { data } = await client.get(`spaces/${spaceId}/datasources`);
	let ds = data.datasources.find((d) => d.slug === 'article-categories');
	if (!ds) {
		const { data: created } = await client.post(`spaces/${spaceId}/datasources`, {
			datasource: { name: 'Article Categories', slug: 'article-categories' },
		});
		ds = created.datasource;
		console.log('Created datasource article-categories');
	}
	const { data: entriesData } = await client.get(`spaces/${spaceId}/datasource_entries`, {
		datasource_id: ds.id,
	});
	for (const entry of CATEGORY_ENTRIES) {
		if (entriesData.datasource_entries.some((e) => e.value === entry.value)) continue;
		await client.post(`spaces/${spaceId}/datasource_entries`, {
			datasource_entry: { ...entry, datasource_id: ds.id },
		});
		console.log(`Created datasource entry ${entry.value}`);
	}
	return ds;
}
```

- [ ] **Step 3: Define the component schemas and call the upserts**

Append to `scripts/setup-storyblok.mjs`:
```js
const COMPONENTS = [
	{
		name: 'author',
		schema: {
			name: { type: 'text' },
			bio: { type: 'textarea' },
			photo: { type: 'asset' },
		},
		is_root: false,
		is_nestable: true,
	},
	{
		name: 'article',
		schema: {
			title: { type: 'text' },
			summary: { type: 'textarea' },
			content: { type: 'richtext' },
			category: {
				type: 'option',
				source: 'internal',
				datasource_slug: 'article-categories',
			},
			author: { type: 'option', source: 'internal_stories', filtr_content_type: 'author' },
		},
		is_root: false,
		is_nestable: true,
	},
	{
		name: 'filtered-posts',
		schema: {},
		is_root: false,
		is_nestable: true,
	},
	{
		name: 'category',
		schema: {
			title: { type: 'text' },
			body: { type: 'bloks', restrict_components: true, component_whitelist: ['filtered-posts'] },
		},
		is_root: true,
		is_nestable: false,
	},
	{
		name: 'nav-link',
		schema: {
			label: { type: 'text' },
			link: { type: 'multilink' },
			sub_links: { type: 'bloks', restrict_components: true, component_whitelist: ['nav-link'] },
		},
		is_root: false,
		is_nestable: true,
	},
	{
		name: 'config',
		schema: {
			header: { type: 'bloks', restrict_components: true, component_whitelist: ['nav-link'] },
			footer_text: { type: 'text' },
		},
		is_root: true,
		is_nestable: false,
	},
];

export async function setupComponentsAndDatasource(spaceId) {
	for (const schema of COMPONENTS) {
		await upsertComponent(spaceId, schema);
	}
	await upsertDatasource(spaceId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const spaceId = await getOrCreateSpace();
	await setupComponentsAndDatasource(spaceId);
	console.log(`Space ready: ${spaceId}. Run 'STORYBLOK_SPACE_ID=${spaceId} node scripts/setup-storyblok.mjs' again to re-apply, or continue with Task 3's content step.`);
}
```

- [ ] **Step 4: Add npm script**

In `package.json` `"scripts"`, add:
```json
"setup:storyblok": "node scripts/setup-storyblok.mjs"
```

- [ ] **Step 5: Run against a real space and verify**

You provide `STORYBLOK_MGMT_TOKEN` and `STORYBLOK_ORG_ID` in `.env`, then:
```bash
node --env-file=.env scripts/setup-storyblok.mjs
```
Expected output: `Created space ...`, then 6 `Created component ...` lines,
`Created datasource article-categories`, 5 `Created datasource entry ...`
lines, ending with `Space ready: <id>`. Note the printed space id — export
it as `STORYBLOK_SPACE_ID` in `.env` so later steps reuse the same space.

Re-run the same command: expected output should now log `Updated
component ...` instead of `Created ...` (idempotency check) and no
duplicate datasource entries.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/setup-storyblok.mjs
git commit -m "feat: add Storyblok Management API setup script (space, content types, datasource)"
```

---

### Task 3: Storyblok setup script — folders, stories, sample content, token

**Files:**
- Modify: `scripts/setup-storyblok.mjs`

**Interfaces:**
- Consumes: `getOrCreateSpace`, from Task 2 (via `STORYBLOK_SPACE_ID` env,
  already set).
- Produces (side effect): `config`, `home` stories; `authors/` folder + 2
  author stories; `articles/` folder + 4 article stories referencing those
  authors; `categories/` folder + 5 category stories (one per datasource
  entry); a preview delivery token, printed to stdout.

- [ ] **Step 1: Add folder + story helpers**

Append to `scripts/setup-storyblok.mjs`:
```js
export async function upsertFolder(spaceId, name, slug) {
	const { data } = await client.get(`spaces/${spaceId}/stories`, { folder_only: 1 });
	const existing = data.stories.find((s) => s.slug === slug);
	if (existing) return existing.id;
	const { data: created } = await client.post(`spaces/${spaceId}/stories`, {
		story: { name, slug, is_folder: true },
	});
	console.log(`Created folder ${slug}`);
	return created.story.id;
}

export async function upsertStory(spaceId, { name, slug, folderId, contentType, content }) {
	const { data } = await client.get(`spaces/${spaceId}/stories`, { with_slug: slug });
	if (data.stories.length) {
		const story = data.stories[0];
		await client.put(`spaces/${spaceId}/stories/${story.id}`, {
			story: { content: { component: contentType, ...content } },
		});
		console.log(`Updated story ${slug}`);
		return story;
	}
	const { data: created } = await client.post(`spaces/${spaceId}/stories`, {
		story: {
			name,
			slug,
			parent_id: folderId,
			content: { component: contentType, ...content },
		},
		publish: 1,
	});
	console.log(`Created story ${slug}`);
	return created.story;
}
```

- [ ] **Step 2: Add the content-seeding function**

Append:
```js
export async function seedContent(spaceId) {
	await upsertStory(spaceId, {
		name: 'Config', slug: 'config', folderId: 0, contentType: 'config',
		content: {
			header: [
				{ component: 'nav-link', label: 'Start', link: { url: '/' } },
				{
					component: 'nav-link', label: 'Artiklar', link: { url: '/articles' },
					sub_links: [
						{ component: 'nav-link', label: 'Alla artiklar', link: { url: '/articles' } },
					],
				},
			],
			footer_text: '© 2026 Artikelsajt',
		},
	});
	await upsertStory(spaceId, {
		name: 'Home', slug: 'home', folderId: 0, contentType: 'page', content: { body: [] },
	});

	const authorsFolderId = await upsertFolder(spaceId, 'Authors', 'authors');
	const articlesFolderId = await upsertFolder(spaceId, 'Articles', 'articles');
	const categoriesFolderId = await upsertFolder(spaceId, 'Categories', 'categories');

	const anna = await upsertStory(spaceId, {
		name: 'Anna Karlsson', slug: 'anna-karlsson', folderId: authorsFolderId, contentType: 'author',
		content: { name: 'Anna Karlsson', bio: 'Ekonomijournalist med 10 års erfarenhet.', photo: {} },
	});
	const erik = await upsertStory(spaceId, {
		name: 'Erik Sundin', slug: 'erik-sundin', folderId: authorsFolderId, contentType: 'author',
		content: { name: 'Erik Sundin', bio: 'Skriver om teknik och samhälle.', photo: {} },
	});

	const richtext = (text) => ({
		type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
	});

	const articles = [
		{ slug: 'riksbanken-lamnar-styrrantan-oforandrad', title: 'Riksbanken lämnar styrräntan oförändrad', summary: 'Räntebeskedet väntat av marknaden.', category: 'ekonomi', author: anna },
		{ slug: 'sveriges-ekonomi-visar-styrka', title: 'Sveriges ekonomi visar styrka', summary: 'Nya siffror pekar uppåt.', category: 'nyheter', author: anna },
		{ slug: 'ai-verktyg-forandrar-arbetslivet', title: 'AI-verktyg förändrar arbetslivet', summary: 'Fler branscher tar in AI i vardagen.', category: 'teknik', author: erik },
		{ slug: 'sa-kommer-du-igang-med-ditt-forsta-projekt', title: 'Så kommer du igång med ditt första projekt', summary: 'En guide för nybörjare.', category: 'guide', author: erik },
	];

	for (const a of articles) {
		await upsertStory(spaceId, {
			name: a.title, slug: a.slug, folderId: articlesFolderId, contentType: 'article',
			content: {
				title: a.title, summary: a.summary, content: richtext(a.summary),
				category: a.category, author: a.author.uuid,
			},
		});
	}

	for (const entry of CATEGORY_ENTRIES) {
		await upsertStory(spaceId, {
			name: entry.name, slug: entry.value, folderId: categoriesFolderId, contentType: 'category',
			content: { title: entry.name, body: [{ component: 'filtered-posts' }] },
		});
	}
}

export async function createPreviewToken(spaceId) {
	const { data } = await client.get(`spaces/${spaceId}/api_keys`);
	const existing = data.api_keys.find((k) => k.access === 'private' || k.access === 'public');
	if (existing) return existing.token;
	const { data: created } = await client.post(`spaces/${spaceId}/api_keys`, {
		api_key: { access: 'public' },
	});
	return created.api_key.token;
}
```

- [ ] **Step 3: Wire into the script's entrypoint**

Modify the `if (import.meta.url === ...)` block at the bottom to:
```js
if (import.meta.url === `file://${process.argv[1]}`) {
	const spaceId = await getOrCreateSpace();
	await setupComponentsAndDatasource(spaceId);
	await seedContent(spaceId);
	const token = await createPreviewToken(spaceId);
	console.log(`Space ready: ${spaceId}.`);
	console.log(`Delivery token (put in .env as STORYBLOK_DELIVERY_API_TOKEN): ${token}`);
}
```

- [ ] **Step 4: Run and verify**

```bash
STORYBLOK_SPACE_ID=<id from Task 2> node --env-file=.env scripts/setup-storyblok.mjs
```
Expected: creates `config`, `home`, 2 author stories, 4 article stories, 5
category stories, prints a delivery token. Copy that token into `.env` as
`STORYBLOK_DELIVERY_API_TOKEN`.

Verify with a direct API read:
```bash
curl "https://api.storyblok.com/v2/cdn/stories?token=$STORYBLOK_DELIVERY_API_TOKEN&content_type=article&version=draft"
```
Expected: JSON with 4 stories under `stories`, each `content.author` a uuid
string.

- [ ] **Step 5: Commit**

```bash
git add scripts/setup-storyblok.mjs
git commit -m "feat: seed Storyblok content (authors, articles, categories, config)"
```

---

### Task 4: Delivery API components map + author/article block renderers

**Files:**
- Modify: `src/lib/storyblok.js`
- Create: `src/components/blocks/AuthorBlock.jsx`
- Create: `src/components/blocks/ArticleBlock.jsx`
- Create: `src/components/blocks/CategoryBlock.jsx`
- Create: `src/components/blocks/ConfigBlock.jsx`

**Interfaces:**
- Produces: `getStoryblokApi()` (unchanged signature) now resolves
  `author`, `article`, `category`, `config` content types and `nav-link`,
  `filtered-posts` nested blocks without throwing "component not found".
  `CategoryBlock` renders its `body` blocks (which is how `filtered-posts`
  from Task 8 gets mounted when Storyblok's own story-render path is used).

- [ ] **Step 1: Create minimal passthrough block components**

`src/components/blocks/AuthorBlock.jsx`:
```jsx
import { storyblokEditable } from '@storyblok/react/rsc';

export default function AuthorBlock({ blok }) {
	return <div {...storyblokEditable(blok)}>{blok.name}</div>;
}
```

`src/components/blocks/ArticleBlock.jsx`:
```jsx
import { storyblokEditable } from '@storyblok/react/rsc';

export default function ArticleBlock({ blok }) {
	return <div {...storyblokEditable(blok)}>{blok.title}</div>;
}
```

`src/components/blocks/ConfigBlock.jsx`:
```jsx
import { storyblokEditable } from '@storyblok/react/rsc';

export default function ConfigBlock({ blok }) {
	return <div {...storyblokEditable(blok)} />;
}
```

`src/components/blocks/CategoryBlock.jsx`:
```jsx
import { StoryblokServerComponent, storyblokEditable } from '@storyblok/react/rsc';

export default function CategoryBlock({ blok }) {
	return (
		<div {...storyblokEditable(blok)}>
			<h1 className="text-3xl font-bold mb-6">{blok.title}</h1>
			{blok.body?.map((nested) => (
				<StoryblokServerComponent blok={nested} key={nested._uid} />
			))}
		</div>
	);
}
```

- [ ] **Step 2: Register them in the components map**

Read `src/lib/storyblok.js` first, then modify the `components` object to
add:
```js
import AuthorBlock from '@/components/blocks/AuthorBlock';
import ArticleBlock from '@/components/blocks/ArticleBlock';
import CategoryBlock from '@/components/blocks/CategoryBlock';
import ConfigBlock from '@/components/blocks/ConfigBlock';
import FilteredPosts from '@/components/FilteredPosts';
import NavLink from '@/components/blocks/NavLink';
```
and inside `components: { ... }` add:
```js
author: AuthorBlock,
article: ArticleBlock,
category: CategoryBlock,
config: ConfigBlock,
'filtered-posts': FilteredPosts,
'nav-link': NavLink,
```
(`FilteredPosts` and `NavLink` are created in Task 6 and Task 5
respectively — this task's import lines will fail to resolve until those
files exist, so do Step 2 last, after Tasks 5 and 6, or stub both files
here with an empty `export default function X() { return null; }` and let
Task 5/6 replace the stub body.)

Create the stubs now so this task is self-contained:

`src/components/FilteredPosts.jsx`:
```jsx
export default function FilteredPosts() {
	return null;
}
```

`src/components/blocks/NavLink.jsx`:
```jsx
export default function NavLink() {
	return null;
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: exits 0 (confirms every import in the components map resolves).

- [ ] **Step 4: Commit**

```bash
git add src/lib/storyblok.js src/components/blocks src/components/FilteredPosts.jsx
git commit -m "feat: register author/article/category/config/nav-link/filtered-posts components"
```

---

### Task 5: Header, Footer, layout wiring (flernivåmeny)

**Files:**
- Create: `src/components/Header.jsx`
- Create: `src/components/Footer.jsx`
- Modify: `src/components/blocks/NavLink.jsx` (replace stub)
- Modify: `src/app/layout.js`

**Interfaces:**
- Consumes: `getStoryblokApi()` from `src/lib/storyblok.js` (Task 4).
- Produces: `<Header navLinks={array} />`, `<Footer text={string} />` — the
  shape of `navLinks` is Storyblok's raw `config.content.header` array
  (each item: `{ _uid, label, link: { url }, sub_links: [...] }`).

- [ ] **Step 1: Replace the NavLink stub with a real renderer**

`src/components/blocks/NavLink.jsx`:
```jsx
export default function NavLink({ blok }) {
	return (
		<li className="relative group">
			<a href={blok.link?.url || '#'} className="px-3 py-2 hover:text-blue-600">
				{blok.label}
			</a>
			{blok.sub_links?.length > 0 && (
				<ul className="absolute left-0 hidden group-hover:block bg-white shadow-md rounded-md py-2 min-w-40 z-10">
					{blok.sub_links.map((sub) => (
						<li key={sub._uid}>
							<a href={sub.link?.url || '#'} className="block px-4 py-2 hover:bg-gray-100">
								{sub.label}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
}
```

- [ ] **Step 2: Write Header and Footer**

`src/components/Header.jsx`:
```jsx
import NavLink from '@/components/blocks/NavLink';

export default function Header({ navLinks = [] }) {
	return (
		<header className="border-b bg-white">
			<nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
				<a href="/" className="font-bold text-xl">Artikelsajt</a>
				<ul className="flex gap-2">
					{navLinks.map((blok) => (
						<NavLink blok={blok} key={blok._uid} />
					))}
				</ul>
			</nav>
		</header>
	);
}
```

`src/components/Footer.jsx`:
```jsx
export default function Footer({ text }) {
	return (
		<footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
			{text}
		</footer>
	);
}
```

- [ ] **Step 3: Wire into layout**

Read `src/app/layout.js` first. Replace its body with a version that fetches
the `config` story and renders `Header`/`Footer` around `children`:
```jsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStoryblokApi } from '@/lib/storyblok';
import './globals.css';

export default async function RootLayout({ children }) {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories/config', { version: 'draft' });
	const config = data.story.content;

	return (
		<html lang="sv">
			<body>
				<Header navLinks={config.header} />
				<main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
				<Footer text={config.footer_text} />
			</body>
		</html>
	);
}
```
(Keep any existing font/metadata setup already in the file — only change
the body-rendering part.)

- [ ] **Step 4: Verify**

```bash
npm run dev
```
Then in another terminal:
```bash
curl -s http://localhost:3000/ | grep -o 'Artikelsajt'
```
Expected: prints `Artikelsajt` (header rendered). Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.jsx src/components/Footer.jsx src/components/blocks/NavLink.jsx src/app/layout.js
git commit -m "feat: header with multi-level nav, footer, layout wiring"
```

---

### Task 6: `/articles` list page + ArticleCard

**Files:**
- Create: `src/components/ArticleCard.jsx`
- Create: `src/app/articles/page.js`

**Interfaces:**
- Produces: `<ArticleCard story={storyblokStoryObject} />` — reused by
  Task 7 (author page) and Task 8 (FilteredPosts). Expects a raw Storyblok
  story object with `resolve_relations` already applied, i.e.
  `story.content.author` is the resolved author story (not a uuid).

- [ ] **Step 1: Write ArticleCard**

`src/components/ArticleCard.jsx`:
```jsx
export default function ArticleCard({ story }) {
	const author = story.content.author;
	return (
		<article className="border-b py-6">
			<span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2">
				{story.content.category}
			</span>
			<h2 className="text-xl font-bold mb-2">
				<a href={`/articles/${story.slug}`} className="hover:underline">
					{story.content.title}
				</a>
			</h2>
			<p className="text-gray-600 mb-2">{story.content.summary}</p>
			{author && (
				<a href={`/authors/${author.slug}`} className="text-sm text-gray-500 hover:underline">
					{author.content.name}
				</a>
			)}
		</article>
	);
}
```

- [ ] **Step 2: Write the list page**

`src/app/articles/page.js`:
```jsx
import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi } from '@/lib/storyblok';

export default async function ArticlesPage() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'article',
		resolve_relations: 'article.author',
	});

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">Artiklar</h1>
			{data.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
```bash
curl -s http://localhost:3000/articles | grep -c 'article'
```
Expected: count ≥ 4 (one `<article` tag per seeded article). Also check
manually that author names appear:
```bash
curl -s http://localhost:3000/articles | grep -o 'Anna Karlsson\|Erik Sundin'
```
Expected: both names appear at least once. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticleCard.jsx src/app/articles/page.js
git commit -m "feat: /articles list page"
```

---

### Task 7: `/articles/[slug]` detail page

**Files:**
- Create: `src/app/articles/[slug]/page.js`

**Interfaces:**
- Consumes: `getStoryblokApi()` (Task 4/lib), no shared component (renders
  richtext inline via `@storyblok/react`'s `render`).

- [ ] **Step 1: Write the detail page**

`src/app/articles/[slug]/page.js`:
```jsx
import { render } from 'storyblok-rich-text-react-renderer';
import { getStoryblokApi } from '@/lib/storyblok';

async function getArticle(slug) {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get(`cdn/stories/articles/${slug}`, {
		version: 'draft',
		resolve_relations: 'article.author',
	});
	return data.story;
}

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'article',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const story = await getArticle(slug);
	return {
		title: story.content.title,
		description: story.content.summary,
	};
}

export default async function ArticlePage({ params }) {
	const { slug } = await params;
	const story = await getArticle(slug);
	const author = story.content.author;

	return (
		<article>
			<span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2">
				{story.content.category}
			</span>
			<h1 className="text-3xl font-bold mb-4">{story.content.title}</h1>
			<div className="prose max-w-none mb-6">{render(story.content.content)}</div>
			{author && (
				<a href={`/authors/${author.slug}`} className="text-blue-600 hover:underline">
					Av {author.content.name}
				</a>
			)}
		</article>
	);
}
```

- [ ] **Step 2: Add the richtext renderer dependency**

```bash
npm install storyblok-rich-text-react-renderer
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```
```bash
curl -s http://localhost:3000/articles/riksbanken-lamnar-styrrantan-oforandrad | grep -o 'Av Anna Karlsson'
```
Expected: prints `Av Anna Karlsson`. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/app/articles/\[slug\]/page.js
git commit -m "feat: /articles/[slug] detail page with metadata and static params"
```

---

### Task 8: `/authors/[slug]` page

**Files:**
- Create: `src/app/authors/[slug]/page.js`

**Interfaces:**
- Consumes: `ArticleCard` (Task 6).

- [ ] **Step 1: Write the author page**

`src/app/authors/[slug]/page.js`:
```jsx
import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi } from '@/lib/storyblok';

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'author',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export default async function AuthorPage({ params }) {
	const { slug } = await params;
	const storyblokApi = getStoryblokApi();

	const { data: authorData } = await storyblokApi.get(`cdn/stories/authors/${slug}`, {
		version: 'draft',
	});
	const authorStory = authorData.story;

	const { data: articlesData } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'article',
		resolve_relations: 'article.author',
		filter_query: { author: { in: authorStory.uuid } },
	});

	return (
		<div>
			<h1 className="text-3xl font-bold mb-2">{authorStory.content.name}</h1>
			<p className="text-gray-600 mb-8">{authorStory.content.bio}</p>
			<h2 className="text-xl font-semibold mb-4">Artiklar</h2>
			{articlesData.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```
```bash
curl -s http://localhost:3000/authors/anna-karlsson | grep -c 'article'
```
Expected: count ≥ 2 (Anna's two seeded articles).

```bash
curl -s http://localhost:3000/authors/anna-karlsson | grep -o 'Riksbanken lämnar styrräntan oförändrad'
```
Expected: title present. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/app/authors
git commit -m "feat: /authors/[slug] page with author's article list"
```

---

### Task 9: `/categories/[slug]` + FilteredPosts

**Files:**
- Create: `src/app/categories/[slug]/page.js`
- Modify: `src/components/FilteredPosts.jsx` (replace stub)

**Interfaces:**
- Consumes: `ArticleCard` (Task 6), `getStoryblokApi()`.
- `FilteredPosts` reads the category slug via Next.js's segment path, not
  props — it calls `headers()` is unnecessary; instead the page passes the
  slug down as a prop through `StoryblokServerComponent`'s standard `blok`
  prop is not enough (blok has no slug). To keep `filtered-posts` usable
  from `CategoryBlock` (Task 4) without extra plumbing, `FilteredPosts`
  takes the slug from the story it's nested in via a second prop the page
  passes explicitly — see Step 2.

- [ ] **Step 1: Replace the FilteredPosts stub**

`src/components/FilteredPosts.jsx`:
```jsx
import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi } from '@/lib/storyblok';

export default async function FilteredPosts({ categorySlug }) {
	if (!categorySlug) return null;
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'article',
		resolve_relations: 'article.author',
		filter_query: { category: { in: categorySlug } },
	});

	if (data.stories.length === 0) {
		return <p className="text-gray-500">Inga artiklar i denna kategori än.</p>;
	}

	return data.stories.map((story) => <ArticleCard story={story} key={story.uuid} />);
}
```

- [ ] **Step 2: Write the category page, passing the slug through**

`src/app/categories/[slug]/page.js`:
```jsx
import FilteredPosts from '@/components/FilteredPosts';
import { getStoryblokApi } from '@/lib/storyblok';

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'category',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export default async function CategoryPage({ params }) {
	const { slug } = await params;
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get(`cdn/stories/categories/${slug}`, {
		version: 'draft',
	});
	const category = data.story.content;

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">{category.title}</h1>
			<FilteredPosts categorySlug={slug} />
		</div>
	);
}
```

This bypasses `StoryblokServerComponent`/`CategoryBlock` for rendering
`body` (the page renders `FilteredPosts` directly with the slug it already
has from `params`) — simpler than threading the slug through the generic
block-rendering path, and still satisfies the spec's "block filters via
filter_query, new category = new datasource entry + story, not new
page.jsx" requirement, since `page.js` here is generic (reads `title` +
renders `FilteredPosts` for any slug) and never needs editing per category.

- [ ] **Step 3: Verify**

```bash
npm run dev
```
```bash
curl -s http://localhost:3000/categories/teknik | grep -o 'AI-verktyg förändrar arbetslivet'
```
Expected: title present (the one `teknik` article).
```bash
curl -s http://localhost:3000/categories/guide | grep -c 'Riksbanken\|Sveriges ekonomi\|AI-verktyg'
```
Expected: `0` (none of the ekonomi/nyheter/teknik articles leak into
`guide`). Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/categories src/components/FilteredPosts.jsx
git commit -m "feat: /categories/[slug] content-driven routing with filter_query"
```

---

### Task 10: Home page, robots.js, sitemap.js

**Files:**
- Create: `src/app/page.js`
- Create: `src/app/robots.js`
- Create: `src/app/sitemap.js`

**Interfaces:**
- None consumed beyond `getStoryblokApi()`.

- [ ] **Step 1: Write the home page**

`src/app/page.js`:
```jsx
export default function HomePage() {
	return (
		<div>
			<h1 className="text-3xl font-bold mb-4">Artikelsajt</h1>
			<a href="/articles" className="text-blue-600 hover:underline">
				Läs alla artiklar
			</a>
		</div>
	);
}
```

- [ ] **Step 2: Write robots.js**

`src/app/robots.js`:
```js
export default function robots() {
	const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
	return {
		rules: { userAgent: '*', allow: '/' },
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
```

- [ ] **Step 3: Write sitemap.js**

`src/app/sitemap.js`:
```js
import { getStoryblokApi } from '@/lib/storyblok';

export default async function sitemap() {
	const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
	const storyblokApi = getStoryblokApi();

	const [{ data: articles }, { data: authors }] = await Promise.all([
		storyblokApi.get('cdn/stories', { version: 'draft', content_type: 'article' }),
		storyblokApi.get('cdn/stories', { version: 'draft', content_type: 'author' }),
	]);

	const staticEntries = [
		{ url: siteUrl, lastModified: new Date() },
		{ url: `${siteUrl}/articles`, lastModified: new Date() },
	];
	const articleEntries = articles.stories.map((s) => ({
		url: `${siteUrl}/articles/${s.slug}`,
		lastModified: s.published_at || s.created_at,
	}));
	const authorEntries = authors.stories.map((s) => ({
		url: `${siteUrl}/authors/${s.slug}`,
		lastModified: s.published_at || s.created_at,
	}));

	return [...staticEntries, ...articleEntries, ...authorEntries];
}
```

- [ ] **Step 4: Add SITE_URL to next.config.mjs env passthrough**

Read `next.config.mjs` first, then add `SITE_URL: process.env.SITE_URL,`
next to the existing `STORYBLOK_*` entries in the `env` object.

- [ ] **Step 5: Verify**

```bash
SITE_URL=http://localhost:3000 npm run dev
```
```bash
curl -s http://localhost:3000/ | grep -o 'Läs alla artiklar'
curl -s http://localhost:3000/robots.txt | grep -o 'sitemap.xml'
curl -s http://localhost:3000/sitemap.xml | grep -c '<url>'
```
Expected: first two greps match; third prints a count ≥ 6 (2 static + 4
articles + 2 authors). Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.js src/app/robots.js src/app/sitemap.js next.config.mjs
git commit -m "feat: home page, robots.txt, sitemap.xml"
```

---

### Task 11: `.env.example` + README deploy/webhook checklist

**Files:**
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:** none.

- [ ] **Step 1: Write .env.example**

`.env.example`:
```
STORYBLOK_DELIVERY_API_TOKEN=
STORYBLOK_REGION=eu
SITE_URL=http://localhost:3000

# Only needed to run scripts/setup-storyblok.mjs, never used at runtime:
STORYBLOK_MGMT_TOKEN=
STORYBLOK_ORG_ID=
STORYBLOK_SPACE_ID=
```

- [ ] **Step 2: Append a deploy checklist to README.md**

Read `README.md` first, then append at the end:
```md
## Deploy (Vercel) + Storyblok webhook

1. Import this repo into Vercel.
2. Set env vars in the Vercel project: `STORYBLOK_DELIVERY_API_TOKEN`,
   `STORYBLOK_REGION`, `SITE_URL` (your Vercel prod URL).
3. Deploy. In Project Settings → Git → Deploy Hooks, create a hook and
   copy its URL.
4. In Storyblok: Settings → Webhooks → add the Deploy Hook URL, trigger on
   "Story published" and "Story unpublished".
5. In Storyblok: Settings → Visual Editor → set Location to the Vercel
   prod URL.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: env example and Vercel deploy + webhook checklist"
```

---

## Manual follow-up (not automatable from this session)

- Run Task 2/3's setup script against a real Storyblok space (needs your
  `STORYBLOK_MGMT_TOKEN`/`STORYBLOK_ORG_ID`).
- Follow Task 11's README checklist to import into Vercel and wire the
  webhook (needs your Vercel/Storyblok account access).
