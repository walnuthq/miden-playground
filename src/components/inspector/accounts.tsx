'use client';

import { useMiden } from '@/lib/context-providers';
import { ListItem } from '.';

export function Accounts() {
	const { accounts, selectedAccountId, selectFile } = useMiden();
	const account = accounts[selectedAccountId];

	return (
		<div className="flex flex-col">
			<ListItem name="Custom component" onClick={() => selectFile(account.scriptFileId)} />
			<ListItem name="Wallet component" />
			<ListItem name="Authentication component" />
			<ListItem name="Account storage" />
			<ListItem name="Account vault" />
		</div>
	);
}
