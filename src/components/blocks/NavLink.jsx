function linkHref(link) {
	if (!link) return '#';
	if (link.linktype === 'url' || link.linktype === 'asset') return link.url || '#';
	const slug = link.cached_url || link.url;
	return slug ? `/${slug.replace(/^\/+/, '')}` : '#';
}

export default function NavLink({ blok }) {
	return (
		<li className="relative group">
			<a href={linkHref(blok.link)} className="px-3 py-2 hover:text-blue-600">
				{blok.label}
			</a>
			{blok.sub_links?.length > 0 && (
				<ul className="absolute left-0 hidden group-hover:block group-focus-within:block bg-white shadow-md rounded-md py-2 min-w-40 z-10">
					{blok.sub_links.map((sub) => (
						<li key={sub._uid}>
							<a href={linkHref(sub.link)} className="block px-4 py-2 hover:bg-gray-100">
								{sub.label}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
}
