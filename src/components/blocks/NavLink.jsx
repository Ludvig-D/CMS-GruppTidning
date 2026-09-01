export function linkHref(link) {
	if (!link) return '#';
	if (link.linktype === 'url' || link.linktype === 'asset') return link.url || '#';
	const slug = link.cached_url || link.url;
	return slug ? `/${slug.replace(/^\/+/, '')}` : '#';
}

const dateline = (iso) =>
	iso ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso)) : null;

export default function NavLink({ blok, articles }) {
	const subItems = articles
		? articles.map((story) => ({
				_uid: story.uuid,
				label: story.content.title,
				href: `/articles/${story.slug}`,
				meta: dateline(story.first_published_at),
			}))
		: (blok.sub_links || []).map((sub) => ({ _uid: sub._uid, label: sub.label, href: linkHref(sub.link) }));

	return (
		<li className="relative group">
			<a href={linkHref(blok.link)} className="block px-3 py-2 hover:text-signal transition-colors">
				{blok.label}
			</a>
			{subItems.length > 0 && (
				<ul
					className="absolute left-0 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-opacity delay-700 duration-150 bg-paper-raised shadow-lg rounded-sm border border-rule py-2 min-w-64 z-10"
				>
					{subItems.map((item) => (
						<li key={item._uid}>
							<a
								href={item.href}
								className="flex items-baseline justify-between gap-4 px-4 py-2 font-body text-sm normal-case tracking-normal text-ink hover:bg-paper hover:text-signal"
							>
								<span>{item.label}</span>
								{item.meta && <span className="font-mono text-[0.65rem] text-ink-soft shrink-0">{item.meta}</span>}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
}
