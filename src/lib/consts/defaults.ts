import { Account, Asset, EditorFiles, Note } from '@/lib/types';
import { ACCOUNT_SCRIPT } from './account';
import { P2ID_SCRIPT } from './p2id';
import { SECRET_KEY } from './secret-key';
import { generateAccountId } from '@/lib/miden-wasm-api';
import { generateId } from '@/lib/utils';

export const SYSTEM_ACCOUNT_ID = 9223372036854775838n;

export const DEFAULT_FAUCET_IDS = [2305843009213693983n];

export function createAccount(name: string): { account: Account; newFiles: EditorFiles } {
	const id = generateAccountId();
	const scriptFileId = generateId();
	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: 'Custom component',
			content: ACCOUNT_SCRIPT,
			isOpen: false,
			readonly: false,
			variant: 'script'
		}
	};
	const account: Account = {
		id: id.toString(16),
		idBigInt: id,
		name,
		isWallet: true,
		isAuth: true,
		assets: [],
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

export function createP2IDNote({
	forAccountId,
	assets,
	name
}: {
	forAccountId: bigint;
	assets: Asset[];
	name: string;
}): {
	note: Note;
	newFiles: EditorFiles;
} {
	const noteId = generateId();
	const scriptFileId = generateId();
	const inputFileId = generateId();
	const newFiles: EditorFiles = {
		[scriptFileId]: {
			id: scriptFileId,
			name: `Note script/${name}`,
			content: P2ID_SCRIPT,
			isOpen: false,
			readonly: false,
			variant: 'script'
		},
		[inputFileId]: {
			id: inputFileId,
			name: `Note Input/${name}`,
			content: JSON.stringify(['0x' + forAccountId.toString(16)], null, 2),
			isOpen: false,
			readonly: true,
			variant: 'script'
		}
	};
	const note: Note = {
		id: noteId,
		name,
		scriptFileId,
		isConsumed: false,
		assets,
		inputFileId
	};
	return { note, newFiles };
}

export function defaultNotes(forAccountId: bigint): {
	notes: Record<string, Note>;
	newFiles: EditorFiles;
} {
	const noteA = createP2IDNote({
		forAccountId,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[0],
				faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
				amount: 100n
			}
		],
		name: 'P2ID 1'
	});
	const noteB = createP2IDNote({
		forAccountId,
		assets: [
			{
				faucetId: DEFAULT_FAUCET_IDS[0],
				faucetIdHex: DEFAULT_FAUCET_IDS[0].toString(16),
				amount: 200n
			}
		],
		name: 'P2ID 2'
	});
	return {
		notes: {
			[noteA.note.id]: noteA.note,
			[noteB.note.id]: noteB.note
		},
		newFiles: { ...noteA.newFiles, ...noteB.newFiles }
	};
}
