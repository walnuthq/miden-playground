export * from './secret-key';

export const TRANSACTION_SCRIPT_FILE_ID = 'transaction-script';
export const WALLET_COMPONENT_SCRIPT_FILE_ID = 'wallet-component-script';
export const AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID = 'authentication-component-script';

export const faucets = {
	BTC: '0x2a3c549c1f3eb8a000009b55653cc0',
	ETH: '0x3f3e2714af2401a00000e02c698d0e'
};

export const faucetSymbols = {
	[faucets.BTC]: 'BTC',
	[faucets.ETH]: 'ETH'
};
