'use client';

import React, {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	useRef
} from 'react';
import init from 'miden-wasm';
import { DEFAULT_FAUCET_IDS } from '@/lib/consts/defaults';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import { consumeNotes, createNoteData, generateFaucetId } from '@/lib/miden-wasm-api';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { convertToBigUint64Array } from '@/lib/utils';
import { Account, AccountProps } from '@/lib/account';
import { createP2IDRNote, createSwapNote, Note } from '@/lib/notes';
import { createP2IDNote } from '@/lib/notes/p2id';
import { EditorFiles } from '@/lib/files';
import { AccountUpdates } from '@/lib/types';
import json5 from 'json5';
import { debounce } from 'lodash';

type Tabs = 'transaction' | 'assets';
type StorageDiffs = Record<
	number,
	{
		old?: BigUint64Array;
		new: BigUint64Array;
	}
>;

type Faucets = {
	[key: string]: string;
};

interface MidenContextProps {
	isInitialized: boolean;
	files: EditorFiles;
	selectedFileId: string | null;
	selectedTab: Tabs;
	accounts: Record<string, Account>;
	notes: Record<string, Note>;
	latestConsumedNotes: Record<string, Note>;
	selectedTransactionAccountId: string | null;
	isCollapsedTabs: boolean;
	selectedTransactionNotesIds: string[];
	isExecutingTransaction: boolean;
	blockNumber: number;
	accountUpdates: AccountUpdates | null;
	accountStorageDiffs: StorageDiffs;
	setBlockNumber: (blockNumber: number) => void;
	createSampleP2IDNote: () => void;
	createSampleP2IDRNote: () => void;
	updateFileContent: (fileId: string, content: string) => void;
	disableWalletComponent: (accountId: string) => void;
	disableAuthComponent: (accountId: string) => void;
	enableWalletComponent: (accountId: string) => void;
	enableAuthComponent: (accountId: string) => void;
	createAccount: () => void;
	selectTransactionNote: (noteId: string) => void;
	removeTransactionNote: (noteId: string) => void;
	selectTransactionAccount: (accountId: string) => void;
	removeTransactionAccount: () => void;
	selectFile: (fileId: string) => void;
	closeFile: (fileId: string) => void;
	selectTab: (tab: Tabs) => void;
	executeTransaction: () => void;
	collapseTabs: () => void;
	createNewNote: () => void;
	createSampleSwapNotes: () => void;
	deleteNote: (noteId: string) => void;
	deleteAccount: (accountId: string) => void;
	consoleLogs: { message: string; type: 'info' | 'error' }[];
	addInfoLog: (message: string) => void;
	addErrorLog: (message: string) => void;
	updateAccountAssetAmount: (
		accountId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => void;
	updateNoteAssetAmount: (
		noteId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => void;
	firstExecuteClick: boolean;
	toggleFisrtExecuteClick: () => void;
	faucets: Faucets;
	createFaucet: (name: string, amount: bigint, accountId: string) => void;
	createNoteFaucet: (name: string, amount: bigint, noteId: string) => void;
	handleChangeInput: (noteId: string, newInput: string, index: number) => void;
	updateRecipientDigest: (noteId: string) => void;
	setNoteTag: (noteId: string, tag: number) => void;
	setNoteAux: (noteId: string, aux: bigint) => void;
	handleChangeStorage: (
		accountId: string,
		newValue: string,
		index: number,
		subIndex: number
	) => void;
	createNewStorageSlot: (accountId: string) => void;
	isInspectorDropdownOpen: boolean;
	setIsInspectorDropdownOpen: (isInspectorDropdownOpen: boolean) => void;
	setIsTutorialMode: (isTutorial: boolean) => void;
	isTutorialMode: boolean;
	clearConsole: () => void;
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	files: {},
	selectedFileId: null,
	selectedTab: 'transaction',
	accounts: {},
	notes: {},
	latestConsumedNotes: {},
	selectedTransactionAccountId: null,
	selectedTransactionNotesIds: [],
	isExecutingTransaction: false,
	isCollapsedTabs: false,
	blockNumber: 4,
	accountUpdates: null,
	accountStorageDiffs: {},
	setBlockNumber: () => {},
	createSampleP2IDNote: () => {},
	createSampleP2IDRNote: () => {},
	updateFileContent: () => {},
	disableWalletComponent: () => {},
	disableAuthComponent: () => {},
	enableWalletComponent: () => {},
	enableAuthComponent: () => {},
	createAccount: () => {},
	selectTransactionAccount: () => {},
	selectTransactionNote: () => {},
	removeTransactionNote: () => {},
	removeTransactionAccount: () => {},
	selectFile: () => {},
	closeFile: () => {},
	selectTab: () => {},
	executeTransaction: () => {},
	collapseTabs: () => {},
	createNewNote: () => {},
	createSampleSwapNotes: () => {},
	deleteNote: () => {},
	deleteAccount: () => {},
	consoleLogs: [],
	addInfoLog: () => {},
	addErrorLog: () => {},
	updateAccountAssetAmount: () => {},
	updateNoteAssetAmount: () => {},
	firstExecuteClick: false,
	toggleFisrtExecuteClick: () => {},
	faucets: {},
	createFaucet: () => {},
	createNoteFaucet: () => {},
	handleChangeInput: () => {},
	updateRecipientDigest: () => {},
	setNoteTag: () => {},
	setNoteAux: () => {},
	handleChangeStorage: () => {},
	createNewStorageSlot: () => {},
	setIsInspectorDropdownOpen: () => {},
	isInspectorDropdownOpen: false,
	setIsTutorialMode: () => {},
	isTutorialMode: false,
	clearConsole: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
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

	const setNoteTag = (noteId: string, tag: number) => {
		updateNoteById(noteId, (note) => {
			note.tag = tag;
			return note;
		});
	};

	const setNoteAux = (noteId: string, aux: bigint) => {
		updateNoteById(noteId, (note) => {
			note.aux = aux;
			return note;
		});
	};

	const isValidUint64 = (value: string): boolean => {
		if (value === '') return true;
		const MAX_UINT64 = 2n ** 64n - 1n;
		const MIN_UINT64 = 0n;
		try {
			const bigIntValue = BigInt(value);
			return bigIntValue >= MIN_UINT64 && bigIntValue <= MAX_UINT64;
		} catch (error) {
			console.error(error);
			return false;
		}
	};

	const handleChangeStorage = (
		accountId: string,
		newValue: string,
		index: number,
		subIndex: number
	) => {
		if (!isValidUint64(newValue) && newValue !== '') {
			return;
		}
		const account = accounts[accountId];
		try {
			let currentStorage: BigUint64Array[] = [];

			if (files[account!.storageFileId].content.value) {
				try {
					currentStorage = Account.parseStorage(files[account?.storageFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentStorage = [];
				}
			}
			currentStorage[index][subIndex] = BigInt(newValue);

			updateFileContent(account!.storageFileId, Account.stringifyStorage(currentStorage));
		} catch (error) {
			console.error(error);
		}
	};

	const createNewStorageSlot = (accountId: string) => {
		const account = accounts[accountId];
		try {
			let currentStorage: BigUint64Array[] = [];

			if (files[account!.storageFileId].content.value) {
				try {
					currentStorage = Account.parseStorage(files[account?.storageFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentStorage = [];
				}
			}
			currentStorage = [...currentStorage, new BigUint64Array([0n, 0n, 0n, 0n])];

			updateFileContent(account!.storageFileId, Account.stringifyStorage(currentStorage));
		} catch (error) {
			console.error(error);
		}
	};

	const handleChangeInput = (noteId: string, newInput: string, index: number) => {
		const note = notes[noteId];
		try {
			let currentInputs = [];

			if (files[note!.inputFileId].content.value) {
				try {
					currentInputs = json5.parse(files[note!.inputFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentInputs = [];
				}
			}

			if (!Array.isArray(currentInputs)) {
				currentInputs = [];
			}
			currentInputs[index] = newInput;

			updateFileContent(note!.inputFileId, JSON.stringify(currentInputs));
		} catch (error) {
			console.error(error);
		}
		updateRecipientDigest(noteId);
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

	const [accountUpdates, setAccountUpdates] = useState<AccountUpdates | null>(null);
	const [accountStorageDiffs, setAccountStorageDiffs] = useState({});

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
	const [files, setFiles] = useState<EditorFiles>({
		[TRANSACTION_SCRIPT_FILE_ID]: {
			id: TRANSACTION_SCRIPT_FILE_ID,
			name: 'Transaction script',
			content: { value: TRANSACTION_SCRIPT },
			isOpen: false,
			readonly: false,
			variant: 'script'
		}
	});
	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
	const [selectedTab, setSelectedTab] = useState<Tabs>('transaction');
	const [accounts, setAccounts] = useState<Record<string, Account>>({});
	const [notes, setNotes] = useState<Record<string, Note>>({});
	const [latestConsumedNotes, setLatestConsumedNotes] = useState<Record<string, Note>>({});
	const [selectedTransactionAccountId, setSelectedTransactionAccountId] = useState<string | null>(
		null
	);
	const [selectedTransactionNotesIds, setSelectedTransactionNotesIds] = useState<string[]>([]);

	// 1️⃣ Сохраняем текущее состояние, когда переключаемся в tutorialMode

	useEffect(() => {
		// Если мы ПЕРЕШЛИ в tutorialMode → перед этим сохраняем обычные данные
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
		// В tutorial режиме БОЛЬШЕ НИЧЕГО не сохраняем!
	}, [isTutorialMode]); // Срабатывает только при смене режима

	// 2️⃣ Автосохранение (только если НЕ tutorialMode)

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

	// add a ref to store debounce timeouts per note and delay constant
	const digestTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
	const RECIPIENT_DIGEST_DEBOUNCE_DELAY_MS = 5000;

	const updateRecipientDigest = useCallback(
		(noteId: string) => {
			// debounce per noteId
			if (digestTimeoutsRef.current[noteId]) {
				clearTimeout(digestTimeoutsRef.current[noteId]);
			}
			digestTimeoutsRef.current[noteId] = setTimeout(() => {
				const note = notes[noteId];
				const sender = accounts[note.senderId];
				const noteData = createNoteData(
					note,
					convertToBigUint64Array(json5.parse(files[note.inputFileId].content.value!)),
					files[note.scriptFileId].content.value!,
					files[sender.scriptFileId].content.value!
				);
				const recipientDigest = noteData.recipient_digest();
				updateNoteById(noteId, (note) => {
					note.recipientDigest = recipientDigest;
					return note;
				});
				delete digestTimeoutsRef.current[noteId];
			}, RECIPIENT_DIGEST_DEBOUNCE_DELAY_MS);
		},
		[accounts, files, notes]
	);

	const updateNoteById = (noteId: string, updateFn: (note: Note) => Note) => {
		setNotes((prev) => {
			const note = prev[noteId];
			const updatedNote = updateFn(note.clone());
			return { ...prev, [noteId]: updatedNote };
		});
	};

	const updateAccountById = (accountId: string, updateFn: (account: Account) => Account) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			if (!account) {
				console.error(`Account with ID ${accountId} not found.`);
				return prev;
			}
			const updatedAccount = updateFn(account.clone());
			const updatedAccounts = { ...prev, [accountId]: updatedAccount };

			return updatedAccounts;
		});
	};

	const updateFileById = useCallback((fileId: string, updateFn: (content: string) => string) => {
		setFiles((prev) => {
			const file = prev[fileId];
			if (!file) {
				console.error(`File with ID ${fileId} not found.`);
				return prev;
			}
			if (file.content.dynamic) {
				console.error(`File with ID ${fileId} is dynamic and cannot be updated.`);
				return prev;
			}
			const updatedContent = updateFn(file.content.value);
			const updatedFile = { ...file, content: { value: updatedContent } };
			const updatedFiles = { ...prev, [fileId]: updatedFile };

			return updatedFiles;
		});
	}, []);

	const selectTransactionNote = useCallback((noteId: string) => {
		setSelectedTransactionNotesIds((prev) => {
			if (prev.includes(noteId)) {
				return prev;
			}
			return [...prev, noteId];
		});
	}, []);

	const selectTransactionAccount = useCallback((accountId: string) => {
		setSelectedTransactionAccountId(accountId);
	}, []);

	const selectTab = useCallback((tab: Tabs) => {
		setSelectedTab(tab);
	}, []);

	const selectFile = useCallback((fileId: string) => {
		setFiles((prev) => {
			const prevIsOpen = prev[fileId].isOpen;
			const file = { ...prev[fileId], isOpen: true, openOrder: Date.now() };
			if (!prevIsOpen) {
				file.positionOrder = Date.now();
			}
			return {
				...prev,
				[fileId]: file
			};
		});
		setSelectedFileId(fileId);
	}, []);

	const closeFile = useCallback(
		(fileId: string) => {
			setFiles((prev) => {
				const newFiles = { ...prev, [fileId]: { ...prev[fileId], isOpen: false } };
				if (selectedFileId === fileId) {
					const openFiles = Object.values(newFiles).filter((file) => file.isOpen);
					if (openFiles.length > 0) {
						const fileWithHighestOrder = openFiles.reduce((prev, current) => {
							return (prev.openOrder || 0) > (current.openOrder || 0) ? prev : current;
						});
						setSelectedFileId(fileWithHighestOrder.id);
					} else {
						setSelectedFileId(null);
					}
				}
				return newFiles;
			});
		},
		[selectedFileId]
	);

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
		//
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
			updateFileById(account.storageFileId, () => {
				return Account.stringifyStorage(output.storage);
			});
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

			setLatestConsumedNotes(() => {
				const newLatestConsumedNotes: Record<string, Note> = {};

				consumedNotesIds.forEach((consumedNoteId) => {
					if (notes[consumedNoteId]) {
						newLatestConsumedNotes[consumedNoteId] = notes[consumedNoteId];
					}
				});

				return newLatestConsumedNotes;
			});

			setSelectedTransactionNotesIds([]);

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
		selectedTransactionAccountId,
		selectedTransactionNotesIds,
		updateFileById
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

	const createAccount = useCallback(() => {
		const newAccountName = Account.getNextAccountName(accounts);
		const { account, newFiles } = Account.new(newAccountName);

		setAccounts((prev) => ({ ...prev, [account.id.id]: account }));

		if (Object.values(accounts).length === 0) {
			selectTransactionAccount(account.id.id);
		}
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts, selectTransactionAccount]);

	const disableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.disableWalletComponent();
			return account;
		});
	}, []);

	const disableAuthComponent = useCallback(
		(accountId: string) => {
			updateAccountById(accountId, (account) => {
				const newStorage = account.disableAuthComponent(
					Account.parseStorage(files[account.storageFileId].content.value!)
				);
				updateFileById(account.storageFileId, () => {
					return Account.stringifyStorage(newStorage);
				});
				return account;
			});
		},
		[files, updateFileById]
	);

	const enableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.enableWalletComponent();
			return account;
		});
	}, []);

	const enableAuthComponent = useCallback(
		(accountId: string) => {
			updateAccountById(accountId, (account) => {
				const newStorage = account.enableAuthComponent(
					Account.parseStorage(files[account.storageFileId].content.value!)
				);
				updateFileById(account.storageFileId, () => {
					return Account.stringifyStorage(newStorage);
				});
				return account;
			});
		},
		[files, updateFileById]
	);
	const updateFileContent = useCallback((fileId: string, content: string) => {
		setFiles((prev) => {
			const updatedFile = {
				...prev[fileId],
				content: prev[fileId].content.dynamic
					? prev[fileId].content
					: { ...prev[fileId].content, value: content }
			};

			const updatedFiles = { ...prev, [fileId]: updatedFile };

			return updatedFiles;
		});
	}, []);

	const createSampleSwapNotes = useCallback(() => {
		const receiver = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId]
			: Object.values(accounts)[0];
		const sender = Object.values(accounts).filter((account) => account.id !== receiver.id)[0];
		const offeredAssetOfSender = sender.assets[0];
		const requestedAssetOfReceiver = receiver.assets.filter(
			(asset) => asset.faucetId !== offeredAssetOfSender.faucetId
		)[0];

		const offeredAsset = { ...offeredAssetOfSender, amount: 10n };
		const requestedAsset = { ...requestedAssetOfReceiver, amount: 10n };

		const { note, newFiles, paybackNote } = createSwapNote({
			senderId: sender.id,
			receiverId: receiver.id,
			offeredAsset,
			requestedAsset,
			name: 'SWAP',
			senderScript: files[sender.scriptFileId].content.value!
		});

		updateAccountById(sender.id.id, (account) => {
			account.updateAssetAmount(offeredAsset.faucetId, (amount) => amount - offeredAsset.amount);
			return account;
		});

		setNotes((prev) => ({ ...prev, [note.id]: note, [paybackNote.id]: paybackNote }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts, selectedTransactionAccountId, files]);

	const createSampleP2IDNote = useCallback(() => {
		const receiverId = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId].id
			: Object.values(accounts)[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id !== receiverId)[0].id;
		const assets = [{ ...accounts[senderId.id].assets[0], amount: 10n }];
		const sender = accounts[senderId.id];

		const { note, newFiles } = createP2IDNote({
			senderId,
			receiverId,
			assets,
			name: 'P2ID',
			senderScript: files[sender.scriptFileId].content.value!
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts, selectedTransactionAccountId]);

	const createSampleP2IDRNote = useCallback(() => {
		const receiverId = selectedTransactionAccountId
			? accounts[selectedTransactionAccountId].id
			: Object.values(accounts)[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id.id !== receiverId.id)[0]
			.id;
		const sender = accounts[senderId.id];
		const assets = [{ ...sender.assets[0], amount: 10n }];
		const { note, newFiles } = createP2IDRNote({
			senderId,
			receiverId,
			reclaimBlockHeight: 20,
			assets,
			name: 'P2IDR',
			senderScript: files[sender.scriptFileId].content.value!
		});

		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts, selectedTransactionAccountId, files]);

	const createSampleNote = useCallback(() => {
		const senderId = Object.values(accounts)[0].id;
		const { note, newFiles } = Note.createEmptyNote({
			senderId: senderId.id,
			assets: [],
			name: 'NOTE'
		});

		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts]);

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

				setFiles((prev) => ({ ...prev, ...accountFiles, ...noteFiles }));
				setNotes(parsedNotes);
				setFaucets(faucets);
				setIsInitialized(true);

				if (Object.entries(accounts)[0]) {
					setSelectedTransactionAccountId(Object.entries(accounts)[0][0]);
				}
			})
			.catch((error) => {
				alert(`Failed to initialize WASM: ${error}`);
			});
	}, [isTutorialMode]);

	const removeTransactionNote = useCallback((noteId: string) => {
		setSelectedTransactionNotesIds((prev) => prev.filter((id) => id !== noteId));
	}, []);

	const removeTransactionAccount = useCallback(() => {
		setSelectedTransactionAccountId(null);
	}, []);

	const removeFile = useCallback((fileId: string) => {
		setFiles((prev) => {
			const newFiles = { ...prev };
			delete newFiles[fileId];
			return newFiles;
		});
	}, []);

	const deleteNote = useCallback(
		(noteId: string) => {
			setNotes((prev) => {
				const newNotes = { ...prev };
				const note = newNotes[noteId];
				if (note) {
					removeFile(note.inputFileId);
					removeFile(note.scriptFileId);
					removeFile(note.metadataFileId);
					removeFile(note.vaultFileId);
					setSelectedTransactionNotesIds((prev) => prev.filter((id) => id !== noteId));
				}
				delete newNotes[noteId];
				return newNotes;
			});
		},
		[removeFile]
	);

	const deleteAccount = useCallback(
		(accountId: string) => {
			setAccounts((prev) => {
				const newAccounts = { ...prev };
				const account = newAccounts[accountId];
				if (account) {
					removeFile(account.scriptFileId);
					removeFile(account.vaultFileId);
					removeFile(account.metadataFileId);
					removeFile(account.storageFileId);
					delete newAccounts[accountId];
				}

				return newAccounts;
			});
		},
		[removeFile]
	);

	const updateAccountAssetAmount = (
		accountId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => {
		updateAccountById(accountId, (account) => {
			account.updateAssetAmount(faucetId, updateFn);
			return account;
		});
	};
	const updateNoteAssetAmount = (
		noteId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => {
		setNotes((prev) => {
			const note = prev[noteId];
			if (!note) {
				console.error(`Note with ID ${noteId} not found.`);
				return prev;
			}
			note.updateAssetAmount(faucetId, updateFn);
			const updatedNotes = { ...prev, [noteId]: note };

			return updatedNotes;
		});
	};

	return (
		<MidenContext.Provider
			value={{
				isInitialized,
				files,
				selectedFileId,
				selectedTab,
				accounts,
				notes,
				latestConsumedNotes,
				selectedTransactionAccountId,
				selectedTransactionNotesIds,
				isExecutingTransaction,
				isCollapsedTabs,
				blockNumber,
				accountUpdates,
				accountStorageDiffs,
				setBlockNumber,
				createSampleP2IDNote,
				createSampleP2IDRNote,
				updateFileContent,
				disableWalletComponent,
				disableAuthComponent,
				enableWalletComponent,
				enableAuthComponent,
				createAccount,
				selectTransactionAccount,
				selectTransactionNote,
				removeTransactionNote,
				removeTransactionAccount,
				selectFile,
				closeFile,
				selectTab,
				executeTransaction,
				collapseTabs,
				createNewNote: createSampleNote,
				createSampleSwapNotes,
				deleteNote,
				deleteAccount,
				consoleLogs,
				addErrorLog,
				addInfoLog,
				updateAccountAssetAmount,
				updateNoteAssetAmount,
				firstExecuteClick,
				toggleFisrtExecuteClick,
				createFaucet,
				faucets,
				createNoteFaucet,
				handleChangeInput,
				updateRecipientDigest,
				setNoteTag,
				setNoteAux,
				handleChangeStorage,
				createNewStorageSlot,
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
