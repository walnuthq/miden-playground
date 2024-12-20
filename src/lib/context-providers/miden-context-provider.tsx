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
import { Transaction } from '@/lib/types';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
import { consumeNote } from '@/lib/miden-wasm-api';
import { defaultTransaction, defaultTransactions, SYSTEM_ACCOUNT_ID } from '@/lib/consts/defaults';
import { ACCOUNT_SCRIPT } from '@/lib/consts';

interface MidenContextProps {
	isInitialized: boolean;
	transactions: Record<string, Transaction>;
	selectedTransactionId: string | null;
	selectedTransaction: Transaction | null;
	runTransaction: () => void;
	createTransaction: () => void;
	selectTransaction: (transactionId: string) => void;
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	transactions: {},
	selectedTransactionId: null,
	selectedTransaction: null,
	runTransaction: () => {},
	createTransaction: () => {},
	selectTransaction: () => {}
});

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [isInitialized, setIsInitialized] = useState(false);

	const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
	const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

	useEffect(() => {
		init()
			.then(() => {
				console.log('WASM initialized successfully');
				setIsInitialized(true);
				setTransactions(defaultTransactions());
			})
			.catch((error: unknown) => {
				alert(`Failed to initialize WASM: ${error}`);
			});
	}, []);

	const createTransaction = useCallback(() => {
		const transaction = defaultTransaction(Object.keys(transactions).length);
		setTransactions((prev) => ({
			...prev,
			[transaction.id]: transaction
		}));
	}, [transactions]);

	const selectTransaction = useCallback((transactionId: string) => {
		setSelectedTransactionId(transactionId);
	}, []);

	const runTransaction = useCallback(() => {
		if (!selectedTransactionId) return;
		const transaction = transactions[selectedTransactionId];
		if (!transaction) return;
		console.log(transaction);
		const result = consumeNote({
			senderId: SYSTEM_ACCOUNT_ID,
			senderScript: ACCOUNT_SCRIPT,
			receiver: transaction.accounts[0],
			note: transaction.notes[0],
			transactionScript: TRANSACTION_SCRIPT
		});
		console.log(result);
		setTransactions((prev) => ({
			...prev,
			[transaction.id]: {
				...transaction,
				result
			}
		}));
	}, [transactions, selectedTransactionId]);

	return (
		<MidenContext.Provider
			value={{
				isInitialized,
				transactions,
				selectedTransactionId,
				selectedTransaction: selectedTransactionId ? transactions[selectedTransactionId] : null,
				createTransaction,
				selectTransaction,
				runTransaction
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
