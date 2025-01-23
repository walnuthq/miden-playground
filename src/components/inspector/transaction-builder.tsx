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

export const TransactionBuilder: React.FC = () => {
	const {
		accounts,
		selectedTransactionAccountId,
		notes,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		removeTransactionNote,
		removeTransactionAccount
	} = useMiden();
	const selectedTransactionAccount = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;

	return (
		<div className="flex flex-col text-sm">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				Compose transaction
			</div>
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-dark-miden-700">
					<InlineIcon variant="file_2" color="white" className="w-4 h-4 cursor-pointer" />
					<span>Transaction file</span>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-white/10">
							<InlineIcon variant="plus-square" className="w-4 h-4 cursor-pointer" />
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
						onRemove={() => removeTransactionAccount()}
					/>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger>
						<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-white/10">
							<InlineIcon variant="plus-square" className="w-4 h-4 cursor-pointer" />
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
					/>
				))}
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
			className={`ml-10 flex text-sm flex-row p-1 items-center gap-2 text-white select-none cursor-pointer rounded-l-miden ${
				onClick ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'
			}`}
			onClick={onClick}
		>
			<InlineIcon variant={variant} className={`w-4 h-4 cursor-pointer`} color="white" />
			<span>{name}</span>
			{onRemove && (
				<div
					className=" ml-auto cursor-pointer hover:bg-white/10 p-1 rounded-miden"
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
