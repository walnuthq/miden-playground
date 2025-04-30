'use client';
import InlineIcon from './ui/inline-icon';
import Image from 'next/image';
import logo from '../app/images/miden_logo.svg';
import Link from 'next/link';
import { useNextStep } from 'nextstepjs';
import { useEffect } from 'react';
import { useMiden } from '@/lib/context-providers';

export function Header() {
	const {
		startNextStep
		// closeNextStep,
		// currentTour,
		// currentStep,
		// setCurrentStep,
		// isNextStepVisible
	} = useNextStep();

	const { selectTab } = useMiden();

	useEffect(() => {
		startNextStep('mainTour');
	}, [startNextStep]);

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
						selectTab('transaction');
						startNextStep('mainTour');
					}}
					className="font-bold text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border transition-all"
				>
					Start tutorial
				</div>
				<Link
					href="/instructions"
					className="font-bold text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border transition-all"
				>
					Instructions
				</Link>
				<a
					href="https://0xpolygonmiden.github.io/miden-docs/miden-base/index.html"
					target="_blank"
					className="font-bold text-theme-text-subtle flex items-center gap-1 text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border transition-all"
				>
					Documentation
					<InlineIcon variant="arrow-up-right" className="w-5 h-5" color="gray" />
				</a>
			</div>
		</div>
	);
}
