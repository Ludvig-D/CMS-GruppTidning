import { storyblokEditable } from '@storyblok/react/rsc';

export default function ConfigBlock({ blok }) {
	return <div {...storyblokEditable(blok)} />;
}
