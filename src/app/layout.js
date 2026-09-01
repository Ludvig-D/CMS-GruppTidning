import './globals.css';
import StoryblokProvider from '@/components/StoryblokProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export const metadata = {
	title: { default: 'Artikelsajt', template: '%s | Artikelsajt' },
	description: 'Artiklar och författare från Storyblok.',
};

export default async function RootLayout({ children }) {
	const storyblokApi = getStoryblokApi();
	let config = {};
	try {
		const { data } = await storyblokApi.get('cdn/stories/config', { version: SB_VERSION });
		config = data.story.content;
	} catch {
		// Missing/unreachable config story shouldn't 500 every route on the site.
	}

	return (
		<StoryblokProvider>
			<html lang="sv">
				<body>
					<Header navLinks={config.header || []} />
					<main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
					<Footer text={config.footer_text} />
				</body>
			</html>
		</StoryblokProvider>
	);
}
