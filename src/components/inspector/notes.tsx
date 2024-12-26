'use client';

import { useMiden } from '@/lib/context-providers';
import { ListItem } from '.';
import InlineIcon from '@/components/ui/inline-icon';

export function Notes() {
	const { files, notes, selectedNoteId, selectFile } = useMiden();
	const note = notes[selectedNoteId];
	const noteScriptFile = files[note.scriptFileId];

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex gap-2 items-center px-3"
			>
				<div>
					<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
				</div>
				{notes[selectedNoteId].name}
			</div>
			<div className="flex flex-col">
				<ListItem name={noteScriptFile.name} onClick={() => selectFile(noteScriptFile.id)} />
				<ListItem name="Note input" onClick={() => selectFile(note.inputFileId)} />
				<ListItem name="Note metadata" />
			</div>
		</div>
	);
}
