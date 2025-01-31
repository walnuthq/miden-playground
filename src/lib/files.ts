import { useMiden } from '@/lib/context-providers';
import { AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID, WALLET_COMPONENT_SCRIPT_FILE_ID } from './consts';
import { Account } from './account';

export interface EditorFile {
	id: string;
	name: string;
	isOpen: boolean;
	variant: 'script' | 'file' | 'note';
	readonly: boolean;
	content:
		| { value: string; dynamic?: undefined }
		| { value?: undefined; dynamic: EditorFileDynamicContent };
	openOrder?: number;
	positionOrder?: number;
}

export type EditorFiles = Record<string, EditorFile>;

export interface EditorFileDynamicContent {
	account?: {
		accountId: string;
		variant: 'metadata' | 'vault' | 'code';
	};
	note?: {
		noteId: string;
		variant: 'metadata' | 'vault';
	};
}

export const useEditorFile = (fileId: string) => {
	const { files } = useMiden();
	return files[fileId];
};

interface EditorFileContent {
	content: string;
	file: EditorFile | null;
	account?: Account | null;
}

type SelectedEditorFileResult =
	| EditorFileContent
	| {
			walletScript: EditorFileContent;
			authScript: EditorFileContent;
			accountScript: EditorFileContent;
			isMultiFile: true;
	  };

export const useSelectedEditorFile = (): SelectedEditorFileResult => {
	const { files, accounts, selectedFileId, notes } = useMiden();

	if (!selectedFileId) return { content: '', file: null, account: null };

	const file = files[selectedFileId];
	if (!file) return { content: '', file: null, account: null };

	if (file.content.dynamic?.account?.variant === 'code') {
		const account = accounts[file.content.dynamic.account.accountId];

		return {
			walletScript: {
				content: files[WALLET_COMPONENT_SCRIPT_FILE_ID]?.content.value || '',
				file: files[WALLET_COMPONENT_SCRIPT_FILE_ID] || null,
				account
			},
			authScript: {
				content: files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID]?.content.value || '',
				file: files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID] || null,
				account
			},
			accountScript: {
				content: files[account.scriptFileId]?.content.value || '',
				file: files[account.scriptFileId] || null,
				account
			},
			isMultiFile: true
		};
	}

	let content = '';
	if (file.content.dynamic) {
		if (file.content.dynamic.account) {
			if (file.content.dynamic.account.variant === 'metadata') {
				const account = accounts[file.content.dynamic.account.accountId];
				content = JSON.stringify(
					{
						accountId: account.id.toString()
					},
					null,
					2
				);
			} else if (file.content.dynamic.account.variant === 'vault') {
				const account = accounts[file.content.dynamic.account.accountId];
				content = JSON.stringify(
					account.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
					null,
					2
				);
			}
		} else if (file.content.dynamic.note) {
			if (file.content.dynamic.note.variant === 'metadata') {
				const note = notes[file.content.dynamic.note.noteId];
				content = JSON.stringify(
					{
						senderId: note.senderId.toString(),
						serialNumber: note.serialNumberDecimalString
					},
					null,
					2
				);
			} else if (file.content.dynamic.note.variant === 'vault') {
				const note = notes[file.content.dynamic.note.noteId];
				content = JSON.stringify(
					note.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
					null,
					2
				);
			}
		}
	} else {
		content = file.content.value;
	}

	return { content, file };
};
