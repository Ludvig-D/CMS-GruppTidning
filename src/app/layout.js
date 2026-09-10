import './globals.css';
import StoryblokProvider from '@/components/StoryblokProvider';
import { StoryblokServerComponent } from '@storyblok/react/rsc';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

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
			<html lang="sv">
				<body>
					<StoryblokServerComponent blok={config}>{children}</StoryblokServerComponent>
				</body>
			</html>
		</StoryblokProvider>
	);
}
