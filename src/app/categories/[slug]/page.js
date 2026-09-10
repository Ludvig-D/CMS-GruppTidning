import { notFound } from 'next/navigation';
import { StoryblokServerComponent } from '@storyblok/react/rsc';
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

	// Render the story through Storyblok so the `filtered-posts` block in the
	// category's body drives the article list (content-driven routing). The slug
	// is forwarded as a prop because `filtered-posts` has no fields of its own.
	return <StoryblokServerComponent blok={categoryStory.content} categorySlug={slug} />;
}
