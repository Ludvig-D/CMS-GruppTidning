import { notFound } from 'next/navigation';
import { StoryblokStory } from '@storyblok/react/rsc';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

async function getArticle(slug) {
	const storyblokApi = getStoryblokApi();
	let story;
	try {
		const { data } = await storyblokApi.get(`cdn/stories/articles/${slug}`, {
			version: SB_VERSION,
			resolve_relations: 'article.author',
		});
		story = data.story;
	} catch {
		notFound();
	}
	if (!story) notFound();
	return story;
}

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	try {
		const storyblokApi = getStoryblokApi();
		const { data } = await storyblokApi.get(`cdn/stories/articles/${slug}`, {
			version: SB_VERSION,
		});
		return {
			title: data.story.content.title,
			description: data.story.content.summary,
		};
	} catch {
		return { title: 'Artikel' };
	}
}

export default async function ArticlePage({ params }) {
	const { slug } = await params;
	const story = await getArticle(slug);

	return <StoryblokStory story={story} />;
}
