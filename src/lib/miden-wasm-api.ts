import { AssetWrapper, consume_notes, generate_account_id, NoteWrapper } from 'miden-wasm';
import { Account, Note, ExecutionOutput } from '@/lib/types';

export function consumeNote({
	senderId,
	senderScript,
	receiver,
	receiverScript,
	notes,
	transactionScript
}: {
	senderId: bigint;
	senderScript: string;
	receiver: Account;
	receiverScript: string;
	notes: { note: Note; noteScript: string; noteInputs: BigUint64Array }[];
	transactionScript: string;
}): ExecutionOutput {
	const notesWrapper = notes.map(
		({ note, noteScript, noteInputs }) =>
			new NoteWrapper(
				note.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
				noteInputs,
				noteScript
			)
	);
	return consume_notes(
		transactionScript,
		senderId,
		senderScript,
		receiverScript,
		receiver.secretKey,
		receiver.idBigInt,
		receiver.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
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
