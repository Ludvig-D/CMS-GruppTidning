import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi } from '@/lib/storyblok';

export default async function ArticlesPage() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: 'draft',
		content_type: 'article',
		resolve_relations: 'article.author',
	});

	return (
		<div>
			<h1 className="text-3xl font-bold mb-6">Artiklar</h1>
			{data.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
