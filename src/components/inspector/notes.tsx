'use client';

import { useMiden } from '@/lib/context-providers';
import { FileItem } from '.';
import InlineIcon from '@/components/ui/inline-icon';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function Notes() {
	const { files, notes, selectedNoteId, selectFile, selectedFileId, selectNote } = useMiden();
	const note = notes[selectedNoteId];
	const noteScriptFile = files[note.scriptFileId];
	const noteInputFile = files[note.inputFileId];
	const noteMetadataFile = files[note.metadataFileId];

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex flex-row justify-between items-center px-3"
			>
				<div className="flex flex-row gap-2 items-center">
					<DropdownMenu>
						<DropdownMenuTrigger className="cursor-pointer hover:bg-white/10 p-1.5 rounded-miden ">
							<InlineIcon variant="plus-square" className="w-6 h-6 cursor-pointer" />
						</DropdownMenuTrigger>
						<DropdownMenuContent></DropdownMenuContent>
					</DropdownMenu>
					{notes[selectedNoteId].name}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger className="cursor-pointer hover:bg-white/10 p-1.5 rounded-miden">
						<InlineIcon variant="arrow" color={'white'} className="w-4 h-4 rotate-90" />
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
				<FileItem
					editorFile={noteScriptFile}
					onClick={() => selectFile(noteScriptFile.id)}
					isSelected={selectedFileId === noteScriptFile.id}
				/>
				<FileItem
					editorFile={noteInputFile}
					onClick={() => selectFile(note.inputFileId)}
					isSelected={selectedFileId === note.inputFileId}
				/>
				<FileItem
					editorFile={noteMetadataFile}
					onClick={() => selectFile(note.metadataFileId)}
					isSelected={selectedFileId === note.metadataFileId}
				/>
			</div>
		</div>
	);
}
