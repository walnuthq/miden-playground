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
	const {
		// startNextStep
		// closeNextStep,
		// currentTour,
		currentStep,
		setCurrentStep
		// isNextStepVisible
	} = useNextStep();
	useEffect(() => {
		if (currentStep === 12) {
			selectFile(Object.values(accounts)[Object.values(accounts).length - 1].metadataFileId);
		}
	}, [currentStep]);
	return (
		<>
			<InspectorItem
				name="Accounts"
				nameClasses="font-bold"
				variant="collapsable"
				onCreate={(option) => {
					if (option === 'Create new account') {
						createAccount();
						if (currentStep === 1) {
							setCurrentStep(2);
						}
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
				Object.values(accounts).map((account, index) => {
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
									<div id={Object.values(accounts).length - 1 === index ? 'step19' : ''}>
										<FileItem
											editorFile={files[account.metadataFileId]}
											onClick={() => {
												selectFile(account.metadataFileId);
												if (currentStep === 18) {
													setCurrentStep(19, 100);
												}
												if (currentStep === 5) {
													setCurrentStep(6, 100);
												}
												if (currentStep === 24) {
													setCurrentStep(25, 100);
												}
											}}
											isSelected={selectedFileId === account.metadataFileId}
											level={2}
										/>
									</div>
									<div id={Object.values(accounts).length - 1 === index ? 'step3' : ''}>
										<FileItem
											editorFile={files[account.scriptFileId]}
											isSelected={selectedFileId === account.scriptFileId}
											onClick={() => {
												selectFile(account.scriptFileId);
												if (currentStep === 2) {
													setCurrentStep(3);
												}
											}}
											level={2}
										/>
									</div>
									{/* <FileItem
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
									/>  */}
								</div>
							)}
						</React.Fragment>
					);
				})}
		</>
	);
};

export default AccountsList;
