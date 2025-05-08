'use client';

import { AssetExplorer } from './asset-explorer';
import InlineIcon from '@/components/ui/inline-icon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EditorFile } from '@/lib/files';
import { useEffect, useState } from 'react';
import { useNextStep } from 'nextstepjs';
import { Note } from '@/lib/notes';

export function Inspector() {
	return <AssetExplorer />;
}

export function FileItem({
	editorFile,
	isSelected,
	onClick,
	onRemove,
	level
}: {
	editorFile: EditorFile;
	isSelected?: boolean;
	onClick?: () => void;
	onRemove?: () => void;
	level: number;
}) {
	return (
		<InspectorItem
			name={editorFile?.name}
			variant={editorFile?.variant}
			level={level}
			isReadOnly={editorFile?.readonly}
			isSelected={isSelected}
			onClick={onClick}
			onRemove={onRemove}
		/>
	);
}

export function InspectorItem({
	name,
	isReadOnly,
	variant,
	isCollapsed,
	isSelected,
	onClick,
	onRemove,
	level,
	onCreate,
	onCreateOptions,
	nameClasses,
	isConsumed = false,
	latestConsumedNotes,
	isInspectorDropdownOpen = false,
	setIsInspectorDropdownOpen
}: {
	name: string;
	isReadOnly?: boolean;
	variant: 'script' | 'note' | 'file' | 'collapsable';
	isCollapsed?: boolean;
	isSelected?: boolean;
	onClick?: () => void;
	onRemove?: () => void;
	level: number;
	onCreate?: (option: string) => void;
	onCreateOptions?: string[];
	nameClasses?: string;
	isConsumed?: boolean;
	latestConsumedNotes?: Record<string, Note>;
	isInspectorDropdownOpen?: boolean;
	setIsInspectorDropdownOpen?: (isInspectorDropdownOpen: boolean) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const {
		// startNextStep
		// closeNextStep,
		currentTour,
		currentStep
		// setCurrentStep,
		// isNextStepVisible
	} = useNextStep();

	useEffect(() => {
		if (
			(onCreateOptions &&
				onCreateOptions[0] === 'Create new account' &&
				currentTour === 'mainTour' &&
				currentStep === 0) ||
			(currentStep === 10 && name === 'Notes')
		) {
			if (setIsInspectorDropdownOpen) {
				setIsInspectorDropdownOpen(true);
			} else {
				setIsOpen(true);
			}
		}
	}, [currentStep]);

	return (
		<div
			className={`text-sm h-6 pr-3 flex ${
				latestConsumedNotes &&
				Object.values(latestConsumedNotes)[Object.values(latestConsumedNotes).length - 1]?.name ===
					name
					? 'step18'
					: ''
			} flex-row items-center justify-between text-theme-text select-none cursor-pointer
    ${isSelected ? 'bg-theme-border ' : 'hover:bg-theme-surface-highlight'}`}
			onClick={onClick}
			style={{ paddingLeft: `${level * 10 + 8}px` }}
		>
			<div className="flex flex-row items-center gap-2">
				{isReadOnly !== undefined && (
					<div className="py-1">
						<InlineIcon variant={isReadOnly ? 'lock' : 'unlock'} className={`w-4 h-4`} />
					</div>
				)}
				<InlineIcon
					variant={
						variant === 'script'
							? 'file_2'
							: variant === 'file'
							? 'file'
							: variant === 'note'
							? 'file_3'
							: 'arrow'
					}
					color="white"
					className={`opacity-80 ${variant === 'collapsable' ? 'w-3 h-3 m-0.5' : 'w-4 h-4'} ${
						isCollapsed === false ? 'rotate-90' : ''
					}`}
				/>
				<span className={nameClasses}>
					{name} {isConsumed && <span className="text-theme-danger"> (Consumed)</span>}
				</span>
			</div>
			<div className="flex flex-row items-center gap-2">
				{onRemove && (
					<div
						className="cursor-pointer hover:bg-theme-border p-1 rounded-theme"
						onClick={(event) => {
							event.stopPropagation();
							onRemove();
						}}
					>
						<InlineIcon variant={'trash'} color="white" className="w-4 h-4 opacity-80" />
					</div>
				)}
				{onCreate && onCreateOptions && (
					<DropdownMenu
						open={isInspectorDropdownOpen ? isInspectorDropdownOpen : isOpen}
						onOpenChange={setIsInspectorDropdownOpen ? setIsInspectorDropdownOpen : setIsOpen}
					>
						<DropdownMenuTrigger>
							<div className="cursor-pointer hover:bg-theme-border rounded-theme p-1">
								<InlineIcon variant="file-plus" color="white" className="w-4 h-4 opacity-80" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							onInteractOutside={(event) => {
								if (currentTour) {
									if (
										currentStep === 1 ||
										currentStep === 6 ||
										currentStep === 3 ||
										currentStep === 7
									) {
										event.preventDefault();
									}
								}
							}}
						>
							{onCreateOptions?.map((option) => (
								<DropdownMenuItem
									onClick={(e) => {
										onCreate(option);

										e.stopPropagation();
									}}
									className={`${
										option === 'Create new account'
											? 'step2'
											: name === 'Notes' && option === 'Create P2ID note'
											? 'step7'
											: ''
									}`}
									key={option}
								>
									{option}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
