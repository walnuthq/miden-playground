import Link from 'next/link';

const Footer = () => {
	return (
		<div className="text-theme-text-subtle text-sm ">
			Built with ❤️ by{' '}
			<Link
				href="https://github.com/walnuthq/miden-playground"
				className="underline"
				target="_blank"
			>
				Walnut
			</Link>
		</div>
	);
};

export default Footer;
