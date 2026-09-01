import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export default async function ArticlesPage() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
		resolve_relations: 'article.author',
	});

	return (
		<div>
			<h1 className="font-display text-3xl font-bold text-ink mb-6">Alla dispatcher</h1>
			{data.stories.map((story) => (
				<ArticleCard story={story} key={story.uuid} />
			))}
		</div>
	);
}
