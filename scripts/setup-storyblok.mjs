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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
	const spaceId = await getOrCreateSpace();
	await setupComponentsAndDatasource(spaceId);
	console.log(`Space ready: ${spaceId}. Run 'STORYBLOK_SPACE_ID=${spaceId} node scripts/setup-storyblok.mjs' again to re-apply, or continue with Task 3's content step.`);
}
