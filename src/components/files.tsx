import { useMiden } from '@/lib/context-providers';
import AccountCodeFile from './account-code-file';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { EditorFile } from '@/lib/files';
import { useEffect, useState } from 'react';
import { Vault } from './vault';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Storage } from './storage';

const useSelectedEditorFile = (): { content: string; file: EditorFile | null } => {
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
							accountId: account.id.id.toString(),
							prefix: account.id.prefix.toString(),
							suffix: account.id.suffix.toString()
						},
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

export const Files = () => {
	const { selectedFileId, updateFileContent, accounts, accountUpdates } = useMiden();
	const { content, file } = useSelectedEditorFile();
	const [value, setValue] = useState(content);
	const account =
		file && file.content.dynamic && file.content.dynamic.account
			? accounts[file.content.dynamic.account.accountId]
			: null;
	useEffect(() => {
		console.log('accountUpdates?.accountId', accountUpdates?.accountId);
	}, [accountUpdates]);
	useEffect(() => {
		setValue(content);
	}, [content]);
	if (!selectedFileId || !file) return <div className="flex-1 bg-[#040113]"></div>;
	if (
		file.content &&
		'variant' in file.content &&
		file.content.variant === 'account-code' &&
		'accountId' in file.content &&
		typeof file.content.accountId === 'string'
	) {
		return (
			<ScrollArea className="overflow-auto h-full flex-1 bg-[#040113] ">
				<AccountCodeFile
					accountFile={file.content.value}
					fileId={file.id}
					accountId={file.content.accountId}
				/>
			</ScrollArea>
		);
	} else if (file?.content?.dynamic?.account?.variant === 'metadata') {
		return (
			<div className="flex-1 bg-[#040113]">
				<div className="p-4 text-theme-text text-sm">
					<div>INFO</div>
					<div className="w-fit mt-2">
						<div className={'rounded-theme border border-theme-border overflow-hidden'}>
							<Table className="[&_tr:hover]:bg-transparent">
								<TableHeader>
									<TableRow>
										<TableHead className="pr-4">Name</TableHead>
										<TableHead className="pr-4">Account ID</TableHead>
										<TableHead className="pr-4">Nonce</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell className="pr-8 last:p-2">{account?.name.toString()}</TableCell>
										<TableCell className="pr-8 last:p-2">
											{account?.id.id.toString()}, ({account?.id.prefix.toString()},{' '}
											{account?.id.suffix.toString()})
										</TableCell>
										<TableCell className="pr-8 last:p-2 flex flex-row font-mono">
											<div className="min-w-8">
												<span className={`text-sm text-muted-foreground`}></span>
											</div>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</div>
					<div className="mt-6 mb-2">VAULT</div>
					<Vault accountId={file.content.dynamic.account.accountId} addAssetAbility />
					<div className="mt-6 mb-2">STORAGE</div>
					{account && <Storage className="h-72" accountId={account?.id.id} withoutOldValue />}
				</div>
			</div>
		);
	} else {
		return (
			<div className="flex-1 bg-[#040113]">
				<CustomMonacoEditor
					lang={file.name !== 'Script' ? 'javascript' : 'masm'}
					onChange={(value) => {
						setValue(value ?? '');
						if (file && !file.readonly) updateFileContent(file.id, value ?? '');
					}}
					readOnly={file.readonly}
					value={value}
				/>
			</div>
		);
	}
};
