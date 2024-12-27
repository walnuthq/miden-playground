'use client';

import { useMiden } from '@/lib/context-providers';
import { ListItem } from '.';
import InlineIcon from '@/components/ui/inline-icon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu';

export function Notes() {
	const { files, notes, selectedNoteId, selectFile, selectNote } = useMiden();
	const note = notes[selectedNoteId];
	const noteScriptFile = files[note.scriptFileId];

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex flex-row justify-between items-center px-3"
			>
				<div className="flex flex-row gap-2 items-center">
					<div>
						<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
					</div>
					{notes[selectedNoteId].name}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<InlineIcon
							variant="arrow"
							color={'white'}
							className="w-4 h-4 cursor-pointer rotate-90"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{Object.values(notes).map((note) => (
							<DropdownMenuItem key={note.id} onClick={() => selectNote(note.id)}>
								{note.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex flex-col">
				<ListItem name={noteScriptFile.name} onClick={() => selectFile(noteScriptFile.id)} />
				<ListItem name="Note input" onClick={() => selectFile(note.inputFileId)} />
				<ListItem name="Note metadata" onClick={() => selectFile(note.metadataFileId)} />
			</div>
		</div>
	);
}
