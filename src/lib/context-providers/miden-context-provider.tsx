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
import { Account, Note } from '@/lib/types';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { consumeNote } from '@/lib/wasm-api';
import { defaultAccounts, defaultNotes } from '@/lib/consts/defaults';

interface MidenContextProps {
	accounts: Account[];
	selectedAccount: Account;
	isInitialized: boolean;
	consoleLogs: { message: string; type: 'info' | 'error' }[];
	notes: Note[];

	setAccountScript: (script: string) => void;
	consumeNote: (noteId: string) => void;
	addInfoLog: (message: string) => void;
	addErrorLog: (message: string) => void;
	toggleWalletComponent: () => void;
	toggleAuthComponent: () => void;
	selectAccount: (accountId: string) => void;
}

export const MidenContext = createContext<MidenContextProps>({
	accounts: [],
	selectedAccount: {} as Account,
	isInitialized: false,
	consoleLogs: [],
	notes: [],

	setAccountScript: () => {},
	consumeNote: () => {},
	addInfoLog: () => {},
	addErrorLog: () => {},
	toggleWalletComponent: () => {},
	toggleAuthComponent: () => {},
	selectAccount: () => {}
});

const fetchSecretKey = async () => {
	const response = await fetch('/secret-key.bin');
	const arrayBuffer = await response.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);
	return uint8Array;
};

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [isInitialized, setIsInitialized] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [notes, setNotes] = useState<Note[]>(defaultNotes());
	const [consoleLogs, setConsoleLogs] = useState<{ message: string; type: 'info' | 'error' }[]>([]);

	const [accounts, setAccounts] = useState<Account[]>(defaultAccounts());
	const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[1]);

	const addInfoLog = useCallback((message: string) => {
		console.log(message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'info' }]);
	}, []);

	const addErrorLog = useCallback((message: string) => {
		console.log('ERROR: ', message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'error' }]);
	}, []);

	const toggleWalletComponent = useCallback(() => {
		const updatedAccount = { ...selectedAccount, isWallet: !selectedAccount.isWallet };
		setSelectedAccount(updatedAccount);
		setAccounts((prev) =>
			prev.map((account) => (account.id === selectedAccount.id ? updatedAccount : account))
		);
	}, [selectedAccount]);

	const toggleAuthComponent = useCallback(() => {
		const updatedAccount = { ...selectedAccount, isAuth: !selectedAccount.isAuth };
		setSelectedAccount(updatedAccount);
		setAccounts((prev) =>
			prev.map((account) => (account.id === selectedAccount.id ? updatedAccount : account))
		);
	}, [selectedAccount]);

	const selectAccount = useCallback(
		(accountId: string) => {
			const account = accounts.find((acc) => acc.id === accountId);
			if (!account) {
				addErrorLog(`Account with id ${accountId} not found`);
				return;
			}
			setSelectedAccount(account);
		},
		[accounts, addErrorLog]
	);

	useEffect(() => {
		Promise.all([init(), fetchSecretKey()])
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.then(([_, secretKey]) => {
				console.log('WASM initialized successfully');
				setAccounts((prevAccounts) =>
					prevAccounts.map((account) => ({
						...account,
						secretKey: secretKey
					}))
				);
				setSelectedAccount((prev) => ({
					...prev,
					secretKey: secretKey
				}));
				addInfoLog('App initialized...');
				setIsInitialized(true);
			})
			.catch((error: unknown) => {
				addErrorLog(`Failed to initialize WASM: ${error}`);
			});
	}, [addErrorLog, addInfoLog]);

	const consumeNoteHandler = (noteId: string) => {
		const note = notes.find((note) => note.id === noteId);
		const senderAccount = accounts.find((acc) => acc.id === note?.creatorId);
		if (!note || !senderAccount) return;
		try {
			const newAccountState = consumeNote({
				sender: senderAccount,
				receiver: selectedAccount,
				note,
				transactionScript: TRANSACTION_SCRIPT
			});
			const updatedAccount = { ...selectedAccount, assets: newAccountState.assets };
			setSelectedAccount(updatedAccount);
			setAccounts((prevAccounts) =>
				prevAccounts.map((acc) => (acc.id === selectedAccount.id ? updatedAccount : acc))
			);
			setNotes((prevNotes) =>
				prevNotes.map((n) => (n.id === noteId ? { ...n, isConsumed: true } : n))
			);
			addInfoLog('');
			addInfoLog('Succesfully created transaction.');
			addInfoLog('The transaction did not generate any output notes.');
			addInfoLog(`The ${note.name} Note was consumed.`);
		} catch (error) {
			addErrorLog(`Error consuming note: ${error}`);
		}
	};

	const setAccountScript = useCallback(
		(script: string) => {
			const updatedAccount = { ...selectedAccount, script };
			setSelectedAccount(updatedAccount);
			setAccounts((prev) =>
				prev.map((account) => (account.id === selectedAccount.id ? updatedAccount : account))
			);
		},
		[selectedAccount]
	);

	return (
		<MidenContext.Provider
			value={{
				accounts,
				selectedAccount,
				notes,
				consumeNote: consumeNoteHandler,
				consoleLogs,
				addInfoLog,
				addErrorLog,
				isInitialized,
				setAccountScript,
				toggleWalletComponent,
				toggleAuthComponent,
				selectAccount
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
