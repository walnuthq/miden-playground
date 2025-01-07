import { useMiden } from '@/lib/context-providers';

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
		variant: 'metadata' | 'vault' | 'storage';
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

export const useSelectedEditorFile = (): { content: string; file: EditorFile | null } => {
	const { files, accounts, selectedFileId, notes } = useMiden();
	if (!selectedFileId) return { content: '', file: null };

	const file = files[selectedFileId];

	let content = '';
	if (file) {
		if (file.content.dynamic) {
			if (file.content.dynamic.account) {
				if (file.content.dynamic.account.variant === 'metadata') {
					content = JSON.stringify(
						{
							accountId: file.content.dynamic.account.accountId
						},
						null,
						2
					);
				} else if (file.content.dynamic.account.variant === 'vault') {
					const account = accounts[file.content.dynamic.account.accountId];
					content = JSON.stringify(
						account.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetIdHex]),
						null,
						2
					);
				} else if (file.content.dynamic.account.variant === 'storage') {
					const account = accounts[file.content.dynamic.account.accountId];
					content = JSON.stringify(account.storage, null, 2);
				}
			} else if (file.content.dynamic.note) {
				if (file.content.dynamic.note.variant === 'metadata') {
					const note = notes[file.content.dynamic.note.noteId];
					content = JSON.stringify(
						{
							senderId: '0x' + note.senderId.toString(16)
						},
						null,
						2
					);
				} else if (file.content.dynamic.note.variant === 'vault') {
					const note = notes[file.content.dynamic.note.noteId];
					content = JSON.stringify(
						note.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetIdHex]),
						null,
						2
					);
				}
			}
		} else {
			content = file.content.value;
		}
	}

	return { content, file };
};
