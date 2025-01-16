'use client';

import { useMiden } from '@/lib/context-providers';
import { TransactionBuilder } from './transaction-builder';
import { AssetExplorer } from './asset-explorer';
import InlineIcon from '@/components/ui/inline-icon';
import { EditorFile } from '@/lib/files';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function Inspector() {
	const { selectedTab } = useMiden();
	if (selectedTab === 'transaction') {
		return <TransactionBuilder />;
	}
	if (selectedTab === 'assets') {
		return <AssetExplorer />;
	}
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
			name={editorFile.name}
			variant={editorFile.variant}
			level={level}
			isReadOnly={editorFile.readonly}
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
	nameClasses
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
}) {
	return (
		<div
			className={`text-xs h-6 pr-3 flex flex-row items-center justify-between text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-700 ' : 'hover:bg-dark-miden-800'}`}
			onClick={onClick}
			style={{ paddingLeft: `${level * 10 + 8}px` }}
		>
			<div className="flex flex-row items-center gap-2">
				{isReadOnly !== undefined && (
					<div className="py-1.5">
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
				<span className={nameClasses}>{name}</span>
			</div>
			<div className="flex flex-row items-center gap-2">
				{onRemove && (
					<div
						className="cursor-pointer hover:bg-white/10 p-0.5 rounded-miden"
						onClick={(event) => {
							event.stopPropagation();
							onRemove();
						}}
					>
						<InlineIcon variant={'trash'} color="white" className="w-4 h-4 opacity-80" />
					</div>
				)}
				{onCreate && onCreateOptions && (
					<DropdownMenu>
						<DropdownMenuTrigger>
							<div className="cursor-pointer hover:bg-white/10 rounded-miden p-0.5">
								<InlineIcon variant="file-plus" color="white" className="w-4 h-4 opacity-80" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{onCreateOptions?.map((option) => (
								<DropdownMenuItem
									onClick={(e) => {
										onCreate(option);
										e.stopPropagation();
									}}
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
