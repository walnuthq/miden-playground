export * from './p2id';
export * from './p2idr';
export * from './swap';

import { Asset } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { generateNoteSerialNumber, generateNoteTag } from '@/lib/miden-wasm-api';
import { EditorFiles } from '../files';
import _ from 'lodash';

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
	tag: number;
	aux: bigint;
	recipientDigest: string;
	serialNumber?: BigUint64Array;
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
	tag: number;
	aux: bigint;
	recipientDigest: string;

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
		this.serialNumber = props.serialNumber ?? generateNoteSerialNumber();
		this.initialNoteId = props.initialNoteId;
		this.isExpectedOutput = props.isExpectedOutput;
		this.tag = props.tag;
		this.aux = props.aux;
		this.recipientDigest = props.recipientDigest;
	}

	clone() {
		return new Note(_.cloneDeep(this));
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
		const tag = generateNoteTag(senderId);

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
				name: `Info`,
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
			vaultFileId,
			tag,
			aux: BigInt(0),
			recipientDigest: ''
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
	addAsset(faucetId: string, amount: bigint) {
		this.assets.push({
			faucetId,
			amount
		});
	}
}
