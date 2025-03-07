import Link from 'next/link';

const Footer = () => {
	return (
		<div className="text-theme-text-subtle text-sm ">
			Built with ❤️ by{' '}
			<Link
				href="https://walnut.dev"
				className="underline"
				target="_blank"
			>
				Walnut
			</Link>
		</div>
	);
};

export default Footer;
