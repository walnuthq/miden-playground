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
import { createP2IDRNote, Note } from '@/lib/notes';
import { EditorFiles } from '@/lib/files';
import { createP2IDNote } from '@/lib/notes/p2id';

type Tabs = 'transaction' | 'accounts' | 'notes';

interface MidenContextProps {
	isInitialized: boolean;
	files: EditorFiles;
	selectedFileId: string | null;
	selectedTab: Tabs;
	accounts: Record<string, Account>;
	selectedAccountId: string;
	notes: Record<string, Note>;
	selectedNoteId: string;
	selectedTransactionAccountId: string | null;
	isCollapsedTabs: boolean;
	selectedTransactionNotesIds: string[];
	executionOutput: ExecutionOutput | null;
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
	selectTransactionAccount: (accountId: string) => void;
	selectAccount: (accountId: string) => void;
	selectNote: (noteId: string) => void;
	selectFile: (fileId: string) => void;
	closeFile: (fileId: string) => void;
	selectTab: (tab: Tabs) => void;
	executeTransaction: () => void;
	collapsedTabs: () => void;
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	files: {},
	selectedFileId: null,
	selectedTab: 'transaction',
	accounts: {},
	selectedAccountId: '',
	notes: {},
	selectedNoteId: '',
	selectedTransactionAccountId: null,
	selectedTransactionNotesIds: [],
	executionOutput: null,
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
	selectAccount: () => {},
	selectNote: () => {},
	selectFile: () => {},
	closeFile: () => {},
	selectTab: () => {},
	executeTransaction: () => {},
	collapsedTabs: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isCollapsedTabs, setCollapsedTabs] = useState(false);

	const collapsedTabs = useCallback(() => {
		setCollapsedTabs((prev) => !prev);
	}, []);

	const [files, setFiles] = useState<EditorFiles>({
		[TRANSACTION_SCRIPT_FILE_ID]: {
			id: TRANSACTION_SCRIPT_FILE_ID,
			name: 'Transaction script',
			content: { value: TRANSACTION_SCRIPT },
			isOpen: false,
			readonly: true,
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
	const [selectedAccountId, setSelectedAccountId] = useState<string>('');
	const [notes, setNotes] = useState<Record<string, Note>>({});
	const [selectedNoteId, setSelectedNoteId] = useState<string>('');
	const [selectedTransactionAccountId, setSelectedTransactionAccountId] = useState<string | null>(
		null
	);
	const [selectedTransactionNotesIds, setSelectedTransactionNotesIds] = useState<string[]>([]);
	const [executionOutput, setExecutionOutput] = useState<ExecutionOutput | null>(null);

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

	const selectAccount = useCallback((accountId: string) => {
		setSelectedAccountId(accountId);
	}, []);

	const selectNote = useCallback((noteId: string) => {
		setSelectedNoteId(noteId);
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
		if (!selectedTransactionAccountId) return;
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
		const output = consumeNotes({
			receiver: account,
			receiverScript: files[account.scriptFileId].content.value!,
			notes: transactionNotes,
			transactionScript: files[TRANSACTION_SCRIPT_FILE_ID].content.value!
		});
		setExecutionOutput(output);
		setAccounts((prev) => {
			const account = prev[selectedTransactionAccountId];
			account.assets = output.assets;
			account.storage = output.storage;
			return { ...prev, [selectedTransactionAccountId]: account };
		});
	}, [accounts, files, notes, selectedTransactionAccountId, selectedTransactionNotesIds]);

	const createAccount = useCallback(() => {
		const newAccountName = Account.getNextAccountName(accounts);
		const { account, newFiles } = Account.new(newAccountName);

		setAccounts((prev) => {
			return { ...prev, [account.idHex]: account };
		});
		setSelectedAccountId(account.idHex);
		setFiles((prev) => ({ ...prev, ...newFiles }));
	}, [accounts]);

	const disableWalletComponent = useCallback((accountId: string) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			account.disableWalletComponent();
			return { ...prev, [accountId]: account };
		});
	}, []);

	const disableAuthComponent = useCallback((accountId: string) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			account.disableAuthComponent();
			return { ...prev, [accountId]: account };
		});
	}, []);

	const enableWalletComponent = useCallback((accountId: string) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			account.enableWalletComponent();
			return { ...prev, [accountId]: account };
		});
	}, []);

	const enableAuthComponent = useCallback((accountId: string) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			account.enableAuthComponent();
			return { ...prev, [accountId]: account };
		});
	}, []);

	const updateFileContent = useCallback((fileId: string, content: string) => {
		console.log('UPDATE FILE CONTENT', fileId);
		setFiles((prev) => ({ ...prev, [fileId]: { ...prev[fileId], content: { value: content } } }));
	}, []);

	const createSampleP2IDNote = useCallback(() => {
		const newNoteName = Note.getNextNoteName('P2ID', notes);
		const receiverId = accounts[selectedAccountId].id;
		const senderId = Object.values(accounts).filter((account) => account.id !== receiverId)[0].id;
		const { note, newFiles } = createP2IDNote({
			senderId,
			receiverId,
			assets: [],
			name: newNoteName
		});
		setNotes((prev) => ({ ...prev, [note.id]: note }));
		setFiles((prev) => ({ ...prev, ...newFiles }));
		setSelectedNoteId(note.id);
	}, [notes, accounts, selectedAccountId]);

	const createSampleP2IDRNote = useCallback(() => {
		const newNoteName = Note.getNextNoteName('P2IDR', notes);
		const receiverId = accounts[selectedAccountId].id;
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
		setSelectedNoteId(note.id);
	}, [notes, accounts, selectedAccountId]);

	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully');
				const { accounts, newFiles: accountFiles } = defaultAccounts();
				setAccounts(accounts);
				const defaultAccount1 = Object.values(accounts)[0];
				const defaultAccount2 = Object.values(accounts)[1];
				setSelectedAccountId(defaultAccount1.idHex);
				const { notes, newFiles: noteFiles } = defaultNotes(defaultAccount1.id, defaultAccount2.id);
				setFiles((prev) => ({ ...prev, ...accountFiles, ...noteFiles }));
				setNotes(notes);
				setSelectedNoteId(Object.values(notes)[0].id);
				setIsInitialized(true);
			})
			.catch((error: unknown) => {
				alert(`Failed to initialize WASM: ${error}`);
			});
	}, []);

	return (
		<MidenContext.Provider
			value={{
				isInitialized,
				files,
				selectedFileId,
				selectedTab,
				accounts,
				selectedAccountId,
				notes,
				selectedNoteId,
				selectedTransactionAccountId,
				selectedTransactionNotesIds,
				executionOutput,
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
				selectAccount,
				selectNote,
				selectFile,
				closeFile,
				selectTab,
				executeTransaction,
				collapsedTabs
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
