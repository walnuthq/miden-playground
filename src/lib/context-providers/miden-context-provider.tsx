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
import { ExecutionOutput } from '@/lib/types';
import { defaultAccounts, defaultNotes } from '@/lib/consts/defaults';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	TRANSACTION_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import { consumeNotes } from '@/lib/miden-wasm-api';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { convertToBigUint64Array } from '@/lib/utils';
import { Account, ACCOUNT_AUTH_SCRIPT, ACCOUNT_WALLET_SCRIPT } from '@/lib/account';
import { createP2IDRNote, createSwapNote, Note } from '@/lib/notes';
import { EditorFiles } from '@/lib/files';
import { createP2IDNote } from '@/lib/notes/p2id';
import { useToast } from '@/hooks/use-toast';

type Tabs = 'transaction' | 'assets';

interface MidenContextProps {
	isInitialized: boolean;
	files: EditorFiles;
	selectedFileId: string | null;
	selectedTab: Tabs;
	accounts: Record<string, Account>;
	notes: Record<string, Note>;
	selectedTransactionAccountId: string | null;
	isCollapsedTabs: boolean;
	selectedTransactionNotesIds: string[];
	executionOutput: ExecutionOutput | null;
	isExecutingTransaction: boolean;
	createSampleP2IDNote: () => void;
	createSampleP2IDRNote: () => void;
	updateFileContent: (fileId: string, content: string) => void;
	disableWalletComponent: (accountId: string) => void;
	disableAuthComponent: (accountId: string) => void;
	enableWalletComponent: (accountId: string) => void;
	enableAuthComponent: (accountId: string) => void;
	createAccount: () => void;
	setExecutionOutput: (output: ExecutionOutput) => void;
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
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	files: {},
	selectedFileId: null,
	selectedTab: 'transaction',
	accounts: {},
	notes: {},
	selectedTransactionAccountId: null,
	selectedTransactionNotesIds: [],
	executionOutput: null,
	isExecutingTransaction: false,
	isCollapsedTabs: false,
	createSampleP2IDNote: () => {},
	createSampleP2IDRNote: () => {},
	updateFileContent: () => {},
	disableWalletComponent: () => {},
	disableAuthComponent: () => {},
	enableWalletComponent: () => {},
	enableAuthComponent: () => {},
	createAccount: () => {},
	setExecutionOutput: () => {},
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
	deleteAccount: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { toast } = useToast();

	const [isInitialized, setIsInitialized] = useState(false);
	const [isCollapsedTabs, setCollapsedTabs] = useState(false);
	const [isExecutingTransaction, setIsExecutingTransaction] = useState(false);

	const collapseTabs = () => {
		setCollapsedTabs(!isCollapsedTabs);
	};

	const [files, setFiles] = useState<EditorFiles>({
		[TRANSACTION_SCRIPT_FILE_ID]: {
			id: TRANSACTION_SCRIPT_FILE_ID,
			name: 'Transaction script',
			content: { value: TRANSACTION_SCRIPT },
			isOpen: false,
			readonly: false,
			variant: 'script'
		},
		[WALLET_COMPONENT_SCRIPT_FILE_ID]: {
			id: WALLET_COMPONENT_SCRIPT_FILE_ID,
			name: 'Wallet component',
			content: { value: ACCOUNT_WALLET_SCRIPT },
			isOpen: false,
			readonly: true,
			variant: 'script'
		},
		[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID]: {
			id: AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
			name: 'Auth component',
			content: { value: ACCOUNT_AUTH_SCRIPT },
			isOpen: false,
			readonly: true,
			variant: 'script'
		}
	});
	const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
	const [selectedTab, setSelectedTab] = useState<Tabs>('transaction');
	const [accounts, setAccounts] = useState<Record<string, Account>>({});
	const [notes, setNotes] = useState<Record<string, Note>>({});
	const [selectedTransactionAccountId, setSelectedTransactionAccountId] = useState<string | null>(
		null
	);
	const [selectedTransactionNotesIds, setSelectedTransactionNotesIds] = useState<string[]>([]);
	const [executionOutput, setExecutionOutput] = useState<ExecutionOutput | null>(null);

	const updateAccountById = (accountId: string, updateFn: (account: Account) => Account) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			if (!account) {
				console.error(`Account with ID ${accountId} not found.`);
				return prev;
			}
			const updatedAccount = updateFn(account.clone());
			return { ...prev, [accountId]: updatedAccount };
		});
	};

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
			toast({
				title: 'No account selected',
				description: 'Please select an account to execute the transaction',
				variant: 'destructive'
			});
			return;
		}
		if (selectedTransactionNotesIds.length === 0) {
			toast({
				title: 'No notes selected',
				description: 'Please select at least one note to execute the transaction',
				variant: 'destructive'
			});
			return;
		}
		setIsExecutingTransaction(true);
		const account = accounts[selectedTransactionAccountId];
		const transactionNotes = selectedTransactionNotesIds.map((noteId) => {
			const sender = accounts[notes[noteId].senderIdHex];
			return {
				note: notes[noteId],
				noteScript: files[notes[noteId].scriptFileId].content.value!,
				noteInputs: convertToBigUint64Array(
					JSON.parse(files[notes[noteId].inputFileId].content.value!)
				),
				senderScript: files[sender.scriptFileId].content.value!
			};
		});
		try {
			const output = consumeNotes({
				receiver: account,
				receiverScript: files[account.scriptFileId].content.value!,
				notes: transactionNotes,
				transactionScript: files[TRANSACTION_SCRIPT_FILE_ID].content.value!
			});
			console.log('output', output);
			setExecutionOutput(output);
			updateAccountById(selectedTransactionAccountId, (account) => {
				account.assets = output.assets;
				account.storage = output.storage;
				return account;
			});
			toast({
				title: 'Execution successful'
			});
		} catch (error) {
			toast({
				title: 'Execution failed',
				description: 'Error: ' + error,
				variant: 'destructive'
			});
		}

		setIsExecutingTransaction(false);
	}, [accounts, files, notes, selectedTransactionAccountId, selectedTransactionNotesIds, toast]);

	const createAccount = useCallback(() => {
		const newAccountName = Account.getNextAccountName(accounts);
		const { account, newFiles } = Account.new(newAccountName);
		setAccounts((prev) => {
			return { ...prev, [account.idHex]: account };
		});
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts]);

	const disableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.disableWalletComponent();
			return account;
		});
	}, []);

	const disableAuthComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.disableAuthComponent();
			return account;
		});
	}, []);

	const enableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.enableWalletComponent();
			return account;
		});
	}, []);

	const enableAuthComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.enableAuthComponent();
			return account;
		});
	}, []);

	const updateFileContent = useCallback((fileId: string, content: string) => {
		setFiles((prev) => ({ ...prev, [fileId]: { ...prev[fileId], content: { value: content } } }));
	}, []);

	const createSampleSwapNotes = useCallback(() => {
		const newNoteName = Note.getNextNoteName('SWAP', notes);
		const sender = Object.values(accounts)[0];
		const receiver = Object.values(accounts).filter((account) => account.id !== sender.id)[0];
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
			name: newNoteName
		});
		updateAccountById(sender.idHex, (account) => {
			account.updateAssetAmount(offeredAsset.faucetId, (amount) => amount - offeredAsset.amount);
			return account;
		});
		setNotes((prev) => ({ ...prev, [note.id]: note, [paybackNote.id]: paybackNote }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [notes, accounts]);

	const createSampleP2IDNote = useCallback(() => {
		const newNoteName = Note.getNextNoteName('P2ID', notes);
		const receiverId = Object.values(accounts)[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id !== receiverId)[0].id;
		const { note, newFiles } = createP2IDNote({
			senderId,
			receiverId,
			assets: [],
			name: newNoteName
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [notes, accounts]);

	const createSampleP2IDRNote = useCallback(() => {
		const newNoteName = Note.getNextNoteName('P2IDR', notes);
		const receiverId = accounts[0].id;
		const senderId = Object.values(accounts).filter((account) => account.id !== receiverId)[0].id;
		const { note, newFiles } = createP2IDRNote({
			senderId,
			receiverId,
			reclaimBlockHeight: 100,
			assets: [],
			name: newNoteName
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [notes, accounts]);

	const createSampleNote = useCallback(() => {
		const newNoteName = Note.getNextNoteName('NOTE', notes);
		const senderId = Object.values(accounts)[0].id;
		const { note, newFiles } = Note.createEmptyNote({
			senderId,
			assets: [],
			name: newNoteName
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [notes, accounts]);

	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully');
				const { accounts, newFiles: accountFiles } = defaultAccounts();
				setAccounts(accounts);
				const defaultAccount1 = Object.values(accounts)[0];
				const defaultAccount2 = Object.values(accounts)[1];
				const { notes, newFiles: noteFiles } = defaultNotes(defaultAccount1.id, defaultAccount2.id);
				setFiles((prev) => ({ ...prev, ...accountFiles, ...noteFiles }));
				setNotes(notes);
				setIsInitialized(true);
			})
			.catch((error: unknown) => {
				alert(`Failed to initialize WASM: ${error}`);
			});
	}, []);

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

	return (
		<MidenContext.Provider
			value={{
				isInitialized,
				files,
				selectedFileId,
				selectedTab,
				accounts,
				notes,
				selectedTransactionAccountId,
				selectedTransactionNotesIds,
				executionOutput,
				isExecutingTransaction,
				isCollapsedTabs,
				createSampleP2IDNote,
				createSampleP2IDRNote,
				updateFileContent,
				disableWalletComponent,
				disableAuthComponent,
				enableWalletComponent,
				enableAuthComponent,
				createAccount,
				setExecutionOutput,
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
				deleteAccount
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
