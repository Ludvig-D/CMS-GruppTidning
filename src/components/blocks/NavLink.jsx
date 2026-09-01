export function linkHref(link) {
	if (!link) return '#';
	if (link.linktype === 'url' || link.linktype === 'asset') return link.url || '#';
	const slug = link.cached_url || link.url;
	return slug ? `/${slug.replace(/^\/+/, '')}` : '#';
}

const dateline = (iso) =>
	iso ? new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso)) : null;

function fromSubLink(sub) {
	return {
		_uid: sub._uid,
		label: sub.label,
		href: linkHref(sub.link),
		children: (sub.sub_links || []).map(fromSubLink),
	};
}

function fromArticle(story) {
	return {
		_uid: story.uuid,
		label: story.content.title,
		href: `/articles/${story.slug}`,
		meta: dateline(story.first_published_at),
		children: [],
	};
}

function NavItem({ item }) {
	const hasChildren = item.children.length > 0;
	return (
		<li className="relative group/item">
			<a
				href={item.href}
				className="flex items-center justify-between gap-3 px-4 py-2 font-body text-sm normal-case tracking-normal text-ink hover:bg-paper hover:text-signal"
			>
				<span>{item.label}</span>
				<span className="flex items-center gap-2 shrink-0">
					{item.meta && <span className="font-mono text-[0.65rem] text-ink-soft">{item.meta}</span>}
					{hasChildren && <span className="text-ink-soft text-xs">›</span>}
				</span>
			</a>
			{hasChildren && (
				<ul className="absolute left-full top-0 opacity-0 invisible pointer-events-none group-hover/item:opacity-100 group-hover/item:visible group-hover/item:pointer-events-auto transition-opacity delay-300 duration-150 bg-paper-raised shadow-lg rounded-sm border border-rule py-2 min-w-64 z-10">
					{item.children.map((child) => (
						<NavItem item={child} key={child._uid} />
					))}
				</ul>
			)}
		</li>
	);
}

export default function NavLink({ blok, articles }) {
	const children = articles ? articles.map(fromArticle) : (blok.sub_links || []).map(fromSubLink);
	const hasChildren = children.length > 0;

	return (
		<li className="relative group">
			<a href={linkHref(blok.link)} className="block px-3 py-2 hover:text-signal transition-colors">
				{blok.label}
			</a>
			{hasChildren && (
				<ul className="absolute left-0 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-opacity delay-700 duration-150 bg-paper-raised shadow-lg rounded-sm border border-rule py-2 min-w-64 z-10">
					{children.map((child) => (
						<NavItem item={child} key={child._uid} />
					))}
				</ul>
			)}
		</li>
	);
}
