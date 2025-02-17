import { useMiden } from '@/lib/context-providers';
import React, { useState } from 'react';
import { FileItem, InspectorItem } from '.';

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
		createNewNote,
		createSampleSwapNotes,
		deleteNote
	} = useMiden();
	const [collapsedNotes, setCollapsedNotes] = useState<Record<string, boolean>>({});
	const isCollapsedNotesTopLevel = collapsedNotes['top-level-notes'] || false;

	return (
		<>
			<InspectorItem
				name="Notes"
				nameClasses="font-bold"
				variant="collapsable"
				isCollapsed={isCollapsedNotesTopLevel}
				level={0}
				onClick={() => {
					toggleCollapse('top-level-notes', setCollapsedNotes);
				}}
				onCreate={(option) => {
					if (option === 'Create P2ID note') {
						createSampleP2IDNote();
					} else if (option === 'Create P2IDR note') {
						createSampleP2IDRNote();
					} else if (option === 'Create SWAP note') {
						createSampleSwapNotes();
					} else if (option === 'Create empty note') {
						createNewNote();
					}
				}}
				onCreateOptions={[
					'Create P2ID note',
					'Create P2IDR note',
					'Create SWAP note',
					'Create empty note'
				]}
			/>
			{!isCollapsedNotesTopLevel &&
				Object.values(notes).map((note) => {
					const isCollapsed = collapsedNotes[note.id] || false;
					return (
						<React.Fragment key={note.id}>
							<InspectorItem
								isConsumed={note.isConsumed}
								name={note.name}
								variant="collapsable"
								isCollapsed={isCollapsed}
								level={1}
								onClick={() => toggleCollapse(note.id, setCollapsedNotes)}
								onRemove={() => {
									deleteNote(note.id);
								}}
							/>
							{!isCollapsed && (
								<div className="flex flex-col">
									<FileItem
										editorFile={files[note.scriptFileId]}
										onClick={() => selectFile(note.scriptFileId)}
										isSelected={selectedFileId === note.scriptFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[note.inputFileId]}
										onClick={() => selectFile(note.inputFileId)}
										isSelected={selectedFileId === note.inputFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[note.metadataFileId]}
										onClick={() => selectFile(note.metadataFileId)}
										isSelected={selectedFileId === note.metadataFileId}
										level={2}
									/>
									<FileItem
										editorFile={files[note.vaultFileId]}
										onClick={() => selectFile(note.vaultFileId)}
										isSelected={selectedFileId === note.vaultFileId}
										level={2}
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
