export interface Account {
	id: string;
	idBigInt: bigint;
	name: string;
	script: string;
	isWallet: boolean;
	isAuth: boolean;
	assets: Asset[];
	secretKey: Uint8Array;
	isHidden: boolean;
}

export interface Note {
	name: string;
	id: string;
	script: string;
	assets: Asset[];
	inputs: BigUint64Array;
	isConsumed: boolean;
	creatorId: string;
}

export interface Asset {
	faucetId: bigint;
	faucetIdHex: string;
	amount: bigint;
}
