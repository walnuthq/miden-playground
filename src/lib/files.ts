export interface EditorFile {
	id: string;
	name: string;
	isOpen: boolean;
	variant: 'script' | 'file' | 'note';
	readonly: boolean;
	content:
		| { value: string; dynamic?: undefined; variant?: 'account-code'; accountId?: string }
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
