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
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				Compose transaction
			</div>
			<div className="flex flex-col gap-4 text-sm">
				<div className="flex flex-row items-center gap-2 text-white py-2 px-3 hover:bg-dark-miden-700">
					<InlineIcon variant="file_2" color="white" className="w-4 h-4 cursor-pointer" />
					<span>Transaction file</span>
				</div>
				<div className="px-3 text-white font-bold">Account</div>
				<div className="flex justify-center">
					<Select
						onValueChange={(value) => {
							const selectedAccount = Object.values(accounts).find(
								(account) => account.name === value
							);
							if (selectedAccount) {
								selectTransactionAccount(selectedAccount.idHex);
							} else if (value === 'None') {
								removeTransactionAccount();
							}
						}}
					>
						<SelectTrigger className="flex justify-center border-2 border-dark-miden-700 rounded-miden w-56 bg-dark-miden-900 hover:bg-dark-miden-700 text-white">
							<SelectValue placeholder="Select account" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Select account</SelectLabel>
								{Object.values(accounts).map((account) => (
									<SelectItem key={account.id} value={account.name}>
										{account.name}
									</SelectItem>
								))}
								{selectedTransactionAccount && <SelectItem value="None">None</SelectItem>}
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
			className={`flex flex-row px-3 items-center gap-2 text-white select-none cursor-pointer rounded-l-miden ${
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
