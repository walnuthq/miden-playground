import { AssetWrapper, consume_note, generate_account_id } from 'miden-wasm';
import { Account, Note, TransactionResult } from '@/lib/types';

export function consumeNote({
	senderId,
	senderScript,
	receiver,
	note,
	transactionScript
}: {
	senderId: bigint;
	senderScript: string;
	receiver: Account;
	note: Note;
	transactionScript: string;
}): TransactionResult {
	return consume_note(
		transactionScript,
		senderId,
		senderScript,
		receiver.script,
		receiver.secretKey,
		receiver.idBigInt,
		receiver.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
		receiver.isWallet,
		receiver.isAuth,
		note.assets.map((a) => new AssetWrapper(a.faucetId, a.amount)),
		note.inputs,
		note.script
	);
}

export function generateAccountId(): bigint {
	return generate_account_id();
}
