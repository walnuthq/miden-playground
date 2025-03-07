import Link from 'next/link';

const Footer = () => {
	return (
		<div className="">
			<div className="text-theme-text-subtle text-sm mt-2">
				Built with ❤️ by{' '}
				<Link
					href="https://github.com/walnuthq/miden-playground"
					className="underline"
					target="_blank"
				>
					Walnut
				</Link>
			</div>
		</div>
	);
};

export default Footer;
