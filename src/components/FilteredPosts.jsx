import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export default async function FilteredPosts({ categorySlug }) {
	if (!categorySlug) return null;
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
		resolve_relations: 'article.author',
		filter_query: { category: { in: categorySlug } },
	});

	if (data.stories.length === 0) {
		return <p className="text-gray-500">Inga artiklar i denna kategori än.</p>;
	}

	return data.stories.map((story) => <ArticleCard story={story} key={story.uuid} />);
}
