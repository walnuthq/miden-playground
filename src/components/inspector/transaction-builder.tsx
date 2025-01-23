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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '../ui/select';

export const TransactionBuilder: React.FC = () => {
	const {
		accounts,
		notes,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		removeTransactionNote,
		selectFile,
		selectedFileId,
		selectedTransactionAccountId,
		removeTransactionAccount
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
				<div className="px-3 text-white font-bold mt-2">Account</div>
				<div className="flex justify-center">
					<Select
						value={
							selectedTransactionAccountId
								? accounts[selectedTransactionAccountId].name
								: 'Select account'
						}
						onValueChange={handleValueChange}
					>
						<SelectTrigger className="flex justify-center border-2 border-dark-miden-700 rounded-miden w-56 bg-dark-miden-900 hover:bg-dark-miden-700 text-white">
							<SelectValue placeholder="Select account">
								{selectedTransactionAccountId
									? accounts[selectedTransactionAccountId].name
									: 'Select account'}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Select account</SelectLabel>
								{Object.values(accounts).map((account) => (
									<SelectItem key={account.id} value={account.idHex}>
										{account.name}
									</SelectItem>
								))}
								{selectedTransactionAccountId && <SelectItem value="None">None</SelectItem>}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				{/* <DropdownMenu>
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
				)} */}
				<div className="px-3 text-white font-bold">Notes</div>
				<DropdownMenu>
					<DropdownMenuTrigger className="border-2 mx-auto w-56 border-dark-miden-700 rounded-miden">
						<div className="flex justify-center items-center gap-2 text-white py-2 px-3 hover:bg-dark-miden-700">
							<span>Select notes</span>
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

				<div
					onClick={() => selectFile(TRANSACTION_SCRIPT_FILE_ID)}
					className={`flex flex-row items-center gap-2 text-white py-1 px-3 cursor-pointer ${
						selectedFileId === TRANSACTION_SCRIPT_FILE_ID
							? 'bg-dark-miden-700 '
							: 'hover:bg-dark-miden-800'
					}`}
				>
					<InlineIcon variant="file_2" color="white" className="w-4 h-4 cursor-pointer" />
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
			className={`flex text-sm flex-row px-3 py-1 items-center gap-2 text-white select-none cursor-pointer rounded-l-miden ${
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
