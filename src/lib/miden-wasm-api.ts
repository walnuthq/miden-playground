import { AssetWrapper, consume_note, generate_account_id } from 'miden-wasm';
import { Account, Note, ExecutionOutput } from '@/lib/types';

export function consumeNote({
	senderId,
	senderScript,
	receiver,
	receiverScript,
	note,
	noteScript,
	noteInputs,
	transactionScript
}: {
	senderId: bigint;
	senderScript: string;
	receiver: Account;
	receiverScript: string;
	note: Note;
	noteScript: string;
	noteInputs: BigUint64Array;
	transactionScript: string;
}): ExecutionOutput {
	return consume_note(
		transactionScript,
		senderId,
		senderScript,
		receiverScript,
		receiver.secretKey,
		receiver.idBigInt,
		receiver.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
		receiver.isWallet,
		receiver.isAuth,
		note.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
		noteInputs,
		noteScript
	);
}

export function generateAccountId(): bigint {
	const seed = new Uint8Array(32);
	window.crypto.getRandomValues(seed);
	return generate_account_id(seed);
}
