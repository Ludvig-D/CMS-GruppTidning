export default function Footer({ text = '' }) {
	return (
		<footer className="bg-ink text-paper mt-16">
			<div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between font-mono text-xs uppercase tracking-widest">
				<span>Artikelsajt</span>
				<span className="text-paper/60">{text}</span>
			</div>
		</footer>
	);
}
