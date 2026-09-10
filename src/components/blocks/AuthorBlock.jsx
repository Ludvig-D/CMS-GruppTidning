import { storyblokEditable } from '@storyblok/react/rsc';
import ArticleCard from '@/components/ArticleCard';

export default function AuthorBlock({ blok, articles = [] }) {
	return (
		<div {...storyblokEditable(blok)}>
			{blok.photo?.filename && (
				<img
					src={blok.photo.filename}
					alt={blok.photo.alt || blok.name}
					className="w-32 h-32 rounded-full object-cover mb-4"
				/>
			)}
			<h1 className="text-3xl font-bold mb-2">{blok.name}</h1>
			<p className="text-gray-600 mb-8">{blok.bio}</p>
			<h2 className="text-xl font-semibold mb-4">Artiklar</h2>
			{articles.length === 0 && <p className="text-gray-500">Inga artiklar än.</p>}
			{articles.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
