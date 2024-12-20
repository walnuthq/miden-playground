import { Account, Transaction } from '@/lib/types';
import { ACCOUNT_SCRIPT } from './account';
import { P2ID_SCRIPT } from './p2id';
import { SECRET_KEY } from './secret-key';
import { generateAccountId } from '@/lib/miden-wasm-api';

export const SYSTEM_ACCOUNT_ID = 9223372036854775838n;

export const DEFAULT_FAUCET_IDS = [2305843009213693983n];

export function createAccount(name: string): Account {
	const id = generateAccountId();
	return {
		id: id.toString(16),
		idBigInt: id,
		name,
		script: ACCOUNT_SCRIPT,
		isWallet: true,
		isAuth: true,
		assets: [],
		secretKey: SECRET_KEY
	};
}

export function defaultTransaction(i: number): Transaction {
	const accountA = createAccount('Account A');
	return {
		id: Date.now().toString(),
		name: `Transaction ${i + 1}`,
		accounts: [accountA],
		notes: [
			{
				id: 'note1',
				name: 'P2ID Note',
				script: P2ID_SCRIPT,
				isConsumed: false,
				assets: [
					{
						faucetId: DEFAULT_FAUCET_IDS[0],
						faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
						amount: 100n
					}
				],
				inputs: new BigUint64Array([accountA.idBigInt])
			}
		],
		arguments: {}
	};
}

export function defaultTransactions(): Record<string, Transaction> {
	const transaction = defaultTransaction(0);
	return {
		[transaction.id]: transaction
	};
}
