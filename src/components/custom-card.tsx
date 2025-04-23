'use client';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from './ui/button';

export const CustomCard = ({
	step,
	currentStep,
	totalSteps,
	nextStep,
	prevStep,
	skipTour,
	arrow
}: CardComponentProps) => {
	return (
		<div className="bg-theme-surface text-theme-text rounded-miden shadow-lg p-6 min-w-96">
			<div className="flex items-center gap-3 mb-4">
				{step.icon && <div className="text-2xl">{step.icon}</div>}
				<h3 className="text-xl font-bold">{step.title}</h3>
			</div>

			<div className="mb-6">{step.content}</div>

			<div>{arrow}</div>

			<div className="flex justify-between items-center">
				<div className="text-sm text-theme-text-subtle">
					Step {currentStep + 1} of {totalSteps}
				</div>

				<div className="flex gap-2">
					<Button
						onClick={skipTour}
						className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border transition-all"
					>
						Skip
					</Button>
					{currentStep > 0 && (
						<Button
							className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border transition-all"
							onClick={prevStep}
						>
							Previous
						</Button>
					)}

					<Button
						onClick={nextStep}
						className="w-full outline-none border border-theme-border rounded-miden px-4 py-1 transition-all text-theme-text bg-theme-primary hover:bg-theme-primary-hover"
					>
						{currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
					</Button>
				</div>
			</div>
		</div>
	);
};
