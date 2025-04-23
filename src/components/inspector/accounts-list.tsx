import { useMiden } from '@/lib/context-providers';
import React, { useEffect, useState } from 'react';
import { FileItem, InspectorItem } from '.';
import { useNextStep } from 'nextstepjs';

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
		selectedTransactionAccountId,
		selectTransactionAccount,
		deleteAccount,
		closeFile
	} = useMiden();
	const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});
	const isCollapsedAccTopLevel = collapsedAccounts['top-level-accounts'] || false;
	const { currentStep } = useNextStep();

	useEffect(() => {
		if (currentStep === 1) {
			createAccount();
		}
	}, [currentStep]);
	console.log('currentStep', currentStep);

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
					console.log('account.name', account.name);
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
									if (
										account.id.id === selectedTransactionAccountId &&
										Object.values(accounts).length > 0
									) {
										selectTransactionAccount(Object.values(accounts)[0].id.id);
									}
									deleteAccount(account.id.id);
									Object.values(files).map((file) => {
										if (
											[
												account.metadataFileId,
												account.scriptFileId,
												account.vaultFileId,
												account.storageFileId
											].includes(file.id)
										) {
											closeFile(file.id);
										}
									});
								}}
							/>

							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[account.metadataFileId]}
										onClick={() => selectFile(account.metadataFileId)}
										isSelected={selectedFileId === account.metadataFileId}
										level={2}
									/>
									<div id={account.name === 'Account C' ? 'step3' : ''}>
										<FileItem
											editorFile={files[account.scriptFileId]}
											isSelected={selectedFileId === account.scriptFileId}
											onClick={() => selectFile(account.scriptFileId)}
											level={2}
										/>
									</div>
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
