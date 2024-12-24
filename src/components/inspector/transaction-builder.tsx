'use client';

import React from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';

export const TransactionBuilder: React.FC = () => {
	const {
		accounts,
		selectedTransactionAccountId,
		notes,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		selectFile
	} = useMiden();
	const selectedTransactionAccount = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;

	return (
		<div className="flex flex-col">
			<DropdownMenu>
				<DropdownMenuTrigger>
					<div className="flex flex-row items-center gap-2 text-white h-[54px] px-3">
						<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
						<span>Account</span>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{Object.values(accounts).map((account) => (
						<DropdownMenuItem key={account.id} onClick={() => selectTransactionAccount(account.id)}>
							{account.name}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			{selectedTransactionAccount && <ListItem name={selectedTransactionAccount.name} level={1} />}
			<DropdownMenu>
				<DropdownMenuTrigger>
					<div className="flex flex-row items-center gap-2 text-white h-[54px] px-3">
						<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
						<span>Note</span>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{Object.values(notes).map((note) => (
						<DropdownMenuItem key={note.id} onClick={() => selectTransactionNote(note.id)}>
							{note.name}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			{selectedTransactionNotesIds.map((noteId) => (
				<ListItem key={noteId} name={notes[noteId].name} level={1} />
			))}
			<div
				className="flex flex-row items-center gap-2 text-white h-[54px] px-3 cursor-pointer"
				onClick={() => {
					selectFile(TRANSACTION_SCRIPT_FILE_ID);
				}}
			>
				<InlineIcon variant="plus-square" className="w-6 h-6" />
				<span>Transaction script</span>
			</div>
		</div>
	);
};

function ListItem({
	name,
	isSelected,
	isCollapsed,
	level,
	switchCollapsed,
	onClick
}: {
	name: string;
	isSelected?: boolean;
	isCollapsed?: boolean;
	level?: number;
	switchCollapsed?: () => void;
	onClick?: () => void;
}) {
	return (
		<div
			className={`border-b-2 border-dark-miden-700 h-[54px] flex flex-row items-center gap-2 text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-800' : ''}
    `}
			style={{ paddingLeft: `${(level ?? 0) * 20 + 24 + (switchCollapsed ? 0 : 20)}px` }}
			onClick={onClick}
		>
			{switchCollapsed && (
				<InlineIcon
					variant="arrow"
					className={`w-3 h-3 cursor-pointer ${!isCollapsed ? 'rotate-90' : ''}`}
					onClick={switchCollapsed}
				/>
			)}
			<span>{name}</span>
		</div>
	);
}
