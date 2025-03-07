export interface ExecutionOutput {
	assets: Asset[];
	accountHash: string;
	codeCommitment: string;
	storageCommitment: string;
	vaultRoot: string;
	nonce: number;
	accountId: bigint;
	totalCycles: number;
	traceLength: number;
	storage: BigUint64Array[];
	outputNotes: { id: string; senderId: string; tag: string; assets: Asset[] }[];
	storageDiffs: Record<
		number,
		{
			old?: BigUint64Array;
		}
	>;
}

export interface Asset {
	faucetId: string;
	amount: bigint;
}

export interface AccountUpdates {
	accountId: string;
	assetsDelta: Record<string, bigint>; // FaucetId -> Amount Delta
	outputNotes: ExecutionOutput['outputNotes'];
}

export interface AccountId {
	id: string;
	prefix: bigint;
	suffix: bigint;
}
