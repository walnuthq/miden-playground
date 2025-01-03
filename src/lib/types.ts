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
	storage: string[];
}

export interface Asset {
	faucetId: bigint;
	faucetIdHex: string;
	amount: bigint;
}
