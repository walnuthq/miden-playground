import React from 'react';
import { useMiden } from '@/lib/context-providers/miden-context-provider';
import { useSelectedEditorFile } from '@/lib/files';
import InlineIcon from './ui/inline-icon';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';

const Breadcrumbs = () => {
	const { file } = useSelectedEditorFile();
	const { notes, accounts, files } = useMiden();

	if (!file) return null;

	const note = Object.values(notes).find(
		(note) => file.id === note.inputFileId || file.id === note.scriptFileId
	);
	const account = Object.values(accounts).find((account) => file.id === account.scriptFileId);

	const isComponent =
		file === files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID] ||
		file === files[WALLET_COMPONENT_SCRIPT_FILE_ID] ||
		file.name === 'Custom component';

	const type = file.content.dynamic?.account
		? 'Accounts'
		: file.content.dynamic?.note
		? 'Notes'
		: isComponent
		? 'Accounts'
		: note
		? 'Notes'
		: 'Accounts';

	const getName = () => {
		if (type === 'Accounts') {
			const accountId = file.content.dynamic?.account?.accountId || account?.idHex;
			return accountId ? accounts[accountId]?.name : undefined;
		}
		const noteId = file.content.dynamic?.note?.noteId;
		return noteId ? notes[noteId]?.name?.toLocaleUpperCase() : note?.name;
	};

	const dynamicName = getName();

	return (
		<div className="flex gap-2 text-theme-text bg-[#040113] shadow-sm shadow-theme-border text-xs flex-row border-theme-border px-4 p-1">
			<div>{type}</div>
			{(file.content.dynamic || note || account) && dynamicName && (
				<div className="flex items-center gap-2">
					<InlineIcon variant="arrow" color="white" className="w-2 h-2" />
					<div>{dynamicName}</div>
				</div>
			)}
			<div className="flex items-center gap-2">
				<InlineIcon variant="arrow" color="white" className="w-2 h-2" />
				<div>{file.name}</div>
			</div>
		</div>
	);
};

export default Breadcrumbs;
