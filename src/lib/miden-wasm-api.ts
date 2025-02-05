import {
	AssetData,
	execute_transaction,
	generate_account_id,
	NoteData,
	generate_faucet_id,
	generate_note_serial_number,
	create_swap_note,
	AccountData,
	WordData
} from 'miden-wasm';
import { ExecutionOutput, Asset } from '@/lib/types';
import { Account } from '@/lib/account';
import { Note } from '@/lib/notes';

export function consumeNotes({
	receiver,
	receiverScript,
	receiverStorage,
	notes,
	transactionScript,
	blockNumber
}: {
	receiver: Account;
	receiverScript: string;
	receiverStorage: BigUint64Array[];
	notes: { note: Note; noteScript: string; noteInputs: BigUint64Array; senderScript: string }[];
	transactionScript: string;
	blockNumber: number;
}): ExecutionOutput {
	const notesWrapper = notes.map(
		({ note, noteScript, noteInputs, senderScript }) =>
			new NoteData(
				note.assets.map((a) => new AssetData(a.faucetId, a.amount)),
				noteInputs,
				noteScript,
				note.senderId,
				senderScript,
				note.serialNumber
			)
	);

	const receiverAccount = new AccountData(
		receiverScript,
		receiver.secretKey,
		receiver.id,
		receiver.assets.map((a) => new AssetData(a.faucetId, a.amount)),
		receiver.isWallet,
		receiver.isAuth,
		receiverStorage.map((row) => new WordData(new BigUint64Array(row)))
	);
	return execute_transaction(transactionScript, receiverAccount, notesWrapper, BigInt(blockNumber));
}

export function generateAccountId(): bigint {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return generate_account_id(seed);
}

export function generateFaucetId(): bigint {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return generate_faucet_id(seed);
}

export function createSwapNotes(
	senderAccountId: bigint,
	receiverAccountId: bigint,
	requestedAsset: Asset
): { swapNoteInputs: BigUint64Array; paybackNote: NoteData } {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	const result = create_swap_note(
		seed,
		senderAccountId,
		receiverAccountId,
		new AssetData(requestedAsset.faucetId, requestedAsset.amount)
	);
	return { swapNoteInputs: result.note_inputs(), paybackNote: result.payback_note() };
}
export function generateNoteSerialNumber(): BigUint64Array {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return generate_note_serial_number(seed);
}
