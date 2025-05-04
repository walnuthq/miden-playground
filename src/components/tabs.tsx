'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { useNextStep } from 'nextstepjs';

export const Tabs = () => {
	const { selectedTab, selectTab } = useMiden();
	const { currentStep, setCurrentStep, currentTour } = useNextStep();
	return (
		<div className="flex  flex-row ">
			<div
				id="step5"
				className={`p-3 w-[210px]  font-semibold border-x border-t border-theme-border rounded-tl-miden text-sm flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'transaction'
						? 'bg-theme-surface-highlight text-theme-text'
						: 'text-theme-text-subtle'
				}`}
				onClick={() => {
					if (currentTour) {
						if (currentStep === 8) {
							setCurrentStep(9, 100);
						} else if (currentStep === 15) {
							setCurrentStep(16, 100);
						} else if (currentStep === 20) {
							setCurrentStep(21, 100);
						}
					}

					selectTab('transaction');
				}}
			>
				<InlineIcon
					variant="transaction-builder"
					className={`w-5 h-5 ${
						selectedTab === 'transaction' ? 'text-theme-primary' : 'text-theme-primary/40'
					}`}
				/>
				Compose transaction
			</div>
			<div
				id="step1"
				className={`p-3 w-[210px] font-semibold border-r border-t rounded-tr-miden text-sm border-theme-border flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'assets'
						? 'bg-theme-surface-highlight text-theme-text'
						: 'text-theme-text-subtle'
				}`}
				onClick={() => {
					if (currentTour) {
						if (currentStep === 0) {
							setCurrentStep(1, 100);
						} else if (currentStep === 17) {
							setCurrentStep(18, 100);
						} else if (currentStep === 23) {
							setCurrentStep(24, 100);
						}
					}

					selectTab('assets');
				}}
			>
				<InlineIcon
					variant="file"
					className={`w-5 h-5 ${
						selectedTab === 'assets' ? 'text-theme-primary' : 'text-theme-primary/40'
					}`}
				/>
				Editor
			</div>
		</div>
	);
};
