import { notFound } from 'next/navigation';
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

	let authorStory;
	try {
		const { data: authorData } = await storyblokApi.get(`cdn/stories/authors/${slug}`, {
			version: 'draft',
		});
		authorStory = authorData.story;
	} catch {
		notFound();
	}
	if (!authorStory) notFound();

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
			{articlesData.stories.length === 0 && <p className="text-gray-500">Inga artiklar än.</p>}
			{articlesData.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
