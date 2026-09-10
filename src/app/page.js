import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export default async function HomePage() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
		resolve_relations: 'article.author',
		sort_by: 'first_published_at:desc',
		per_page: 6,
	});
	const [splash, ...rest] = data.stories;

	if (!splash) {
		return <p className="font-body text-ink-soft">Inga dispatcher publicerade än.</p>;
	}

	const splashDate = splash.first_published_at
		? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(splash.first_published_at))
		: null;

	return (
		<div>
			<section className="bg-paper-raised border border-rule rounded-sm p-8 mb-12">
				<div className="flex items-center gap-3 mb-4 font-mono text-xs uppercase tracking-widest text-signal">
					<span>● Dagens huvudnyhet</span>
					<span className="text-rule">·</span>
					<span>{splash.content.category}</span>
					{splashDate && (
						<>
							<span className="text-rule">·</span>
							<span className="text-ink-soft">{splashDate}</span>
						</>
					)}
				</div>
				<h1 className="font-display text-4xl md:text-5xl font-bold text-ink leading-[1.05] mb-4">
					<a href={`/articles/${splash.slug}`} className="hover:text-signal transition-colors">
						{splash.content.title}
					</a>
				</h1>
				<p className="font-body text-lg text-ink-soft mb-4">{splash.content.summary}</p>
				{splash.content.author && (
					<a
						href={`/authors/${splash.content.author.slug}`}
						className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-signal"
					>
						{splash.content.author.content.name}
					</a>
				)}
			</section>

			{rest.length > 0 && (
				<section>
					<h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">Senaste dispatcher</h2>
					{rest.map((story) => (
						<ArticleCard story={story} key={story.uuid} />
					))}
				</section>
			)}
		</div>
	);
}
