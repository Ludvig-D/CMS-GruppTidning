const dateline = (iso) =>
	iso ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : null;

export default function ArticleCard({ story }) {
	const author = story.content.author;
	return (
		<article className="border-b border-rule py-6 first:pt-0">
			<div className="flex items-center gap-3 mb-2 font-mono text-xs uppercase tracking-widest text-signal">
				<span>{story.content.category}</span>
				{dateline(story.first_published_at) && (
					<>
						<span className="text-rule">·</span>
						<span className="text-ink-soft">{dateline(story.first_published_at)}</span>
					</>
				)}
			</div>
			<h2 className="font-display text-2xl font-bold text-ink mb-2 leading-tight">
				<a href={`/articles/${story.slug}`} className="hover:text-signal transition-colors">
					{story.content.title}
				</a>
			</h2>
			<p className="font-body text-ink-soft mb-2">{story.content.summary}</p>
			{author && (
				<a href={`/authors/${author.slug}`} className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-signal">
					{author.content.name}
				</a>
			)}
		</article>
	);
}
