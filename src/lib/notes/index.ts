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

	constructor(props: NoteProps) {
		this.name = props.name;
		this.id = props.id;
		this.assets = props.assets;
		this.isConsumed = props.isConsumed;
		this.inputFileId = props.inputFileId;
		this.scriptFileId = props.scriptFileId;
		this.senderId = props.senderId;
		this.metadataFileId = props.metadataFileId;
	}

	get senderIdHex(): string {
		return '0x' + this.senderId.toString(16);
	}
}
