import InlineIcon from './ui/inline-icon';
import Image from 'next/image';
import logo from '../app/images/miden_logo.png';

export function Header() {
	return (
		<div className="h-full text-theme-text flex justify-between items-center">
			<div className="font-bold text-xl flex items-center gap-1">
				<Image src={logo} alt="logo" className="w-10 h-10" />
				Miden{' '}
				<div className="text-xs font-normal text-theme-primary">
					<span className="bg-theme-border/40 py-1 px-1.5 ml-2 rounded-full">PLAYGROUND</span>
				</div>
			</div>
			<a
				href="https://0xpolygonmiden.github.io/miden-docs/miden-base/index.html"
				target="_blank"
				className="font-bold text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border"
			>
				Documentation
				<InlineIcon variant="arrow-up-right" className="w-5 h-5" color="gray" />
			</a>
		</div>
	);
}
