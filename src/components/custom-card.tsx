'use client';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from './ui/button';
import { useNextStep } from 'nextstepjs';
import { useMiden } from '@/lib/context-providers';

export const CustomCard = ({
	step,
	currentStep,
	totalSteps,
	skipTour,
	arrow
}: CardComponentProps) => {
	const { closeNextStep, setCurrentStep } = useNextStep();
	const {
		notes,
		selectFile,
		accounts,
		setIsInspectorDropdownOpen,
		setIsTutorialMode,
		closeFile,
		files,
		selectedFileId,
		selectedTransactionNotesIds,
		selectedTransactionAccountId,
		removeTransactionAccount,
		removeTransactionNote,
		clearConsole
	} = useMiden();
	const progress = ((currentStep + 1) / totalSteps) * 100;

	const delayedNextStep = async () => {
		const nextIndex = currentStep + 1;
		if (currentStep === totalSteps - 1) {
			closeNextStep();
			localStorage.setItem('isNewUser', JSON.stringify(false));
			selectedTransactionNotesIds.map((noteId) => {
				removeTransactionNote(noteId);
			});
			if (selectedTransactionAccountId) {
				removeTransactionAccount();
			}

			Object.values(files).map((file) => {
				closeFile(file.id);
			});
			clearConsole();
			if (selectedFileId) closeFile(selectedFileId);
			setIsTutorialMode(false);
		} else {
			if (nextIndex === 14) {
				selectFile(Object.values(accounts)[Object.values(accounts).length - 1].metadataFileId);
			}
			if (nextIndex === 13 || nextIndex === 15) {
				selectFile(Object.values(notes)[Object.values(notes).length - 1].metadataFileId);
			}
			if (nextIndex === 7) {
				setIsInspectorDropdownOpen(true);
			}
			setCurrentStep(nextIndex, 100);
		}
	};
	return (
		<div className="bg-theme-surface text-theme-text rounded-b-miden shadow-lg p-6  overflow-hidden">
			<div className="absolute bottom-0 left-0 h-1 bg-theme-border w-full">
				<div
					className="h-full bg-theme-primary transition-all duration-300 ease-in-out"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<div className="flex items-center gap-3 mb-4 mt-1">
				{step?.icon && <div className="text-2xl">{step?.icon}</div>}
				<h3 className="text-xl font-bold whitespace-nowrap">{step?.title}</h3>
			</div>

			<div className="mb-6">{step?.content}</div>

			<div>{arrow}</div>

			<div className="flex justify-between gap-4 items-center">
				<div className="text-sm text-theme-text-subtle whitespace-nowrap">
					Step {currentStep + 1} of {totalSteps}
				</div>

				<div className="flex gap-2">
					<Button
						onClick={() => {
							Object.values(files).map((file) => {
								closeFile(file.id);
							});
							selectedTransactionNotesIds.map((noteId) => {
								removeTransactionNote(noteId);
							});
							if (selectedTransactionAccountId) {
								removeTransactionAccount();
							}
							clearConsole();
							if (selectedFileId) closeFile(selectedFileId);
							setIsTutorialMode(false);

							if (skipTour) {
								skipTour();
								localStorage.setItem('isNewUser', JSON.stringify(false));
							}
						}}
						className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight text-theme-text hover:bg-theme-border transition-all"
					>
						Skip
					</Button>
					{step?.showControls && (
						<Button
							onClick={delayedNextStep}
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
