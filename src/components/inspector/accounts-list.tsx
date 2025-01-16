import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import { FileItem, InspectorItem } from '.';

const AccountsList = ({
	toggleCollapse
}: {
	toggleCollapse: (
		id: string,
		setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) => void;
}) => {
	const {
		files,
		selectFile,
		selectedFileId,
		accounts,
		createAccount,
		disableWalletComponent,
		disableAuthComponent,
		enableAuthComponent,
		enableWalletComponent,
		deleteAccount
	} = useMiden();
	const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});
	const isCollapsedAccTopLevel = collapsedAccounts['top-level-accounts'] || false;

	return (
		<>
			<InspectorItem
				name="Accounts"
				nameClasses="font-bold"
				variant="collapsable"
				onCreate={(option) => {
					if (option === 'Create new account') {
						createAccount();
					}
				}}
				onCreateOptions={['Create new account']}
				isCollapsed={isCollapsedAccTopLevel}
				level={0}
				onClick={() => {
					toggleCollapse('top-level-accounts', setCollapsedAccounts);
				}}
			/>
			{!isCollapsedAccTopLevel &&
				Object.values(accounts).map((account) => {
					const isCollapsed = collapsedAccounts[account.idHex] || false;

					const onCreateOptions = [];
					if (!account.isAuth) {
						onCreateOptions.push('Add auth component');
					}
					if (!account.isWallet) {
						onCreateOptions.push('Add wallet component');
					}

					const onCreate =
						!account.isAuth || !account.isWallet
							? (option: string) => {
									if (option === 'Add auth component') {
										enableAuthComponent(account.idHex);
									} else if (option === 'Add wallet component') {
										enableWalletComponent(account.idHex);
									}
							  }
							: undefined;

					return (
						<React.Fragment key={account.id}>
							<InspectorItem
								name={account.name}
								variant="collapsable"
								isCollapsed={isCollapsed}
								level={1}
								onClick={() => {
									toggleCollapse(account.idHex, setCollapsedAccounts);
								}}
								onRemove={() => {
									deleteAccount(account.idHex);
								}}
								onCreate={onCreate}
								onCreateOptions={onCreateOptions}
							/>

							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[account.scriptFileId]}
										isSelected={selectedFileId === account.scriptFileId}
										onClick={() => selectFile(account.scriptFileId)}
										level={2}
									/>
									{account.isWallet && (
										<FileItem
											editorFile={files[WALLET_COMPONENT_SCRIPT_FILE_ID]}
											isSelected={selectedFileId === WALLET_COMPONENT_SCRIPT_FILE_ID}
											onClick={() => selectFile(WALLET_COMPONENT_SCRIPT_FILE_ID)}
											onRemove={() => disableWalletComponent(account.idHex)}
											level={2}
										/>
									)}
									{account.isAuth && (
										<FileItem
											editorFile={files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID]}
											isSelected={selectedFileId === AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID}
											onClick={() => selectFile(AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID)}
											onRemove={() => disableAuthComponent(account.idHex)}
											level={2}
										/>
									)}
									<FileItem
										editorFile={files[account.metadataFileId]}
										onClick={() => selectFile(account.metadataFileId)}
										isSelected={selectedFileId === account.metadataFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[account.vaultFileId]}
										onClick={() => selectFile(account.vaultFileId)}
										isSelected={selectedFileId === account.vaultFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[account.storageFileId]}
										onClick={() => selectFile(account.storageFileId)}
										isSelected={selectedFileId === account.storageFileId}
										level={2}
									/>
								</div>
							)}
						</React.Fragment>
					);
				})}
		</>
	);
};

export default AccountsList;
