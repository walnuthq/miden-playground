'use client';

import { useMiden } from '@/lib/context-providers';
import { FileItem } from '.';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import InlineIcon from '@/components/ui/inline-icon';

export function Accounts() {
	const { accounts, selectedAccountId, selectFile, files } = useMiden();
	const account = accounts[selectedAccountId];
	const customComponent = files[account.scriptFileId];
	const walletComponent = files[WALLET_COMPONENT_SCRIPT_FILE_ID];
	const authComponent = files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID];
	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				<div>
					<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
				</div>
				{accounts[selectedAccountId].name}
				<div>
					<InlineIcon variant="pencil" color={'gray'} className="w-4 h-4 cursor-pointer" />
				</div>
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
			</div>
		</div>
	);
}
