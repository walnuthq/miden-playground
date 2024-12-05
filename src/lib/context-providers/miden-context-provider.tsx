'use client';

import React, {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState
} from 'react';
import init, { ClientAccount } from 'miden-wasm';
import { ACCOUNT_SCRIPT, P2ID_SCRIPT } from '@/lib/consts';
import { Asset, Note } from '@/lib/types';
import { TRANSACTION_SCRIPT } from '@/lib/consts/transaction';
const USER_ACCOUNT_ID = 9223372036854775839n;
const SYSTEM_ACCOUNT_ID = 10376293541461622847n;
const FAUCET_ID = 2305843009213693983n;

interface MidenContextProps {
	isInitialized: boolean;
	notes: Note[];
	assets: Asset[];
	consumeNote: (noteId: string) => void;
	consoleLogs: { message: string; type: 'info' | 'error' }[];
	addInfoLog: (message: string) => void;
	addErrorLog: (message: string) => void;
}

export const MidenContext = createContext<MidenContextProps>({
	isInitialized: false,
	notes: [],
	assets: [],
	consumeNote: () => {},
	consoleLogs: [],
	addInfoLog: () => {},
	addErrorLog: () => {}
});

const fetchSecretKey = async () => {
	const response = await fetch('/secret-key.bin');
	const arrayBuffer = await response.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);
	return uint8Array;
};

export const MidenContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const [isInitialized, setIsInitialized] = useState(false);
	const [notes, setNotes] = useState<Note[]>([]);
	const [userAccount, setUserAccount] = useState<ClientAccount | null>(null);
	const [consoleLogs, setConsoleLogs] = useState<{ message: string; type: 'info' | 'error' }[]>([]);
	const [assets, setAssets] = useState<Asset[]>([]);

	const addInfoLog = useCallback((message: string) => {
		console.log(message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'info' }]);
	}, []);

	const addErrorLog = useCallback((message: string) => {
		console.log('ERROR: ', message);
		setConsoleLogs((prevLogs) => [...prevLogs, { message, type: 'error' }]);
	}, []);

	const setupDefaults = useCallback(
		async (secretKey: Uint8Array) => {
			let systemAccount: ClientAccount | null = null;
			try {
				const userAccount = new ClientAccount(
					secretKey,
					USER_ACCOUNT_ID,
					ACCOUNT_SCRIPT,
					true,
					true
				);
				systemAccount = new ClientAccount(secretKey, SYSTEM_ACCOUNT_ID, ACCOUNT_SCRIPT, true, true);
				setUserAccount(userAccount);
			} catch (error) {
				addErrorLog(`Error setting up accounts: ${error}`);
			}
			if (!systemAccount) {
				addErrorLog('System account not found');
				return;
			}
			try {
				const note = createNote({
					account: systemAccount,
					faucetId: FAUCET_ID,
					amount: 100n,
					inputs: new BigUint64Array([USER_ACCOUNT_ID]),
					script: P2ID_SCRIPT,
					name: 'P2ID'
				});
				const note2 = createNote({
					account: systemAccount,
					faucetId: FAUCET_ID,
					amount: 200n,
					inputs: new BigUint64Array([USER_ACCOUNT_ID]),
					script: P2ID_SCRIPT,
					name: 'P2ID (2)'
				});
				setNotes([note, note2]);
			} catch (error) {
				addErrorLog(`Error setting up notes: ${error}`);
			}
		},
		[addErrorLog]
	);

	useEffect(() => {
		Promise.all([init(), fetchSecretKey()])
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.then(([_, secretKey]) => {
				console.log('WASM initialized successfully');
				setupDefaults(secretKey);
				addInfoLog('App initialized...');
				setIsInitialized(true);
			})
			.catch((error: unknown) => {
				addErrorLog(`Failed to initialize WASM: ${error}`);
			});
	}, [addErrorLog, addInfoLog, setupDefaults]);

	const consumeNote = (noteId: string) => {
		const note = notes.find((note) => note.id === noteId);
		if (note && userAccount) {
			try {
				userAccount.consume_note(TRANSACTION_SCRIPT, note.wasmNote);
				note.isConsumed = true;
				setNotes([...notes]);
				addInfoLog('');
				addInfoLog('Succesfully created transaction.');
				addInfoLog('The transaction did not generate any output notes.');
				addInfoLog(`The ${note.name} Note was consumed.`);
				setAssets(
					userAccount.assets().map((asset) => ({
						faucetId: asset.faucet_id(),
						amount: Number(asset.amount()),
						wasmAsset: asset
					}))
				);
			} catch (error) {
				addErrorLog(`Error consuming note: ${error}`);
			}
		}
	};

	return (
		<MidenContext.Provider
			value={{ notes, consumeNote, assets, consoleLogs, addInfoLog, addErrorLog, isInitialized }}
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

const createNote = ({
	account,
	faucetId,
	amount,
	inputs,
	script,
	name
}: {
	account: ClientAccount;
	amount: bigint;
	inputs: BigUint64Array;
	script: string;
	faucetId: bigint;
	name: string;
}): Note => {
	const note = account.create_note(faucetId, inputs, script, amount);

	return {
		id: note.id(),
		name,
		script,
		isConsumed: false,
		wasmNote: note
	};
};
