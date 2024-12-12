import { Account, Note } from '@/lib/types';
import { ACCOUNT_SCRIPT } from './account';
import { P2ID_SCRIPT } from './p2id';

const DEFAULT_ACCOUNT_IDS = [9223372036854775838n, 9223372036854775839n, 10376293541461622847n];
const DEFAULT_FAUCET_IDS = [2305843009213693983n];

export function defaultAccounts(): Account[] {
	return [
		{
			id: DEFAULT_ACCOUNT_IDS[0].toString(16),
			idBigInt: DEFAULT_ACCOUNT_IDS[0],
			name: 'System Account',
			script: ACCOUNT_SCRIPT,
			isWallet: true,
			isAuth: true,
			assets: [],
			secretKey: new Uint8Array([]),
			isHidden: true
		},
		{
			id: DEFAULT_ACCOUNT_IDS[1].toString(16),
			idBigInt: DEFAULT_ACCOUNT_IDS[1],
			name: 'Account 1',
			script: ACCOUNT_SCRIPT,
			isWallet: true,
			isAuth: true,
			assets: [],
			secretKey: new Uint8Array([]),
			isHidden: false
		},
		{
			id: DEFAULT_ACCOUNT_IDS[2].toString(16),
			idBigInt: DEFAULT_ACCOUNT_IDS[2],
			name: 'Account 2',
			script: ACCOUNT_SCRIPT,
			isWallet: true,
			isAuth: true,
			assets: [],
			secretKey: new Uint8Array([]),
			isHidden: false
		}
	];
}

export function defaultNotes(): Note[] {
	return [
		{
			id: 'note1',
			name: 'P2ID',
			script: P2ID_SCRIPT,
			isConsumed: false,
			assets: [
				{
					faucetId: DEFAULT_FAUCET_IDS[0],
					faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
					amount: 100n
				}
			],
			inputs: new BigUint64Array([DEFAULT_ACCOUNT_IDS[1]]),
			creatorId: DEFAULT_ACCOUNT_IDS[0].toString(16)
		},
		{
			id: 'note2',
			name: 'P2ID (2)',
			script: P2ID_SCRIPT,
			isConsumed: false,
			assets: [
				{
					faucetId: DEFAULT_FAUCET_IDS[0],
					faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
					amount: 200n
				}
			],
			inputs: new BigUint64Array([DEFAULT_ACCOUNT_IDS[1]]),
			creatorId: DEFAULT_ACCOUNT_IDS[0].toString(16)
		}
	];
}
