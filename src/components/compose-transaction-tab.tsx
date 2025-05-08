'use client';

import { useEffect, useState } from 'react';
import { useMiden } from '@/lib/context-providers';
import { Vault } from '@/components/vault';
import { Console } from '@/components/console';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Storage } from './storage';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import OutputNotes from './output-notes';
import NoteCard from './note-card';
import InlineIcon from './ui/inline-icon';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useNextStep } from 'nextstepjs';

export const ComposeTransactionTab = () => {
	const {
		accounts,
		notes,
		latestConsumedNotes,
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		selectTransactionNote,
		selectTransactionAccount,
		executeTransaction,
		blockNumber,
		removeTransactionNote,
		setBlockNumber,
		accountUpdates,
		selectFile,
		selectTab,
		firstExecuteClick,
		toggleFisrtExecuteClick,
		faucets,
		createAccount,
		accountStorageDiffs
	} = useMiden();
	const selectedAccountData = selectedTransactionAccountId
		? accounts[selectedTransactionAccountId]
		: null;
	const [isOpenDropdown, setIsOpenDropdown] = useState(false);
	const [_blockNumber, _setBlockNumber] = useState(blockNumber.toString());
	const { currentStep, setCurrentStep, currentTour } = useNextStep();
	const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
	useEffect(() => {
		if (currentStep === 8 && currentTour) {
			setIsAccountDropdownOpen(true);
		}
	}, [currentStep]);

	useEffect(() => {
		if (currentStep === 17 && currentTour) {
			setCurrentStep(18, 100);
		}
	}, [isOpenDropdown]);

	return (
		<>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel defaultSize={30} className="min-w-[400px]">
					<ScrollArea className="relative h-full px-4 py-5  overflow-auto text-theme-text text-sm">
						<div className="">
							<div
								className={`${
									Object.values(accounts).length > 0 && 'flex'
								} justify-between items-center`}
							>
								<TooltipProvider>
									<Tooltip delayDuration={100}>
										<div className=" text-theme-text flex gap-2 items-center">
											EXECUTING ACCOUNT{' '}
											<TooltipTrigger>
												<InlineIcon
													className=" w-4 h-4 cursor-pointer hover:text-theme-text text-theme-text-subtle"
													variant="question"
												/>
											</TooltipTrigger>
											<TooltipContent>
												Learn about accounts in the{' '}
												<a
													target="_blank"
													className="text-theme-primary hover:underline"
													href="https://0xpolygonmiden.github.io/miden-docs/miden-base/architecture/account.html"
												>
													docs
												</a>
												.
											</TooltipContent>
										</div>
									</Tooltip>
								</TooltipProvider>
								<div>
									{Object.values(accounts).length > 0 ? (
										<DropdownMenu
											open={isAccountDropdownOpen}
											onOpenChange={setIsAccountDropdownOpen}
										>
											<DropdownMenuTrigger>
												<div className="px-2 text-theme-text  hover:bg-theme-border rounded-miden transition-all flex flex-row items-center gap-2 cursor-pointer">
													<span className="">{selectedAccountData?.name}</span>
													<InlineIcon variant="arrow" className="w-3 h-3 rotate-90" />
												</div>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												onInteractOutside={(event) => {
													if (currentStep === 9 && currentTour) {
														event.preventDefault();
													}
												}}
											>
												{Object.values(accounts)
													.filter((account) => account.id.id !== selectedTransactionAccountId)
													.map((account, index) => (
														<DropdownMenuItem
															className={`${
																index === Object.values(accounts).length - 2 ? 'step6' : ''
															}`}
															key={account.id.id}
															onClick={() => {
																selectTransactionAccount(account.id.id);
																if (currentStep === 9 && currentTour) {
																	setCurrentStep(10, 100);
																}
															}}
														>
															{account.name}
														</DropdownMenuItem>
													))}
												<DropdownMenuItem
													onClick={(e) => {
														e.preventDefault();
														selectTab('assets');
													}}
												>
													Create account
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									) : (
										<div className="mt-2">
											<div>Please create an account first</div>
											<button
												onClick={() => {
													createAccount();
												}}
												className={`mt-6 w-full outline-none border border-theme-border rounded-miden px-4 py-1 transition-all bg-theme-surface-highlight text-theme-text hover:bg-theme-border`}
											>
												Create account
											</button>
										</div>
									)}
								</div>
							</div>
							{selectedAccountData && (
								<div className="border border-theme-border rounded-miden mt-2">
									<div className="flex flex-col text-sm">
										<div className="flex justify-between px-4 pt-2">
											<div className=" text-theme-text whitespace-nowrap mr-4">Account ID:</div>
											<div className=" text-theme-text">
												({selectedAccountData?.id.prefix.toString()},{' '}
												{selectedAccountData?.id.suffix.toString()})
											</div>
										</div>
										<div className="px-4 py-1"></div>
										{selectedAccountData?.assets.map((asset) => (
											<div key={asset.faucetId} className="border-t border-theme-border px-4 py-2">
												<div className="flex justify-between items-center text-theme-text">
													<div>{faucets[asset.faucetId.toString()]}</div>
													<div>{asset.amount}</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
							<TooltipProvider>
								<Tooltip delayDuration={100}>
									<div className=" text-theme-text mt-6 flex items-center gap-2">
										NOTES TO CONSUME{' '}
										<TooltipTrigger>
											<InlineIcon
												className="w-4 h-4 cursor-pointer hover:text-theme-text text-theme-text-subtle"
												variant="question"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Learn about notes in the{' '}
											<a
												target="_blank"
												className="text-theme-primary hover:underline"
												href="https://0xpolygonmiden.github.io/miden-docs/miden-base/architecture/note.html"
											>
												docs
											</a>
											.
										</TooltipContent>
									</div>
								</Tooltip>
							</TooltipProvider>
							<div className="flex flex-col gap-4 mt-2">
								{selectedTransactionNotesIds.length > 0 ? (
									selectedTransactionNotesIds.map(
										(noteId) =>
											!notes[noteId].isConsumed && (
												<div key={noteId} className="">
													<div className="border border-theme-border rounded-miden relative text-sm ">
														<NoteCard noteId={noteId} />
													</div>
													<div className="flex mt-2 justify-end items-center">
														<button
															onClick={(event) => {
																event.stopPropagation();
																selectFile(notes[noteId].scriptFileId);
																selectTab('assets');
															}}
															className="px-2 rounded-miden border-theme-border text-theme-text-subtlest hover:text-theme-text hover:underline"
														>
															Edit
														</button>
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
											)
									)
								) : (
									<div className="text-sm">
										{Object.values(notes).some((note) => !notes[note.id].isConsumed)
											? 'Add at least one note'
											: 'All of your notes are consumed. Please create new notes'}
									</div>
								)}
							</div>

							{Object.values(notes).filter(
								(note) => !selectedTransactionNotesIds.includes(note.id) && !note.isConsumed
							).length > 0 && (
								<div className="mt-6">
									<DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
										<DropdownMenuTrigger
											id="step10"
											className="w-full border border-theme-border transition-all rounded-miden px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border"
										>
											<span className="select-none">Add note</span>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											onInteractOutside={(event) => {
												if (currentStep === 11 && currentTour) {
													event.preventDefault();
												}
											}}
										>
											{Object.values(notes)
												.filter(
													(note) =>
														!selectedTransactionNotesIds.includes(note.id) &&
														!note.isConsumed &&
														!note.isExpectedOutput
												)
												.map((note, index) => (
													<DropdownMenuItem
														className={`${
															Object.values(notes).filter(
																(note) =>
																	!selectedTransactionNotesIds.includes(note.id) &&
																	!note.isConsumed &&
																	!note.isExpectedOutput
															).length -
																1 ===
															index
																? 'step11'
																: ''
														}`}
														key={note.id}
														onClick={() => {
															selectTransactionNote(note.id);
															if (currentTour) {
																setCurrentStep(19, 100);
															}
														}}
													>
														{note.name}
													</DropdownMenuItem>
												))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)}

							<div className="mt-6">
								<TooltipProvider>
									<Tooltip delayDuration={100}>
										<div className="text-theme-text mt-6 flex items-center gap-2">
											BLOCK NUMBER{' '}
											<TooltipTrigger>
												<InlineIcon
													className="w-4 h-4 cursor-pointer hover:text-theme-text text-theme-text-subtle"
													variant="question"
												/>
											</TooltipTrigger>
											<TooltipContent>
												Transaction will be executed at the specified block number.
											</TooltipContent>
										</div>
									</Tooltip>
								</TooltipProvider>
								<input
									type="number"
									min={1}
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
									onClick={() => {
										selectFile(TRANSACTION_SCRIPT_FILE_ID);
										selectTab('assets');
										if (currentTour) {
											setCurrentStep(20, 100);
										}
									}}
									id="step12"
									className="w-full flex justify-center gap-2 border items-center border-theme-border rounded-miden px-4 py-1 bg-theme-surface-highlight  text-theme-text hover:bg-theme-border transition-all"
								>
									<span>Edit Transaction Script</span>
									<InlineIcon variant="arrow-link" color="white" className={`w-4 h-4`} />
								</button>
							</div>
							<div className="mt-2">
								<button
									disabled={firstExecuteClick && selectedTransactionNotesIds.length === 0}
									onClick={() => {
										executeTransaction();
										toggleFisrtExecuteClick();
										if (currentTour) {
											setCurrentStep(23, 100);
										}
									}}
									id="step15"
									className={`w-full outline-none border border-theme-border rounded-miden px-4 py-1 transition-all text-theme-text ${
										!firstExecuteClick || selectedTransactionNotesIds.length > 0
											? 'bg-theme-primary hover:bg-theme-primary-hover'
											: 'bg-theme-surface-highlight opacity-50'
									}`}
								>
									Execute Transaction
								</button>
							</div>
							{Object.values(latestConsumedNotes).length > 0 &&
								Object.values(notes).some((value) =>
									Object.values(latestConsumedNotes).includes(value)
								) && <div className="mt-6">CONSUMED NOTES</div>}
							<div className="flex flex-col gap-4 mt-2">
								{Object.values(latestConsumedNotes).map((note) => (
									<NoteCard key={note.id} noteId={note.id} />
								))}
							</div>
						</div>
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle className="w-[1px] bg-theme-border" />
				<ResizablePanel defaultSize={70}>
					<div className="flex flex-col h-full text-sm">
						<ResizablePanelGroup direction="vertical">
							<ResizablePanel defaultSize={75}>
								{accountUpdates !== null && accounts[accountUpdates.accountId] ? (
									<ScrollArea
										id="step16"
										className="relative h-full pt-5 px-4 overflow-auto text-theme-text"
									>
										<div className="flex justify-center">TRANSACTION RESULT</div>
										<div className="mt-6">OUTPUT NOTES</div>
										<div className="mt-2">
											<OutputNotes />
										</div>
										<div className="mt-6">
											{accounts[accountUpdates.accountId].name.toUpperCase()} VAULT CHANGES
										</div>
										<div className="mt-2">
											<Vault accountId={accounts[accountUpdates.accountId]?.id.id} displayDelta />
										</div>
										<div className="mt-6">
											{accounts[accountUpdates.accountId].name.toUpperCase()} STORAGE CHANGES
										</div>
										<div className="mt-2 text-theme-text-subtle">
											{Object.keys(accountStorageDiffs).length !== 0 ? (
												<Storage accountId={accountUpdates.accountId} />
											) : (
												'No storage changes'
											)}
										</div>
									</ScrollArea>
								) : (
									<ScrollArea className="relative h-full px-4 overflow-auto max-w-3xl mx-auto text-theme-text">
										<div className="flex flex-col gap-4 pt-16">
											<h1 className="font-bold text-4xl">Miden Playground</h1>
											<h3 className="font-bold text-2xl mt-8">Getting Started</h3>
											<div>
												<div>1. Execute Transactions:</div>
												<ul style={{ listStyleType: 'disc', paddingLeft: '20px' }} className="ml-2">
													<li>Select an account and at least one note from the left-side menu.</li>
													<li>Click &quot;Execute Transaction&quot; to see Miden in action.</li>
												</ul>
											</div>
											<div>
												<div>2. Craft Notes for Transactions:</div>
												<ul style={{ listStyleType: 'disc', paddingLeft: '20px' }} className="ml-2">
													<li>Create notes in the editor tab.</li>
													<li>Each note includes a vault with assets and a script.</li>
												</ul>
											</div>
											<div>
												<div>3. Create More Accounts:</div>
												<ul style={{ listStyleType: 'disc', paddingLeft: '20px' }} className="ml-2">
													<li>
														Store assets in your account&apos;s vault and keep data in its storage.
													</li>
													<li>Create additional accounts in the editor tab as needed.</li>
												</ul>
											</div>
										</div>
										<div className="flex flex-col gap-4 mt-8 pb-4">
											<h3 className="font-bold text-2xl">Need help?</h3>
											<ul>
												<li>
													📚{' '}
													<Link
														href="https://0xpolygonmiden.github.io/miden-docs/miden-base/index.html"
														target="_blank"
														className="font-bold text-theme-primary hover:underline"
													>
														Read our docs
													</Link>{' '}
													for detailed guides and instructions.
												</li>
												<li>
													🗂 Check our{' '}
													<Link
														href="https://github.com/0xPolygonMiden/miden-vm"
														target="_blank"
														className="font-bold text-theme-primary hover:underline"
													>
														GitHub repository
													</Link>
													.
												</li>
											</ul>
										</div>
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
