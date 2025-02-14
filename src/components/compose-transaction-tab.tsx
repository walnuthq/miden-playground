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

export const ComposeTransactionTab = () => {
	const {
		accounts,
		notes,
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		executeTransaction,
		blockNumber
	} = useMiden();
	const selectedAccountData = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;

	const [isOpenDropdown, setIsOpenDropdown] = useState(false);
	return (
		<>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel defaultSize={25}>
					<ScrollArea className="relative h-full px-4 py-5  overflow-auto text-theme-text">
						<div>
							<div className="flex justify-between items-center">
								<div className=" text-theme-text ">EXECUTING ACCOUNT</div>
								<div>
									<DropdownMenu>
										<DropdownMenuTrigger>
											<div className="px-2 text-theme-text  flex flex-row items-center gap-0.5 cursor-pointer">
												<span className="">{selectedAccountData?.name}</span>
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
							</div>
							<div className="border border-theme-border rounded-s-theme mt-2">
								{selectedAccountData && (
									<div className="flex flex-col text-sm">
										<div className="flex justify-between px-4 pt-2">
											<div className=" text-theme-text">Account ID:</div>
											<div className=" text-theme-text">{selectedAccountData?.id}</div>
										</div>
										<div className="px-4 py-1">
											<div className=" text-theme-text-subtle">Assets:</div>
										</div>
										{selectedAccountData?.assets.map((asset) => (
											<div key={asset.faucetId} className="border-t border-theme-border px-4 py-2">
												<div className=" text-theme-text">
													{faucetSymbols[asset.faucetId.toString()]} {asset.amount}
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							<div className=" text-theme-text mt-6">NOTES TO CONSUME</div>
							<div className="flex flex-col gap-2 mt-2">
								{selectedTransactionNotesIds.length > 0 ? (
									selectedTransactionNotesIds.map((noteId) => (
										<div
											key={noteId}
											className="border border-theme-border rounded-s-theme relative text-sm pl-4 py-4 "
										>
											<NoteCard noteId={noteId} />
										</div>
									))
								) : (
									<div className="text-sm">Select at least one note</div>
								)}
							</div>

							{selectedTransactionNotesIds.length < Object.keys(notes).length && (
								<div className="mt-6">
									<DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
										<DropdownMenuTrigger className="w-full  border border-theme-border rounded-s-theme px-4 py-2  text-theme-text hover:bg-theme-border">
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

							<div className="mt-2">
								<button
									onClick={() => {
										executeTransaction();
									}}
									disabled
									className="w-full opacity-50  border border-theme-border rounded-s-theme px-4 py-2  text-theme-text "
								>
									Transaction script
								</button>
							</div>
							{Object.values(notes).find((note) => note.isConsumed) && (
								<div className="mt-6">CONSUMED NOTES</div>
							)}
							<div>
								{Object.values(notes)
									.filter((note) => note.isConsumed)
									.map((note) => (
										<div
											key={note.id}
											className="border border-theme-border rounded-s-theme relative text-sm pl-4 py-4 "
										>
											<NoteCard noteId={note.id} isClosing={false} />
										</div>
									))}
							</div>
							<div className="mt-6">
								<div className=" text-theme-text ">BLOCK NUMBER</div>
								<input
									type="text"
									value={blockNumber}
									disabled
									className="w-full mt-2 bg-theme-surface border border-theme-border rounded-s-theme px-4 py-2  text-theme-text"
								/>
							</div>

							<div className="mt-12">
								<button
									disabled={selectedTransactionNotesIds.length === 0}
									onClick={() => {
										executeTransaction();
									}}
									className={`w-full  border border-theme-border rounded-s-theme px-4 py-2  text-theme-text ${
										selectedTransactionNotesIds.length > 0 ? 'hover:bg-theme-border' : 'opacity-50'
									}`}
								>
									Execute Transaction
								</button>
							</div>
						</div>
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle className="w-[2px] bg-theme-border" />
				<ResizablePanel defaultSize={75}>
					<div className="flex flex-col h-full">
						<ResizablePanelGroup direction="vertical">
							<ResizablePanel defaultSize={75}>
								<ScrollArea className="relative h-full py-5 px-4 overflow-auto text-theme-text">
									<div className="flex justify-center">EXECUTION OUTPUT</div>
									<div className="mt-2">OUTPUT NOTES</div>
									<div className="mt-2">
										<OutputNotes />
									</div>
									<div className="mt-6">ACCOUNT VAULT CHANGES</div>
									<div className="mt-2">
										<Vault accountId={selectedAccountData?.idHex} displayDelta />
									</div>
									<div className="mt-6">ACCOUNT STORAGE CHANGES</div>
								</ScrollArea>
							</ResizablePanel>
							<ResizableHandle className="w-[2px] bg-theme-border" />
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
