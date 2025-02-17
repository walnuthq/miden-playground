import React from 'react';
import { useMiden } from '@/lib/context-providers/miden-context-provider';

import InlineIcon from './ui/inline-icon';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	TRANSACTION_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';

const Breadcrumbs = () => {
	const { notes, accounts, files, selectedFileId } = useMiden();

	if (!selectedFileId) return null;
	const note = Object.values(notes).find(
		(note) => selectedFileId === note.inputFileId || selectedFileId === note.scriptFileId
	);
	const account = Object.values(accounts).find(
		(account) => selectedFileId === account.scriptFileId
	);

	if (selectedFileId === TRANSACTION_SCRIPT_FILE_ID) {
		return (
			<div className="flex gap-2 text-theme-text bg-[#040113] shadow-sm shadow-theme-border text-xs flex-row border-theme-border px-4 p-1">
				<div>Transaction Script</div>
			</div>
		);
	}
	const isComponent =
		selectedFileId === AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID ||
		selectedFileId === WALLET_COMPONENT_SCRIPT_FILE_ID ||
		files[selectedFileId].name === 'Custom component';

	const type = files[selectedFileId].content.dynamic?.account
		? 'Accounts'
		: files[selectedFileId].content.dynamic?.note
		? 'Notes'
		: isComponent
		? 'Accounts'
		: note
		? 'Notes'
		: 'Accounts';

	const getName = () => {
		if (type === 'Accounts') {
			const accountId =
				files[selectedFileId].content.dynamic?.account?.accountId ||
				('accountId' in files[selectedFileId].content
					? files[selectedFileId].content.accountId
					: undefined) ||
				account?.id.id;
			return accountId ? accounts[accountId]?.name : undefined;
		}
		const noteId = files[selectedFileId].content.dynamic?.note?.noteId;
		return noteId ? notes[noteId]?.name?.toLocaleUpperCase() : note?.name;
	};

	const dynamicName = getName();

	return (
		<div className="flex gap-2 text-theme-text bg-[#040113] shadow-sm shadow-theme-border text-xs flex-row border-theme-border px-4 p-1">
			<div>{type}</div>
			{(files[selectedFileId].content.dynamic ||
				files[selectedFileId].content.accountId ||
				note ||
				account) &&
				dynamicName && (
					<div className="flex items-center gap-2">
						<InlineIcon variant="arrow" color="white" className="w-2 h-2" />
						<div>{dynamicName}</div>
					</div>
				)}
			<div className="flex items-center gap-2">
				<InlineIcon variant="arrow" color="white" className="w-2 h-2" />
				<div>{files[selectedFileId].name}</div>
			</div>
		</div>
	);
};

export default Breadcrumbs;
