export default function NavLink({ blok }) {
	return (
		<li className="relative group">
			<a href={blok.link?.url || '#'} className="px-3 py-2 hover:text-blue-600">
				{blok.label}
			</a>
			{blok.sub_links?.length > 0 && (
				<ul className="absolute left-0 hidden group-hover:block bg-white shadow-md rounded-md py-2 min-w-40 z-10">
					{blok.sub_links.map((sub) => (
						<li key={sub._uid}>
							<a href={sub.link?.url || '#'} className="block px-4 py-2 hover:bg-gray-100">
								{sub.label}
							</a>
						</li>
					))}
				</ul>
			)}
		</li>
	);
}
