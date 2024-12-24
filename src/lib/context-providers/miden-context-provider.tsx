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
import { createP2IDNote, defaultAccounts, SYSTEM_ACCOUNT_ID } from '@/lib/consts/defaults';
import { consumeNote } from '@/lib/miden-wasm-api';
import { ACCOUNT_SCRIPT } from '@/lib/consts';
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

	const [files, setFiles] = useState<EditorFiles>({});
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
		const note = notes[selectedTransactionNotesIds[0]];
		const noteInputs = convertToBigUint64Array(JSON.parse(files[note.inputFileId].content));
		const output = consumeNote({
			senderId: SYSTEM_ACCOUNT_ID,
			senderScript: ACCOUNT_SCRIPT,
			receiver: account,
			receiverScript: files[account.scriptFileId].content,
			note,
			noteScript: files[note.scriptFileId].content,
			noteInputs,
			transactionScript: TRANSACTION_SCRIPT
		});
		setExecutionOutput(output);
	}, [accounts, files, notes, selectedTransactionAccountId, selectedTransactionNotesIds]);

	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully');
				const { accounts, newFiles: accountFiles } = defaultAccounts();
				console.log(' accounts', accounts);
				setAccounts(accounts);
				const defaultAccount = Object.values(accounts)[0];
				setSelectedAccountId(defaultAccount.id);
				const { note, newFiles: noteFiles } = createP2IDNote({
					forAccountId: defaultAccount.idBigInt
				});
				setFiles({ ...accountFiles, ...noteFiles });
				setNotes({ [note.id]: note });
				setSelectedNoteId(note.id);
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
