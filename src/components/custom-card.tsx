'use client';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from './ui/button';

export const CustomCard = ({
	step,
	currentStep,
	totalSteps,
	nextStep,
	// prevStep,
	skipTour,
	arrow
}: CardComponentProps) => {
	const progress = ((currentStep + 1) / totalSteps) * 100;

	return (
		<div className="bg-theme-surface text-theme-text rounded-b-miden shadow-lg p-6  overflow-hidden">
			<div className="absolute top-0 left-0 h-1 bg-theme-border w-full">
				<div
					className="h-full bg-theme-primary transition-all duration-300 ease-in-out"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="flex items-center gap-3 mb-4 mt-1">
				{step?.icon && <div className="text-2xl">{step?.icon}</div>}
				<h3 className="text-xl font-bold whitespace-nowrap">{step.title}</h3>
			</div>

			<div className="mb-6">{step.content}</div>

			<div>{arrow}</div>

			<div className="flex justify-between gap-4 items-center">
				<div className="text-sm text-theme-text-subtle whitespace-nowrap">
					Step {currentStep + 1} of {totalSteps}
				</div>

				<div className="flex gap-2">
					<Button
						onClick={skipTour}
						className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight text-theme-text hover:bg-theme-border transition-all"
					>
						Skip
					</Button>
					{/* {step.showControls && currentStep > 0 && (
						<Button
							className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight text-theme-text hover:bg-theme-border transition-all"
							onClick={prevStep}
						>
							Previous
						</Button>
					)} */}
					{step.showControls && (
						<Button
							onClick={nextStep}
							className="w-full outline-none border border-theme-border rounded-miden px-4 py-1 transition-all text-theme-text bg-theme-primary hover:bg-theme-primary-hover"
						>
							{currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
