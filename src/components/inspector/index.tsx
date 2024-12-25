'use client';

import { useMiden } from '@/lib/context-providers';
import { TransactionBuilder } from './transaction-builder';
import { Accounts } from './accounts';
import { Notes } from './notes';
import InlineIcon from '@/components/ui/inline-icon';
import { EditorFile } from '@/lib/types';

export function Inspector() {
	const { selectedTab, selectedAccountId, accounts } = useMiden();
	const tabName =
		selectedTab === 'transaction'
			? 'Compose transaction'
			: selectedTab === 'accounts'
			? accounts[selectedAccountId].name
			: selectedTab === 'notes'
			? 'Note'
			: selectedTab === 'transaction-arguments'
			? 'Transaction arguments'
			: '';

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				<div>
					{(selectedTab === 'accounts' || selectedTab === 'notes') && (
						<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
					)}
				</div>

				{tabName}
				<div>
					{selectedTab === 'accounts' && (
						<InlineIcon variant="pencil" color={'gray'} className="w-4 h-4 cursor-pointer" />
					)}
				</div>
			</div>
			{selectedTab === 'transaction' && <TransactionBuilder />}
			{selectedTab === 'accounts' && <Accounts />}
			{selectedTab === 'notes' && <Notes />}
		</div>
	);
}

export function FileItem({
	editorFile,
	isSelected,
	onClick
}: {
	editorFile: EditorFile;
	isSelected?: boolean;
	onClick?: () => void;
}) {
	return (
		<div
			className={`border-b-2 border-dark-miden-700 h-[54px] px-2 flex flex-row items-center gap-2 text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-800' : 'hover:bg-white/5'}
    `}
			onClick={onClick}
		>
			<InlineIcon variant={editorFile.readonly ? 'lock' : 'unlock'} className={`w-4 h-4`} />
			<InlineIcon
				variant={editorFile.variant === 'script' ? 'file_2' : 'file'}
				color="white"
				className={`w-4 h-4`}
			/>
			<span>{editorFile.name}</span>
			<div className=" ml-auto">
				<InlineIcon variant={'trash'} color="white" className={`w-4 h-4`} />
			</div>
		</div>
	);
}

export function ListItem({
	name,
	isSelected,
	onClick
}: {
	name: string;
	isSelected?: boolean;
	onClick?: () => void;
}) {
	return (
		<div
			className={`border-b-2 border-dark-miden-700 h-[54px] px-6 flex flex-row items-center gap-2 text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-800' : 'hover:bg-white/5'}
    `}
			onClick={onClick}
		>
			<InlineIcon variant={'file_3'} color="white" className={`w-4 h-4`} />
			<span>{name}</span>
		</div>
	);
}
