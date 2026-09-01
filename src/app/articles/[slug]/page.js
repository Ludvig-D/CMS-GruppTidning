import { notFound } from 'next/navigation';
import { render } from 'storyblok-rich-text-react-renderer';
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
	const author = story.content.author;
	const date = story.first_published_at
		? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(story.first_published_at))
		: null;

	return (
		<article>
			<div className="flex items-center gap-3 mb-4 font-mono text-xs uppercase tracking-widest text-signal">
				<span>{story.content.category}</span>
				{date && (
					<>
						<span className="text-rule">·</span>
						<span className="text-ink-soft">{date}</span>
					</>
				)}
			</div>
			<h1 className="font-display text-4xl font-bold text-ink leading-tight mb-3">{story.content.title}</h1>
			{author && (
				<a href={`/authors/${author.slug}`} className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-signal">
					Av {author.content.name}
				</a>
			)}
			<div className="prose-dispatch font-body text-ink mt-6">{render(story.content.content)}</div>
		</article>
	);
}
