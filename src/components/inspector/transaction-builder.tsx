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
		notes,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		removeTransactionNote,
		selectedTransactionAccountId,
		removeTransactionAccount,
		selectOverview,
		selectedOverview,
		isExecutingTransaction,
		executeTransaction
	} = useMiden();

	const handleValueChange = (value: string) => {
		if (value === 'None') {
			removeTransactionAccount();
		} else {
			selectTransactionAccount(value);
		}
	};
	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				Compose transaction
			</div>
			<div className="flex flex-col gap-2 text-sm">
				<div className="px-3 text-white font-bold mt-4">Account</div>
				<div className="flex justify-center px-2">
					<div className="border-2 mx-auto flex justify-between items-center w-full border-dark-miden-700 rounded-miden">
						<div
							onClick={() => {
								if (selectedTransactionAccountId) {
									selectOverview('account');
								}
							}}
							className={`text-white w-full py-2 border-r-2 border-dark-miden-700 pl-2 h-full flex items-center ${
								selectedTransactionAccountId && 'hover:bg-dark-miden-700 cursor-pointer'
							} `}
						>
							{selectedTransactionAccountId ? (
								<span className="flex items-center gap-3">
									<InlineIcon variant="account" color="white" />
									{accounts[selectedTransactionAccountId].name}
								</span>
							) : (
								'Select account'
							)}
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger>
								<div className=" gap-2  text-white py-3 px-3 hover:bg-dark-miden-700">
									<InlineIcon variant="arrow" className="rotate-90 w-4 h-4" />
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								{Object.values(accounts).map((account) => (
									<DropdownMenuItem
										key={account.id}
										onClick={() => handleValueChange(account.idHex)}
									>
										{account.name}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="px-3 mt-4 text-white font-bold">Notes to consume</div>
				{selectedTransactionNotesIds.map((noteId) => (
					<ListItem
						key={noteId}
						name={notes[noteId].name}
						variant="file_3"
						onClick={() => selectOverview(noteId)}
						onRemove={() => removeTransactionNote(noteId)}
					/>
				))}
				<div className="px-2">
					<DropdownMenu>
						<DropdownMenuTrigger
							className={`border-2 mx-auto w-full border-dark-miden-700 rounded-miden ${
								Object.values(notes).some((note) => !selectedTransactionNotesIds.includes(note.id))
									? ''
									: 'opacity-50 pointer-events-none'
							}`}
							disabled={
								!Object.values(notes).some((note) => !selectedTransactionNotesIds.includes(note.id))
							}
						>
							<div className="flex justify-center items-center gap-2 text-white py-2 px-3 hover:bg-dark-miden-700">
								<span>Add notes</span>
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{Object.values(notes)
								.filter((note) => !selectedTransactionNotesIds.includes(note.id))
								.map((note) => (
									<DropdownMenuItem key={note.id} onClick={() => selectTransactionNote(note.id)}>
										{note.name}
									</DropdownMenuItem>
								))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div
					onClick={() => {
						selectOverview('transaction-script');
					}}
					className={`flex flex-row items-center mt-4 gap-2 text-white py-2 px-3 cursor-pointer ${
						selectedOverview === 'transaction-script'
							? 'bg-dark-miden-700 '
							: 'hover:bg-dark-miden-800'
					}`}
				>
					<InlineIcon variant="file_2" color="white" className="w-4 h-4 cursor-pointer" />
					<span>Transaction script</span>
				</div>
			</div>
			<div className="flex justify-center px-2 mt-4">
				<div className="border-2 mx-auto w-full border-dark-miden-700 rounded-miden">
					<div
						onClick={() => {
							if (!isExecutingTransaction) {
								executeTransaction();
							}
						}}
						className={`text-white text-sm w-full justify-center py-2 pl-2 h-full flex items-center hover:bg-dark-miden-700 cursor-pointer `}
					>
						<span className="flex items-center gap-3">Execute Transaction</span>
					</div>
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
	variant: 'account' | 'file_3';
	onRemove?: () => void;
	onClick?: () => void;
}) {
	return (
		<div
			className={`flex text-sm flex-row px-3 py-1 items-center gap-2 text-white select-none cursor-pointer  ${
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
