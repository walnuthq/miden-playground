'use client';

import { useMiden } from '@/lib/context-providers';
import { FileItem } from '.';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';

export function Accounts() {
	const { accounts, selectedAccountId, selectFile, files } = useMiden();
	const account = accounts[selectedAccountId];
	const customComponent = files[account.scriptFileId];
	const walletComponent = files[WALLET_COMPONENT_SCRIPT_FILE_ID];
	const authComponent = files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID];
	return (
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
	);
}
