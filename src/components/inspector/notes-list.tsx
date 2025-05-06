import { useAccounts, useFiles, useNotes } from '@/lib/context-providers';
import React, { useState } from 'react';
import { FileItem, InspectorItem } from '.';
import { useToast } from '@/hooks/use-toast';

const NotesList = ({
	toggleCollapse
}: {
	toggleCollapse: (
		id: string,
		setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) => void;
}) => {
	const { accounts } = useAccounts();
	const { files, selectFile, selectedFileId, closeFile } = useFiles();
	const {
		notes,
		createSampleP2IDNote,
		createSampleP2IDRNote,
		createNewNote,
		createSampleSwapNotes,
		deleteNote,
		removeTransactionNote,
		selectedTransactionNotesIds
	} = useNotes();
	const [collapsedNotes, setCollapsedNotes] = useState<Record<string, boolean>>({});
	const isCollapsedNotesTopLevel = collapsedNotes['top-level-notes'] || false;
	const accountsCount = Object.values(accounts).length;
	const { toast } = useToast();
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
						if (accountsCount > 1) {
							createSampleP2IDNote();
						} else {
							toast({
								title: 'Cannot create P2ID note',
								description: 'To create a P2ID note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
					} else if (option === 'Create P2IDR note') {
						if (accountsCount > 1) {
							createSampleP2IDRNote();
						} else {
							toast({
								title: 'Cannot create P2IDR note',
								description: 'To create a P2IDR note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
					} else if (option === 'Create SWAP note') {
						if (accountsCount > 1) {
							createSampleSwapNotes();
						} else {
							toast({
								title: 'Cannot create SWAP note',
								description: 'To create a SWAP note, you need to have at least two accounts.',
								variant: 'destructive'
							});
						}
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
				Object.values(notes)
					.filter((note) => !note.isExpectedOutput)
					.map((note) => {
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
										Object.values(files).map((file) => {
											if (
												[
													note.scriptFileId,
													note.inputFileId,
													note.metadataFileId,
													note.vaultFileId
												].includes(file.id)
											) {
												closeFile(file.id);
											}
										});

										if (selectedTransactionNotesIds.includes(note.id)) {
											removeTransactionNote(note.id);
										}
										deleteNote(note.id);
									}}
								/>
								{!isCollapsed && (
									<div className="flex flex-col">
										<FileItem
											editorFile={files[note.metadataFileId]}
											onClick={() => selectFile(note.metadataFileId)}
											isSelected={selectedFileId === note.metadataFileId}
											level={2}
										/>
										<FileItem
											editorFile={files[note.scriptFileId]}
											onClick={() => selectFile(note.scriptFileId)}
											isSelected={selectedFileId === note.scriptFileId}
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
