import {
	AssetData,
	execute_transaction,
	generate_account_id,
	NoteData,
	generate_faucet_id,
	create_swap_note_inputs
} from 'miden-wasm';
import { ExecutionOutput, Asset } from '@/lib/types';
import { Account } from '@/lib/account';
import { Note } from '@/lib/notes';

export function consumeNotes({
	receiver,
	receiverScript,
	notes,
	transactionScript
}: {
	receiver: Account;
	receiverScript: string;
	notes: { note: Note; noteScript: string; noteInputs: BigUint64Array; senderScript: string }[];
	transactionScript: string;
}): ExecutionOutput {
	const notesWrapper = notes.map(
		({ note, noteScript, noteInputs, senderScript }) =>
			new NoteData(
				note.assets.map((a) => new AssetData(a.faucetId, a.amount)),
				noteInputs,
				noteScript,
				note.senderId,
				senderScript
			)
	);
	return execute_transaction(
		transactionScript,
		receiverScript,
		receiver.secretKey,
		receiver.id,
		receiver.assets.map((a) => new AssetData(a.faucetId, a.amount)),
		receiver.isWallet,
		receiver.isAuth,
		notesWrapper
	);
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

export function createSwapNoteInputs(
	senderAccountId: bigint,
	requestedAsset: Asset
): BigUint64Array {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return create_swap_note_inputs(
		seed,
		senderAccountId,
		new AssetData(requestedAsset.faucetId, requestedAsset.amount)
	);
}
