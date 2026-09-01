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
