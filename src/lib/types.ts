import { ClientAsset, ClientNote } from 'miden-wasm';

export interface Note {
	name: string;
	id: string;
	script: string;
	isConsumed: boolean;
	wasmNote: ClientNote;
}

export interface Asset {
	faucetId: string;
	amount: number;
	wasmAsset: ClientAsset;
}
