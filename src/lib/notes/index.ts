export * from './p2id';
export * from './p2idr';
export * from './swap';

import { Asset } from '@/lib/types';

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
	}

	get senderIdHex(): string {
		return '0x' + this.senderId.toString(16);
	}

	static getNextNoteName(type: 'P2ID' | 'P2IDR' | 'SWAP', notes: Record<string, Note>) {
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
}
