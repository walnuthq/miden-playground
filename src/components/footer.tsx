import Link from 'next/link';

const Footer = () => {
	return (
		<div className="flex justify-end">
			<div className="text-theme-text-subtle text-xs mt-2">
				Built with ❤️ by{' '}
				<Link
					href="https://github.com/walnuthq/miden-playground"
					className="text-theme-primary hover:underline"
					target="_blank"
				>
					Walnut
				</Link>
			</div>
		</div>
	);
};

export default Footer;
