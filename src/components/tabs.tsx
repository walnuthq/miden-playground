'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { useNextStep } from 'nextstepjs';

export const Tabs = () => {
	const { selectedTab, selectTab } = useMiden();
	const { currentStep, setCurrentStep } = useNextStep();
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
					if (currentStep === 7) {
						setCurrentStep(8, 100);
					} else if (currentStep === 8) {
						setCurrentStep(9, 100);
					} else if (currentStep === 14) {
						setCurrentStep(15, 100);
					} else if (currentStep === 19) {
						setCurrentStep(20, 100);
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
					if (currentStep === 0) {
						setCurrentStep(1, 100);
					} else if (currentStep === 16) {
						setCurrentStep(17, 100);
					} else if (currentStep === 22) {
						setCurrentStep(23, 100);
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
