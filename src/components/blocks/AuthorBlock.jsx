import { storyblokEditable } from '@storyblok/react/rsc';

export default function AuthorBlock({ blok }) {
	return <div {...storyblokEditable(blok)}>{blok.name}</div>;
}
