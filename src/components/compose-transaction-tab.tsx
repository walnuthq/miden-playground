'use client';

import { useState } from 'react';
import { useMiden } from '@/lib/context-providers';
import OverviewLayout from '@/components/overview-details';
import { Vault } from '@/components/vault';
import { Console } from '@/components/console';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CustomMonacoEditor } from '@/components/custom-monaco-editor';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Storage } from './storage';

export const ComposeTransactionTab = () => {
	const {
		files,
		accounts,
		notes,
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		selectTransactionNote,
		removeTransactionNote,
		selectTransactionAccount,
		updateFileContent
	} = useMiden();
	const selectedAccountData = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;

	const [isOpenDropdown, setIsOpenDropdown] = useState(false);

	return (
		<div className="flex flex-row gap-8 px-8 pb-8 pt-6 h-full">
			<div className="basis-1/2 flex flex-col gap-8">
				<div className="basis-2/3 flex flex-col gap-1">
					<div className="flex flex-row">
						<DropdownMenu>
							<DropdownMenuTrigger>
								<div className="px-2 text-theme-text-subtle text-base font-mono flex flex-row items-center gap-0.5 cursor-pointer hover:text-theme-text">
									<span>Account</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="currentColor"
										className="size-7"
									>
										<path d="M480-360 280-560h400L480-360Z" />
									</svg>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								{Object.values(accounts)
									.filter((account) => account.idHex !== selectedTransactionAccountId)
									.map((account) => (
										<DropdownMenuItem
											key={account.id}
											onClick={() => {
												selectTransactionAccount(account.idHex);
											}}
										>
											{account.name}
										</DropdownMenuItem>
									))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex-1 border-2 border-theme-border rounded-theme">
						{selectedAccountData && (
							<OverviewLayout
								data={{
									'Account name': { value: selectedAccountData?.name, copyable: true },
									'Account ID': {
										value: selectedAccountData?.id,
										copyable: true,
										divider: true
									},
									Vault: <Vault accountId={selectedAccountData?.idHex} displayDelta />,
									Storage: <Storage accountId={selectedAccountData?.idHex} />
								}}
							/>
						)}
					</div>
				</div>
				<div className="basis-1/3 flex flex-col gap-1">
					<div className="text-theme-text-subtle text-base font-mono px-2">Transaction script</div>
					<div className="flex-1 border-2 border-theme-border rounded-theme overflow-hidden">
						<CustomMonacoEditor
							onChange={(value) => {
								updateFileContent(TRANSACTION_SCRIPT_FILE_ID, value ?? '');
							}}
							readOnly={false}
							value={files[TRANSACTION_SCRIPT_FILE_ID].content.value}
						/>
					</div>
				</div>
			</div>
			<div className="basis-1/2 flex flex-col">
				<ScrollArea className="flex-1 flex flex-col pb-8 pr-3">
					<div className="text-theme-text-subtle text-base font-mono mb-2 px-2">Notes</div>
					<div className="flex-1 flex flex-col">
						{selectedTransactionNotesIds.map((noteId) => (
							<div
								key={noteId}
								className="min-h-[200px] border-2 border-theme-border rounded-theme relative mb-8"
							>
								<OverviewLayout
									data={{
										'Note name': { value: notes[noteId].name, copyable: true },
										'Sender id': {
											value: notes[noteId].senderId,
											copyable: true
										},
										'Serial number': {
											value: notes[noteId].serialNumber.at(0), // TODO
											copyable: true,
											divider: true
										},
										Vault: <Vault noteId={noteId} />
									}}
								/>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									height="24px"
									viewBox="0 -960 960 960"
									width="24px"
									fill="currentColor"
									className="size-11 p-2 text-theme-text-subtle absolute top-0 right-0 cursor-pointer hover:text-theme-text"
									onClick={(event) => {
										event.stopPropagation();
										removeTransactionNote(noteId);
									}}
								>
									<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
								</svg>
							</div>
						))}
						{selectedTransactionNotesIds.length < Object.keys(notes).length && (
							<div
								className="h-[200px] border-dashed border-2 border-theme-border rounded-theme
								flex items-center justify-center text-theme-text-subtle text-lg font-semibold hover:border-theme-text-subtle hover:text-theme-text cursor-pointer"
								onClick={(event) => {
									event.stopPropagation();
									setIsOpenDropdown(!isOpenDropdown);
								}}
							>
								<DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
									<DropdownMenuTrigger>
										<span className="select-none">Select note</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{Object.values(notes)
											.filter((note) => !selectedTransactionNotesIds.includes(note.id))
											.map((note) => (
												<DropdownMenuItem
													key={note.id}
													onClick={() => {
														selectTransactionNote(note.id);
													}}
												>
													{note.name}
												</DropdownMenuItem>
											))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}
					</div>
				</ScrollArea>
				<div className="h-[240px]">
					<Console />
				</div>
			</div>
		</div>
	);
};
