import { StoryblokServerComponent, storyblokEditable } from '@storyblok/react/rsc';

export default function CategoryBlock({ blok }) {
	return (
		<div {...storyblokEditable(blok)}>
			<h1 className="text-3xl font-bold mb-6">{blok.title}</h1>
			{blok.body?.map((nested) => (
				<StoryblokServerComponent blok={nested} key={nested._uid} />
			))}
		</div>
	);
}
