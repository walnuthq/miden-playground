'use client';

import { useState } from 'react';
import { useMiden } from '@/lib/context-providers';
import { Vault } from '@/components/vault';
import { Console } from '@/components/console';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { faucetSymbols } from '@/lib/consts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import OutputNotes from './output-notes';
import NoteCard from './note-card';
import InlineIcon from './ui/inline-icon';

export const ComposeTransactionTab = () => {
	const {
		accounts,
		notes,
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		executeTransaction,
		blockNumber,
		removeTransactionNote,
		setBlockNumber,
		accountUpdates
	} = useMiden();
	const selectedAccountData = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;
	console.log(accountUpdates);
	const [isOpenDropdown, setIsOpenDropdown] = useState(false);
	const [_blockNumber, _setBlockNumber] = useState(blockNumber.toString());
	return (
		<>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel defaultSize={25}>
					<ScrollArea className="relative h-full px-4 py-5  overflow-auto text-theme-text text-sm">
						<div className="">
							<div className="flex justify-between items-center">
								<div className=" text-theme-text ">EXECUTING ACCOUNT</div>
								<div>
									<DropdownMenu>
										<DropdownMenuTrigger>
											<div className="px-2 text-theme-text  hover:bg-theme-border rounded-miden transition-all flex flex-row items-center gap-2 cursor-pointer">
												<span className="">{selectedAccountData?.name}</span>
												<InlineIcon variant="arrow" className="w-3 h-3 rotate-90" />
											</div>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											{Object.values(accounts)
												.filter((account) => account.id.id !== selectedTransactionAccountId)
												.map((account) => (
													<DropdownMenuItem
														key={account.id.id}
														onClick={() => {
															selectTransactionAccount(account.id.id);
														}}
													>
														{account.name}
													</DropdownMenuItem>
												))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
							<div className="border border-theme-border rounded-miden mt-2">
								{selectedAccountData && (
									<div className="flex flex-col text-sm">
										<div className="flex justify-between px-4 pt-2">
											<div className=" text-theme-text">Account ID:</div>
											<div className=" text-theme-text">{selectedAccountData?.id.id}</div>
										</div>
										<div className="px-4 py-1"></div>
										{selectedAccountData?.assets.map((asset) => (
											<div key={asset.faucetId} className="border-t border-theme-border px-4 py-2">
												<div className="flex justify-between items-center text-theme-text">
													<div>{faucetSymbols[asset.faucetId.toString()]}</div>
													<div>{asset.amount}</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							<div className=" text-theme-text mt-6">NOTES TO CONSUME</div>
							<div className="flex flex-col gap-4 mt-2">
								{selectedTransactionNotesIds.length > 0 ? (
									selectedTransactionNotesIds.map((noteId) => (
										<div key={noteId} className="">
											<div className="border border-theme-border rounded-miden relative text-sm ">
												<NoteCard noteId={noteId} />
											</div>
											<div className="flex mt-2 justify-end items-center">
												<button
													onClick={(event) => {
														event.stopPropagation();
														removeTransactionNote(noteId);
													}}
													className="px-2 rounded-miden border-theme-border text-theme-text-subtlest hover:text-theme-text hover:underline"
												>
													Remove
												</button>
											</div>
										</div>
									))
								) : (
									<div className="text-sm">Select at least one note</div>
								)}
							</div>

							{selectedTransactionNotesIds.length < Object.keys(notes).length && (
								<div className="mt-6">
									<DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
										<DropdownMenuTrigger className="w-full  border border-theme-border transition-all rounded-miden px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border">
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

							{Object.values(notes).find((note) => note.isConsumed) && (
								<div className="mt-6">CONSUMED NOTES</div>
							)}
							<div>
								{Object.values(notes)
									.filter((note) => note.isConsumed)
									.map((note) => (
										<div
											key={note.id}
											className="border border-theme-border rounded-miden relative text-sm pl-4 py-4 "
										>
											<NoteCard noteId={note.id} />
										</div>
									))}
							</div>
							<div className="mt-6">
								<div className=" text-theme-text ">BLOCK NUMBER</div>
								<input
									type="text"
									value={_blockNumber}
									onChange={(e) => {
										_setBlockNumber(e.target.value);
										const valueInt = Number(e.target.value);
										setBlockNumber(Math.max(valueInt, 1));
									}}
									className="w-full mt-2 border border-theme-border rounded-miden px-4 py-1 bg-transparent outline-none text-theme-text"
								/>
							</div>
							<div className="mt-6 ">
								<button
									disabled
									className="w-full flex opacity-50 justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight transition-all text-theme-text "
								>
									<span>Edit Transaction Script</span>
									<InlineIcon variant="arrow-link" color="white" className={`w-4 h-4`} />
								</button>
							</div>
							<div className="mt-2">
								<button
									disabled={selectedTransactionNotesIds.length === 0}
									onClick={() => {
										executeTransaction();
									}}
									className={`w-full outline-none border border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight transition-all text-theme-text ${
										selectedTransactionNotesIds.length > 0 ? 'hover:bg-theme-border' : 'opacity-50'
									}`}
								>
									Execute Transaction
								</button>
							</div>
						</div>
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle className="w-[1px] bg-theme-border" />
				<ResizablePanel defaultSize={75}>
					<div className="flex flex-col h-full text-sm">
						<ResizablePanelGroup direction="vertical">
							<ResizablePanel defaultSize={75}>
								{accountUpdates !== null && (
									<ScrollArea className="relative h-full pt-5 px-4 overflow-auto text-theme-text">
										<div className="flex justify-center">EXECUTION OUTPUT</div>
										<div className="mt-2">OUTPUT NOTES</div>
										<div className="mt-2">
											<OutputNotes />
										</div>
										<div className="mt-2">ACCOUNT VAULT CHANGES</div>
										<div className="mt-2">
											<Vault accountId={selectedAccountData?.id.id} displayDelta />
										</div>
										<div className="mt-2">ACCOUNT STORAGE CHANGES</div>
									</ScrollArea>
								)}
							</ResizablePanel>
							<ResizableHandle className="w-[1px] bg-theme-border" />
							<ResizablePanel defaultSize={25}>
								<div className="flex flex-col h-full">
									<Console />
								</div>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</>
	);
};
