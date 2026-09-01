export default function ArticleCard({ story }) {
	const author = story.content.author;
	return (
		<article className="border-b py-6">
			<span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1 mb-2">
				{story.content.category}
			</span>
			<h2 className="text-xl font-bold mb-2">
				<a href={`/articles/${story.slug}`} className="hover:underline">
					{story.content.title}
				</a>
			</h2>
			<p className="text-gray-600 mb-2">{story.content.summary}</p>
			{author && (
				<a href={`/authors/${author.slug}`} className="text-sm text-gray-500 hover:underline">
					{author.content.name}
				</a>
			)}
		</article>
	);
}
