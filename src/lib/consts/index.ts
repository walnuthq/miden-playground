export * from './secret-key';

export const TRANSACTION_SCRIPT_FILE_ID = 'transaction-script';
export const WALLET_COMPONENT_SCRIPT_FILE_ID = 'wallet-component-script';
export const AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID = 'authentication-component-script';

export const assets = {
	BTC: 2305843009213693983n,
	ETH: 3103030043208856727n
};

export const assetSymbols = {
	[assets.BTC]: 'BTC',
	[assets.ETH]: 'ETH'
};
