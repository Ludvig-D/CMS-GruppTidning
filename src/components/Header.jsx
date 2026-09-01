import NavLink, { linkHref } from '@/components/blocks/NavLink';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

export default async function Header({ navLinks = [] }) {
	const storyblokApi = getStoryblokApi();

	const links = await Promise.all(
		navLinks.map(async (blok) => {
			const match = linkHref(blok.link).match(/^\/categories\/(.+)$/);
			if (!match) return { blok, articles: null };
			try {
				const { data } = await storyblokApi.get('cdn/stories', {
					version: SB_VERSION,
					content_type: 'article',
					filter_query: { category: { in: match[1] } },
				});
				return { blok, articles: data.stories };
			} catch {
				return { blok, articles: null };
			}
		})
	);

	return (
		<header className="border-b bg-white">
			<nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
				<a href="/" className="font-bold text-xl">Artikelsajt</a>
				<ul className="flex gap-2">
					{links.map(({ blok, articles }) => (
						<NavLink blok={blok} articles={articles} key={blok._uid} />
					))}
				</ul>
			</nav>
		</header>
	);
}
