'use client';
import InlineIcon from './ui/inline-icon';
import Image from 'next/image';
import logo from '../app/images/miden_logo.svg';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';
import { useMiden } from '@/lib/context-providers';

export function Header() {
	const { startNextStep } = useNextStep();

	const { selectTab, setIsTutorialMode, files, closeFile, selectedFileId, clearConsole } =
		useMiden();

	return (
		<div className="h-full text-theme-text flex justify-between items-center">
			<div className="font-bold text-xl flex items-center gap-1">
				<Image src={logo} alt="logo" className="w-6 h-6" />
				Miden{' '}
				<div className="text-xs font-normal text-theme-primary">
					<span className="bg-theme-border/40 py-1 px-1.5 ml-2 rounded-full">PLAYGROUND</span>
				</div>
			</div>
			<div className="flex items-center">
				<div
					onClick={() => {
						Object.values(files).map((file) => {
							closeFile(file.id);
						});
						if (selectedFileId) closeFile(selectedFileId);
						selectTab('transaction');
						startNextStep('mainTour');
						clearConsole();
						setIsTutorialMode(true);
					}}
					className="text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border transition-all"
				>
					Start tutorial
				</div>
				<Link
					href="/instructions"
					className="text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-3 py-1 rounded-theme hover:bg-theme-border transition-all"
				>
					MASM Instructions
				</Link>
				<a
					href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/index.html"
					target="_blank"
					className="text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-3 py-1 rounded-theme hover:bg-theme-border transition-all"
				>
					Documentation
					<InlineIcon variant="arrow-up-right" className="w-5 h-5" color="gray" />
				</a>
			</div>
		</div>
	);
}
