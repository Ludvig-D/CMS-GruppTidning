import { storyblokEditable } from '@storyblok/react/rsc';
import ArticleCard from '@/components/ArticleCard';

export default function AuthorBlock({ blok, articles = [] }) {
	const initials = blok.name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return (
		<div {...storyblokEditable(blok)}>
			<div className="flex items-center gap-4 mb-2">
				{blok.photo?.filename ? (
					<img
						src={blok.photo.filename}
						alt={blok.photo.alt || blok.name}
						className="w-14 h-14 rounded-full object-cover shrink-0"
					/>
				) : (
					<div className="w-14 h-14 rounded-full bg-ink text-paper font-display font-bold text-lg flex items-center justify-center shrink-0">
						{initials}
					</div>
				)}
				<div>
					<p className="font-mono text-xs uppercase tracking-widest text-signal mb-1">Korrespondent</p>
					<h1 className="font-display text-2xl font-bold text-ink">{blok.name}</h1>
				</div>
			</div>
			<p className="font-body text-ink-soft mb-10 mt-4">{blok.bio}</p>
			<h2 className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-4">Dispatcher</h2>
			{articles.length === 0 && <p className="font-body text-ink-soft">Inga artiklar än.</p>}
			{articles.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
