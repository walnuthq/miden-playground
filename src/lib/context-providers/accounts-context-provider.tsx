'use client';

import React, { PropsWithChildren, createContext, useCallback, useContext, useState } from 'react';
import { Account } from '@/lib/account';
import { AccountUpdates } from '@/lib/types';
import { useFiles } from './files-context-provider';

type StorageDiffs = Record<
	number,
	{
		old?: BigUint64Array;
	}
>;

interface AccountsContextProps {
	accounts: Record<string, Account>;
	selectedTransactionAccountId: string | null;
	accountUpdates: AccountUpdates | null;
	accountStorageDiffs: StorageDiffs;
	disableWalletComponent: (accountId: string) => void;
	disableAuthComponent: (accountId: string) => void;
	enableWalletComponent: (accountId: string) => void;
	enableAuthComponent: (accountId: string) => void;
	createAccount: () => void;
	selectTransactionAccount: (accountId: string) => void;
	removeTransactionAccount: () => void;
	deleteAccount: (accountId: string) => void;
	updateAccountAssetAmount: (
		accountId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => void;
	handleChangeStorage: (
		accountId: string,
		newValue: string,
		index: number,
		subIndex: number
	) => void;
	createNewStorageSlot: (accountId: string) => void;
	setAccountUpdates: (accountUpdates: AccountUpdates) => void;
	setAccountStorageDiffs: (accountStorageDiffs: StorageDiffs) => void;
	updateAccountById: (accountId: string, updateFn: (account: Account) => Account) => void;
	setAccounts: (accounts: Record<string, Account>) => void;
}

export const AccountsContext = createContext<AccountsContextProps>({
	accounts: {},
	selectedTransactionAccountId: null,
	accountUpdates: null,
	accountStorageDiffs: {},
	disableWalletComponent: () => {},
	disableAuthComponent: () => {},
	enableWalletComponent: () => {},
	enableAuthComponent: () => {},
	createAccount: () => {},
	selectTransactionAccount: () => {},
	removeTransactionAccount: () => {},
	updateAccountAssetAmount: () => {},
	handleChangeStorage: () => {},
	createNewStorageSlot: () => {},
	deleteAccount: () => {},
	setAccountUpdates: () => {},
	setAccountStorageDiffs: () => {},
	updateAccountById: () => {},
	setAccounts: () => {}
});

export const AccountsContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
	const { files, addFiles, updateFileContent, removeFile } = useFiles();

	const isValidUint64 = (value: string): boolean => {
		if (value === '') return true;
		const MAX_UINT64 = 2n ** 64n - 1n;
		const MIN_UINT64 = 0n;
		try {
			const bigIntValue = BigInt(value);
			return bigIntValue >= MIN_UINT64 && bigIntValue <= MAX_UINT64;
		} catch (error) {
			console.error(error);
			return false;
		}
	};

	const handleChangeStorage = (
		accountId: string,
		newValue: string,
		index: number,
		subIndex: number
	) => {
		if (!isValidUint64(newValue) && newValue !== '') {
			return;
		}
		const account = accounts[accountId];
		try {
			let currentStorage: BigUint64Array[] = [];

			if (files[account!.storageFileId].content.value) {
				try {
					currentStorage = Account.parseStorage(files[account?.storageFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentStorage = [];
				}
			}
			currentStorage[index][subIndex] = BigInt(newValue);

			updateFileContent(account!.storageFileId, Account.stringifyStorage(currentStorage));
		} catch (error) {
			console.error(error);
		}
	};

	const createNewStorageSlot = (accountId: string) => {
		const account = accounts[accountId];
		try {
			let currentStorage: BigUint64Array[] = [];

			if (files[account!.storageFileId].content.value) {
				try {
					currentStorage = Account.parseStorage(files[account?.storageFileId].content.value!);
				} catch (error) {
					console.error(error);
					currentStorage = [];
				}
			}
			currentStorage = [...currentStorage, new BigUint64Array([0n, 0n, 0n, 0n])];

			updateFileContent(account!.storageFileId, Account.stringifyStorage(currentStorage));
		} catch (error) {
			console.error(error);
		}
	};

	const [accountUpdates, setAccountUpdates] = useState<AccountUpdates | null>(null);
	const [accountStorageDiffs, setAccountStorageDiffs] = useState<StorageDiffs>({});

	const [accounts, setAccounts] = useState<Record<string, Account>>({});
	const [selectedTransactionAccountId, setSelectedTransactionAccountId] = useState<string | null>(
		null
	);

	const updateAccountById = (accountId: string, updateFn: (account: Account) => Account) => {
		setAccounts((prev) => {
			const account = prev[accountId];
			if (!account) {
				console.error(`Account with ID ${accountId} not found.`);
				return prev;
			}
			const updatedAccount = updateFn(account.clone());
			const updatedAccounts = { ...prev, [accountId]: updatedAccount };

			return updatedAccounts;
		});
	};

	const selectTransactionAccount = useCallback((accountId: string) => {
		setSelectedTransactionAccountId(accountId);
	}, []);

	const createAccount = useCallback(() => {
		const newAccountName = Account.getNextAccountName(accounts);
		const { account, newFiles } = Account.new(newAccountName);

		setAccounts((prev) => ({ ...prev, [account.id.id]: account }));

		if (Object.values(accounts).length === 0) {
			selectTransactionAccount(account.id.id);
		}
		addFiles(newFiles);
	}, [accounts, selectTransactionAccount, addFiles]);

	const disableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.disableWalletComponent();
			return account;
		});
	}, []);

	const disableAuthComponent = useCallback(
		(accountId: string) => {
			updateAccountById(accountId, (account) => {
				const newStorage = account.disableAuthComponent(
					Account.parseStorage(files[account.storageFileId].content.value!)
				);
				updateFileContent(account.storageFileId, Account.stringifyStorage(newStorage));
				return account;
			});
		},
		[files, updateFileContent]
	);

	const enableWalletComponent = useCallback((accountId: string) => {
		updateAccountById(accountId, (account) => {
			account.enableWalletComponent();
			return account;
		});
	}, []);

	const enableAuthComponent = useCallback(
		(accountId: string) => {
			updateAccountById(accountId, (account) => {
				const newStorage = account.enableAuthComponent(
					Account.parseStorage(files[account.storageFileId].content.value!)
				);
				updateFileContent(account.storageFileId, Account.stringifyStorage(newStorage));
				return account;
			});
		},
		[files, updateFileContent]
	);

	const removeTransactionAccount = useCallback(() => {
		setSelectedTransactionAccountId(null);
	}, []);

	const deleteAccount = useCallback(
		(accountId: string) => {
			setAccounts((prev) => {
				const newAccounts = { ...prev };
				const account = newAccounts[accountId];
				if (account) {
					removeFile(account.scriptFileId);
					removeFile(account.vaultFileId);
					removeFile(account.metadataFileId);
					removeFile(account.storageFileId);
					delete newAccounts[accountId];
				}

				return newAccounts;
			});
		},
		[removeFile]
	);

	const updateAccountAssetAmount = (
		accountId: string,
		faucetId: string,
		updateFn: (amount: bigint) => bigint
	) => {
		updateAccountById(accountId, (account) => {
			account.updateAssetAmount(faucetId, updateFn);
			return account;
		});
	};

	return (
		<AccountsContext.Provider
			value={{
				accounts,
				selectedTransactionAccountId,
				accountUpdates,
				accountStorageDiffs,
				disableWalletComponent,
				disableAuthComponent,
				enableWalletComponent,
				enableAuthComponent,
				createAccount,
				selectTransactionAccount,
				removeTransactionAccount,
				updateAccountAssetAmount,
				deleteAccount,
				handleChangeStorage,
				createNewStorageSlot,
				setAccountUpdates,
				setAccountStorageDiffs,
				updateAccountById,
				setAccounts
			}}
		>
			{children}
		</AccountsContext.Provider>
	);
};

export const useAccounts = () => {
	const context = useContext(AccountsContext);
	if (!context) {
		throw new Error('useAccounts must be used within a AccountsContextProvider');
	}
	return context;
};
