import { storyblokEditable } from '@storyblok/react/rsc';

export default function ArticleBlock({ blok }) {
	return <div {...storyblokEditable(blok)}>{blok.title}</div>;
}
