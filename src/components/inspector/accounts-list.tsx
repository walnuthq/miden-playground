import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
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
		closeFile,
		isInspectorDropdownOpen,
		setIsInspectorDropdownOpen
	} = useMiden();
	const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});
	const isCollapsedAccTopLevel = collapsedAccounts['top-level-accounts'] || false;
	const { currentTour, currentStep, setCurrentStep } = useNextStep();

	return (
		<>
			<InspectorItem
				name="Accounts"
				nameClasses="font-bold"
				variant="collapsable"
				onCreate={(option) => {
					if (option === 'Create new account') {
						createAccount();

						if (currentTour) {
							if (currentStep === 1) {
								setCurrentStep(2, 100);
							} else if (currentStep === 7) {
								setCurrentStep(8);
							}
						}
					}
				}}
				setIsInspectorDropdownOpen={setIsInspectorDropdownOpen}
				onCreateOptions={['Create new account']}
				isCollapsed={isCollapsedAccTopLevel}
				level={0}
				onClick={() => {
					toggleCollapse('top-level-accounts', setCollapsedAccounts);
				}}
				isInspectorDropdownOpen={isInspectorDropdownOpen}
			/>
			{!isCollapsedAccTopLevel &&
				Object.values(accounts).map((account, index) => {
					const isCollapsed = collapsedAccounts[account.id.id] || false;
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
												if (currentTour) {
													if (currentStep === 20) {
														setCurrentStep(21, 100);
													}
													if (currentStep === 5) {
														setCurrentStep(6, 100);
													}
													if (currentStep === 26) {
														setCurrentStep(27, 100);
													}
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
												if (currentStep === 2 && currentTour) {
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
