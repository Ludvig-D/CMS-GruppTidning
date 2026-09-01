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
