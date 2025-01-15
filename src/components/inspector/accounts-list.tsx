import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import { FileItem } from '.';

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
		disableAuthComponent
	} = useMiden();
	const [collapsedAccounts, setCollapsedAccounts] = useState<Record<string, boolean>>({});
	const isCollapsedAccTopLevel = collapsedAccounts['top-level-accounts'] || false;

	return (
		<>
			<div
				onClick={() => toggleCollapse('top-level-accounts', setCollapsedAccounts)}
				className="
        text-white font-medium cursor-pointer hover:bg-dark-miden-800 flex flex-row justify-between items-center px-3"
			>
				<div className="flex gap-2 items-center">
					<span className="cursor-pointer text-white">
						<InlineIcon
							variant="arrow"
							color="white"
							className={`w-3 h-3 ${isCollapsedAccTopLevel ? '' : 'rotate-90'}`}
						/>
					</span>
					<div className="font-semibold">Accounts</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger className="cursor-pointer rounded-miden ">
						<InlineIcon
							variant="file-plus"
							color="white"
							className="w-6 h-6 cursor-pointer hover:bg-white/10 p-1 rounded-miden"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={() => createAccount()}>Create new account</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{!isCollapsedAccTopLevel &&
				Object.values(accounts).map((account) => {
					const isCollapsed = collapsedAccounts[account.idHex] || false;

					return (
						<React.Fragment key={account.id}>
							<div
								onClick={() => toggleCollapse(account.idHex, setCollapsedAccounts)}
								className="
              text-white font-medium  cursor-pointer hover:bg-dark-miden-800 flex flex-row justify-between items-center pl-6 pr-3"
							>
								<div className="flex items-center gap-2">
									<span className=" text-white">
										<InlineIcon
											variant="arrow"
											color="white"
											className={`w-3 h-3 ${isCollapsed ? '' : 'rotate-90'}`}
										/>
									</span>
									<div>{account.name}</div>
								</div>
								<div className="ml-auto cursor-pointer hover:bg-white/10 p-1 rounded-miden">
									<InlineIcon variant={'trash'} color="white" className={`w-4 h-4`} />
								</div>
							</div>

							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[account.scriptFileId]}
										isSelected={selectedFileId === account.scriptFileId}
										onClick={() => selectFile(account.scriptFileId)}
									/>
									{account.isWallet && (
										<FileItem
											editorFile={files[WALLET_COMPONENT_SCRIPT_FILE_ID]}
											isSelected={selectedFileId === WALLET_COMPONENT_SCRIPT_FILE_ID}
											onClick={() => selectFile(WALLET_COMPONENT_SCRIPT_FILE_ID)}
											onRemove={() => disableWalletComponent(account.idHex)}
										/>
									)}
									{account.isAuth && (
										<FileItem
											editorFile={files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID]}
											isSelected={selectedFileId === AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID}
											onClick={() => selectFile(AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID)}
											onRemove={() => disableAuthComponent(account.idHex)}
										/>
									)}
									<FileItem
										editorFile={files[account.metadataFileId]}
										onClick={() => selectFile(files[account.metadataFileId].id)}
										isSelected={selectedFileId === files[account.metadataFileId].id}
									/>
									<FileItem
										editorFile={files[account.vaultFileId]}
										onClick={() => selectFile(files[account.vaultFileId].id)}
										isSelected={selectedFileId === files[account.vaultFileId].id}
									/>
									<FileItem
										editorFile={files[account.storageFileId]}
										onClick={() => selectFile(files[account.storageFileId].id)}
										isSelected={selectedFileId === files[account.storageFileId].id}
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
