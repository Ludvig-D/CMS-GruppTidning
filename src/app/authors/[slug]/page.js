import { notFound } from 'next/navigation';
import { StoryblokStory } from '@storyblok/react/rsc';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'author',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export default async function AuthorPage({ params }) {
	const { slug } = await params;
	const storyblokApi = getStoryblokApi();

	let authorStory;
	try {
		const { data: authorData } = await storyblokApi.get(`cdn/stories/authors/${slug}`, {
			version: SB_VERSION,
		});
		authorStory = authorData.story;
	} catch {
		notFound();
	}
	if (!authorStory) notFound();

	const { data: articlesData } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
		resolve_relations: 'article.author',
		filter_query: { author: { in: authorStory.uuid } },
	});

	return <StoryblokStory story={authorStory} articles={articlesData.stories} />;
}
