import NavLink from '@/components/blocks/NavLink';

export default function Header({ navLinks = [] }) {
	return (
		<header className="border-b bg-white">
			<nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
				<a href="/" className="font-bold text-xl">Artikelsajt</a>
				<ul className="flex gap-2">
					{navLinks.map((blok) => (
						<NavLink blok={blok} key={blok._uid} />
					))}
				</ul>
			</nav>
		</header>
	);
}
