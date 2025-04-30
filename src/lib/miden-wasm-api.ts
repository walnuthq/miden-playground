import {
	AssetData,
	execute_transaction,
	generate_account_id,
	NoteData,
	generate_faucet_id,
	generate_note_serial_number,
	create_swap_note,
	AccountData,
	WordData,
	generate_note_tag
} from 'miden-wasm';
import { ExecutionOutput, Asset, AccountId } from '@/lib/types';
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
	const notesWrapper = notes.map(({ note, noteScript, noteInputs, senderScript }) => {
		return new NoteData(
			note.assets.map((a) => new AssetData(a.faucetId, a.amount)),
			noteInputs,
			noteScript,
			note.senderId,
			senderScript,
			note.serialNumber,
			note.tag,
			note.aux
		);
	});

	// const start = Date.now();
	// const digest = computeRecipientDigest(notesWrapper[0]);
	// console.log(digest);
	// console.log('Time taken:', Date.now() - start);

	const receiverAccount = new AccountData(
		receiverScript,
		receiver.secretKey,
		receiver.id.id,
		receiver.assets.map((a) => new AssetData(a.faucetId, a.amount)),
		receiver.isWallet,
		receiver.isAuth,
		receiverStorage.map((row) => new WordData(new BigUint64Array(row))),
		BigInt(receiver.nonce)
	);

	const output = execute_transaction(
		transactionScript,
		receiverAccount,
		notesWrapper,
		BigInt(blockNumber)
	);

	return output;
}

export function generateAccountId(): AccountId {
	const seed = new Uint8Array(15);
	window.crypto.getRandomValues(seed);
	const id = generate_account_id(seed);
	return { id: id.id, prefix: id.prefix, suffix: id.suffix };
}

export function generateFaucetId(): AccountId {
	const seed = new Uint8Array(15);
	window.crypto.getRandomValues(seed);
	const id = generate_faucet_id(seed);
	return { id: id.id, prefix: id.prefix, suffix: id.suffix };
}

export function createSwapNotes(
	senderAccountId: string,
	receiverAccountId: string,
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
	const paybackNote = result.payback_note();
	return { swapNoteInputs: result.note_inputs(), paybackNote };
}

export function generateNoteSerialNumber(): BigUint64Array {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return generate_note_serial_number(seed);
}

export function generateNoteTag(senderAccountId: string): number {
	return generate_note_tag(senderAccountId);
}

export function createNoteData(
	note: Note,
	noteInputs: BigUint64Array,
	noteScript: string,
	senderScript: string
): NoteData {
	return new NoteData(
		note.assets.map((a) => new AssetData(a.faucetId, a.amount)),
		noteInputs,
		noteScript,
		note.senderId,
		senderScript,
		note.serialNumber,
		note.tag,
		note.aux
	);
}
