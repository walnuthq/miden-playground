import { Account } from '@/lib/account';
import { Note, createP2IDNote } from '@/lib/notes';
import { EditorFiles } from '@/lib/files';

export const DEFAULT_FAUCET_IDS = [2305843009213693983n, 3103030043208856727n];

export function defaultAccounts(): {
	accounts: Record<string, Account>;
	newFiles: EditorFiles;
} {
	const accountA = Account.new('Account A');
	const accountB = Account.new('Account B');
	return {
		accounts: {
			[accountA.account.idHex]: accountA.account,
			[accountB.account.idHex]: accountB.account
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
		name: 'P2ID (1)'
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
		name: 'P2ID (2)'
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
