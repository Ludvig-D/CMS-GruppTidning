import { storyblokEditable } from '@storyblok/react/rsc';
import ArticleCard from '@/components/ArticleCard';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export default async function FilteredPosts({ blok, categorySlug }) {
	if (!categorySlug) return null;
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'article',
		resolve_relations: 'article.author',
		filter_query: { category: { in: categorySlug } },
	});

	return (
		<div {...storyblokEditable(blok)}>
			{data.stories.length === 0 ? (
				<p className="font-body text-ink-soft">Inga artiklar i denna kategori än.</p>
			) : (
				data.stories.map((story) => <ArticleCard story={story} key={story.uuid} />)
			)}
		</div>
	);
}
