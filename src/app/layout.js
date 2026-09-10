import './globals.css';
import { Space_Grotesk, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import StoryblokProvider from '@/components/StoryblokProvider';
import { StoryblokServerComponent } from '@storyblok/react/rsc';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700'] });
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body', weight: ['400', '600'], style: ['normal', 'italic'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata = {
	title: { default: 'Artikelsajt', template: '%s | Artikelsajt' },
	description: 'Artiklar och författare från Storyblok.',
};

export default async function RootLayout({ children }) {
	const storyblokApi = getStoryblokApi();
	let config = { component: 'config' };
	try {
		const { data } = await storyblokApi.get('cdn/stories/config', { version: SB_VERSION });
		config = data.story.content;
	} catch {
		// Missing/unreachable config story shouldn't 500 every route on the site.
	}

	return (
		<StoryblokProvider>
			<html lang="sv" className={`${display.variable} ${body.variable} ${mono.variable}`}>
				<body className="bg-paper text-ink font-body">
					<StoryblokServerComponent blok={config}>{children}</StoryblokServerComponent>
				</body>
			</html>
		</StoryblokProvider>
	);
}
