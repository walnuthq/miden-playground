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
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				Compose transaction
			</div>
			<div className="flex flex-col">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3">
							<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
							<span>Account</span>
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{Object.values(accounts).map((account) => (
							<DropdownMenuItem
								key={account.id}
								onClick={() => selectTransactionAccount(account.id)}
							>
								{account.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
				{selectedTransactionAccount && (
					<ListItem name={selectedTransactionAccount.name} isAccount={true} />
				)}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3">
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
					<ListItem key={noteId} name={notes[noteId].name} />
				))}
				<div
					className="flex flex-row items-center gap-2 text-white py-2 px-3 cursor-pointer"
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

function ListItem({ name, isAccount }: { name: string; isAccount?: boolean }) {
	return (
		<div
			className={`ml-10 flex flex-row py-2 items-center gap-2 text-white select-none cursor-pointer
    `}
		>
			<InlineIcon
				variant={isAccount ? 'account' : 'file'}
				className={`w-5 h-5 cursor-pointer`}
				color="white"
			/>
			<span>{name}</span>
		</div>
	);
}
