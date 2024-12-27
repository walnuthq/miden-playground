'use client';

import { useMiden } from '@/lib/context-providers';
import { TransactionBuilder } from './transaction-builder';
import { Accounts } from './accounts';
import { Notes } from './notes';
import InlineIcon from '@/components/ui/inline-icon';
import { EditorFile } from '@/lib/files';

export function Inspector() {
	const { selectedTab } = useMiden();
	if (selectedTab === 'transaction') {
		return <TransactionBuilder />;
	}
	if (selectedTab === 'accounts') {
		return <Accounts />;
	}
	if (selectedTab === 'notes') {
		return <Notes />;
	}
}

export function FileItem({
	editorFile,
	isSelected,
	onClick,
	isNote = false
}: {
	editorFile: EditorFile;
	isSelected?: boolean;
	onClick?: () => void;
	isNote?: boolean;
}) {
	return (
		<div
			className={`border-b-2 border-dark-miden-700 h-[54px] px-2 flex flex-row items-center gap-2 text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-800' : 'hover:bg-white/5'}
    `}
			onClick={onClick}
		>
			{!isNote && (
				<InlineIcon variant={editorFile.readonly ? 'lock' : 'unlock'} className={`w-4 h-4`} />
			)}
			<InlineIcon
				variant={isNote ? 'file_3' : editorFile.variant === 'script' ? 'file_2' : 'file'}
				color="white"
				className={`w-4 h-4`}
			/>
			<span>{editorFile.name}</span>
			<div className=" ml-auto cursor-pointer hover:bg-white/10 p-1.5 rounded-miden">
				<InlineIcon
					variant={isNote ? 'arrow' : 'trash'}
					color="white"
					className={`w-4 h-4 ${isNote && 'rotate-90'}`}
				/>
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
