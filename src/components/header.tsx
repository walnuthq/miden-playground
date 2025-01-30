export function Header() {
	return (
		<div className="h-full text-theme-text flex justify-between items-center px-12">
			<div className="font-bold text-2xl">
				Miden <span className="text-lg p-1.5 bg-white/10 rounded-theme">Playground</span>
			</div>
			<div className="font-bold text-neutral-400 text-xl cursor-pointer px-2 rounded-theme hover:bg-white/10">
				Documentation
			</div>
		</div>
	);
}
