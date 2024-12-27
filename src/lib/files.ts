import { useMiden } from '@/lib/context-providers';

export interface EditorFile {
	id: string;
	name: string;
	isOpen: boolean;
	variant: 'script' | 'file';
	readonly: boolean;
	content:
		| { value: string; dynamic?: undefined }
		| { value?: undefined; dynamic: EditorFileDynamicContent };
}

export type EditorFiles = Record<string, EditorFile>;

export interface EditorFileDynamicContent {
	account?: {
		accountId: string;
		variant: 'metadata' | 'vault';
	};
	note?: {
		noteId: string;
		variant: 'metadata';
	};
}

export const useEditorFile = (fileId: string) => {
	const { files } = useMiden();
	return files[fileId];
};

export const useSelectedEditorFileContent = () => {
	const { files, accounts, selectedFileId } = useMiden();
	if (!selectedFileId) return '';

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
				}
			}
		} else {
			content = file.content.value;
		}
	}

	return content;
};
