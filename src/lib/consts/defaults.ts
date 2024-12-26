import { Account, EditorFiles, Note } from '@/lib/types';
import { ACCOUNT_SCRIPT } from './account';
import { SECRET_KEY } from './secret-key';
import { generateAccountId } from '@/lib/miden-wasm-api';
import { generateId } from '@/lib/utils';
import { createP2IDNote } from '../notes/p2id';

export const DEFAULT_FAUCET_IDS = [2305843009213693983n, 3103030043208856727n];

export function createAccount(name: string): { account: Account; newFiles: EditorFiles } {
	const id = generateAccountId();
	const scriptFileId = generateId();
	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: 'Custom component',
			content: ACCOUNT_SCRIPT,
			isOpen: false
		}
	};
	const account: Account = {
		id: id.toString(16),
		idBigInt: id,
		name,
		isWallet: true,
		isAuth: true,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[0],
				faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
				amount: 500n
			},
			{
				faucetId: DEFAULT_FAUCET_IDS[1],
				faucetIdHex: DEFAULT_FAUCET_IDS[1].toString(16),
				amount: 500n
			}
		],
		secretKey: SECRET_KEY,
		scriptFileId
	};
	return { account, newFiles };
}

export function defaultAccounts(): {
	accounts: Record<string, Account>;
	newFiles: EditorFiles;
} {
	const accountA = createAccount('Account A');
	const accountB = createAccount('Account B');
	return {
		accounts: {
			[accountA.account.id]: accountA.account,
			[accountB.account.id]: accountB.account
		},
		newFiles: {
			...accountA.newFiles,
			...accountB.newFiles
		}
	};
}

export function defaultNotes(
	accountId1: bigint,
	accountId2: bigint
): {
	notes: Record<string, Note>;
	newFiles: EditorFiles;
} {
	const p2idNote1 = createP2IDNote({
		senderId: accountId1,
		receiverId: accountId2,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[0],
				faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
				amount: 100n
			}
		],
		name: 'P2ID 1'
	});
	const p2idNote2 = createP2IDNote({
		senderId: accountId1,
		receiverId: accountId2,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[1],
				faucetIdHex: DEFAULT_FAUCET_IDS[1].toString(16),
				amount: 200n
			}
		],
		name: 'P2ID 2'
	});
	// const swapNote = createSwapNote({
	// 	senderId: accountId1,
	// 	offeredAsset: {
	// 		faucetId: DEFAULT_FAUCET_IDS[0],
	// 		faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
	// 		amount: 100n
	// 	},
	// 	requestedAsset: {
	// 		faucetId: DEFAULT_FAUCET_IDS[1],
	// 		faucetIdHex: DEFAULT_FAUCET_IDS[1].toString(16),
	// 		amount: 200n
	// 	},
	// 	name: 'SWAP'
	// });
	return {
		notes: {
			[p2idNote1.note.id]: p2idNote1.note,
			[p2idNote2.note.id]: p2idNote2.note
		},
		newFiles: { ...p2idNote1.newFiles, ...p2idNote2.newFiles }
	};
}
