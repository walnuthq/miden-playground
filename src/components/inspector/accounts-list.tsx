import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
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
					const isCollapsed = collapsedAccounts[account.id.id] || false;
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
										enableAuthComponent(account.id.id);
									} else if (option === 'Add wallet component') {
										enableWalletComponent(account.id.id);
									}
							  }
							: undefined;

					return (
						<React.Fragment key={account.id.id}>
							<InspectorItem
								name={account.name}
								variant="collapsable"
								isCollapsed={isCollapsed}
								level={1}
								onClick={() => {
									toggleCollapse(account.id.id, setCollapsedAccounts);
								}}
								onRemove={() => {
									deleteAccount(account.id.id);
								}}
								onCreate={onCreate}
								onCreateOptions={onCreateOptions}
							/>

							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[account.metadataFileId]}
										onClick={() => selectFile(account.metadataFileId)}
										isSelected={selectedFileId === account.metadataFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[account.scriptFileId]}
										isSelected={selectedFileId === account.scriptFileId}
										onClick={() => selectFile(account.scriptFileId)}
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
