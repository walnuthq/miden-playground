import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu';
import InlineIcon from '../ui/inline-icon';
import { FileItem } from '.';

const NotesList = ({
	toggleCollapse
}: {
	toggleCollapse: (
		id: string,
		setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) => void;
}) => {
	const {
		files,
		notes,
		selectFile,
		selectedFileId,
		createSampleP2IDNote,
		createSampleP2IDRNote,
		createNewNote
	} = useMiden();
	const [collapsedNotes, setCollapsedNotes] = useState<Record<string, boolean>>({});
	const isCollapsedNotesTopLevel = collapsedNotes['top-level-notes'] || false;

	return (
		<>
			<div
				onClick={() => {
					toggleCollapse('top-level-notes', setCollapsedNotes);
				}}
				className="
      text-white font-medium cursor-pointer hover:bg-dark-miden-800 flex flex-row justify-between items-center px-3"
			>
				<div className="flex gap-2 items-center">
					<span className="cursor-pointer text-white">
						<InlineIcon
							variant="arrow"
							color="white"
							className={`w-3 h-3 ${isCollapsedNotesTopLevel ? '' : 'rotate-90'}`}
						/>
					</span>
					<div className="font-semibold">Notes</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger className="cursor-pointer rounded-miden ">
						<InlineIcon
							variant="file-plus"
							color="white"
							className="w-6 h-6 cursor-pointer hover:bg-white/10 p-1 rounded-miden"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem
							onClick={(e) => {
								createSampleP2IDNote();
								e.stopPropagation();
							}}
						>
							Create P2ID note
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								createSampleP2IDRNote();
								e.stopPropagation();
							}}
						>
							Create P2IDR note
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								createNewNote();
								e.stopPropagation();
							}}
						>
							Create empty note
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{!isCollapsedNotesTopLevel &&
				Object.values(notes).map((note) => {
					const isCollapsed = collapsedNotes[note.id] || false;
					return (
						<React.Fragment key={note.id}>
							<div
								onClick={() => toggleCollapse(note.id, setCollapsedNotes)}
								className="
text-white font-medium flex cursor-pointer hover:bg-dark-miden-800 flex-row justify-between items-center pl-6 pr-3"
							>
								<div className="flex items-center gap-2">
									<span className=" text-white">
										<InlineIcon
											variant="arrow"
											color="white"
											className={`w-3 h-3 ${isCollapsed ? '' : 'rotate-90'}`}
										/>
									</span>
									<div>{note.name}</div>
								</div>
								<div className="ml-auto cursor-pointer hover:bg-white/10 p-1 rounded-miden">
									<InlineIcon variant={'trash'} color="white" className={`w-4 h-4`} />
								</div>
							</div>
							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[note.scriptFileId]}
										onClick={() => selectFile(files[note.scriptFileId].id)}
										isSelected={selectedFileId === files[note.scriptFileId].id}
									/>
									<FileItem
										editorFile={files[note.inputFileId]}
										onClick={() => selectFile(note.inputFileId)}
										isSelected={selectedFileId === note.inputFileId}
									/>
									<FileItem
										editorFile={files[note.metadataFileId]}
										onClick={() => selectFile(note.metadataFileId)}
										isSelected={selectedFileId === note.metadataFileId}
									/>
									<FileItem
										editorFile={files[note.vaultFileId]}
										onClick={() => selectFile(note.vaultFileId)}
										isSelected={selectedFileId === note.vaultFileId}
									/>
								</div>
							)}
						</React.Fragment>
					);
				})}
		</>
	);
};

export default NotesList;
