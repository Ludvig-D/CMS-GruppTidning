import { storyblokEditable } from '@storyblok/react/rsc';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConfigBlock({ blok, children }) {
	return (
		<div {...storyblokEditable(blok)}>
			<Header navLinks={blok.header || []} />
			<main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
			<Footer text={blok.footer_text} />
		</div>
	);
}
