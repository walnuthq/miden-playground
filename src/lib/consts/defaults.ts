import { Account } from '@/lib/account';
import { Note, createP2IDNote } from '@/lib/notes';
import { EditorFiles } from '../files';
import { AccountId } from '@/lib/types';

export const DEFAULT_FAUCET_IDS = [
	'0x2a3c549c1f3eb8a000009b55653cc0',
	'0x3f3e2714af2401a00000e02c698d0e'
];

export function defaultAccounts(): {
	accounts: Record<string, Account>;
	newFiles: EditorFiles;
} {
	const accountA = Account.new('Account A', false);
	const accountB = Account.new('Account B', false);
	return {
		accounts: {
			[accountA.account.id.id]: accountA.account,
			[accountB.account.id.id]: accountB.account
		},
		newFiles: {
			...accountA.newFiles,
			...accountB.newFiles
		}
	};
}

export function defaultNotes(
	accountId1: AccountId,
	accountId2: AccountId
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
				amount: 100n
			}
		],
		name: 'P2ID'
	});
	const p2idNote2 = createP2IDNote({
		senderId: accountId1,
		receiverId: accountId2,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[1],
				amount: 200n
			}
		],
		name: 'P2ID'
	});
	// const p2idrNote = createP2IDRNote({
	// 	senderId: accountId1,
	// 	receiverId: accountId2,
	// 	reclaimBlockHeight: 100,
	// 	assets: [
	// 		{
	// 			faucetId: DEFAULT_FAUCET_IDS[0],
	// 			faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
	// 			amount: 100n
	// 		}
	// 	],
	// 	name: 'P2IDR'
	// });
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
