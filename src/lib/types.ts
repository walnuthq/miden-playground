export interface ExecutionOutput {
	assets: Asset[];
	accountHash: string;
	codeCommitment: string;
	storageCommitment: string;
	vaultRoot: string;
	nonce: number;
}

export interface Account {
	id: string;
	idBigInt: bigint;
	name: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	scriptFileId: string;
}

export interface Note {
	name: string;
	id: string;
	scriptFileId: string;
	assets: Asset[];
	inputFileId: string;
	isConsumed: boolean;
}

export interface Asset {
	faucetId: bigint;
	faucetIdHex: string;
	amount: bigint;
}

export interface EditorFile {
	id: string;
	name: string;
	content: string;
	isOpen: boolean;
}

export type EditorFiles = Record<string, EditorFile>;
