export function linkHref(link) {
	if (!link) return '#';
	if (link.linktype === 'url' || link.linktype === 'asset') return link.url || '#';
	const slug = link.cached_url || link.url;
	return slug ? `/${slug.replace(/^\/+/, '')}` : '#';
}

export default function NavLink({ blok, articles }) {
	const subItems = articles
		? articles.map((story) => ({ _uid: story.uuid, label: story.content.title, href: `/articles/${story.slug}` }))
		: (blok.sub_links || []).map((sub) => ({ _uid: sub._uid, label: sub.label, href: linkHref(sub.link) }));

	return (
		<li className="relative group">
			<a href={linkHref(blok.link)} className="px-3 py-2 hover:text-blue-600">
				{blok.label}
			</a>
			{subItems.length > 0 && (
				<ul
					className="absolute left-0 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto transition-opacity delay-700 duration-150 bg-white shadow-md rounded-md py-2 min-w-48 z-10"
				>
					{subItems.map((item) => (
						<li key={item._uid}>
							<a href={item.href} className="block px-4 py-2 hover:bg-gray-100">
								{item.label}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
}
