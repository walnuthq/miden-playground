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

export const useSelectedEditorFile = (): {
	content: string;
	file: EditorFile | null;
	type: string | null;
	typeId: string;
} => {
	const { files, accounts, selectedFileId, notes } = useMiden();
	if (!selectedFileId) return { content: '', file: null, type: null, typeId: '' };

	const file = files[selectedFileId];
	let type = null;
	let typeId = '';
	let content = '';
	if (file) {
		if (file.content.dynamic) {
			if (file.content.dynamic.account) {
				type = 'account';
				typeId = file.content.dynamic.account.accountId;
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
						account.assets.map((asset) => [
							asset.amount.toString(),
							0,
							0,
							asset.faucetId.toString()
						]),
						null,
						2
					);
				} else if (file.content.dynamic.account.variant === 'storage') {
					const account = accounts[file.content.dynamic.account.accountId];
					content = JSON.stringify(account.storage, null, 2);
				}
			} else if (file.content.dynamic.note) {
				type = 'note';
				typeId = file.content.dynamic.note.noteId;
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
	}

	return { content, file, type, typeId };
};

export const useSelectedAccountData = (): {
	metadata: string;
	vault: string;
} => {
	const { accounts, selectedTransactionAccountId } = useMiden();

	if (!selectedTransactionAccountId) {
		return {
			metadata: '',
			vault: ''
		};
	}

	const account = accounts[selectedTransactionAccountId];

	const metadata = account.id.toString();

	const vault = JSON.stringify(
		account.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
		null,
		2
	);

	return {
		metadata,
		vault
	};
};
