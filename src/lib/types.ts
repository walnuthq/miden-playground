export interface Transaction {
	id: string;
	name: string;
	accounts: Account[];
	notes: Note[];
	arguments: Record<string, string | number>;
	result?: TransactionResult;
}

export interface TransactionResult {
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
	script: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
}

export interface Note {
	name: string;
	id: string;
	script: string;
	assets: Asset[];
	inputs: BigUint64Array;
	isConsumed: boolean;
}

export interface Asset {
	faucetId: bigint;
	faucetIdHex: string;
	amount: bigint;
}
