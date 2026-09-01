import { fileURLToPath } from 'node:url';
import StoryblokClient from 'storyblok-js-client';

const MGMT_TOKEN = process.env.STORYBLOK_MGMT_TOKEN;
const ORG_ID = process.env.STORYBLOK_ORG_ID;
if (!MGMT_TOKEN) throw new Error('STORYBLOK_MGMT_TOKEN is required');

const client = new StoryblokClient({ oauthToken: MGMT_TOKEN });

async function fetchAllPages(url, key, params = {}) {
	const per_page = 100;
	let page = 1;
	let all = [];
	while (true) {
		const { data } = await client.get(url, { ...params, per_page, page });
		const items = data[key];
		all = all.concat(items);
		if (items.length < per_page) break;
		page += 1;
	}
	return all;
}

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
	const components = await fetchAllPages(`spaces/${spaceId}/components`, 'components');
	const existing = components.find((c) => c.name === schema.name);
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
	const datasources = await fetchAllPages(`spaces/${spaceId}/datasources`, 'datasources');
	let ds = datasources.find((d) => d.slug === 'article-categories');
	if (!ds) {
		const { data: created } = await client.post(`spaces/${spaceId}/datasources`, {
			datasource: { name: 'Article Categories', slug: 'article-categories' },
		});
		ds = created.datasource;
		console.log('Created datasource article-categories');
	}
	const entries = await fetchAllPages(`spaces/${spaceId}/datasource_entries`, 'datasource_entries', {
		datasource_id: ds.id,
	});
	for (const entry of CATEGORY_ENTRIES) {
		if (entries.some((e) => e.value === entry.value)) continue;
		await client.post(`spaces/${spaceId}/datasource_entries`, {
			datasource_entry: { ...entry, datasource_id: ds.id },
		});
		console.log(`Created datasource entry ${entry.value}`);
	}
	return ds;
}

const COMPONENTS = [
	{
		name: 'author',
		schema: {
			name: { type: 'text' },
			bio: { type: 'textarea' },
			photo: { type: 'asset' },
		},
		is_root: true,
		is_nestable: false,
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
		is_root: true,
		is_nestable: false,
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

export async function upsertFolder(spaceId, name, slug) {
	const stories = await fetchAllPages(`spaces/${spaceId}/stories`, 'stories', { folder_only: 1 });
	const existing = stories.find((s) => s.slug === slug);
	if (existing) return existing.id;
	const { data: created } = await client.post(`spaces/${spaceId}/stories`, {
		story: { name, slug, is_folder: true },
	});
	console.log(`Created folder ${slug}`);
	return created.story.id;
}

export async function upsertStory(spaceId, { name, slug, folderId, contentType, content }) {
	// ponytail: `with_slug` filters on full_slug (folder/slug), but callers
	// pass the bare leaf slug, so it never matches nested stories — list
	// everything under the parent folder and match on parent_id + slug
	// instead, same approach as upsertFolder above.
	const stories = await fetchAllPages(`spaces/${spaceId}/stories`, 'stories');
	const existing = stories.find((s) => s.parent_id === folderId && s.slug === slug);
	if (existing) {
		const story = existing;
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
						...CATEGORY_ENTRIES.map((e) => ({
							component: 'nav-link', label: e.name, link: { url: `/categories/${e.value}` },
						})),
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
	// ponytail: the /api_keys endpoint 403s ("This endpoint does not support
	// this token type") for Personal Access Tokens. The space's own
	// `first_token` field is the default delivery API token — use that
	// instead of provisioning a new key.
	const { data } = await client.get(`spaces/${spaceId}`);
	return data.space.first_token;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	const spaceId = await getOrCreateSpace();
	await setupComponentsAndDatasource(spaceId);
	await seedContent(spaceId);
	const token = await createPreviewToken(spaceId);
	console.log(`Space ready: ${spaceId}.`);
	console.log(`Delivery token (put in .env as STORYBLOK_DELIVERY_API_TOKEN): ${token}`);
}
