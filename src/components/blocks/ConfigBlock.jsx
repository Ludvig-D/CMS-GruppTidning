import { storyblokEditable } from '@storyblok/react/rsc';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ConfigBlock({ blok, children }) {
	return (
		<div {...storyblokEditable(blok)}>
			<Header navLinks={blok.header || []} />
			<main className="max-w-4xl mx-auto px-6 py-12">{children}</main>
			<Footer text={blok.footer_text} />
		</div>
	);
}
