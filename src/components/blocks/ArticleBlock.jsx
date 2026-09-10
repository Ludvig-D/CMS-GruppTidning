import { storyblokEditable } from '@storyblok/react/rsc';
import { render } from 'storyblok-rich-text-react-renderer';

export default function ArticleBlock({ blok }) {
	const author = blok.author;

	return (
		<article {...storyblokEditable(blok)}>
			<span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2">
				{blok.category}
			</span>
			<h1 className="text-3xl font-bold mb-4">{blok.title}</h1>
			<div className="prose max-w-none mb-6">{render(blok.content)}</div>
			{author && typeof author === 'object' && (
				<a href={`/authors/${author.slug}`} className="text-blue-600 hover:underline">
					Av {author.content?.name}
				</a>
			)}
		</article>
	);
}
