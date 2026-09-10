import { StoryblokServerComponent, storyblokEditable } from '@storyblok/react/rsc';

export default function CategoryBlock({ blok, categorySlug }) {
	return (
		<div {...storyblokEditable(blok)}>
			<h1 className="font-display text-3xl font-bold text-ink mb-1 pb-3 border-b-2 border-signal inline-block">
				{blok.title}
			</h1>
			<div className="mt-6">
				{blok.body?.map((nested) => (
					<StoryblokServerComponent blok={nested} categorySlug={categorySlug} key={nested._uid} />
				))}
			</div>
		</div>
	);
}
