export * from './p2id';
export * from './p2idr';
export * from './swap';

import { Asset } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { generateNoteSerialNumber } from '../miden-wasm-api';
import { EditorFiles } from '../files';

export interface NoteProps {
	name: string;
	id: string;
	assets: Asset[];
	isConsumed: boolean;
	inputFileId: string;
	scriptFileId: string;
	senderId: string;
	metadataFileId: string;
	vaultFileId: string;
	initialNoteId?: string;
	isExpectedOutput?: boolean;
}

export class Note {
	name: string;
	id: string;
	assets: Asset[];
	isConsumed: boolean;
	inputFileId: string;
	scriptFileId: string;
	senderId: string;
	metadataFileId: string;
	vaultFileId: string;
	serialNumber: BigUint64Array;
	isExpectedOutput?: boolean;
	initialNoteId?: string;

	constructor(props: NoteProps) {
		this.name = props.name;
		this.id = props.id;
		this.assets = props.assets;
		this.isConsumed = props.isConsumed;
		this.inputFileId = props.inputFileId;
		this.scriptFileId = props.scriptFileId;
		this.senderId = props.senderId;
		this.metadataFileId = props.metadataFileId;
		this.vaultFileId = props.vaultFileId;
		this.serialNumber = generateNoteSerialNumber();
		this.initialNoteId = props.initialNoteId;
		this.isExpectedOutput = props.isExpectedOutput;
	}

	static createEmptyNote({
		senderId,
		assets,
		name
	}: {
		senderId: string;
		assets: Asset[];
		name: string;
	}): {
		note: Note;
		newFiles: EditorFiles;
	} {
		const noteId = generateId();
		const scriptFileId = generateId();
		const inputFileId = generateId();
		const metadataFileId = generateId();
		const vaultFileId = generateId();
		const newFiles: EditorFiles = {
			[scriptFileId]: {
				id: scriptFileId,
				name: `Script`,
				content: { value: '' },
				isOpen: false,
				variant: 'script',
				readonly: false
			},
			[inputFileId]: {
				id: inputFileId,
				name: `Inputs`,
				content: {
					value: JSON.stringify([], null, 2)
				},
				isOpen: false,
				variant: 'note',
				readonly: false
			},
			[metadataFileId]: {
				id: metadataFileId,
				name: `Metadata`,
				content: { dynamic: { note: { noteId, variant: 'metadata' } } },
				isOpen: false,
				variant: 'file',
				readonly: true
			},
			[vaultFileId]: {
				id: vaultFileId,
				name: `Vault`,
				content: { dynamic: { note: { noteId, variant: 'vault' } } },
				isOpen: false,
				variant: 'file',
				readonly: true
			}
		};

		const note = new Note({
			id: noteId,
			name,
			scriptFileId,
			isConsumed: false,
			assets,
			inputFileId,
			senderId,
			metadataFileId,
			vaultFileId
		});
		const serialNumberString = note.serialNumberDecimalString.slice(0, 10);
		note.name = `${name} - ${serialNumberString}`;
		return { note, newFiles };
	}

	get serialNumberDecimalString(): string {
		return this.serialNumber.reduce((acc, num) => acc + BigInt(num), BigInt(0)).toString();
	}

	updateAssetAmount(faucetId: string, updateFn: (amount: bigint) => bigint) {
		const asset = this.assets.find((asset) => asset.faucetId === faucetId);
		if (asset) {
			asset.amount = updateFn(asset.amount);
		}
	}
}
