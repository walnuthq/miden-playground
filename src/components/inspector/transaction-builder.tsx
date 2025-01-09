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
		selectFile,
		removeTransactionNote,
		removeTransactionAccount,
		selectNote,
		selectAccount,
		selectTab,
		selectedFileId
	} = useMiden();
	const selectedTransactionAccount = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				Compose transaction
			</div>
			<div className="flex flex-col">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-white/5">
							<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
							<span>Account</span>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{Object.values(accounts).map((account) => (
							<DropdownMenuItem
								key={account.id}
								onClick={() => selectTransactionAccount(account.idHex)}
							>
								{account.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				{selectedTransactionAccount && (
					<ListItem
						name={selectedTransactionAccount.name}
						variant="account"
						onClick={() => {
							selectAccount(selectedTransactionAccount.idHex);
							selectTab('accounts');
						}}
						onRemove={() => removeTransactionAccount()}
					/>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-white/5">
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
					<ListItem
						key={noteId}
						name={notes[noteId].name}
						variant="file"
						onRemove={() => removeTransactionNote(noteId)}
						onClick={() => {
							selectNote(noteId);
							selectTab('notes');
						}}
					/>
				))}
				<div
					className={`flex flex-row items-center ${
						selectedFileId === TRANSACTION_SCRIPT_FILE_ID ? 'bg-white/5' : 'hover:bg-white/5'
					} gap-2 text-white py-2 px-3 cursor-pointer`}
					onClick={() => {
						selectFile(TRANSACTION_SCRIPT_FILE_ID);
					}}
				>
					<InlineIcon variant="file_2" color="white" className="w-5 h-5" />
					<span>Transaction script</span>
				</div>
			</div>
		</div>
	);
};

function ListItem({
	name,
	variant,
	onRemove,
	onClick
}: {
	name: string;
	variant: 'account' | 'file';
	onRemove?: () => void;
	onClick?: () => void;
}) {
	return (
		<div
			className={`ml-10 flex flex-row p-2 px-2 items-center gap-2 text-white select-none cursor-pointer rounded-l-miden ${
				onClick ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'
			}`}
			onClick={onClick}
		>
			<InlineIcon variant={variant} className={`w-5 h-5 cursor-pointer`} color="white" />
			<span>{name}</span>
			{onRemove && (
				<div
					className=" ml-auto cursor-pointer hover:bg-white/10 p-1.5 rounded-miden"
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
				>
					<InlineIcon variant={'trash'} color="white" className={`w-4 h-4 `} />
				</div>
			)}
		</div>
	);
}
