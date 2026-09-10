import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';

const dateline = (iso) =>
	iso ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : null;

export default function ArticleBlock({ blok, publishedAt }) {
	const author = blok.author;
	const date = dateline(publishedAt);

	return (
		<article {...storyblokEditable(blok)}>
			<div className="flex items-center gap-3 mb-4 font-mono text-xs uppercase tracking-widest text-signal">
				<span>{blok.category}</span>
				{date && (
					<>
						<span className="text-rule">·</span>
						<span className="text-ink-soft">{date}</span>
					</>
				)}
			</div>
			<h1 className="font-display text-4xl font-bold text-ink leading-tight mb-3">{blok.title}</h1>
			{author && typeof author === 'object' && (
				<a href={`/authors/${author.slug}`} className="font-mono text-xs uppercase tracking-wide text-ink-soft hover:text-signal">
					Av {author.content?.name}
				</a>
			)}
			<div className="prose-dispatch font-body text-ink mt-6">{render(blok.content)}</div>
		</article>
	);
}
