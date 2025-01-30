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
		variant: 'metadata' | 'vault';
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
	}

	return { content, file };
};

export const useSelectedAccountData = (): {
	id: string;
	name: string;
	metadata: string;
	vault: string;
} => {
	const { accounts, selectedTransactionAccountId } = useMiden();

	if (!selectedTransactionAccountId) {
		return {
			id: '',
			name: '',
			metadata: '',
			vault: ''
		};
	}

	const account = accounts[selectedTransactionAccountId];

	const metadata = account.id.toString();

	const name = account.name;

	const vault = JSON.stringify(
		account.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
		null,
		2
	);

	return {
		id: account.idHex,
		name,
		metadata,
		vault
	};
};

export const useSelectedNoteData = (): {
	id: string;
	noteName: string;
	noteMetadata?: { senderId: string; serialNumber: string };
	noteVault: string;
	script: string;
	input: string;
} => {
	const { notes, files, selectedOverview } = useMiden();
	if (!notes[selectedOverview]) {
		return {
			id: '',
			noteName: '',
			noteVault: '',
			script: '',
			input: ''
		};
	}
	const note = notes[selectedOverview];
	const noteName = note.name;
	const noteMetadata = {
		senderId: note.senderId.toString(),
		serialNumber: note.serialNumberDecimalString
	};

	const noteVault = JSON.stringify(
		note.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
		null,
		2
	);

	const script =
		note && note.scriptFileId && files[note.scriptFileId] && files[note.scriptFileId].content?.value
			? files[note.scriptFileId].content.value
			: '';

	const input = JSON.stringify(JSON.parse(files[note.inputFileId]?.content.value || '{}'), null, 2);
	return {
		id: note.id,
		noteName,
		noteMetadata,
		noteVault,
		script: script || '',
		input
	};
};
