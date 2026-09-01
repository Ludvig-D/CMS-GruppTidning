export default function Footer({ text = '' }) {
	return (
		<footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
			{text}
		</footer>
	);
}
