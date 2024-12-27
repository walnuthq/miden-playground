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
	const { accounts, selectedAccountId, selectFile, files, selectAccount } = useMiden();
	const account = accounts[selectedAccountId];
	const customComponent = files[account.scriptFileId];
	const walletComponent = files[WALLET_COMPONENT_SCRIPT_FILE_ID];
	const authComponent = files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID];
	const metadataFile = files[account.metadataFileId];
	const vaultFile = files[account.vaultFileId];

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex flex-row justify-between items-center px-3"
			>
				<div className="flex flex-row gap-2 items-center">
					<div>
						<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
					</div>
					{accounts[selectedAccountId].name}
					<div>
						<InlineIcon variant="pencil" color={'gray'} className="w-4 h-4 cursor-pointer" />
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<InlineIcon
							variant="arrow"
							color={'white'}
							className="w-4 h-4 cursor-pointer rotate-90"
						/>
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
				<FileItem editorFile={customComponent} onClick={() => selectFile(account.scriptFileId)} />
				<FileItem
					editorFile={walletComponent}
					onClick={() => selectFile(WALLET_COMPONENT_SCRIPT_FILE_ID)}
				/>
				<FileItem
					editorFile={authComponent}
					onClick={() => selectFile(AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID)}
				/>
				<FileItem editorFile={metadataFile} onClick={() => selectFile(metadataFile.id)} />
				<FileItem editorFile={vaultFile} onClick={() => selectFile(vaultFile.id)} />
			</div>
		</div>
	);
}
