import { useMiden } from '../lib/context-providers';

export const useSelectedAccountData = (): {
	name: string;
	metadata: string;
	vault: string;
} | null => {
	const { accounts, selectedTransactionAccountId } = useMiden();

	if (!selectedTransactionAccountId) {
		return null;
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
		name,
		metadata,
		vault
	};
};

export const useSelectedNoteData = (): {
	noteName: string;
	noteMetadata?: { senderId: string; serialNumber: string };
	noteVault: string;
	script: string;
	input: string;
} | null => {
	const { notes, files, selectedOverviewTab } = useMiden();
	if (!selectedOverviewTab) {
		return null;
	}
	const note = notes[selectedOverviewTab];
	if (!note) {
		return null;
	}
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
		noteName,
		noteMetadata,
		noteVault,
		script: script || '',
		input
	};
};
