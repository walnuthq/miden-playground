import InlineIcon from './ui/inline-icon';

export function Header() {
	return (
		<div className="h-full text-theme-text flex justify-between items-center">
			<div className="font-bold text-xl flex gap-2">
				Miden{' '}
				<div className="text-xs font-normal text-theme-primary">
					<span className="bg-theme-border/40 py-1 px-1.5 rounded-full">PLAYGROUND</span>
				</div>
			</div>
			<a
				href="https://0xpolygonmiden.github.io/miden-vm/"
				className="font-bold text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border"
			>
				Documentation
				<InlineIcon variant="arrow-up-right" className="w-5 h-5" color="gray" />
			</a>
		</div>
	);
}
