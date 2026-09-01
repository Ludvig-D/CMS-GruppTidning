import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
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

	const initials = authorStory.content.name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<div>
			<div className="flex items-center gap-4 mb-2">
				<div className="w-14 h-14 rounded-full bg-ink text-paper font-display font-bold text-lg flex items-center justify-center shrink-0">
					{initials}
				</div>
				<div>
					<p className="font-mono text-xs uppercase tracking-widest text-signal mb-1">Korrespondent</p>
					<h1 className="font-display text-2xl font-bold text-ink">{authorStory.content.name}</h1>
				</div>
			</div>
			<p className="font-body text-ink-soft mb-10 mt-4">{authorStory.content.bio}</p>
			<h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">Dispatcher</h2>
			{articlesData.stories.length === 0 && <p className="font-body text-ink-soft">Inga artiklar än.</p>}
			{articlesData.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
