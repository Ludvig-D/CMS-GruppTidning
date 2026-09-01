import NavLink, { linkHref } from '@/components/blocks/NavLink';
import { getStoryblokApi, SB_VERSION } from '@/lib/storyblok';

async function getTickerHeadlines(storyblokApi) {
	try {
		const { data } = await storyblokApi.get('cdn/stories', {
			version: SB_VERSION,
			content_type: 'article',
			sort_by: 'first_published_at:desc',
			per_page: 8,
		});
		return data.stories.map((story) => story.content.title);
	} catch {
		return [];
	}
}

export default async function Header({ navLinks = [] }) {
	const storyblokApi = getStoryblokApi();

	const [links, headlines] = await Promise.all([
		Promise.all(
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
		),
		getTickerHeadlines(storyblokApi),
	]);

	return (
		<header className="bg-paper">
			{headlines.length > 0 && (
				<div className="bg-ink text-paper overflow-hidden whitespace-nowrap py-1.5">
					<div className="ticker-track inline-flex w-max font-mono text-xs tracking-wide uppercase">
						{[...headlines, ...headlines].map((title, i) => (
							<span key={i} className="px-6 flex items-center gap-6">
								<span className="text-signal">●</span>
								{title}
							</span>
						))}
					</div>
				</div>
			)}
			<nav className="max-w-4xl mx-auto flex items-center justify-between px-6 py-5">
				<a href="/" className="font-display font-bold text-2xl tracking-tight text-ink">
					ARTIKELSAJT
				</a>
				<ul className="flex gap-1 font-mono text-xs uppercase tracking-widest text-ink-soft">
					{links.map(({ blok, articles }) => (
						<NavLink blok={blok} articles={articles} key={blok._uid} />
					))}
				</ul>
			</nav>
		</header>
	);
}
