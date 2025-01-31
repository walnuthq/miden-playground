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
	senderId: bigint;
	metadataFileId: string;
	vaultFileId: string;
}

export class Note {
	name: string;
	id: string;
	assets: Asset[];
	isConsumed: boolean;
	inputFileId: string;
	scriptFileId: string;
	senderId: bigint;
	metadataFileId: string;
	vaultFileId: string;
	serialNumber: BigUint64Array;

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
	}

	get senderIdHex(): string {
		return '0x' + this.senderId.toString(16);
	}

	static getNextNoteName(type: 'P2ID' | 'P2IDR' | 'SWAP' | 'NOTE', notes: Record<string, Note>) {
		const noteNames = Object.values(notes).map((note) => note.name);
		let nextNoteName = '';
		let i = 0;
		while (true) {
			nextNoteName = `${type} (${i + 1})`;
			if (!noteNames.includes(nextNoteName)) {
				break;
			}
			i++;
		}
		return nextNoteName;
	}

	static createEmptyNote({
		senderId,
		assets,
		name
	}: {
		senderId: bigint;
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
				name: `${name} Script`,
				content: { value: '' },
				isOpen: false,
				variant: 'script',
				readonly: false
			},
			[inputFileId]: {
				id: inputFileId,
				name: `${name} Inputs`,
				content: {
					value: JSON.stringify([], null, 2)
				},
				isOpen: false,
				variant: 'note',
				readonly: false
			},
			[metadataFileId]: {
				id: metadataFileId,
				name: `${name} Metadata`,
				content: { dynamic: { note: { noteId, variant: 'metadata' } } },
				isOpen: false,
				variant: 'file',
				readonly: true
			},
			[vaultFileId]: {
				id: vaultFileId,
				name: `${name} Vault`,
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
		return { note, newFiles };
	}

	get serialNumberDecimalString(): string {
		return this.serialNumber.reduce((acc, num) => acc + BigInt(num), BigInt(0)).toString();
	}

	updateAssetAmount(faucetId: bigint, updateFn: (amount: bigint) => bigint) {
		const asset = this.assets.find((asset) => asset.faucetId === faucetId);
		if (asset) {
			asset.amount = updateFn(asset.amount);
		}
	}
}
