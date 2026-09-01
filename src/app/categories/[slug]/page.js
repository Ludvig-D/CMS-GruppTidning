import { notFound } from 'next/navigation';
import FilteredPosts from '@/components/FilteredPosts';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export async function generateStaticParams() {
	const storyblokApi = getStoryblokApi();
	const { data } = await storyblokApi.get('cdn/stories', {
		version: SB_VERSION,
		content_type: 'category',
	});
	return data.stories.map((story) => ({ slug: story.slug }));
}

export default async function CategoryPage({ params }) {
	const { slug } = await params;
	const storyblokApi = getStoryblokApi();

	let categoryStory;
	try {
		const { data } = await storyblokApi.get(`cdn/stories/categories/${slug}`, {
			version: SB_VERSION,
		});
		categoryStory = data.story;
	} catch {
		notFound();
	}
	if (!categoryStory) notFound();

	const category = categoryStory.content;

	return (
		<div>
			<h1 className="font-display text-3xl font-bold text-ink mb-1 pb-3 border-b-2 border-signal inline-block">
				{category.title}
			</h1>
			<div className="mt-6">
				<FilteredPosts categorySlug={slug} />
			</div>
		</div>
	);
}
