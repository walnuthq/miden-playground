import { useMiden } from '@/lib/context-providers';
import AccountCodeFile from './account-code-file';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { useEffect, useState } from 'react';

export const Files = () => {
	const { files, accounts, selectedFileId, notes, updateFileContent } = useMiden();
	const [value, setValue] = useState('');

	const file = selectedFileId ? files[selectedFileId] : null;

	useEffect(() => {
		if (file && !file.content.dynamic && file.content.variant !== 'account-code') {
			setValue(file.content.value);
		}
	}, [file, file?.content.dynamic, file?.content.value]);

	if (!selectedFileId || !file) return null;

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
				return <CustomMonacoEditor readOnly value={content} />;
			} else if (file.content.dynamic.account.variant === 'vault') {
				const account = accounts[file.content.dynamic.account.accountId];
				content = JSON.stringify(
					account.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
					null,
					2
				);
				return <CustomMonacoEditor readOnly value={content} />;
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
				return <CustomMonacoEditor readOnly value={content} />;
			} else if (file.content.dynamic.note.variant === 'vault') {
				const note = notes[file.content.dynamic.note.noteId];
				content = JSON.stringify(
					note.assets.map((asset) => [asset.amount.toString(), 0, 0, asset.faucetId.toString()]),
					null,
					2
				);
				return <CustomMonacoEditor readOnly value={content} />;
			}
		}
	} else if (file.content.variant === 'account-code' && file.content.accountId) {
		return (
			<AccountCodeFile
				accountFile={file.content.value}
				fileId={file.id}
				accountId={file.content.accountId}
			/>
		);
	} else {
		return (
			<CustomMonacoEditor
				onChange={(value) => {
					setValue(value ?? '');
					if (file.id) {
						updateFileContent(file.id, value ?? '');
					}
				}}
				readOnly={file.readonly}
				value={value}
			/>
		);
	}
};
