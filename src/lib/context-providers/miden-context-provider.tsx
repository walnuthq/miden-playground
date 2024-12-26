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
import { Account, EditorFiles, ExecutionOutput, Note } from '@/lib/types';
import { defaultAccounts, defaultNotes } from '@/lib/consts/defaults';
import {
	ACCOUNT_AUTH_SCRIPT,
	ACCOUNT_WALLET_SCRIPT,
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	TRANSACTION_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import { consumeNotes } from '@/lib/miden-wasm-api';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { convertToBigUint64Array } from '@/lib/utils';

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
	selectedTransactionNotesIds: string[];
	executionOutput: ExecutionOutput | null;
	setExecutionOutput: (output: ExecutionOutput) => void;
	selectTransactionNote: (noteId: string) => void;
	selectTransactionAccount: (accountId: string) => void;
	selectAccount: (accountId: string) => void;
	selectNote: (noteId: string) => void;
	selectFile: (fileId: string) => void;
	closeFile: (fileId: string) => void;
	selectTab: (tab: Tabs) => void;
	executeTransaction: () => void;
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
	setExecutionOutput: () => {},
	selectTransactionAccount: () => {},
	selectTransactionNote: () => {},
	selectAccount: () => {},
	selectNote: () => {},
	selectFile: () => {},
	closeFile: () => {},
	selectTab: () => {},
	executeTransaction: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [isInitialized, setIsInitialized] = useState(false);

	const [files, setFiles] = useState<EditorFiles>({
		[TRANSACTION_SCRIPT_FILE_ID]: {
			id: TRANSACTION_SCRIPT_FILE_ID,
			name: 'Transaction script',
			content: TRANSACTION_SCRIPT,
			isOpen: false,
			readonly: true,
			variant: 'script'
		},
		[WALLET_COMPONENT_SCRIPT_FILE_ID]: {
			id: WALLET_COMPONENT_SCRIPT_FILE_ID,
			name: 'Wallet component script',
			content: ACCOUNT_WALLET_SCRIPT,
			isOpen: false,
			readonly: true,
			variant: 'script'
		},
		[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID]: {
			id: AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
			name: 'Authentication component script',
			content: ACCOUNT_AUTH_SCRIPT,
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
		setFiles((prev) => ({
			...prev,
			[fileId]: { ...prev[fileId], isOpen: true }
		}));
		setSelectedFileId(fileId);
	}, []);

	const closeFile = useCallback(
		(fileId: string) => {
			setFiles((prev) => ({
				...prev,
				[fileId]: { ...prev[fileId], isOpen: false }
			}));
			if (selectedFileId === fileId) {
				setSelectedFileId(null);
			}
		},
		[selectedFileId]
	);

	const executeTransaction = useCallback(() => {
		if (!selectedTransactionAccountId) return;
		const account = accounts[selectedTransactionAccountId];
		const transactionNotes = selectedTransactionNotesIds.map((noteId) => {
			const sender = accounts[notes[noteId].noteMetadata.senderId.toString(16)];
			return {
				note: notes[noteId],
				noteScript: files[notes[noteId].scriptFileId].content,
				noteInputs: convertToBigUint64Array(JSON.parse(files[notes[noteId].inputFileId].content)),
				senderScript: files[sender.scriptFileId].content
			};
		});
		const output = consumeNotes({
			receiver: account,
			receiverScript: files[account.scriptFileId].content,
			notes: transactionNotes,
			transactionScript: files[TRANSACTION_SCRIPT_FILE_ID].content
		});
		setExecutionOutput(output);
	}, [accounts, files, notes, selectedTransactionAccountId, selectedTransactionNotesIds]);

	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully');
				const { accounts, newFiles: accountFiles } = defaultAccounts();
				setAccounts(accounts);
				const defaultAccount1 = Object.values(accounts)[0];
				const defaultAccount2 = Object.values(accounts)[1];
				setSelectedAccountId(defaultAccount1.id);
				const { notes, newFiles: noteFiles } = defaultNotes(
					defaultAccount1.idBigInt,
					defaultAccount2.idBigInt
				);
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
				setExecutionOutput,
				selectTransactionAccount,
				selectTransactionNote,
				selectAccount,
				selectNote,
				selectFile,
				closeFile,
				selectTab,
				executeTransaction
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
