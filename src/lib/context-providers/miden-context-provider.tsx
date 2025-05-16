'use client';

import React, {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState
} from 'react';
import init from 'miden-wasm';
import { DEFAULT_FAUCET_IDS } from '@/lib/consts/defaults';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { consumeNotes, generateFaucetId } from '@/lib/miden-wasm-api';
import { convertToBigUint64Array } from '@/lib/utils';
import { Account, AccountProps } from '@/lib/account';
import { Note } from '@/lib/notes';
import { EditorFiles } from '@/lib/files';
import { AccountUpdates } from '@/lib/types';
import json5 from 'json5';
import { debounce } from 'lodash';
import { useFiles } from './files-context-provider';
import { useAccounts } from './accounts-context-provider';
import { useNotes } from './notes-context-provider';

type Tabs = 'transaction' | 'assets';

type Faucets = {
	[key: string]: string;
};

interface MidenContextProps {
	isInitialized: boolean;
	selectedTab: Tabs;
	isCollapsedTabs: boolean;
	isExecutingTransaction: boolean;
	blockNumber: number;
	setBlockNumber: (blockNumber: number) => void;
	selectTab: (tab: Tabs) => void;
	executeTransaction: () => void;
	collapseTabs: () => void;
	consoleLogs: { message: string; type: 'info' | 'error' }[];
	addInfoLog: (message: string) => void;
	addErrorLog: (message: string) => void;
	firstExecuteClick: boolean;
	toggleFisrtExecuteClick: () => void;
	faucets: Faucets;
	createFaucet: (name: string, amount: bigint, accountId: string) => void;
	createNoteFaucet: (name: string, amount: bigint, noteId: string) => void;
	isInspectorDropdownOpen: boolean;
	setIsInspectorDropdownOpen: (isInspectorDropdownOpen: boolean) => void;
	setIsTutorialMode: (isTutorial: boolean) => void;
	isTutorialMode: boolean;
	clearConsole: () => void;
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	selectedTab: 'transaction',
	isExecutingTransaction: false,
	isCollapsedTabs: false,
	blockNumber: 4,
	setBlockNumber: () => {},
	selectTab: () => {},
	executeTransaction: () => {},
	collapseTabs: () => {},
	consoleLogs: [],
	addInfoLog: () => {},
	addErrorLog: () => {},
	firstExecuteClick: false,
	toggleFisrtExecuteClick: () => {},
	faucets: {},
	createFaucet: () => {},
	createNoteFaucet: () => {},
	setIsInspectorDropdownOpen: () => {},
	isInspectorDropdownOpen: false,
	setIsTutorialMode: () => {},
	isTutorialMode: false,
	clearConsole: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { files, addFiles, updateFileContent } = useFiles();
	const {
		accounts,
		setAccountUpdates,
		setAccountStorageDiffs,
		selectedTransactionAccountId,
		updateAccountById,
		setAccounts,
		selectTransactionAccount
	} = useAccounts();
	const {
		setLatestConsumedNotes,
		removeExecutedTransactionNotes,
		selectedTransactionNotesIds,
		notes,
		setNotes
	} = useNotes();

	const [isInitialized, setIsInitialized] = useState(false);
	const [isCollapsedTabs, setCollapsedTabs] = useState(false);
	const [isExecutingTransaction, setIsExecutingTransaction] = useState(false);
	const [firstExecuteClick, setFirstExecuteClick] = useState(false);
	const [isInspectorDropdownOpen, setIsInspectorDropdownOpen] = useState(false);
	const [faucets, setFaucets] = useState<Faucets>({
		'0x2a3c549c1f3eb8a000009b55653cc0': 'BTC',
		'0x3f3e2714af2401a00000e02c698d0e': 'ETH'
	});
	const [isTutorialMode, setIsTutorialMode] = useState(false);

	const createFaucet = (name: string, amount: bigint, accountId: string) => {
		const account = accounts[accountId];
		const faucetId = generateFaucetId().id;

		setFaucets((prev) => {
			const newFaucets = { ...prev, [faucetId]: name };
			return newFaucets;
		});

		account.addAsset(faucetId, amount);
	};

	const createNoteFaucet = (name: string, amount: bigint, noteId: string) => {
		const note = notes[noteId];
		const faucetId = generateFaucetId().id;
		setFaucets((prev) => {
			const newFaucets = prev;
			newFaucets[faucetId] = name;
			return newFaucets;
		});
		note.addAsset(faucetId, amount);
	};

	const toggleFisrtExecuteClick = () => {
		setFirstExecuteClick(true);
	};

	const collapseTabs = () => {
		setCollapsedTabs(!isCollapsedTabs);
	};

	const [blockNumber, setBlockNumber] = useState<number>(4);

	const [consoleLogs, setConsoleLogs] = useState<{ message: string; type: 'info' | 'error' }[]>([]);

	const addInfoLog = useCallback((message: string) => {
		console.log(message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'info' }]);
	}, []);

	const addErrorLog = useCallback((message: string) => {
		console.log('ERROR: ', message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'error' }]);
	}, []);

	const clearConsole = useCallback(() => {
		setConsoleLogs([]);
	}, []);

	const [selectedTab, setSelectedTab] = useState<Tabs>('transaction');

	useEffect(() => {
		if (isTutorialMode) {
			const closedFiles = Object.fromEntries(
				Object.entries(files).map(([fileId, file]) => [fileId, { ...file, isOpen: false }])
			);

			localStorage.setItem(
				'accounts',
				encodeForStorage({ accounts: { ...accounts }, newFiles: { ...closedFiles } })
			);
			localStorage.setItem(
				'notes',
				encodeForStorage({ notes: { ...notes }, newFiles: { ...closedFiles } })
			);
			localStorage.setItem('faucets', encodeForStorage(faucets));
		}
	}, [isTutorialMode]);

	useEffect(() => {
		if (!isTutorialMode) {
			const saveToLocalStorage = debounce(() => {
				const closedFiles = Object.fromEntries(
					Object.entries(files).map(([fileId, file]) => [fileId, { ...file, isOpen: false }])
				);

				localStorage.setItem(
					'accounts',
					encodeForStorage({ accounts: { ...accounts }, newFiles: { ...closedFiles } })
				);
				localStorage.setItem(
					'notes',
					encodeForStorage({ notes: { ...notes }, newFiles: { ...closedFiles } })
				);
				localStorage.setItem('faucets', encodeForStorage(faucets));
			}, 5000);

			const handleBeforeUnload = () => {
				saveToLocalStorage.flush();
			};

			window.addEventListener('beforeunload', handleBeforeUnload);

			saveToLocalStorage();

			return () => {
				window.removeEventListener('beforeunload', handleBeforeUnload);
				saveToLocalStorage.cancel();
			};
		}
	}, [accounts, notes, files, faucets, isTutorialMode]);

	const selectTab = useCallback((tab: Tabs) => {
		setSelectedTab(tab);
	}, []);

	const executeTransaction = useCallback(() => {
		if (!selectedTransactionAccountId) {
			addErrorLog('No account selected: Please select an account to execute the transaction');
			return;
		}
		if (selectedTransactionNotesIds.length === 0) {
			addErrorLog(
				'At least one note is required to execute the transaction. Please add a note and try again.'
			);
			return;
		}

		setIsExecutingTransaction(true);
		const account = accounts[selectedTransactionAccountId];
		const transactionNotes: {
			note: Note;
			noteScript: string;
			noteInputs: BigUint64Array<ArrayBufferLike>;
			senderScript: string;
		}[] = [];
		const consumedNotesIds: string[] = [];
		for (const noteId of selectedTransactionNotesIds) {
			const note = notes[noteId];
			if (note.isConsumed) {
				addErrorLog(`${note.name} is already consumed`);
				setIsExecutingTransaction(false);
				return;
			} else {
				consumedNotesIds.push(noteId);
			}

			const sender = accounts[note.senderId];

			transactionNotes.push({
				note,
				noteScript: files[note.scriptFileId].content.value!,
				noteInputs: convertToBigUint64Array(json5.parse(files[note.inputFileId].content.value!)),
				senderScript: files[sender.scriptFileId].content.value!
			});
		}

		try {
			const storage = Account.parseStorage(files[account.storageFileId].content.value!);
			const output = consumeNotes({
				receiver: account,
				receiverScript: files[account.scriptFileId].content.value!,
				receiverStorage: storage,
				notes: transactionNotes,
				transactionScript: files[TRANSACTION_SCRIPT_FILE_ID].content.value!,
				blockNumber
			});

			output.storageDiffs = Account.previousStorageValues(storage, output.storage);
			if (Object.keys(output.storageDiffs).length > 0) {
				setAccountStorageDiffs(output.storageDiffs);
			}
			if (!output.assets.some((a) => a.faucetId === DEFAULT_FAUCET_IDS[0])) {
				output.assets.push({ faucetId: DEFAULT_FAUCET_IDS[0], amount: 0n });
			}

			if (!output.assets.some((a) => a.faucetId === DEFAULT_FAUCET_IDS[1])) {
				output.assets.push({ faucetId: DEFAULT_FAUCET_IDS[1], amount: 0n });
			}
			const accountUpdates: AccountUpdates = {
				accountId: selectedTransactionAccountId,
				assetsDelta: output.assets.reduce((acc, asset) => {
					acc[asset.faucetId.toString()] =
						asset.amount -
						(accounts[selectedTransactionAccountId]?.assets.find(
							(a) => a.faucetId === asset.faucetId
						)?.amount ?? 0n);
					return acc;
				}, {} as Record<string, bigint>),
				outputNotes: output.outputNotes
			};
			setAccountUpdates(accountUpdates);

			updateAccountById(selectedTransactionAccountId, (account) => {
				account.assets = output.assets;
				account.nonce = output.nonce;
				return account;
			});
			updateFileContent(account.storageFileId, Account.stringifyStorage(output.storage));
			addInfoLog('Execution successful');

			setNotes((prev) => {
				const oldNotes = { ...prev };

				consumedNotesIds.forEach((consumedNoteId) => {
					if (oldNotes[consumedNoteId]) {
						oldNotes[consumedNoteId].isConsumed = true;
					}
				});

				return oldNotes;
			});

			const newLatestConsumedNotes: Record<string, Note> = {};

			consumedNotesIds.forEach((consumedNoteId) => {
				if (notes[consumedNoteId]) {
					newLatestConsumedNotes[consumedNoteId] = notes[consumedNoteId];
				}
			});

			setLatestConsumedNotes(newLatestConsumedNotes);

			removeExecutedTransactionNotes();

			for (const outputNote of output.outputNotes) {
				setNotes((prev) => {
					const note = Object.values(prev).find((note) => note.initialNoteId === outputNote.id);
					if (note) {
						note.isExpectedOutput = false;
					}
					return prev;
				});
			}

			addInfoLog(`Total cycles: ${output.totalCycles}; Trace length: ${output.traceLength}`);
		} catch (error) {
			addErrorLog('Execution failed. Error: ' + error);
		}

		setIsExecutingTransaction(false);
	}, [
		accounts,
		addErrorLog,
		addInfoLog,
		blockNumber,
		files,
		notes,
		removeExecutedTransactionNotes,
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		setAccountStorageDiffs,
		setAccountUpdates,
		setLatestConsumedNotes,
		setNotes,
		updateAccountById,
		updateFileContent
	]);

	function encodeForStorage(obj: unknown): string {
		const json = JSON.stringify(obj, (_, value) => {
			if (typeof value === 'bigint') {
				return { __type: 'bigint', value: value.toString() };
			}
			if (value instanceof Uint8Array) {
				return { __type: 'uint8array', value: Array.from(value) };
			}
			if (value instanceof BigUint64Array) {
				return { __type: 'biguint64array', value: Array.from(value, (v) => v.toString()) };
			}
			return value;
		});
		return btoa(encodeURIComponent(json));
	}

	function decodeFromStorage(input: string) {
		let json: string;
		try {
			json = decodeURIComponent(atob(input));
		} catch {
			json = input;
		}

		return JSON.parse(json, (_, value) => {
			if (value && typeof value === 'object' && '__type' in value) {
				switch (value.__type) {
					case 'bigint':
						return BigInt(value.value);
					case 'uint8array':
						return new Uint8Array(value.value);
					case 'biguint64array':
						return new BigUint64Array(value.value.map((v: string) => BigInt(v)));
				}
			}
			return value;
		});
	}
	useEffect(() => {
		init()
			.then(() => {
				const prefix = isTutorialMode ? 'tutorial-' : '';

				const existingAccountsB64 = localStorage.getItem(`${prefix}accounts`);
				const { accounts, newFiles: accountFiles } = existingAccountsB64
					? (decodeFromStorage(existingAccountsB64) as {
							accounts: Record<string, AccountProps>;
							newFiles: EditorFiles;
					  })
					: { accounts: {}, newFiles: {} };

				const parsedAccounts = Object.fromEntries(
					Object.entries(accounts).map(([id, account]) => [id, new Account(account)])
				);
				setAccounts(parsedAccounts);

				const existingNotesB64 = localStorage.getItem(`${prefix}notes`);
				const { notes: rawNotes, newFiles: noteFiles } = existingNotesB64
					? (decodeFromStorage(existingNotesB64) as {
							notes: Record<string, Note>;
							newFiles: EditorFiles;
					  })
					: { notes: {}, newFiles: {} };

				const parsedNotes = Object.fromEntries(
					Object.entries(rawNotes).map(([id, parsedNote]) => {
						const note = new Note(parsedNote);
						note.serialNumber = new BigUint64Array(parsedNote.serialNumber.map(BigInt));
						return [id, note];
					})
				);

				const defaultFaucets = {
					'0x2a3c549c1f3eb8a000009b55653cc0': 'BTC',
					'0x3f3e2714af2401a00000e02c698d0e': 'ETH'
				};

				const existingFaucetsB64 = localStorage.getItem(`faucets`);
				const faucets = existingFaucetsB64 ? decodeFromStorage(existingFaucetsB64) : defaultFaucets;

				if (!existingFaucetsB64) {
					localStorage.setItem(`faucets`, encodeForStorage(defaultFaucets));
				}

				addFiles(accountFiles);
				addFiles(noteFiles);
				setNotes(parsedNotes);
				setFaucets(faucets);
				setIsInitialized(true);

				if (Object.entries(accounts)[0]) {
					selectTransactionAccount(Object.entries(accounts)[0][0]);
				}
			})
			.catch((error) => {
				alert(`Failed to initialize WASM: ${error}`);
			});
	}, [isTutorialMode]);

	return (
		<MidenContext.Provider
			value={{
				isInitialized,
				selectedTab,
				isExecutingTransaction,
				isCollapsedTabs,
				blockNumber,
				setBlockNumber,
				selectTab,
				executeTransaction,
				collapseTabs,
				consoleLogs,
				addErrorLog,
				addInfoLog,
				firstExecuteClick,
				toggleFisrtExecuteClick,
				createFaucet,
				faucets,
				createNoteFaucet,
				isInspectorDropdownOpen,
				setIsInspectorDropdownOpen,
				isTutorialMode,
				setIsTutorialMode,
				clearConsole
			}}
		>
			{children}
		</MidenContext.Provider>
	);
};

export const useMiden = () => {
	const context = useContext(MidenContext);
	if (!context) {
		throw new Error('useMiden must be used within a MidenContextProvider');
	}
	return context;
};
