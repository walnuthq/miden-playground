'use client';

import { useMiden } from '@/lib/context-providers';
import { FileItem } from '.';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import InlineIcon from '@/components/ui/inline-icon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function Accounts() {
	const {
		accounts,
		selectedAccountId,
		selectFile,
		files,
		selectAccount,
		selectedFileId,
		createAccount,
		disableWalletComponent,
		disableAuthComponent,
		enableAuthComponent,
		enableWalletComponent
	} = useMiden();
	const account = accounts[selectedAccountId];
	const customComponent = files[account.scriptFileId];
	const walletComponent = files[WALLET_COMPONENT_SCRIPT_FILE_ID];
	const authComponent = files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID];
	const metadataFile = files[account.metadataFileId];
	const vaultFile = files[account.vaultFileId];
	const storageFile = files[account.storageFileId];

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex flex-row justify-between items-center px-3"
			>
				<div className="flex flex-row gap-2 items-center">
					<DropdownMenu>
						<DropdownMenuTrigger className="cursor-pointer rounded-miden ">
							<InlineIcon
								variant="plus-square"
								className="w-8 h-8 cursor-pointer hover:bg-white/10 p-1 rounded-miden"
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							{!account.isAuth && (
								<DropdownMenuItem onClick={() => enableAuthComponent(selectedAccountId)}>
									Add authentication component
								</DropdownMenuItem>
							)}
							{!account.isWallet && (
								<DropdownMenuItem onClick={() => enableWalletComponent(selectedAccountId)}>
									Add wallet component
								</DropdownMenuItem>
							)}
							<DropdownMenuItem onClick={() => createAccount()}>
								Create new account
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					{accounts[selectedAccountId].name}
					{/* <div>
						<InlineIcon variant="pencil" color={'gray'} className="w-6 h-6 cursor-pointer hover:bg-white/10 p-1 rounded-miden" />
					</div> */}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger className="cursor-pointer hover:bg-white/10 p-1.5 rounded-miden ">
						<InlineIcon variant="arrow" color={'white'} className="w-4 h-4 rotate-90" />
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{Object.values(accounts).map((account) => (
							<DropdownMenuItem key={account.id} onClick={() => selectAccount(account.idHex)}>
								{account.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex flex-col">
				<FileItem
					editorFile={customComponent}
					isSelected={selectedFileId === account.scriptFileId}
					onClick={() => selectFile(account.scriptFileId)}
				/>
				{account.isWallet && (
					<FileItem
						editorFile={walletComponent}
						isSelected={selectedFileId === WALLET_COMPONENT_SCRIPT_FILE_ID}
						onClick={() => selectFile(WALLET_COMPONENT_SCRIPT_FILE_ID)}
						onRemove={() => disableWalletComponent(account.idHex)}
					/>
				)}
				{account.isAuth && (
					<FileItem
						editorFile={authComponent}
						isSelected={selectedFileId === AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID}
						onClick={() => selectFile(AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID)}
						onRemove={() => disableAuthComponent(account.idHex)}
					/>
				)}
				<FileItem
					editorFile={metadataFile}
					onClick={() => selectFile(metadataFile.id)}
					isSelected={selectedFileId === metadataFile.id}
				/>
				<FileItem
					editorFile={vaultFile}
					onClick={() => selectFile(vaultFile.id)}
					isSelected={selectedFileId === vaultFile.id}
				/>
				<FileItem
					editorFile={storageFile}
					onClick={() => selectFile(storageFile.id)}
					isSelected={selectedFileId === storageFile.id}
				/>
			</div>
		</div>
	);
}
