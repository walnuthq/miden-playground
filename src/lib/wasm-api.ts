import { AssetWrapper, consume_note } from 'miden-wasm';
import { Account, Asset, Note } from '@/lib/types';

export function consumeNote({
	sender,
	receiver,
	note,
	transactionScript
}: {
	sender: Account;
	receiver: Account;
	note: Note;
	transactionScript: string;
}): { assets: Asset[] } {
	const result = consume_note(
		transactionScript,
		sender.idBigInt,
		sender.script,
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

	return { assets: result.assets };
}
