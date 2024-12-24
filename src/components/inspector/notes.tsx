'use client';

import { useMiden } from '@/lib/context-providers';
import { ListItem } from '.';

export function Notes() {
	const { files, notes, selectedNoteId, selectFile } = useMiden();
	const note = notes[selectedNoteId];
	const noteScriptFile = files[note.scriptFileId];

	return (
		<div className="flex flex-col">
			<ListItem name={noteScriptFile.name} onClick={() => selectFile(noteScriptFile.id)} />
			<ListItem name="Note input" onClick={() => selectFile(note.inputFileId)} />
			<ListItem name="Note metadata" />
		</div>
	);
}
